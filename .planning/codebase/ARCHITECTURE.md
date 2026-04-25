# Architecture

**Analysis Date:** 2025-01-24

## Pattern Overview

**Overall:** Monolithic React Component with Imperative Logic

**Key Characteristics:**
- **Centralized State:** All application state (image data, nail positions, generated path) resides in a single component.
- **Greedy Algorithm:** Uses a greedy approach to find the next best string path by iteratively selecting lines that reduce image darkness.
- **Canvas-based Rendering:** High-performance visualization using HTML5 Canvas for both the string art and nail overlays.

## Layers

**UI Layer (React):**
- Purpose: Handles user input, parameter configuration, and layout.
- Location: `src/StringArtGenerator.jsx`
- Contains: Styled components (inline), control sliders, and file upload logic.
- Depends on: Logic and Rendering functions within the same file.
- Used by: `src/main.jsx`

**Logic Layer (Algorithms):**
- Purpose: Processes image data and generates the string art path.
- Location: `src/StringArtGenerator.jsx`
- Contains: `generateStringArt`, `calculateNailPositions`, `getLinePixels`, `calculateLineScore`.
- Depends on: ImageData from the UI layer.

**Rendering Layer (Canvas):**
- Purpose: Efficiently draws thousands of lines and nail markers.
- Location: `src/StringArtGenerator.jsx`
- Contains: `useEffect` hooks for canvas context operations, incremental drawing logic.
- Depends on: Generated path data and configuration state.

## Data Flow

**Path Generation Flow:**

1. **Image Upload:** User selects image -> `handleImageUpload` converts to `ImageData`.
2. **Initialization:** `generateStringArt` creates a `Float32Array` representing image darkness.
3. **Iterative Optimization:**
    - Calculate candidate lines from current nail.
    - Score lines based on pixel darkness reduction.
    - Select best line, update darkness array, and record path step.
4. **Visualization:** Canvas renders path steps incrementally or fully based on state changes.

**State Management:**
- Standard React hooks: `useState`, `useRef`, `useMemo`, `useCallback`.
- `useRef` is heavily used for performance-sensitive data (processing flags, caches, canvas refs) to avoid unnecessary re-renders.

## Key Abstractions

**Nail Position Calculation:**
- Purpose: Determines X/Y coordinates of nails evenly spaced around a rectangular perimeter.
- Examples: `calculateNailPositions` in `src/StringArtGenerator.jsx`.
- Pattern: Geometry-based distribution.

**Line Scoring:**
- Purpose: Evaluates the "darkness" of a line to decide if it's a good candidate for the next string step.
- Examples: `calculateLineScore` and `getLinePixels` in `src/StringArtGenerator.jsx`.
- Pattern: Bresenham's line algorithm (variant) and darkness averaging.

## Entry Points

**Main Entry:**
- Location: `src/main.jsx`
- Triggers: Application startup.
- Responsibilities: Renders the `StringArtGenerator` component into the DOM.

## Error Handling

**Strategy:** Defensive programming and basic UI feedback.

**Patterns:**
- **Input Validation:** Ensuring physical dimensions and nail spacing are within reasonable bounds via `onBlur` handlers.
- **State Guards:** Checking for `imageData` existence before starting processing.
- **Processing Control:** `processingRef` allows stopping the async generation loop safely.

## Cross-Cutting Concerns

**Logging:** Minimal, mostly console logs for debugging (not present in final source).
**Validation:** Handled via component state constraints.
**Performance:** Use of `Float32Array`, line caching, and `requestAnimationFrame` for smooth playback.

---

*Architecture analysis: 2025-01-24*
