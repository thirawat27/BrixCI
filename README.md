# BrixCI 🧱 

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/thirawat27/BrixCI)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

**BrixCI** is the ultimate visual, drag-and-drop editor for designing **GitHub Actions Workflows**. Gone are the days of manually typing complex and error-prone YAML configurations. With BrixCI, you can visually construct your CI/CD pipelines, validate them in real-time, generate industry-standard YAML instantly, and push your workflows directly back to your GitHub repository—all inside an intuitive, lightning-fast interface!

---

## 📑 Table of Contents

1. [Introduction](#1-introduction)
2. [Why BrixCI?](#2-why-brixci)
3. [Key Features](#3-key-features)
4. [Core Concepts](#4-core-concepts)
   - [Triggers](#triggers)
   - [Jobs](#jobs)
   - [Steps](#steps)
5. [Ultimate User Manual](#5-ultimate-user-manual)
   - [1. Creating a New Workflow](#1-creating-a-new-workflow)
   - [2. Drawing Connections (Edges)](#2-drawing-connections-edges)
   - [3. Real-Time Validation](#3-real-time-validation)
   - [4. Editing Node Properties (Inspector)](#4-editing-node-properties-inspector)
   - [5. Using Auto-Layout (Dagre)](#5-using-auto-layout-dagre)
   - [6. Navigating with the MiniMap](#6-navigating-with-the-minimap)
   - [7. Deploying Directly to GitHub](#7-deploying-directly-to-github)
6. [Templates Library](#6-templates-library)
7. [Installation & Setup](#7-installation--setup)
8. [Architecture & Tech Stack](#8-architecture--tech-stack)
9. [Localization](#9-localization)
10. [Contributing & Security](#10-contributing--security)

---

## 1. Introduction

Writing GitHub Actions workflows is powerful, but it usually involves reading heavy documentation and hunting down spacing issues in YAML files. **BrixCI** bridges this gap by offering a fully interactive, node-based visual workspace that behaves like a mind-mapping tool for Infrastructure and DevOps engineering.

Whether you are a Junior Developer trying to set up your first Continuous Integration process, or a Senior Site Reliability Engineer looking to quickly visualize complex Continuous Deployment matrices, BrixCI adapts to your needs seamlessly.

---

## 2. Why BrixCI?

- **Stop Wasting Time on Syntax Errors:** Missing a space or adding an extra `-` in your YAML? BrixCI generates perfect YAML structure every single time via our built-in robust compiler.
- **Visualize the Big Picture:** Seeing a graphical hierarchy from Push triggers -> Linters -> Unit Tests -> Deployments helps human brains process dependencies far faster than reading hundreds of lines of code.
- **Immediate Feedback Loop:** Through our real-time validator, if a Step Node doesn't belong to a Job, an error is highlighted instantly.
- **No Complex Context Switching:** You can build, validate, format, and push your entire pipeline without ever leaving your web browser.

---

## 3. Key Features

BrixCI is packed with cutting-edge tools to maximize your developer productivity.

- ✨ **Drag-and-Drop Node System:** Effortlessly bring your workflows to life using familiar interactive canvas actions built on React Flow.
- ✨ **Direct GitHub Deployment (API Integration):** You no longer need to download your YAML and push it independently. Enter your personal access token, and BrixCI commits your workflow straight into the `.github/workflows/` directory!
- ✨ **Intelligent Auto-Layout (Powered by Dagre):** Messy graph? One click on "Auto Layout (Dagre)" calculates optimal node distances and alignment automatically.
- ✨ **MiniMap Navigation:** Effortlessly pan and zoom around massive enterprise-scale CI pipelines without losing track of your place.
- ✨ **Rich Template Library:** Skip hours of Googling syntax. Use community-standard templates like `Node.js CI/CD` and `Docker Build & Push` presets to get up and running in one second.
- ✨ **Undo / Redo Safety Net:** Accidentally deleted your main deployment job? Press `Ctrl + Z` to bring it instantly back via our specialized history provider implementation.
- ✨ **Live Compiler & Validation Console:** Keep an eye on the side panel; it constantly transforms your nodes into GitHub-ready YAML while warning you about missing environment variables or unconnected edge structures.

---

## 4. Core Concepts

To master BrixCI, you should understand the three primary types of nodes corresponding to the GitHub Actions specification.

### Triggers
Triggers are the starting points. They define **WHEN** a workflow should run. Common triggers include:
- `push`: Whenever code is pushed to specific branches (e.g., `main`).
- `pull_request`: Whenever someone opens or updates a Pull Request.
- `schedule`: To run automated cron jobs (e.g., Every day at midnight).

### Jobs
Jobs represent a virtual machine or runner (e.g., `ubuntu-latest`, `windows-latest`). All steps inside a job run sequentially on the same server environment, allowing them to share files and environments. Multiple Jobs can run in parallel via concurrent execution mapping.

### Steps
Steps are the atomic execution blocks. A step can either:
- Run a shell command (e.g., `npm install`).
- Use an existing open-source GitHub Action (e.g., `actions/checkout@v4`).

---

## 5. Ultimate User Manual

This section contains highly detailed instructions on every feature in the application, acting as your comprehensive guide.

### 1. Creating a New Workflow
1. Look at the top toolbar and find the **+ Create** dropdown.
2. Select **Add Trigger**, **Add Job**, or **Add Step**. The new node will drop directly into the center of your screen.
3. You can click and drag this node anywhere on the infinite canvas.

### 2. Drawing Connections (Edges)
Nodes need to know their relationship! 
1. Hover over a **Trigger Node**. A small handle (dot) will appear on its right edge.
2. Click and hold the handle, then drag the line down to the left edge of a **Job Node**.
3. Repeat this process from the **Job Node** connecting to its child **Step Nodes**.

### 3. Real-Time Validation
Keep an eye on the **Validation Panel** on the right side of the screen.
If you leave a Step floating without connecting it to a Job, the validation engine will mark it in RED as a **Blocking Error**, and the generated YAML compilation will be suspended to protect you from deploying broken code.

### 4. Editing Node Properties (Inspector)
Each node is highly customizable.
1. Click on any node to select it.
2. Look at the **Inspector Panel** in the right column.
3. Depending on the newly selected node type, you can rename the Step, switch the executor from `ubuntu-latest` to `macos-latest`, inject environment variables, define bash scripts, and pick action references like `actions/checkout@v4`.

### 5. Using Auto-Layout (Dagre)
If you have created 20 steps and their visual placement is overlapping or disorganized:
1. Right-click anywhere in the empty canvas background to display the Canvas Context Menu.
2. Select **Auto Layout (Dagre)**.
3. Watch the magic happen as all nodes cleanly arrange into a highly readable left-to-right flow based on directional graph optimization.

### 6. Navigating with the MiniMap
At the bottom right of the canvas, you will see a small dark window summarizing the entire graph shape.
You can click or drag the highlighted square inside the MiniMap to fast-travel across large workflows instantly! This ensures you never lose orientation in enterprise deployments.

### 7. Deploying Directly to GitHub
This is BrixCI’s real superpower!
1. Once your YAML output looks structurally perfect, find the **Export / Build Menu**.
2. Click the shiny **Deploy to GitHub** button.
3. A browser native popup will ask you for your repository path in the exact format `username/repository`.
4. Next, enter your GitHub Personal Access Token (Requires `repo` and `workflow` OAuth scopes).
5. The application securely sends the Base64 payload payload to the GitHub API via REST fetch requests and commits `.github/workflows/your-workflow.yml` automatically! You'll never need to clone, commit, and push manually just to update CI workflows again.

---

## 6. Templates Library

Why start from scratch when you don't have to? At the top toolbar, you will find a **Templates** dropdown menu pre-populated with common workflows.
- **Node.js CI**: Instantly generates a pipeline that checks out code, setups up target Node.js versions via a matrix strategy, installs dependencies cleanly with `npm ci`, builds production assets, and rigorously runs test suites.
- **Docker Build & Push**: Automatically provisions a docker authentication pipeline securely connected to the GitHub Container Registry (`ghcr.io`), tags images dynamically based on GitHub Metadata Action outputs, and securely pushes your application container!

---

## 7. Installation & Setup

Developers wishing to run their own local instance or contribute to BrixCI can follow these straightforward steps:

### Prerequisites
- Node.js version 20 LTS is heavily recommended (We use a `.nvmrc` file to pin the exact version to guarantee stability).
- NPM Package Manager (Configs strictly provided via `.npmrc` enforcing exact dependencies).

### Standard Installation
```bash
# 1. Clone your repository
git clone https://github.com/thirawat27/BrixCI.git
cd BrixCI

# 2. Use the correct Node version if you have NVM installed
nvm use

# 3. Lock engine dependencies and install packages
npm install

# 4. Start the frontend on the blazing-fast Vite server
npm run dev
```

Your modern hot-reloading development server will now be fully accessible at `http://localhost:5173`. 

---

## 8. Architecture & Tech Stack

BrixCI uses a strictly modular Domain-Driven structure designed to scale flawlessly over time:

- **React 18 & Vite:** Serving as the blazing-fast modern application shell.
- **TypeScript:** Ensuring 100% type safety for complex graphical calculations, state payloads, and generic component parsing.
- **React Flow (`@xyflow/react`):** Executing all canvas logic, customized user handles, Minimaps, and responsive smooth step edges.
- **Dagre JS:** Handling complex Directed Acyclic Graph layouts on command matrix structures.
- **Zustand:** Providing predictable global state management coupled tightly with robust Undo/Redo middleware architecture limits.
- **Domain Directory Architecture:** The logic compiler (`src/domain/compiler.ts`) is fully decoupled from the React UI bindings, ensuring you can theoretically export it to a standalone CLI node-tool easily in the future if desired.

---

## 9. Localization

To aid a wide network of developers worldwide, global accessibility is highly prioritized. Open the dropdown in the navigation header to switch languages dynamically. Available languages include **English (en)**, **Thai (th)**, and **Chinese (zh)**. The translations are fully decoupled from layout components natively existing cleanly under the `src/i18n` dictionary folders!

---

## 10. Contributing & Security

We embrace the global open-source community deeply!
If you find elusive bugs or want to write new Graph Templates to share:
1. Make absolutely sure to read [CONTRIBUTING.md](./CONTRIBUTING.md) for strict pull-request community guidelines, conventional commit instructions, and architectural rule compliance overviews.
2. For severe vulnerabilities spanning outside feature scope, please consult [SECURITY.md](./SECURITY.md) privately before indiscriminately posting public issues to allow core maintainers an early-stage patch window.

---

**Crafted with unwavering dedication and 💖 by Thirawat27 alongside Open Source Contributors globally. Stop coding YAML blindfolded—Start building engineering paths visually!**
