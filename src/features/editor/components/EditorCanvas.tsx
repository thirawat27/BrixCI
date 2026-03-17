import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import { JobNode } from '../nodes/JobNode'
import { StepNode } from '../nodes/StepNode'
import { TriggerNode } from '../nodes/TriggerNode'
import { useEditorStore } from '../../../store/editorStore'
import type { BrixEdge, BrixNode } from '../../../domain/graph'

const nodeTypes = {
  trigger: TriggerNode,
  job: JobNode,
  step: StepNode,
}

function CanvasInner() {
  const nodes = useEditorStore((state) => state.graph.nodes)
  const edges = useEditorStore((state) => state.graph.edges)
  const onNodesChange = useEditorStore((state) => state.onNodesChange)
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange)
  const onConnect = useEditorStore((state) => state.onConnect)
  const setSelectedNode = useEditorStore((state) => state.setSelectedNode)

  return (
    <ReactFlow<BrixNode, BrixEdge>
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      snapToGrid
      snapGrid={[16, 16]}
      deleteKeyCode={['Delete', 'Backspace']}
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
      className="h-full min-h-[62svh] w-full xl:min-h-0"
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
      <CanvasInner />
    </ReactFlowProvider>
  )
}
