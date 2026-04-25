# Codebase Concerns

**Analysis Date:** 2025-01-24

## Tech Debt

**Monolithic Component:**
- Issue: `src/StringArtGenerator.jsx` is a 665-line file that handles UI, application state, image processing, geometry calculations, the core greedy algorithm, and canvas rendering.
- Files: `src/StringArtGenerator.jsx`
- Impact: Difficult to maintain, test, and reuse. Changes to logic are tightly coupled with UI changes.
- Fix approach: Extract core logic (geometry, algorithms, image processing) into separate utility modules. Use a custom hook for state management if necessary.

**Duplicated Logic in Tests:**
- Issue: Core algorithms like `calculateNailPositions`, `getLinePixels`, and `calculateLineScore` are copy-pasted into the test files instead of being imported from the source.
- Files: `src/test/algorithms.test.js`, `src/test/performance.test.js`
- Impact: Tests do not actually verify the production code. If the production code breaks but the copy in the test file remains the same, the tests will still pass.
- Fix approach: Export the functions from a utility file and import them into both the component and the tests.

**Simulated Performance Testing:**
- Issue: Performance tests run against a simulation of the algorithm rather than the actual implementation.
- Files: `src/test/performance.test.js`
- Impact: Performance metrics may not reflect actual application behavior.
- Fix approach: Benchmarking should be done against the actual exported functions from the logic modules.

## Known Bugs

**No Major Functional Bugs Detected:**
- Symptoms: N/A
- Files: N/A
- Trigger: N/A
- Workaround: N/A

## Security Considerations

**Unrestricted Image Processing:**
- Risk: While processing is local, extremely large images could cause memory exhaustion or browser crashes (DoS on the client side).
- Files: `src/StringArtGenerator.jsx`
- Current mitigation: Basic scaling is applied to `canvasWidth` (400px).
- Recommendations: Implement strict size limits on uploaded images before processing.

## Performance Bottlenecks

**Main Thread Algorithm Execution:**
- Problem: The string art generation algorithm (a greedy search) runs on the main thread.
- Files: `src/StringArtGenerator.jsx`
- Cause: The `generateStringArt` function is `async` and uses `await new Promise(resolve => setTimeout(resolve, 0))` to yield, but it still performs heavy computation in chunks on the UI thread.
- Improvement path: Move the core algorithm to a Web Worker to ensure the UI remains fully responsive during long-running generation tasks.

**Repeated Line Calculations:**
- Problem: While a `lineCache` is used within a single generation run, it's recreated every time.
- Files: `src/StringArtGenerator.jsx`
- Cause: `lineCache` is local to `generateStringArt`.
- Improvement path: Persist or pre-calculate line pixels for a given nail configuration to speed up subsequent runs with the same dimensions but different string counts/opacities.

## Fragile Areas

**Geometry Logic:**
- Files: `src/StringArtGenerator.jsx` (functions `calculateNailPositions`, `getLinePixels`)
- Why fragile: These are complex mathematical functions mixed with UI code. A small change in the coordinate mapping could break the entire generation or instruction export.
- Safe modification: Extract to pure functions with comprehensive unit tests (that actually test the code being used).
- Test coverage: Current tests are decoupled from the implementation due to code duplication.

## Scaling Limits

**String Count / Nail Count:**
- Current capacity: UI allows up to 5000 strings and 200cm dimensions.
- Limit: Performance degrades significantly as these numbers increase due to O(N*M) complexity in the greedy search.
- Scaling path: Web Workers for computation and potentially WebGL for rendering the thousands of lines.

## Dependencies at Risk

**None identified:**
- Risk: The project has very few dependencies (React, Vite, Vitest, Lucide React - though Lucide isn't used in the main component).
- Impact: Low risk.

## Missing Critical Features

**Instruction Preview:**
- Problem: Users must export a text file to see the routing steps.
- Blocks: Real-time validation of how difficult the pattern will be to string.

## Test Coverage Gaps

**Core Algorithm (Production Code):**
- What's not tested: The actual implementation used in the component is NOT tested because the tests use a copy of the code.
- Files: `src/StringArtGenerator.jsx`
- Risk: High. Regressions in the core logic can go unnoticed.
- Priority: High

**Export Logic:**
- What's not tested: `exportInstructions` and `exportOverlay` functions.
- Files: `src/StringArtGenerator.jsx`
- Risk: Users might receive incorrect physical instructions.
- Priority: Medium

---

*Concerns audit: 2025-01-24*
