# BrixCI

BrixCI is a visual CI/CD builder for GitHub Actions. Users can design workflows by dragging and connecting Trigger, Job, and Step nodes, then export the result as YAML.

## Scripts

- `npm run dev` Start the local dev server
- `npm run build` Type-check and build production assets
- `npm run lint` Run ESLint
- `npm run test` Run unit tests with Vitest

## Core Stack

- React + TypeScript + Vite
- React Flow (`@xyflow/react`) for node-based editing
- Zustand for runtime state management
- `js-yaml` for YAML generation

## Project Structure

```txt
src/
  domain/
    compiler/      # Graph -> GitHub Actions YAML
    graph/         # Types, DAG validation, topology sorting
    templates/     # Default graph seed
  features/
    editor/        # Editor UI and custom nodes
  store/
    editorStore.ts # Single source of truth for editor runtime
  lib/
    download.ts    # Browser file export utilities
```

## Current Stability Focus

The current phase prioritizes foundation stability:

- Strict separation between domain logic and UI
- DAG validation with cycle detection
- Deterministic compile path from graph to YAML
- Undo/redo history with unit test coverage for critical logic

See `ARCHITECTURE.md` for architecture details.
