# 🚀 Brix CI

BrixCI is an advanced visual continuous integration and continuous deployment builder explicitly designed for GitHub Actions 🛠️ Through an intuitive drag and drop interface users can craft complex automation pipelines without writing a single line of YAML by hand 🖱️ The ultimate goal of this project is to simplify workflow generation whilst reducing syntax errors drastically 🎯

## 🎯 Architecture and System Overview

The core foundation relies on a strict separation of concerns between domain logic and user interface presentation ensures stability and predictability when compiling valid outputs ✨

### 1 Project Structure and Responsibilities
* `src/domain/compiler` Handles the orchestration of validations and generates the final GitHub Actions YAML schema 📝
* `src/domain/graph` Acts as the single source of truth for all node structures and enforces Directed Acyclic Graph rules along with topological sorting algorithms 🧠
* `src/domain/templates` Provides default graph patterns for first time users ensuring a smooth onboarding experience 🚀
* `src/features/editor` Manages the entire visual presentation layer and custom node components rendered via React Flow 🎨
* `src/store/editorStore.ts` Utilizes Zustand to store runtime state and manage user interactions such as adding nodes or linking them together 💾
* `src/lib/download.ts` Packs utility functions allowing seamless browser based file downloads 📥

### 2 Graph Constraints and Rules
To prevent users from generating invalid YAML configurations the system enforces rigid connection rules 🛡️

* The platform supports three distinct node types Trigger Job and Step 📦
* We exclusively allow specific connection pathways Trigger to Job Job to Job Job to Step and Step to Step 🔗
* Any connection attempt falling outside these parameters is instantly rejected ❌
* Every individual Step must maintain a strict parent reference to a specific Job When a user draws a line from a Job to a Step the system automatically establishes this ownership Step to Step connections are thus strictly fenced within their designated Job context 🔒

### 3 Automated Validation Strategy
Validation algorithms trigger automatically after every state mutation ensuring real time feedback ⚡

* Structural Checks Verify the existence of all referenced nodes and intercept invalid edge formations 🏗️
* Semantic Checks Identify conflicting job IDs or floating Steps lacking a parent Job 🔍
* Graph Traversal Detect infinite loops and circular dependencies ruining workflow execution 🔄
* Quality Assurance Flags orphaned Jobs without any incoming connections or empty Jobs containing zero Steps ⚠️
All detected issues stream directly to the user interface providing instant actionable warnings 🚨

### 4 Compilation Pipeline
Transforming the visual canvas into deployable YAML follows a rigorous sequential process ⚙️

1 Re evaluate the entire graph to guarantee zero critical errors exist 🚦
2 Assemble the foundational trigger section using data gathered from Trigger nodes 🎯
3 Organize Jobs sequentially using topological sorting or fall back to canvas coordinates if necessary 📋
4 Sequence Steps within each respective Job applying topological sorting once more 🔢
5 Translate all parsed objects into well formatted YAML text ready for deployment 📄

### 5 State Memory and Time Travel
* The engine captures periodic snapshots of the graph state to support robust undo and redo mechanics ⏪
* We impose reasonable limits on the memory stack to preserve browser performance and prevent lag 💻
* Upon restoring any previous snapshot the application immediately runs a full validation pass guaranteeing accuracy 🛡️

### 6 Technologies Under The Hood
* React TypeScript and Vite deliver a blazing fast developer experience 🏎️
* React Flow powers the interactive canvas and node manipulation mechanics ⚛️
* Zustand provides an elegant and highly performant state management solution 📦
* js yaml facilitates perfect serialization of JavaScript objects into YAML formats 📜
* Tailwind CSS ensures a modern beautiful and highly responsive design aesthetic 🌈

## 💻 Developer Commands

* `npm run dev` Spins up the local development environment 🚀
* `npm run build` Executes TypeScript type checking and generates optimized production assets 🛠️
* `npm run lint` Analyzes the codebase using ESLint to catch potential styling or logic issues 🧹
* `npm run test` Runs the automated test suites via Vitest ensuring core logic remains intact 🧪

---
Built from the ground up to make GitHub Actions workflow creation a delightful and error free experience 🎉
