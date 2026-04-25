# Coding Conventions

**Analysis Date:** 2025-01-03

## Naming Patterns

**Files:**
- PascalCase for React components: `src/StringArtGenerator.jsx`
- camelCase for entry points and main files: `src/main.jsx`
- `.test.js` or `.test.jsx` suffix for test files: `src/test/algorithms.test.js`

**Functions:**
- camelCase for functional components: `const StringArtGenerator = () => { ... }`
- camelCase for internal logic: `calculateNailPositions`, `getLinePixels`, `calculateLineScore`

**Variables:**
- camelCase for state and local variables: `image`, `imageData`, `physicalWidth`
- PascalCase for React components: `StringArtGenerator`

**Types:**
- Not applicable (Plain JavaScript/JSX)

**Constants:**
- UPPER_SNAKE_CASE for configuration values: `MIN_NAIL_SPACING`, `MAX_NAIL_SPACING`

## Code Style

**Formatting:**
- Indentation: 2 spaces
- Semicolons: Used consistently
- Quotes: Single quotes for imports and string literals: `import React from 'react'`, `setUnit('cm')`
- JSX: PascalCase for components, camelCase for props

**Linting:**
- Not explicitly configured via `.eslintrc` in the root, but Vitest and Vite provide some environment-level linting and type checking via dependencies.

## Import Organization

**Order:**
1. React and standard library hooks: `import React, { useState, ... } from 'react';`
2. External libraries: `import { describe, it, ... } from 'vitest';`
3. Local components and files: `import StringArtGenerator from './StringArtGenerator';`

**Path Aliases:**
- Relative paths are used: `./StringArtGenerator`, `../StringArtGenerator`

## Error Handling

**Patterns:**
- Defensive checks: `if (nailPositionsCacheKey.current === cacheKey && nailPositionsCache.current)`
- Initial state handling: `const [image, setImage] = useState(null);`
- Disabling interactions when state is invalid: Generate button disabled if `!image` or `isProcessing`.

## Logging

**Framework:** `console`

**Patterns:**
- Used primarily in performance tests to report metrics: `console.log('Baseline Performance Metrics:', baselineMetrics);`

## Comments

**When to Comment:**
- Section headers in large components: `// Physical canvas dimensions`, `// Nail spacing (in mm)`
- Algorithm explanations: `// Test helper functions that mirror the component's logic`

**JSDoc/TSDoc:**
- Not detected.

## Function Design

**Size:** 
- Core logic is broken into focused helper functions: `getLinePixels`, `calculateLineScore`.
- The main component `StringArtGenerator` is relatively large (~660 lines), containing both logic and JSX.

**Parameters:**
- Functions take specific primitive or object parameters: `(width, height, count)`, `(pixels, imageArray, width, height)`.

**Return Values:**
- Explicit return values for logic functions: `return positions;`, `return pixels;`, `return score;`.

## Module Design

**Exports:**
- Default exports for main components: `export default StringArtGenerator;`
- Default export for config: `export default defineConfig({ ... })`

**Barrel Files:**
- Not used.

---

*Convention analysis: 2025-01-03*
