import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = function(contextType) {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      drawImage: () => {},
      getImageData: () => ({
        data: new Uint8ClampedArray(400 * 400 * 4),
        width: 400,
        height: 400
      }),
      putImageData: () => {},
      fillText: () => {},
      measureText: () => ({ width: 0 }),
      font: '',
      textAlign: '',
      textBaseline: ''
    };
  }
  return null;
};

// Mock URL.createObjectURL
global.URL.createObjectURL = () => 'mock-url';
global.URL.revokeObjectURL = () => {};

// Mock FileReader
class MockFileReader {
  readAsDataURL(blob) {
    this.result = 'data:image/png;base64,mockdata';
    setTimeout(() => {
      if (this.onload) this.onload({ target: { result: this.result } });
    }, 0);
  }
}
global.FileReader = MockFileReader;

// Mock Image
class MockImage {
  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 100;
      if (this.onload) this.onload();
    }, 0);
  }
}
global.Image = MockImage;

// Mock performance.now for animation tests
global.performance = {
  now: () => Date.now()
};

// Mock requestAnimationFrame
let rafId = 0;
global.requestAnimationFrame = (cb) => {
  rafId++;
  setTimeout(() => cb(performance.now()), 16);
  return rafId;
};
global.cancelAnimationFrame = () => {};
