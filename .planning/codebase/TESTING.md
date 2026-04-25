# Testing Patterns

**Analysis Date:** 2025-01-03

## Test Framework

**Runner:**
- Vitest ^4.0.16
- Config: `vite.config.js` (using `test` property)

**Assertion Library:**
- Vitest (compatible with Jest matchers)

**Run Commands:**
```bash
npm test                # Run all tests
npm run test:ui         # Vitest UI mode
npm run test:coverage   # Coverage report
```

## Test File Organization

**Location:**
- Separate directory: `src/test/`

**Naming:**
- `*.test.js` or `*.test.jsx`

**Structure:**
```
src/test/
├── algorithms.test.js    # Unit tests for core logic
├── performance.test.js   # Performance and scalability tests
├── rendering.test.jsx    # Component and UI integration tests
└── setup.js              # Global test setup and mocks
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Module Name', () => {
  it('should perform a specific behavior', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

**Patterns:**
- `beforeEach` used for resetting mocks and state: `src/test/rendering.test.jsx`
- `afterEach` used for cleaning up: `src/test/setup.js`
- `describe` blocks used to group related tests (e.g., `describe('Canvas Memory Management', ...)`).

## Mocking

**Framework:** Vitest (`vi`)

**Patterns:**
```typescript
// Mocking Canvas Context in setup.js
HTMLCanvasElement.prototype.getContext = function(contextType) {
  return {
    fillRect: vi.fn(),
    stroke: vi.fn(),
    // ... other methods
  };
};

// Spying on global methods in tests
const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
```

**What to Mock:**
- Browser APIs not fully supported by JSDom: `HTMLCanvasElement`, `FileReader`, `URL.createObjectURL`, `Image`.
- Global timing functions for deterministic tests: `performance.now`, `requestAnimationFrame`.

**What NOT to Mock:**
- Pure logic functions (they are tested directly in `algorithms.test.js`).
- React state (let React handle state changes during tests).

## Fixtures and Factories

**Test Data:**
```typescript
// In performance.test.js
function simulateStringArtGeneration(nailCount, stringCount) {
  // Generates simulated data for performance testing
}

// In algorithms.test.js
const imageArray = new Float32Array([100, 150, 200, 50]);
const pixels = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
```

**Location:**
- Defined inline or via helper functions within the test files.

## Coverage

**Requirements:** None explicitly enforced in package.json, but `test:coverage` script is available.

**View Coverage:**
```bash
npm run test:coverage
```
- Provider: `v8`
- Reports: `text`, `json`, `html`
- Excluded: `node_modules/`, `src/test/`

## Test Types

**Unit Tests:**
- Located in `src/test/algorithms.test.js`.
- Focus on mathematical correctness of nail positioning, line pixel calculation, and scoring.

**Integration Tests:**
- Located in `src/test/rendering.test.jsx`.
- Focus on React component lifecycle, user interactions with sliders/inputs, and canvas operation calls.

**Performance Tests:**
- Located in `src/test/performance.test.js`.
- Custom `PerformanceMonitor` class tracks execution times.
- Verifies frame budgets (60fps) and scalability with large datasets.

## Common Patterns

**Async Testing:**
```typescript
await act(async () => {
  await user.click(button);
});
await waitFor(() => expect(screen.getByText('...')).toBeInTheDocument());
```

**Error Testing:**
- Testing boundary conditions and out-of-bounds inputs: `it('should ignore out-of-bounds pixels', ...)` in `algorithms.test.js`.

---

*Testing analysis: 2025-01-03*
