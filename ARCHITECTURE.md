# BrixCI Architecture (Foundation Phase)

This document explains the current architecture baseline that prioritizes a stable core for the visual CI/CD editor before advanced feature expansion.

## 1) Layered Design

1. `domain/graph`
- Source of truth for node and edge data models
- Node connection rules
- DAG validation and cycle detection
- Topological sorting for job and step order

2. `domain/compiler`
- Accepts `GraphState`
- Always validates before compile
- Generates a GitHub Actions workflow object
- Dumps output YAML with `js-yaml`

3. `store/editorStore.ts`
- Single runtime state for the editor (`graph`, `issues`, `yamlOutput`)
- UI command handlers (`addNode`, `onConnect`, `undo`, `redo`, `compile`)
- Deterministic state transitions via immutable snapshots

4. `features/editor`
- React Flow canvas and custom nodes
- Validation, inspector, and output panels
- No compile or validation business logic inside UI components

## 2) Graph Contract

### Node Types
- `trigger`
- `job`
- `step`

### Allowed Edges
- `trigger -> job`
- `job -> job`
- `job -> step`
- `step -> step`

Any other connection is invalid.

### Step Ownership
- Every Step must have `jobNodeId`
- Step chains (`step -> step`) must stay within the same Job
- When connecting `job -> step`, the system auto-binds the Step `jobNodeId`

## 3) Validation Strategy

Validation runs after every mutation in the store:

- Structural checks: missing node references, invalid edges
- Semantic checks: duplicate `jobId`, steps without a valid parent job
- Graph checks: cycle detection
- Quality warnings: orphan jobs, jobs without steps

The result is stored as `ValidationIssue[]` and rendered immediately in the UI.

## 4) Compilation Strategy

`compileGraphToYaml` runs in this order:

1. Validate graph and block on `severity=error`
2. Build the `on` section from Trigger nodes
3. Sort Jobs with topological sort (fallback: canvas position order)
4. Sort Steps per Job with topological sort
5. Convert to workflow object and dump YAML

## 5) Undo/Redo Model

- Graph snapshots are stored in `historyPast` / `historyFuture`
- Snapshot count is capped by `HISTORY_LIMIT` to control memory growth
- Undo/redo always re-runs validation on the restored snapshot

## 6) Extension Points (Next Phases)

- Import YAML -> Graph auto-layout (dagre or elkjs)
- Plugin architecture for custom nodes
- Draft persistence with IndexedDB or LocalStorage
- Expanded component and e2e tests
- GitHub sync (OAuth + REST API)
