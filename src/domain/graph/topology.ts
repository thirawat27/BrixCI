import type { BrixEdge, BrixNode } from './types'

export interface SortNode {
  id: string
  x: number
  y: number
}

function getSortWeight(node: SortNode): number {
  return node.y * 10_000 + node.x
}

function sortedQueueInsert(queue: SortNode[], node: SortNode): void {
  queue.push(node)
  queue.sort((a, b) => getSortWeight(a) - getSortWeight(b))
}

export function topologicalSortByEdges(
  nodes: SortNode[],
  edges: Array<{ source: string; target: string }>,
): string[] | null {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const adjacency = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
    indegree.set(node.id, 0)
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      continue
    }
    adjacency.get(edge.source)!.push(edge.target)
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
  }

  const queue: SortNode[] = []
  for (const node of nodes) {
    if ((indegree.get(node.id) ?? 0) === 0) {
      sortedQueueInsert(queue, node)
    }
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current.id)

    for (const target of adjacency.get(current.id) ?? []) {
      const nextIndegree = (indegree.get(target) ?? 0) - 1
      indegree.set(target, nextIndegree)
      if (nextIndegree === 0) {
        const targetNode = nodeMap.get(target)!
        sortedQueueInsert(queue, targetNode)
      }
    }
  }

  if (sorted.length !== nodes.length) {
    return null
  }

  return sorted
}

export function detectCycle(
  nodes: Pick<BrixNode, 'id'>[],
  edges: Pick<BrixEdge, 'source' | 'target'>[],
): string[] | null {
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) {
      continue
    }
    adjacency.get(edge.source)!.push(edge.target)
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const path: string[] = []

  function dfs(nodeId: string): string[] | null {
    visiting.add(nodeId)
    path.push(nodeId)

    for (const nextId of adjacency.get(nodeId) ?? []) {
      if (visiting.has(nextId)) {
        const startIndex = path.indexOf(nextId)
        return [...path.slice(startIndex), nextId]
      }
      if (!visited.has(nextId)) {
        const cycle = dfs(nextId)
        if (cycle) {
          return cycle
        }
      }
    }

    visiting.delete(nodeId)
    visited.add(nodeId)
    path.pop()
    return null
  }

  for (const node of nodes) {
    if (visited.has(node.id)) {
      continue
    }
    const cycle = dfs(node.id)
    if (cycle) {
      return cycle
    }
  }

  return null
}
