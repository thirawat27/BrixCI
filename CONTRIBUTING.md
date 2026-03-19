# Contributing to BrixCI 🧱

First off, thank you for considering contributing to BrixCI! It's people like you that make BrixCI such a great tool for the community.

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful, welcoming, and inclusive of everyone.

## 💡 How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue in the GitHub repository. Try to include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- The expected versus actual behavior.
- Screenshots if applicable.

### Suggesting Enhancements
Have a cool idea for a new CI/CD block or template? Suggest it by opening an issue! Provide details on the feature and how it would improve the application.

### Submitting Pull Requests
1. **Fork** the repository and clone it to your local machine.
2. Ensure you refer to the `.nvmrc` and `.npmrc` files to use the correct Node.js configuration.
3. Install dependencies with `npm install`.
4. Create a new branch: `git checkout -b feature/my-new-feature` or `fix/issue-number`.
5. Make your changes in the codebase.
   - We use `Zustand` for state in `src/store`.
   - Complex logic goes into `src/domain`.
   - UI views are inside `src/features`.
6. Test your changes locally (`npm run dev` and `npm test`).
7. Commit your changes. We highly encourage following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
8. Push your branch to GitHub.
9. Open a Pull Request from your fork to our `main` branch.

## 🏗️ Architecture Overview
- `src/domain/`: Core business logic (compiling to YAML, validating nodes). Must not depend on React or the store!
- `src/store/`: The Zustand state holding the graph structure (nodes, edges) and undo/redo logic.
- `src/features/`: React components (e.g., Editor Canvas, Right Panel menus).
- `src/i18n/`: Multilingual vocabulary dictionaries.

We look forward to reviewing your PRs! ✨
