import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { compileGraphToYaml, CompilationError, DEFAULT_WORKFLOW_NAME } from '../domain/compiler'
import {
  createJobNode,
  createStepNode,
  createTriggerNode,
  createEdge,
  nextNodePosition,
} from '../domain/graph/factories'
import {
  type BrixEdge,
  type BrixNode,
  type EditorNodeData,
  type StepNodeData,
  isNodeConnectionAllowed,
  resolveGraphOverlaps,
  applyAutoLayout,
  validateGraph,
  type GraphState,
  type NodeKind,
  type ValidationIssue,
} from '../domain/graph'
import { createDefaultGraph } from '../domain/templates/defaultGraph'
import { createId } from '../lib/id'

const HISTORY_LIMIT = 80

function cloneGraph(graph: GraphState): GraphState {
  return structuredClone(graph)
}

function limitHistory(items: GraphState[]): GraphState[] {
  if (items.length <= HISTORY_LIMIT) {
    return items
  }
  return items.slice(items.length - HISTORY_LIMIT)
}

function hasSubstantiveNodeChanges(changes: NodeChange<BrixNode>[]): boolean {
  return changes.some(
    (change) => change.type !== 'position' || ('dragging' in change && !change.dragging),
  )
}

function createConnectionIssue(sourceType: string, targetType: string): ValidationIssue {
  return {
    code: 'INVALID_EDGE',
    severity: 'error',
    message: `Invalid connection: ${sourceType} -> ${targetType}.`,
  }
}

interface EditorStoreState {
  graph: GraphState
  issues: ValidationIssue[]
  yamlOutput: string
  workflowName: string
  workflowEnv: Record<string, string>
  selectedNodeId: string | null
  historyPast: GraphState[]
  historyFuture: GraphState[]

  addNode: (kind: NodeKind) => void
  setWorkflowName: (workflowName: string) => void
  setWorkflowEnv: (workflowEnv: Record<string, string>) => void
  updateNodeData: (nodeId: string, updater: (current: EditorNodeData) => EditorNodeData) => void
  onNodesChange: (changes: NodeChange<BrixNode>[]) => void
  onEdgesChange: (changes: EdgeChange<BrixEdge>[]) => void
  onConnect: (connection: Connection) => void
  setSelectedNode: (nodeId: string | null) => void
  removeSelectedNode: () => void
  validate: () => ValidationIssue[]
  compile: () => string | null
  undo: () => void
  redo: () => void
  reset: () => void
  autoLayout: () => void
  replaceGraph: (
    graph: GraphState,
    yamlOutput?: string,
    workflowName?: string,
    workflowEnv?: Record<string, string>,
  ) => void
}

function pushHistory(state: EditorStoreState): Pick<EditorStoreState, 'historyPast' | 'historyFuture'> {
  return {
    historyPast: limitHistory([...state.historyPast, cloneGraph(state.graph)]),
    historyFuture: [],
  }
}

const initialGraph = createDefaultGraph()

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  graph: initialGraph,
  issues: validateGraph(initialGraph),
  yamlOutput: '',
  workflowName: DEFAULT_WORKFLOW_NAME,
  workflowEnv: {},
  selectedNodeId: null,
  historyPast: [],
  historyFuture: [],

  addNode: (kind) => {
    set((state) => {
      const position = nextNodePosition(state.graph, kind)
      const nodeId = createId(kind)
      let node: ReturnType<typeof createTriggerNode>
      const autoEdges: BrixEdge[] = []

      if (kind === 'trigger') {
        node = createTriggerNode({ id: nodeId, position })

      } else if (kind === 'job') {
        const existingJobCount = state.graph.nodes.filter((item) => item.type === 'job').length
        node = createJobNode(
          { id: nodeId, position },
          {
            label: `Job ${existingJobCount + 1}`,
            jobId: `job_${existingJobCount + 1}`,
          },
        )

        // ── Auto-Wire: Trigger → Job ─────────────────────────────────────
        // If there is exactly 1 Trigger in the canvas, automatically create
        // an edge from that Trigger to the new Job so the user doesn't have
        // to manually draw the connection.
        const triggers = state.graph.nodes.filter((n) => n.type === 'trigger')
        if (triggers.length === 1) {
          autoEdges.push(
            createEdge(createId('edge'), triggers[0].id, nodeId, 'smoothstep'),
          )
        }

      } else {
        // ── Auto-Wire: Job → Step ────────────────────────────────────────
        // Priority 1: the currently selected node is a Job → use it.
        // Priority 2: there is exactly 1 Job on the canvas → use it.
        // In both cases, pre-fill `jobNodeId` AND create the edge.
        const jobs = state.graph.nodes.filter((item) => item.type === 'job')
        const selectedJob = state.selectedNodeId
          ? state.graph.nodes.find(
              (n) => n.id === state.selectedNodeId && n.type === 'job',
            )
          : null
        const targetJob = selectedJob ?? (jobs.length === 1 ? jobs[0] : null)

        node = createStepNode(
          { id: nodeId, position },
          {
            label: 'New Step',
            jobNodeId: targetJob?.id ?? '',
          },
        )

        if (targetJob) {
          autoEdges.push(
            createEdge(createId('edge'), targetJob.id, nodeId, 'smoothstep'),
          )
        }
      }

      const nextGraph = resolveGraphOverlaps({
        nodes: [...state.graph.nodes, node],
        edges: [...state.graph.edges, ...autoEdges],
      })

      return {
        ...pushHistory(state),
        graph: nextGraph,
        issues: validateGraph(nextGraph),
        selectedNodeId: node.id,
      }
    })
  },


  setWorkflowName: (workflowName) => {
    set({
      workflowName,
    })
  },

  setWorkflowEnv: (workflowEnv) => {
    set({
      workflowEnv,
    })
  },

  updateNodeData: (nodeId, updater) => {
    set((state) => {
      const nextNodes = state.graph.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node
        }
        return {
          ...node,
          data: updater(node.data) as typeof node.data,
        }
      })
      const nextGraph: GraphState = {
        nodes: nextNodes,
        edges: state.graph.edges,
      }
      return {
        ...pushHistory(state),
        graph: nextGraph,
        issues: validateGraph(nextGraph),
      }
    })
  },

  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges<BrixNode>(changes, state.graph.nodes)
      const nextNodeIds = new Set(nextNodes.map((node) => node.id))
      const nextEdges = state.graph.edges.filter(
        (edge) => nextNodeIds.has(edge.source) && nextNodeIds.has(edge.target),
      )
      const nextGraph = { nodes: nextNodes, edges: nextEdges }
      const shouldPush = hasSubstantiveNodeChanges(changes)

      return {
        ...(shouldPush ? pushHistory(state) : {}),
        graph: nextGraph,
        issues: validateGraph(nextGraph),
      }
    })
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const nextEdges = applyEdgeChanges<BrixEdge>(changes, state.graph.edges)
      const nextGraph = {
        nodes: state.graph.nodes,
        edges: nextEdges,
      }
      return {
        ...pushHistory(state),
        graph: nextGraph,
        issues: validateGraph(nextGraph),
      }
    })
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) {
      return
    }

    set((state) => {
      const sourceNode = state.graph.nodes.find((node) => node.id === connection.source)
      const targetNode = state.graph.nodes.find((node) => node.id === connection.target)
      if (!sourceNode || !targetNode) {
        return state
      }

      if (!isNodeConnectionAllowed(sourceNode.type, targetNode.type)) {
        return {
          ...state,
          issues: [...state.issues, createConnectionIssue(sourceNode.type, targetNode.type)],
        }
      }

      if (
        state.graph.edges.some(
          (edge) => edge.source === connection.source && edge.target === connection.target,
        )
      ) {
        return state
      }

      let nextNodes = state.graph.nodes
      if (sourceNode.type === 'job' && targetNode.type === 'step') {
        nextNodes = nextNodes.map((node) =>
          node.id === targetNode.id
            ? { ...node, data: { ...node.data, jobNodeId: sourceNode.id } }
            : node,
        )
      } else if (sourceNode.type === 'step' && targetNode.type === 'step') {
        const sourceStepData = sourceNode.data as StepNodeData
        const targetStepData = targetNode.data as StepNodeData
        const sourceJob = sourceStepData.jobNodeId
        const targetJob = targetStepData.jobNodeId
        if (!sourceJob) {
          return {
            ...state,
            issues: [
              ...state.issues,
              {
                code: 'STEP_JOB_NOT_FOUND',
                severity: 'error',
                nodeId: sourceNode.id,
                message: 'Source Step is not assigned to a Job.',
              },
            ],
          }
        }
        if (targetJob && targetJob !== sourceJob) {
          return {
            ...state,
            issues: [
              ...state.issues,
              {
                code: 'STEP_CHAIN_CROSS_JOB',
                severity: 'error',
                nodeId: targetNode.id,
                message: 'Cross-Job Step chaining is not allowed.',
              },
            ],
          }
        }
        if (!targetJob) {
          nextNodes = nextNodes.map((node) =>
            node.id === targetNode.id
              ? { ...node, data: { ...node.data, jobNodeId: sourceJob } }
              : node,
          )
        }
      }

      const nextEdges = addEdge(
        {
          id: createId('edge'),
          source: connection.source,
          target: connection.target,
          type: 'smoothstep',
          animated: false,
        },
        state.graph.edges,
      ) as BrixEdge[]

      const nextGraph = {
        nodes: nextNodes,
        edges: nextEdges,
      }

      return {
        ...pushHistory(state),
        graph: nextGraph,
        issues: validateGraph(nextGraph),
      }
    })
  },

  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },

  removeSelectedNode: () => {
    set((state) => {
      if (!state.selectedNodeId) {
        return state
      }

      const nextNodes = state.graph.nodes.filter((node) => node.id !== state.selectedNodeId)
      const nextNodeIds = new Set(nextNodes.map((node) => node.id))
      const nextEdges = state.graph.edges.filter(
        (edge) => nextNodeIds.has(edge.source) && nextNodeIds.has(edge.target),
      )
      const nextGraph = {
        nodes: nextNodes,
        edges: nextEdges,
      }
      return {
        ...pushHistory(state),
        graph: nextGraph,
        selectedNodeId: null,
        issues: validateGraph(nextGraph),
      }
    })
  },

  validate: () => {
    const graph = get().graph
    const issues = validateGraph(graph)
    set({ issues })
    return issues
  },

  compile: () => {
    const { graph, workflowName, workflowEnv } = get()
    try {
      const result = compileGraphToYaml(graph, workflowName, workflowEnv)
      set({
        issues: result.issues,
        yamlOutput: result.yaml,
      })
      return result.yaml
    } catch (error) {
      if (error instanceof CompilationError) {
        set({ issues: error.issues })
        console.error('[BrixCI] Compile blocked by issues:', error.issues)
      } else {
        console.error('[BrixCI] Unexpected compile error:', error)
        set({
          issues: [
            {
              code: 'INVALID_EDGE',
              severity: 'error',
              message: 'Unexpected error while compiling.',
            },
          ],
        })
      }
      return null
    }
  },


  undo: () => {
    set((state) => {
      if (state.historyPast.length === 0) {
        return state
      }

      const previousGraph = state.historyPast[state.historyPast.length - 1]
      const nextPast = state.historyPast.slice(0, -1)
      const nextFuture = [cloneGraph(state.graph), ...state.historyFuture]

      return {
        graph: previousGraph,
        historyPast: nextPast,
        historyFuture: limitHistory(nextFuture),
        issues: validateGraph(previousGraph),
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.historyFuture.length === 0) {
        return state
      }

      const [futureGraph, ...restFuture] = state.historyFuture
      const nextPast = [...state.historyPast, cloneGraph(state.graph)]

      return {
        graph: futureGraph,
        historyPast: limitHistory(nextPast),
        historyFuture: restFuture,
        issues: validateGraph(futureGraph),
      }
    })
  },

  reset: () => {
    const fresh = createDefaultGraph()
    set({
      graph: fresh,
      issues: validateGraph(fresh),
      yamlOutput: '',
      workflowName: DEFAULT_WORKFLOW_NAME,
      workflowEnv: {},
      selectedNodeId: null,
      historyPast: [],
      historyFuture: [],
    })
  },

  autoLayout: () => {
    set((state) => {
      const nextGraph = applyAutoLayout(state.graph, 'LR')
      return {
        ...pushHistory(state),
        graph: nextGraph,
        issues: validateGraph(nextGraph),
      }
    })
  },

  replaceGraph: (graph, yamlOutput = '', workflowName, workflowEnv) => {
    const normalizedGraph = resolveGraphOverlaps(graph)
    set((state) => ({
      graph: normalizedGraph,
      issues: validateGraph(normalizedGraph),
      yamlOutput,
      workflowName: workflowName ?? state.workflowName,
      workflowEnv: workflowEnv ?? state.workflowEnv,
      selectedNodeId: null,
      historyPast: [],
      historyFuture: [],
    }))
  },
}))
