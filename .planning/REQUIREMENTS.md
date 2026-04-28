# Requirements: String Art Generator Revamp

## 1. Functional Requirements

### 1.1 Canvas & Dimensions
- [x] Users MUST be able to specify physical width and height of the canvas.
- [x] Users MUST be able to toggle between cm and inches.
- [x] Changing canvas dimensions MUST reliably update the preview and reset the processing state without breaking UI controls.

### 1.2 Nail Management
- [x] System MUST calculate nail positions based on perimeter and nail spacing (mm).
- [x] System MUST prevent invalid nail configurations (e.g., spacing too small for canvas).

### 1.3 String Routing Algorithm
- [x] System MUST use a greedy algorithm to find the optimal string path.
- [x] Users MUST be able to set the total number of string connections.
- [x] Processing MUST be interruptible by the user.

### 1.4 PDF Export
- [x] System MUST generate a PDF document containing:
    - [x] Project summary (Canvas size, nail count, total connections).
    - [x] Nail placement guide (Spacing, numbering convention).
    - [x] Step-by-step routing instructions (e.g., "Step 1: 0 -> 42").
- [x] PDF generation MUST use `jsPDF`.

### 1.5 Preview & Playback
- [x] System MUST provide a real-time preview of the string art generation.
- [x] System MUST include playback controls (Play/Pause, Seek) for the routing path.

## 2. Non-Functional Requirements

### 2.1 Reliability
- [x] UI buttons MUST remain responsive after any configuration change.
- [x] State resets MUST be clean and complete when new images are uploaded or dimensions changed.

### 2.2 Performance
- [x] String path calculation MUST be performant enough for up to 3000 connections on a standard browser.
- [x] Canvas rendering MUST be optimized (e.g., incremental drawing).

### 2.3 Aesthetics
- [x] UI MUST follow a **minimalist** design pattern.
- [x] Clean layout with clear grouping of controls and preview.

## 3. Technical Constraints
- [x] Must be compatible with modern browsers.
- [x] Must support WSL development environments as per existing setup scripts.
