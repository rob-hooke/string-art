import { describe, it, expect } from 'vitest';

// Test helper functions that mirror the component's logic
function calculateNailPositions(width, height, count) {
  const positions = [];
  const perimeter = 2 * (width + height);
  const spacing = perimeter / count;

  for (let i = 0; i < count; i++) {
    const currentDist = i * spacing;
    let x, y;

    if (currentDist < width) {
      x = currentDist;
      y = 0;
    } else if (currentDist < width + height) {
      x = width;
      y = currentDist - width;
    } else if (currentDist < 2 * width + height) {
      x = width - (currentDist - width - height);
      y = height;
    } else {
      x = 0;
      y = height - (currentDist - 2 * width - height);
    }
    positions.push({ x, y, index: i });
  }
  return positions;
}

function getLinePixels(x0, y0, x1, y1) {
  const pixels = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    pixels.push({ x: Math.round(x), y: Math.round(y) });
    if (Math.round(x) === Math.round(x1) && Math.round(y) === Math.round(y1)) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return pixels;
}

function calculateLineScore(pixels, imageArray, width, height) {
  let totalDarkness = 0;
  let count = 0;
  for (const pixel of pixels) {
    if (pixel.x >= 0 && pixel.x < width && pixel.y >= 0 && pixel.y < height) {
      totalDarkness += imageArray[pixel.y * width + pixel.x];
      count++;
    }
  }
  return count > 0 ? totalDarkness / count : 0;
}

describe('Nail Position Calculation', () => {
  it('should calculate correct number of nails', () => {
    const nails = calculateNailPositions(400, 400, 100);
    expect(nails).toHaveLength(100);
  });

  it('should start at top-left corner (0, 0)', () => {
    const nails = calculateNailPositions(400, 400, 100);
    expect(nails[0].x).toBe(0);
    expect(nails[0].y).toBe(0);
    expect(nails[0].index).toBe(0);
  });

  it('should place nails clockwise around perimeter', () => {
    const nails = calculateNailPositions(400, 300, 100);

    // First nail at top-left
    expect(nails[0].x).toBe(0);
    expect(nails[0].y).toBe(0);

    // Some nails should be on each edge
    const onTop = nails.filter(n => n.y === 0).length;
    const onRight = nails.filter(n => n.x === 400).length;
    const onBottom = nails.filter(n => n.y === 300).length;
    const onLeft = nails.filter(n => n.x === 0).length;

    expect(onTop).toBeGreaterThan(0);
    expect(onRight).toBeGreaterThan(0);
    expect(onBottom).toBeGreaterThan(0);
    expect(onLeft).toBeGreaterThan(0);
  });

  it('should distribute nails evenly based on perimeter', () => {
    const width = 400;
    const height = 300;
    const count = 140; // 2*(400+300) = 1400mm perimeter, 10mm spacing
    const nails = calculateNailPositions(width, height, count);

    const perimeter = 2 * (width + height);
    const expectedSpacing = perimeter / count;

    // Check spacing between consecutive nails
    for (let i = 0; i < nails.length - 1; i++) {
      const n1 = nails[i];
      const n2 = nails[i + 1];
      const distance = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));

      // Allow small tolerance for rounding
      expect(distance).toBeCloseTo(expectedSpacing, 0);
    }
  });

  it('should handle square canvas', () => {
    const nails = calculateNailPositions(400, 400, 160);
    expect(nails).toHaveLength(160);

    // For square, nails should be roughly equal on all sides (within 5 nails)
    const onEachEdge = 160 / 4;
    const onTop = nails.filter(n => n.y === 0).length;
    const onRight = nails.filter(n => n.x === 400).length;

    expect(Math.abs(onTop - onEachEdge)).toBeLessThan(5);
    expect(Math.abs(onRight - onEachEdge)).toBeLessThan(5);
  });

  it('should handle rectangular canvas with different dimensions', () => {
    const nails = calculateNailPositions(600, 200, 100);
    expect(nails).toHaveLength(100);

    // Longer edges should have more nails
    const onTop = nails.filter(n => n.y === 0 && n.x < 600).length;
    const onRight = nails.filter(n => n.x === 600 && n.y < 200).length;

    expect(onTop).toBeGreaterThan(onRight);
  });

  it('should assign sequential indices', () => {
    const nails = calculateNailPositions(400, 400, 50);
    nails.forEach((nail, index) => {
      expect(nail.index).toBe(index);
    });
  });
});

describe('Bresenham Line Algorithm (getLinePixels)', () => {
  it('should return pixels for horizontal line', () => {
    const pixels = getLinePixels(0, 0, 10, 0);
    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels[0]).toEqual({ x: 0, y: 0 });
    expect(pixels[pixels.length - 1]).toEqual({ x: 10, y: 0 });
  });

  it('should return pixels for vertical line', () => {
    const pixels = getLinePixels(0, 0, 0, 10);
    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels[0]).toEqual({ x: 0, y: 0 });
    expect(pixels[pixels.length - 1]).toEqual({ x: 0, y: 10 });
  });

  it('should return pixels for diagonal line', () => {
    const pixels = getLinePixels(0, 0, 10, 10);
    expect(pixels.length).toBeGreaterThanOrEqual(11);
    expect(pixels[0]).toEqual({ x: 0, y: 0 });
    expect(pixels[pixels.length - 1]).toEqual({ x: 10, y: 10 });
  });

  it('should handle reverse direction lines', () => {
    const pixels1 = getLinePixels(0, 0, 10, 10);
    const pixels2 = getLinePixels(10, 10, 0, 0);

    // Both should have same number of pixels
    expect(pixels1.length).toBe(pixels2.length);
  });

  it('should include start and end points', () => {
    const pixels = getLinePixels(5, 5, 15, 20);
    const start = pixels[0];
    const end = pixels[pixels.length - 1];

    expect(start.x).toBe(5);
    expect(start.y).toBe(5);
    expect(end.x).toBe(15);
    expect(end.y).toBe(20);
  });

  it('should handle single point (same start and end)', () => {
    const pixels = getLinePixels(5, 5, 5, 5);
    expect(pixels.length).toBe(1);
    expect(pixels[0]).toEqual({ x: 5, y: 5 });
  });

  it('should produce continuous pixels (no gaps)', () => {
    const pixels = getLinePixels(0, 0, 100, 50);

    for (let i = 0; i < pixels.length - 1; i++) {
      const p1 = pixels[i];
      const p2 = pixels[i + 1];
      const dx = Math.abs(p2.x - p1.x);
      const dy = Math.abs(p2.y - p1.y);

      // Adjacent pixels should differ by at most 1 in each direction
      expect(dx).toBeLessThanOrEqual(1);
      expect(dy).toBeLessThanOrEqual(1);
      expect(dx + dy).toBeGreaterThan(0); // Should move
    }
  });
});

describe('Line Score Calculation', () => {
  it('should calculate average darkness of pixels', () => {
    const imageArray = new Float32Array([100, 150, 200, 50]);
    const pixels = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ];

    const score = calculateLineScore(pixels, imageArray, 2, 2);
    const expectedAvg = (100 + 150 + 200 + 50) / 4;
    expect(score).toBe(expectedAvg);
  });

  it('should return 0 for empty pixel list', () => {
    const imageArray = new Float32Array([100, 150, 200, 50]);
    const pixels = [];

    const score = calculateLineScore(pixels, imageArray, 2, 2);
    expect(score).toBe(0);
  });

  it('should ignore out-of-bounds pixels', () => {
    const imageArray = new Float32Array([100, 150, 200, 50]);
    const pixels = [
      { x: 0, y: 0 },
      { x: 10, y: 10 }, // Out of bounds
      { x: 1, y: 1 }
    ];

    const score = calculateLineScore(pixels, imageArray, 2, 2);
    const expectedAvg = (100 + 50) / 2;
    expect(score).toBe(expectedAvg);
  });

  it('should return 0 if all pixels out of bounds', () => {
    const imageArray = new Float32Array([100, 150, 200, 50]);
    const pixels = [
      { x: -1, y: 0 },
      { x: 0, y: -1 },
      { x: 10, y: 10 }
    ];

    const score = calculateLineScore(pixels, imageArray, 2, 2);
    expect(score).toBe(0);
  });

  it('should handle negative coordinates', () => {
    const imageArray = new Float32Array([100, 150, 200, 50]);
    const pixels = [
      { x: -1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];

    const score = calculateLineScore(pixels, imageArray, 2, 2);
    const expectedAvg = (100 + 50) / 2;
    expect(score).toBe(expectedAvg);
  });

  it('should correctly index 2D array', () => {
    const width = 3;
    const height = 3;
    const imageArray = new Float32Array([
      1, 2, 3,
      4, 5, 6,
      7, 8, 9
    ]);

    const pixels = [{ x: 1, y: 1 }]; // Middle pixel
    const score = calculateLineScore(pixels, imageArray, width, height);

    expect(score).toBe(5);
  });
});

describe('Performance and Memory Tests', () => {
  it('should handle large nail counts efficiently', () => {
    const start = performance.now();
    const nails = calculateNailPositions(400, 400, 500);
    const duration = performance.now() - start;

    expect(nails).toHaveLength(500);
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  it('should handle very long lines efficiently', () => {
    const start = performance.now();
    const pixels = getLinePixels(0, 0, 1000, 1000);
    const duration = performance.now() - start;

    expect(pixels.length).toBeGreaterThan(1000);
    expect(duration).toBeLessThan(50); // Should complete in < 50ms
  });

  it('should not create duplicate nail positions', () => {
    const nails = calculateNailPositions(400, 400, 100);
    const positions = new Set();

    nails.forEach(nail => {
      const key = `${nail.x},${nail.y}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
    });
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  it('should handle minimum nail count', () => {
    const nails = calculateNailPositions(400, 400, 4);
    expect(nails).toHaveLength(4);
  });

  it('should handle very small canvas', () => {
    const nails = calculateNailPositions(10, 10, 4);
    expect(nails).toHaveLength(4);
    expect(nails[0].x).toBe(0);
    expect(nails[0].y).toBe(0);
  });

  it('should handle very large canvas', () => {
    const nails = calculateNailPositions(2000, 2000, 100);
    expect(nails).toHaveLength(100);
  });

  it('should handle extreme aspect ratios', () => {
    const nails = calculateNailPositions(1000, 100, 100);
    expect(nails).toHaveLength(100);

    const onLongEdge = nails.filter(n => n.y === 0 || n.y === 100).length;
    const onShortEdge = nails.filter(n => n.x === 0 || n.x === 1000).length;

    expect(onLongEdge).toBeGreaterThan(onShortEdge);
  });
});
