import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import { useEffect } from 'react'
import { JobNode } from '../nodes/JobNode'
import { StepNode } from '../nodes/StepNode'
import { TriggerNode } from '../nodes/TriggerNode'
import { CanvasContextMenuProvider } from './CanvasContextMenu'
import { useEditorStore } from '../../../store/editorStore'
import type { BrixEdge, BrixNode, NodeKind } from '../../../domain/graph'

const nodeTypes = {
  trigger: TriggerNode,
  job: JobNode,
  step: StepNode,
}

function CanvasInner() {
  const nodes = useEditorStore((state) => state.graph.nodes)
  const edges = useEditorStore((state) => state.graph.edges)
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const onNodesChange = useEditorStore((state) => state.onNodesChange)
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange)
  const onConnect = useEditorStore((state) => state.onConnect)
  const setSelectedNode = useEditorStore((state) => state.setSelectedNode)
  const addNode = useEditorStore((state) => state.addNode)
  const removeSelectedNode = useEditorStore((state) => state.removeSelectedNode)
  const { fitView } = useReactFlow()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey
      
      // Duplicate node (Ctrl+D)
      if (hasModifier && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (selectedNodeId) {
          const selectedNode = nodes.find((n) => n.id === selectedNodeId)
          if (selectedNode) {
            addNode(selectedNode.type as NodeKind)
          }
        }
        return
      }

      // Fit view (Ctrl+0)
      if (hasModifier && event.key === '0') {
        event.preventDefault()
        fitView({ padding: 0.2 })
        return
      }

      // Delete selected node (Delete key)
      if (event.key === 'Delete' && selectedNodeId) {
        removeSelectedNode()
        return
      }

      // Escape to deselect
      if (event.key === 'Escape') {
        setSelectedNode(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, nodes, addNode, removeSelectedNode, setSelectedNode, fitView])

  return (
    <ReactFlow<BrixNode, BrixEdge>
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      snapToGrid
      snapGrid={[16, 16]}
      deleteKeyCode={null}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={(selection) => {
        setSelectedNode(selection.nodes[0]?.id ?? null)
      }}
      onPaneClick={() => {
        setSelectedNode(null)
      }}
      colorMode="dark"
      className="h-full min-h-[62svh] w-full lg:min-h-0"
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Controls position="bottom-left" showInteractive={false} />
      <Background color="rgba(148, 163, 184, 0.22)" gap={18} size={1.2} variant={BackgroundVariant.Dots} />
    </ReactFlow>
  )
}

export function EditorCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasContextMenuProvider>
        <CanvasInner />
      </CanvasContextMenuProvider>
    </ReactFlowProvider>
  )
}
