# Codebase Structure

**Analysis Date:** 2025-01-24

## Directory Layout

```
string-art/
├── .claude/            # Agent settings
├── .planning/          # GSD planning and codebase maps
│   └── codebase/       # Analysis documents
├── src/                # Main source code
│   ├── test/           # Test suites and configuration
│   │   ├── algorithms.test.js
│   │   ├── performance.test.js
│   │   ├── rendering.test.jsx
│   │   └── setup.js
│   ├── main.jsx        # Entry point
│   └── StringArtGenerator.jsx # Main component and logic
├── index.html          # HTML template for Vite
├── package.json        # Project metadata and dependencies
├── vite.config.js      # Vite and Vitest configuration
└── .nvmrc              # Node version specification
```

## Directory Purposes

**src/:**
- Purpose: Contains all application source code.
- Contains: React components, entry points, and tests.
- Key files: `src/StringArtGenerator.jsx`

**src/test/:**
- Purpose: Contains unit, integration, and performance tests.
- Contains: JavaScript and JSX test files.
- Key files: `src/test/setup.js`, `src/test/algorithms.test.js`

**.planning/codebase/:**
- Purpose: Contains codebase analysis and architecture documents.
- Contains: Markdown files.
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Bootstraps the React application.
- `index.html`: Mount point for the React app.

**Configuration:**
- `package.json`: Dependency management and script definitions.
- `vite.config.js`: Build and test runner configuration.
- `.nvmrc`: Ensures consistent Node.js environment.

**Core Logic:**
- `src/StringArtGenerator.jsx`: Contains both the UI and the string art generation algorithm.

**Testing:**
- `src/test/`: Centralized location for all test files.

## Naming Conventions

**Files:**
- PascalCase for React components: `StringArtGenerator.jsx`
- camelCase for logic/tests: `algorithms.test.js`

**Directories:**
- lowercase for general directories: `src`, `test`, `codebase`

## Where to Add New Code

**New Feature:**
- Primary code: `src/StringArtGenerator.jsx` (currently monolithic, consider splitting if size increases).
- Tests: `src/test/` (create a new `.test.js` or `.test.jsx` file).

**New Component/Module:**
- Implementation: Create a new file in `src/` (e.g., `src/components/Controls.jsx`).

**Utilities:**
- Shared helpers: `src/utils/` (create this directory if logic is extracted from `StringArtGenerator.jsx`).

## Special Directories

**node_modules/:**
- Purpose: Third-party dependencies.
- Generated: Yes
- Committed: No

**.planning/:**
- Purpose: Project management and architectural mapping.
- Generated: No (managed by GSD tools)
- Committed: Yes

---

*Structure analysis: 2025-01-24*
