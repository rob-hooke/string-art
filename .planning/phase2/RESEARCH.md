# Phase 2: PDF Export Implementation - Research

**Researched:** 2025-05-24
**Domain:** Client-side PDF Generation (jsPDF)
**Confidence:** HIGH

## Summary

This phase focuses on replacing the basic `.txt` instruction export with a professional, multi-page PDF document using `jsPDF`. The research confirms that `jsPDF` is well-suited for this task, especially when combined with manual layout management for multi-column text to handle large instruction lists (up to 3000 steps) efficiently.

**Primary recommendation:** Use `jsPDF` with a custom manual layout loop for the routing instructions to support a multi-column format. This will keep the document concise (10-20 pages instead of 50+) and ensure optimal performance without the overhead of heavy plugins.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PDF Document Structure | Browser | — | `jsPDF` generates the PDF binary entirely in-memory on the client. |
| Instruction Formatting | Browser | — | Logic for columns and pagination happens during the generation loop. |
| Metadata Extraction | Frontend Component | — | React state (canvas size, nail count) is passed to the PDF service. |
| File Download | Browser | — | `doc.save()` triggers the native browser download dialog. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jspdf` | ^2.5.1 | PDF Generation | Industry standard for client-side PDF creation in JS. [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `jspdf-autotable` | ^3.8.2 | Table generation | Use if we decide on a structured table layout for the summary section. [CITED: github.com/simonbengtsson/jspdf-autotable] |

**Installation:**
```bash
npm install jspdf
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── pdfService.js    # Logic for generating the instruction PDF
└── components/
    └── StringArtGenerator.jsx # Updates to call the new service
```

### Pattern 1: Multi-Column Text Flow
To handle 3000 steps efficiently and use page space effectively:
1. Define constants for `COLUMNS` (e.g., 3), `MARGIN`, and `COLUMN_GAP`.
2. Iterate through steps, tracking `currentColumn` and `yPosition`.
3. If `yPosition` exceeds `PAGE_BOTTOM`, move to next column or add a new page.

### Anti-Patterns to Avoid
- **html2pdf / html2canvas:** Avoid using these for the instruction list. They render content as images, which leads to massive file sizes, blurry text on zoom, and high memory usage.
- **Large global state:** Don't store the generated PDF in React state. Generate it on-the-fly and trigger `doc.save()` immediately.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF Binary Generation | Custom Buffer manipulation | `jsPDF` | Handles cross-browser PDF encoding, font embedding, and stream compression. |
| Text Splitting | Character-width math | `doc.splitTextToSize()` | Accounts for kerning and specific font metrics automatically. |

## Common Pitfalls

### Pitfall 1: Main Thread Blocking
**What goes wrong:** Generating 3000+ lines of PDF content in a single loop can lock the UI for several hundred milliseconds.
**How to avoid:** Use a `setTimeout(..., 0)` or requestAnimationFrame to break the loop if needed, but for 3000 steps of simple text, it's usually fast enough (< 200ms). Adding a "Generating..." UI state is essential.

### Pitfall 2: Coordinate Confusion
**What goes wrong:** `jsPDF` uses a coordinate system (0,0 is top-left) that can be tricky with different units (mm vs pt).
**How to avoid:** Initialize `jsPDF` with `unit: 'mm'` and `format: 'a4'` to match the project's physical dimension focus.

## Code Examples

### Multi-Column Generation Logic
```javascript
// Source: Manual research implementation pattern
import { jsPDF } from 'jspdf';

export const generateInstructionsPDF = (projectData, stringPath) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const colCount = 3;
  const colWidth = (pageWidth - (margin * 2) - (10 * (colCount - 1))) / colCount;
  
  // 1. Summary Section
  doc.setFontSize(18);
  doc.text("String Art Instructions", margin, margin);
  // ... add metadata text ...

  // 2. Routing Steps
  doc.setFontSize(10);
  let y = 60; // Start after summary
  let col = 0;
  
  stringPath.forEach((step, i) => {
    if (y > pageHeight - margin) {
      if (col < colCount - 1) {
        col++;
        y = 60; // Reset Y to start of column area
      } else {
        doc.addPage();
        col = 0;
        y = margin; // Reset to top for new page
      }
    }
    
    const x = margin + (col * (colWidth + 10));
    doc.text(`${i + 1}. ${step.from} -> ${step.to}`, x, y);
    y += 5; // Line height
  });

  doc.save('instructions.pdf');
};
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `src/test/setup.js` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| PDF-01 | PDF contains Project Summary | Unit | `vitest src/services/pdfService.test.js` |
| PDF-02 | PDF contains 3000 steps | Unit/Load | `vitest src/services/pdfService.test.js` |
| PDF-03 | PDF uses jsPDF | Unit | `vitest src/services/pdfService.test.js` (Verify mock calls) |

### Testing Strategy: Mocking jsPDF
Use `vi.mock` to intercept calls to `jsPDF`.
```javascript
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      text: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
      setFontSize: vi.fn(),
      internal: { pageSize: { getHeight: () => 297, getWidth: () => 210 } }
    }))
  };
});
```

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Ensure project metadata (image names, user-input labels) are escaped or sanitized if they could break PDF syntax (though jsPDF handles most text safely). |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Resource Exhaustion | Denial of Service | Limit max connections to 5000 (already in UI) to prevent browser memory crashes during PDF generation. |

## Sources

### Primary (HIGH confidence)
- `jspdf` Context7 ID: `/parallax/jspdf` - Checked multi-page and pagination.
- `jspdf-autotable` Context7 ID: `/simonbengtsson/jspdf-autotable` - Checked table formatting.

### Secondary (MEDIUM confidence)
- Web search for "Vitest mock jspdf" - Verified standard pattern for content verification.

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: MEDIUM (Main thread blocking is edge-case for 3000 steps but manageable)

**Research date:** 2025-05-24
**Valid until:** 2025-06-24
