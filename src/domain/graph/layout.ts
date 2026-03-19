import type { XYPosition } from '@xyflow/react'
import type { BrixNode, GraphState, NodeKind } from './types'
import dagre from 'dagre'

const SNAP_GRID = 16
const GRID_COLUMNS = 4
const GRID_START_X = 120
const GRID_START_Y = 120
const GRID_GAP_X = 340
const GRID_GAP_Y = 840
const OVERLAP_GAP_Y = 40

const NODE_DIMENSIONS: Record<NodeKind, { width: number; height: number }> = {
  trigger: { width: 300, height: 400 },
  job: { width: 300, height: 700 },
  step: { width: 300, height: 600 },
}

function snap(value: number): number {
  return Math.ceil(value / SNAP_GRID) * SNAP_GRID
}

function rangesOverlap(startA: number, sizeA: number, startB: number, sizeB: number): boolean {
  return startA < startB + sizeB && startA + sizeA > startB
}

function estimatedNodeDimensions(nodeOrKind: BrixNode | NodeKind): { width: number; height: number } {
  const kind = typeof nodeOrKind === 'string' ? nodeOrKind : nodeOrKind.type
  return NODE_DIMENSIONS[kind]
}

function findResolvedY(
  candidateX: number,
  candidateY: number,
  candidateKind: NodeKind,
  existingNodes: BrixNode[],
): number {
  const { width, height } = estimatedNodeDimensions(candidateKind)
  let nextY = snap(candidateY)
  let changed = true

  while (changed) {
    changed = false

    for (const node of existingNodes) {
      const other = estimatedNodeDimensions(node)
      const overlapsHorizontally = rangesOverlap(
        candidateX,
        width,
        node.position.x,
        other.width,
      )
      if (!overlapsHorizontally) {
        continue
      }

      const overlapsVertically = rangesOverlap(
        nextY,
        height,
        node.position.y,
        other.height,
      )
      if (!overlapsVertically) {
        continue
      }

      nextY = snap(node.position.y + other.height + OVERLAP_GAP_Y)
      changed = true
    }
  }

  return nextY
}

export function nextNodePosition(existingNodes: BrixNode[], kind: NodeKind): XYPosition {
  const col = existingNodes.length % GRID_COLUMNS
  const row = Math.floor(existingNodes.length / GRID_COLUMNS)
  const x = GRID_START_X + col * GRID_GAP_X
  const y = GRID_START_Y + row * GRID_GAP_Y

  return {
    x,
    y: findResolvedY(x, y, kind, existingNodes),
  }
}

export function resolveGraphOverlaps(graph: GraphState): GraphState {
  const nodes = structuredClone(graph.nodes)
  const sortedNodes = [...nodes].sort(
    (a, b) => a.position.x - b.position.x || a.position.y - b.position.y,
  )
  const placedNodes: BrixNode[] = []

  for (const node of sortedNodes) {
    node.position.y = findResolvedY(node.position.x, node.position.y, node.type, placedNodes)
    placedNodes.push(node)
  }

  return {
    nodes,
    edges: structuredClone(graph.edges),
  }
}

export function applyAutoLayout(graph: GraphState, direction: 'TB' | 'LR' = 'LR'): GraphState {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
  })

  // Add nodes to dagre
  graph.nodes.forEach((node) => {
    const dim = estimatedNodeDimensions(node)
    dagreGraph.setNode(node.id, { width: dim.width, height: dim.height })
  })

  // Add edges to dagre
  graph.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply new positions
  const newNodes = graph.nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const dim = estimatedNodeDimensions(node)
    
    // Dagre returns the center point constraint, we need to map to top-left for React Flow
    return {
      ...node,
      position: {
        x: snap(nodeWithPosition.x - dim.width / 2 + GRID_START_X),
        y: snap(nodeWithPosition.y - dim.height / 2 + GRID_START_Y),
      },
    }
  })

  return {
    ...graph,
    nodes: newNodes,
  }
}
