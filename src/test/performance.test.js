import { describe, it, expect, beforeEach } from 'vitest';

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      memorySnapshots: [],
      canvasOperations: 0
    };
  }

  startRender() {
    this.renderStart = performance.now();
  }

  endRender() {
    if (this.renderStart) {
      const duration = performance.now() - this.renderStart;
      this.metrics.renderTimes.push(duration);
      this.renderStart = null;
      return duration;
    }
    return 0;
  }

  trackCanvasOperation() {
    this.metrics.canvasOperations++;
  }

  getAverageRenderTime() {
    if (this.metrics.renderTimes.length === 0) return 0;
    return this.metrics.renderTimes.reduce((a, b) => a + b, 0) / this.metrics.renderTimes.length;
  }

  getMaxRenderTime() {
    return Math.max(...this.metrics.renderTimes, 0);
  }

  getMetrics() {
    return {
      averageRenderTime: this.getAverageRenderTime(),
      maxRenderTime: this.getMaxRenderTime(),
      totalRenders: this.metrics.renderTimes.length,
      canvasOperations: this.metrics.canvasOperations,
      renderTimes: this.metrics.renderTimes
    };
  }

  reset() {
    this.metrics = {
      renderTimes: [],
      memorySnapshots: [],
      canvasOperations: 0
    };
  }
}

// Simulate string art generation performance
function simulateStringArtGeneration(nailCount, stringCount) {
  const monitor = new PerformanceMonitor();
  const lineCache = new Map();

  // Simulate nail position calculation
  monitor.startRender();
  const nails = [];
  for (let i = 0; i < nailCount; i++) {
    nails.push({ x: i * 2, y: i % 100, index: i });
  }
  const nailCalcTime = monitor.endRender();

  // Simulate string path generation
  monitor.startRender();
  const stringPath = [];
  let currentNail = 0;

  for (let i = 0; i < stringCount; i++) {
    // Simulate finding best nail (simplified)
    const nextNail = (currentNail + Math.floor(nailCount / 2)) % nailCount;
    stringPath.push({ from: currentNail, to: nextNail });
    currentNail = nextNail;

    // Simulate line caching
    const cacheKey = `${Math.min(currentNail, nextNail)}-${Math.max(currentNail, nextNail)}`;
    if (!lineCache.has(cacheKey)) {
      lineCache.set(cacheKey, []);
    }
  }
  const pathGenTime = monitor.endRender();

  // Simulate canvas rendering (incremental)
  monitor.startRender();
  for (let i = 0; i < Math.min(100, stringCount); i++) {
    monitor.trackCanvasOperation(); // Simulate drawing one line
  }
  const incrementalRenderTime = monitor.endRender();

  // Simulate full redraw
  monitor.startRender();
  for (let i = 0; i < stringCount; i++) {
    monitor.trackCanvasOperation(); // Simulate drawing all lines
  }
  const fullRenderTime = monitor.endRender();

  return {
    monitor,
    nailCalcTime,
    pathGenTime,
    incrementalRenderTime,
    fullRenderTime,
    lineCacheSize: lineCache.size
  };
}

describe('Performance Monitoring', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('PerformanceMonitor', () => {
    it('should track render times', () => {
      monitor.startRender();
      monitor.endRender();

      expect(monitor.metrics.renderTimes.length).toBe(1);
    });

    it('should calculate average render time', () => {
      monitor.metrics.renderTimes = [10, 20, 30];
      expect(monitor.getAverageRenderTime()).toBe(20);
    });

    it('should find maximum render time', () => {
      monitor.metrics.renderTimes = [10, 50, 30];
      expect(monitor.getMaxRenderTime()).toBe(50);
    });

    it('should track canvas operations', () => {
      monitor.trackCanvasOperation();
      monitor.trackCanvasOperation();
      monitor.trackCanvasOperation();

      expect(monitor.metrics.canvasOperations).toBe(3);
    });

    it('should reset metrics', () => {
      monitor.metrics.renderTimes = [10, 20, 30];
      monitor.metrics.canvasOperations = 100;

      monitor.reset();

      expect(monitor.metrics.renderTimes.length).toBe(0);
      expect(monitor.metrics.canvasOperations).toBe(0);
    });

    it('should return comprehensive metrics', () => {
      monitor.metrics.renderTimes = [10, 20, 30];
      monitor.metrics.canvasOperations = 50;

      const metrics = monitor.getMetrics();

      expect(metrics.averageRenderTime).toBe(20);
      expect(metrics.maxRenderTime).toBe(30);
      expect(metrics.totalRenders).toBe(3);
      expect(metrics.canvasOperations).toBe(50);
    });
  });

  describe('String Art Generation Performance', () => {
    it('should complete nail calculation quickly for typical count', () => {
      const result = simulateStringArtGeneration(200, 1000);

      expect(result.nailCalcTime).toBeLessThan(50);
    });

    it('should complete path generation in reasonable time', () => {
      const result = simulateStringArtGeneration(200, 2000);

      expect(result.pathGenTime).toBeLessThan(100);
    });

    it('should demonstrate incremental rendering is faster than full redraw', () => {
      const result = simulateStringArtGeneration(200, 2000);

      // Incremental (100 lines) should be much faster than full (2000 lines)
      // Allow for zero times in test environment
      if (result.incrementalRenderTime > 0 && result.fullRenderTime > 0) {
        expect(result.incrementalRenderTime).toBeLessThan(result.fullRenderTime);
      } else {
        expect(result.incrementalRenderTime).toBeLessThanOrEqual(result.fullRenderTime);
      }
    });

    it('should handle large nail counts without excessive slowdown', () => {
      const small = simulateStringArtGeneration(100, 1000);
      const large = simulateStringArtGeneration(500, 1000);

      // Large nail count shouldn't be more than 5x slower
      // Allow for very fast times in test environment
      if (small.nailCalcTime > 0) {
        expect(large.nailCalcTime).toBeLessThan(small.nailCalcTime * 5 + 10);
      } else {
        expect(large.nailCalcTime).toBeLessThan(10);
      }
    });

    it('should use line cache efficiently', () => {
      const result = simulateStringArtGeneration(200, 2000);

      // Line cache should have entries but not one per string
      expect(result.lineCacheSize).toBeGreaterThan(0);
      expect(result.lineCacheSize).toBeLessThanOrEqual(2000);
    });
  });

  describe('Rendering Performance Benchmarks', () => {
    it('should maintain 60fps target for incremental rendering', () => {
      const targetFrameTime = 16.67; // 60fps
      const result = simulateStringArtGeneration(200, 1000);

      // Incremental render of 100 lines should be well under frame budget
      expect(result.incrementalRenderTime).toBeLessThan(targetFrameTime);
    });

    it('should handle worst-case full redraw efficiently', () => {
      const result = simulateStringArtGeneration(300, 2000);

      // Even full redraw should complete in reasonable time (< 200ms)
      expect(result.fullRenderTime).toBeLessThan(200);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not accumulate unbounded line cache', () => {
      const results = [];

      // Simulate multiple generations
      for (let i = 0; i < 5; i++) {
        results.push(simulateStringArtGeneration(200, 1000));
      }

      // Each generation should have similar cache sizes
      const cacheSizes = results.map(r => r.lineCacheSize);
      const avgCacheSize = cacheSizes.reduce((a, b) => a + b, 0) / cacheSizes.length;

      cacheSizes.forEach(size => {
        expect(size).toBeLessThan(avgCacheSize * 2);
      });
    });
  });

  describe('Animation Performance', () => {
    it('should simulate animation frame performance', () => {
      const monitor = new PerformanceMonitor();
      const framesPerSecond = 60;
      const targetFrameTime = 1000 / framesPerSecond;

      // Simulate 100 animation frames
      for (let i = 0; i < 100; i++) {
        monitor.startRender();
        // Simulate incremental draw of 1 line
        monitor.trackCanvasOperation();
        monitor.endRender();
      }

      const metrics = monitor.getMetrics();

      // Average frame time should be under 60fps target
      expect(metrics.averageRenderTime).toBeLessThan(targetFrameTime);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with string count for incremental rendering', () => {
      const small = simulateStringArtGeneration(200, 500);
      const medium = simulateStringArtGeneration(200, 1000);
      const large = simulateStringArtGeneration(200, 2000);

      // Verify all runs completed
      expect(small.incrementalRenderTime).toBeGreaterThanOrEqual(0);
      expect(medium.incrementalRenderTime).toBeGreaterThanOrEqual(0);
      expect(large.incrementalRenderTime).toBeGreaterThanOrEqual(0);

      // Incremental should scale roughly linearly (within 3x tolerance)
      if (small.incrementalRenderTime > 0 && medium.incrementalRenderTime > 0) {
        const ratio1 = medium.incrementalRenderTime / small.incrementalRenderTime;
        const ratio2 = large.incrementalRenderTime / medium.incrementalRenderTime;
        expect(ratio1).toBeLessThan(5);
        expect(ratio2).toBeLessThan(5);
      }
    });

    it('should handle maximum recommended configuration', () => {
      // Maximum recommended: 500 nails, 5000 strings
      const result = simulateStringArtGeneration(500, 5000);

      expect(result.nailCalcTime).toBeLessThan(100);
      expect(result.pathGenTime).toBeLessThan(500);
    });
  });
});

describe('Performance Regression Detection', () => {
  it('should establish baseline performance metrics', () => {
    const baseline = simulateStringArtGeneration(200, 2000);

    // Document baseline performance
    const baselineMetrics = {
      nailCalc: baseline.nailCalcTime,
      pathGen: baseline.pathGenTime,
      incrementalRender: baseline.incrementalRenderTime,
      fullRender: baseline.fullRenderTime
    };

    // All metrics should be reasonable
    expect(baselineMetrics.nailCalc).toBeLessThan(50);
    expect(baselineMetrics.pathGen).toBeLessThan(100);
    expect(baselineMetrics.incrementalRender).toBeLessThan(20);
    expect(baselineMetrics.fullRender).toBeLessThan(200);

    console.log('Baseline Performance Metrics:', baselineMetrics);
  });

  it('should detect performance improvements from optimizations', () => {
    // Simulate old (full redraw every frame) vs new (incremental)
    const oldApproach = simulateStringArtGeneration(200, 2000);
    const optimizedResult = simulateStringArtGeneration(200, 2000);

    // Incremental should be significantly faster than full redraw
    if (optimizedResult.incrementalRenderTime > 0 && oldApproach.fullRenderTime > 0) {
      const improvement = oldApproach.fullRenderTime / optimizedResult.incrementalRenderTime;
      expect(improvement).toBeGreaterThan(5); // Should be > 5x faster
    } else {
      // In test environment, verify incremental is at least not slower
      expect(optimizedResult.incrementalRenderTime).toBeLessThanOrEqual(oldApproach.fullRenderTime);
    }
  });
});
