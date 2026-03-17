import { describe, expect, it } from 'vitest'
import { createStepNode } from './factories'
import { resolveGraphOverlaps } from './layout'

describe('graph layout', () => {
  it('pushes overlapping nodes downward to avoid stacking collisions', () => {
    const topStep = createStepNode(
      { id: 'step-top', position: { x: 700, y: 80 } },
      {
        label: 'Checkout',
        mode: 'uses',
      },
    )
    const bottomStep = createStepNode(
      { id: 'step-bottom', position: { x: 700, y: 220 } },
      {
        label: 'Install Dependencies',
        mode: 'run',
      },
    )

    const graph = resolveGraphOverlaps({
      nodes: [topStep, bottomStep],
      edges: [],
    })

    const first = graph.nodes.find((node) => node.id === 'step-top')
    const second = graph.nodes.find((node) => node.id === 'step-bottom')

    expect(first?.position.y).toBe(80)
    expect(second?.position.y).toBeGreaterThanOrEqual(640)
  })
})
