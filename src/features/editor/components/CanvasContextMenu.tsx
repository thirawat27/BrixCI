import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Maximize,
  Play,
  ShieldCheck,
  Undo2,
  Redo2,
  MousePointer2,
} from 'lucide-react'
import type { NodeKind } from '../../../domain/graph'
import { useEditorStore } from '../../../store/editorStore'
import { useI18n } from '../../../i18n'

interface ContextMenuItem {
  id: string
  label: string
  icon: ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  action: () => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  nodeId: string | null
}

interface CanvasContextMenuProps {
  children: ReactNode
}

export function CanvasContextMenuProvider({ children }: CanvasContextMenuProps) {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  })

  const { text } = useI18n()
  const nodes = useEditorStore((state) => state.graph.nodes)
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const addNode = useEditorStore((state) => state.addNode)
  const removeSelectedNode = useEditorStore((state) => state.removeSelectedNode)
  const setSelectedNode = useEditorStore((state) => state.setSelectedNode)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const reset = useEditorStore((state) => state.reset)
  const validate = useEditorStore((state) => state.validate)
  const compile = useEditorStore((state) => state.compile)
  const historyPastCount = useEditorStore((state) => state.historyPast.length)
  const historyFutureCount = useEditorStore((state) => state.historyFuture.length)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, nodeId?: string) => {
      event.preventDefault()
      
      // Use screen coordinates directly since menu uses position: fixed
      const x = event.clientX
      const y = event.clientY
      
      setMenu({
        visible: true,
        x,
        y,
        nodeId: nodeId ?? null,
      })
    },
    []
  )

  const closeMenu = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  useEffect(() => {
    if (!menu.visible) return

    const handleClick = () => closeMenu()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menu.visible, closeMenu])

  const handleAddNode = (kind: NodeKind) => {
    addNode(kind)
    closeMenu()
  }

  const handleDeleteNode = () => {
    if (selectedNodeId) {
      removeSelectedNode()
    }
    closeMenu()
  }

  const handleDuplicateNode = () => {
    if (selectedNode) {
      const nodeType = selectedNode.type as NodeKind
      addNode(nodeType)
    }
    closeMenu()
  }

  const getMenuItems = (): ContextMenuItem[][] => {
    const isNodeMenu = !!menu.nodeId

    // Node-specific actions
    const nodeActions: ContextMenuItem[] = isNodeMenu
      ? [
          {
            id: 'select-node',
            label: text.selectNode || 'Select Node',
            icon: <MousePointer2 size={14} />,
            shortcut: 'Click',
            action: () => {
              setSelectedNode(menu.nodeId)
              closeMenu()
            },
          },
          {
            id: 'duplicate-node',
            label: text.duplicateNode || 'Duplicate',
            icon: <Copy size={14} />,
            shortcut: 'Ctrl+D',
            action: handleDuplicateNode,
          },
          {
            id: 'delete-node',
            label: text.deleteNode || 'Delete',
            icon: <Trash2 size={14} />,
            shortcut: 'Del',
            danger: true,
            action: handleDeleteNode,
          },
        ]
      : []

    // Create actions
    const createActions: ContextMenuItem[] = [
      {
        id: 'add-trigger',
        label: text.addTrigger || 'Add Trigger',
        icon: <Plus size={14} />,
        action: () => handleAddNode('trigger'),
      },
      {
        id: 'add-job',
        label: text.addJob || 'Add Job',
        icon: <Plus size={14} />,
        action: () => handleAddNode('job'),
      },
      {
        id: 'add-step',
        label: text.addStep || 'Add Step',
        icon: <Plus size={14} />,
        action: () => handleAddNode('step'),
      },
    ]

    // History actions
    const historyActions: ContextMenuItem[] = [
      {
        id: 'undo',
        label: text.undo || 'Undo',
        icon: <Undo2 size={14} />,
        shortcut: 'Ctrl+Z',
        disabled: historyPastCount === 0,
        action: () => {
          undo()
          closeMenu()
        },
      },
      {
        id: 'redo',
        label: text.redo || 'Redo',
        icon: <Redo2 size={14} />,
        shortcut: 'Ctrl+Y',
        disabled: historyFutureCount === 0,
        action: () => {
          redo()
          closeMenu()
        },
      },
    ]

    // Workflow actions
    const workflowActions: ContextMenuItem[] = [
      {
        id: 'validate',
        label: text.validate || 'Validate',
        icon: <ShieldCheck size={14} />,
        shortcut: 'Ctrl+Shift+V',
        action: () => {
          validate()
          closeMenu()
        },
      },
      {
        id: 'compile',
        label: text.compile || 'Compile',
        icon: <Play size={14} />,
        shortcut: 'Ctrl+Enter',
        action: () => {
          compile()
          closeMenu()
        },
      },
    ]

    // Canvas actions
    const canvasActions: ContextMenuItem[] = !isNodeMenu
      ? [
          {
            id: 'fit-view',
            label: text.fitView || 'Fit View',
            icon: <Maximize size={14} />,
            shortcut: 'Ctrl+0',
            action: () => {
              closeMenu()
            },
          },
        ]
      : []

    // Danger actions
    const dangerActions: ContextMenuItem[] = [
      {
        id: 'reset',
        label: text.reset || 'Reset All',
        icon: <RotateCcw size={14} />,
        danger: true,
        action: () => {
          if (window.confirm(text.resetConfirm)) {
            reset()
          }
          closeMenu()
        },
      },
    ]

    if (isNodeMenu) {
      return [nodeActions, createActions, historyActions, workflowActions, dangerActions]
    }

    return [createActions, canvasActions, historyActions, workflowActions, dangerActions]
  }

  const menuGroups = getMenuItems()

  return (
    <>
      <div
        onContextMenu={(e) => handleContextMenu(e)}
        className="contents"
      >
        {children}
      </div>

      {menu.visible && (
        <div
          className="fixed z-50 min-w-[200px] rounded-xl border border-slate-700 bg-slate-950/95 p-1.5 shadow-[0_24px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          style={{
            left: menu.x,
            top: menu.y,
          }}
        >
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && group.length > 0 && (
                <div className="my-1 border-t border-slate-700/60" />
              )}
              {group.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    item.action()
                  }}
                  disabled={item.disabled}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                    item.danger
                      ? 'text-rose-300 hover:bg-rose-950/40'
                      : item.disabled
                      ? 'cursor-not-allowed text-slate-600'
                      : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={item.danger ? 'text-rose-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <kbd className="rounded border border-slate-600/50 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
