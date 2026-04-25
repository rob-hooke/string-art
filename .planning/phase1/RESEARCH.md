# Phase 1: Stability & Reliability Fixes - Research

**Researched:** 2025-03-24
**Domain:** React State Synchronization & Async Race Conditions
**Confidence:** HIGH

## Summary

The research identified a critical crash-inducing race condition and several state synchronization issues in the `StringArtGenerator` component. The primary cause of UI unresponsiveness after dimension changes is a `TypeError` in the canvas rendering loop, caused by out-of-bounds access to the nail positions array when the nail count decreases while a previous string path exists.

**Primary recommendation:** Implement a centralized synchronization `useEffect` that cancels any running generation and resets volatile state (like `stringPath` and `isProcessing`) whenever core parameters (dimensions, spacing) change.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State Management | Browser (React) | — | Handles UI controls and parameter synchronization. |
| Algorithm Execution | Browser (Main Thread) | — | Current implementation runs on the main thread, causing potential UI lag during heavy computations. |
| Canvas Rendering | Browser (Canvas API) | — | Responsible for drawing the string art and overlay. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | UI Framework | Project base |
| Vite | 5.0.0 | Build Tool | Project base |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Vitest | 4.0.16 | Testing | Unit and Integration tests |
| @testing-library/react | 16.3.1 | UI Testing | Testing component behavior |

## Architecture Patterns

### Recommended Project Structure
*No changes to structure needed, logic resides within `StringArtGenerator.jsx`.*

### Pattern 1: Parameter-Driven Cancellation
**What:** Use a dedicated `useEffect` to monitor all input parameters and reset processing state.
**When to use:** Whenever changing inputs makes previous work invalid or dangerous.
**Example:**
```javascript
useEffect(() => {
  // Signal cancellation
  processingRef.current = false;
  
  // Reset state to safe defaults
  setIsProcessing(false);
  setStringPath([]);
  setCurrentStep(0);
}, [physicalWidth, physicalHeight, nailSpacing]);
```

### Anti-Patterns to Avoid
- **Stale Async State Access:** Allowing an async loop to continue after its closure variables or dependencies have changed.
- **Unprotected Indexing:** Accessing arrays (like `nails`) using indices from a potentially stale source (like `stringPath`) without boundary checks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loop Cancellation | Custom event system | `useRef` + `useEffect` cleanup | React standard for async control |
| Heavy Computation | Main thread loops | Web Workers (Future) | Avoids UI jank |

## Common Pitfalls

### Pitfall 1: Out-of-Bounds Indexing in Rendering Loop
**What goes wrong:** The app crashes with `TypeError: Cannot read properties of undefined (reading 'x')`.
**Why it happens:** When `nailCount` decreases (e.g., by increasing nail spacing), the existing `stringPath` still contains indices from the previous higher nail count. The rendering `useEffect` uses the new, smaller `nails` array but iterates over the old, larger indices in `stringPath`.
**How to avoid:**
1. Reset `stringPath` whenever `nailCount` or dimensions change.
2. Add boundary checks in the rendering loop: `if (nails[line.from] && nails[line.to]) ...`

### Pitfall 2: Async Closure Trap
**What goes wrong:** Multiple generation processes running simultaneously, or generation continuing with stale parameters.
**Why it happens:** `generateStringArt` is an `async` function. When parameters change, a new callback is created, but the previous one might still be executing its loop (suspended at `setTimeout`).
**How to avoid:** Ensure `processingRef.current = false` is called on any parameter change.

### Pitfall 3: Button State Lock
**What goes wrong:** "Generate" button stays as "Stop" or stays disabled.
**Why it happens:** `isProcessing` remains `true` if an error occurs inside the async generator (no `try...finally`).
**How to avoid:** Wrap the loop in `try...finally { setIsProcessing(false); }`.

## Code Examples

### Safely Stopping Generation
```javascript
const stopProcessing = useCallback(() => {
  processingRef.current = false;
  setIsProcessing(false);
}, []);

// In the generation function
const generateStringArt = useCallback(async () => {
  if (!imageData) return;
  setIsProcessing(true);
  processingRef.current = true;
  
  try {
    for (let iteration = 0; iteration < stringCount; iteration++) {
      if (!processingRef.current) break; // Check for cancellation
      // ... logic ...
      if (iteration % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  } finally {
    setIsProcessing(false);
    processingRef.current = false;
  }
}, [...]);
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| STAB-01 | Dimension change stops processing | Integration | `npm test src/test/stability.test.js` |
| STAB-02 | Nail count reduction doesn't crash | Integration | `npm test src/test/stability.test.js` |
| STAB-03 | Stop button works during error | Unit | `npm test src/test/rendering.test.jsx` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `isProcessing` is the main gate for UI controls | Summary | Low - code confirms this. |
| A2 | Users experience crashes after spacing changes | Pitfalls | High - this is the theorized root cause. |

## Open Questions (RESOLVED)

1. **Web Workers:** Should we move the generation to a Web Worker now, or just fix the reliability first?
   - *Recommendation (RESOLVED):* Fix reliability first, move to Worker in a performance-focused phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vitest | Testing | ✓ | 4.0.16 | — |
| Canvas | Rendering | ✓ | Native | — |

## Sources

### Primary (HIGH confidence)
- `src/StringArtGenerator.jsx` - Source code analysis
- `src/test/algorithms.test.js` - Existing test analysis
