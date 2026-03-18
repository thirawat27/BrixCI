# 🚀 Brix CI: The Ultimate Visual GitHub Actions Builder

BrixCI is an advanced, graph-based visual builder designed specifically for **GitHub Actions**. It allows developers to craft complex CI/CD automation pipelines through an intuitive drag-and-drop interface, without manually writing deeply nested YAML files. 

Our ultimate goals are to drastically reduce YAML syntax errors, uncover advanced GitHub Actions features normally hidden in documentation, and make CI/CD accessible to everyone.

![BrixCI Interface](https://img.shields.io/badge/Status-Active-success)

---

## 🌟 Why BrixCI? (Benefits)

* **No More YAML Indentation Hell**: Say goodbye to spending hours debugging invisible space/tab indentation errors.
* **Discover Hidden Features**: We bring advanced properties (like `concurrency`, `permissions`, `continue-on-error`, and multiple specific triggers) directly to the UI, unlocking powerful features you might not have known existed.
* **Real-time Validation & Feedback**: BrixCI validates your structural logic instantly. It warns you about cycle detections, orphaned jobs, missing triggers, or invalid edges *before* you even try to commit.
* **Seamless Import/Export**: Got an existing `.yml` file? Just import it! BrixCI's intelligent compiler can parse complex YAML files and immediately generate a beautiful visual graph.
* **100% Client-side**: Everything runs locally in your browser. No server processing required.

---

## 📖 User Manual & Features

BrixCI utilizes a **Node-based architecture** consisting of three core node types: **Trigger**, **Job**, and **Step**.

### 1. Trigger Nodes (The "When")
Triggers define *when* your pipeline should run.
* **Full Event Support**: Supports all 22+ GitHub Actions events including `push`, `pull_request`, `release`, `workflow_dispatch`, `schedule`, `workflow_run`, and many more.
* **Advanced Filters**: You can specify exact constraints:
  * `branches` and `branches-ignore` (e.g., run only on `main`)
  * `paths` and `paths-ignore` (e.g., skip deployments if only `README.md` changed)
  * `tags` and `tags-ignore`
  * `types` (e.g., run only when a Release is `published` or a PR is `opened`)
* **Cron UI**: Specifically supports inputting Cron syntax for the `schedule` event.

### 2. Job Nodes (The "Where" & "How")
Jobs represent the environments where your steps run. They can run in parallel or depend on each other.
* **Runs-on Autocomplete**: Easily switch between environments like `ubuntu-latest`, `windows-latest`, `macos-latest`, or custom runners.
* **Strategy / Matrix**: Run tests across multiple OS or Language versions simultaneously. Supports `max-parallel` and `fail-fast`.
* **Environment Variables**: Set pipeline or job-level `env` variables securely.
* **Concurrency**: Prevent overlapping deployments by assigning a `Concurrency Group` and choosing whether to `Cancel in-progress` runs automatically.
* **Granular Permissions**: Follow security best practices by narrowing down exactly what scope (e.g., `contents=read`, `pull-requests=write`) the `GITHUB_TOKEN` is permitted to access.
* **Outputs**: Send outputs out of a Job so subsequent Jobs can use them (e.g., `artifact-id=${{ steps.upload.outputs.id }}`).
* **Containers & Environments**: Run the entire job inside a specific `Container Image` or bind the job to a GitHub `Environment Name` (to prompt for manual approvals).

### 3. Step Nodes (The "What")
Steps are the actual commands and actions that get executed sequentially inside a Job.
* **Actions vs. Commands**: Easily switch between using an external Action (e.g., `actions/checkout@v4`) or running custom Shell Commands (`npm run build`).
* **Step IDs**: Give steps an ID so other steps/jobs can reference their outputs.
* **If Conditions**: Control step execution logically. For example, `always() || failure()` to ensure cleanup steps run even if previous steps failed.
* **Shell & Working Directory**: Override the default shell (e.g., `pwsh`, `python`) or execute commands in a distinct directory (e.g., `./packages/backend`).
* **Timeouts & Continue-on-Error**: Specify `Timeout (minutes)` to kill hanging processes, and opt to `Continue on error` for non-critical steps (like linting).

---

## 🔗 Connection Rules & Validation

To ensure compilation into a strictly valid GitHub Actions YAML, BrixCI enforces rules in real-time:

1. **Hierarchy**: Triggers connect to Jobs (`Trigger -> Job`). Jobs can connect to other Jobs to define dependencies (`needs:`). Jobs connect to Steps to assign ownership (`Job -> Step`). Steps connect to Steps sequentially inside the same Job.
2. **Cycle Detection (DAG)**: You cannot create circular dependencies between Jobs.
3. **Orphan Prevention**: A Job with no trigger connection or no internal Steps will be flagged.
4. **Step Chains**: Step connections cannot cross borders into other Jobs.

---

## 🚀 Getting Started (Development)

Clone the repository and install dependencies to run the BrixCI editor locally:

```bash
# Start the local development environment
npm run dev

# Run TypeScript checking and generate production assets
npm run build

# Run unit tests via Vitest
npm run test

# Run ESLint to analyze the codebase
npm run lint
```

## 🌐 Supported Languages
BrixCI comes natively with full i18n support. 
* English (en)
* Thai (th)
* Chinese (zh)

Change your preferred language using the globe icon in the navigation bar.

---
*Built from the ground up to make CI/CD pipelines accessible, delightful, and error-free.* 🎉
