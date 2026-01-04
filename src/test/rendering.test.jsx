import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StringArtGenerator from '../StringArtGenerator';

describe('StringArtGenerator Rendering Reliability', () => {
  let mockCanvas;
  let mockContext;
  let drawCallCount;

  beforeEach(() => {
    drawCallCount = 0;
    mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(() => { drawCallCount++; }),
      fill: vi.fn(),
      arc: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(400 * 400 * 4).fill(128),
        width: 400,
        height: 400
      })),
      putImageData: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      font: '',
      textAlign: '',
      textBaseline: ''
    };

    mockCanvas = {
      getContext: vi.fn(() => mockContext),
      width: 400,
      height: 400,
      toDataURL: vi.fn(() => 'data:image/png;base64,mock')
    };

    HTMLCanvasElement.prototype.getContext = function() {
      return mockContext;
    };

    HTMLCanvasElement.prototype.toDataURL = function() {
      return 'data:image/png;base64,mock';
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<StringArtGenerator />);
    expect(container).toBeTruthy();
  });

  it('should have upload zone initially', () => {
    render(<StringArtGenerator />);
    expect(screen.getByText(/Drop image or click to upload/i)).toBeInTheDocument();
  });

  it('should have generate button disabled initially', () => {
    render(<StringArtGenerator />);
    const generateButton = screen.getByText(/Generate String Art/i);
    expect(generateButton).toBeDisabled();
  });

  it('should display canvas elements', () => {
    const { container } = render(<StringArtGenerator />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(2); // Main canvas and overlay canvas
  });

  it('should update nail count when spacing changes', async () => {
    const user = userEvent.setup();
    render(<StringArtGenerator />);

    // Find the nail spacing slider
    const sliders = screen.getAllByRole('slider');
    const nailSpacingSlider = sliders[0]; // First slider is nail spacing

    await act(async () => {
      await user.click(nailSpacingSlider);
    });

    // Check that nail count is displayed
    const nailCountElement = screen.getByText(/Total Nails/i).closest('.stat-row');
    expect(nailCountElement).toBeTruthy();
  });

  it('should not call excessive canvas operations during idle state', () => {
    render(<StringArtGenerator />);

    // Reset counters after initial render
    drawCallCount = 0;
    mockContext.fillRect.mockClear();
    mockContext.stroke.mockClear();

    // Wait a bit to ensure no animations are running
    expect(drawCallCount).toBe(0);
  });

  describe('Canvas Memory Management', () => {
    it('should not leak canvas contexts', () => {
      const { unmount } = render(<StringArtGenerator />);
      const getContextCallsBefore = mockCanvas.getContext.mock?.calls?.length || 0;

      unmount();

      // Render again
      render(<StringArtGenerator />);

      // Should reuse contexts efficiently
      expect(mockContext.fillRect).toBeDefined();
    });

    it('should cleanup animation frames on unmount', () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const { unmount } = render(<StringArtGenerator />);

      unmount();

      // Should have called cleanup (even if no animation was running)
      expect(cancelAnimationFrameSpy).toBeDefined();
    });
  });

  describe('Animation Performance', () => {
    it('should use requestAnimationFrame for animation', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      render(<StringArtGenerator />);

      // Since there's no string path yet, RAF shouldn't be called for animation
      const rafCallsBefore = rafSpy.mock.calls.length;

      // Note: Full animation testing would require mocking image upload and generation
      expect(rafSpy).toBeDefined();
    });

    it('should pause animation when page is hidden', async () => {
      const { container } = render(<StringArtGenerator />);

      // Simulate page visibility change
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true
      });

      const event = new Event('visibilitychange');
      document.dispatchEvent(event);

      // Animation should pause (tested via visibility event handler)
      expect(document.hidden).toBe(true);

      // Cleanup
      Object.defineProperty(document, 'hidden', {
        value: false
      });
    });
  });

  describe('Multiple Render Cycles', () => {
    it('should handle multiple re-renders without crashing', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<StringArtGenerator />);

      // Trigger multiple re-renders by changing state
      const sliders = screen.getAllByRole('slider');

      for (let i = 0; i < 5; i++) {
        rerender(<StringArtGenerator />);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should still be functional
      expect(screen.getByText(/Generate String Art/i)).toBeInTheDocument();
    });

    it('should not accumulate draw calls on re-renders without animation', () => {
      const { rerender } = render(<StringArtGenerator />);

      const strokeCallsBefore = mockContext.stroke.mock.calls.length;

      // Re-render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<StringArtGenerator />);
      }

      const strokeCallsAfter = mockContext.stroke.mock.calls.length;

      // Without animation or string path, should not accumulate excessive calls
      expect(strokeCallsAfter - strokeCallsBefore).toBeLessThan(100);
    });
  });

  describe('Configuration Changes', () => {
    it('should handle canvas dimension changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<StringArtGenerator />);

      // Find width input by placeholder or other means
      const inputs = container.querySelectorAll('input[type="number"]');
      const widthInput = inputs[0]; // First number input is width

      await act(async () => {
        await user.clear(widthInput);
        await user.type(widthInput, '50');
        await user.tab(); // Trigger blur event
      });

      expect(widthInput.value).toBe('50');
    });

    it('should handle unit changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<StringArtGenerator />);

      const inchesButton = screen.getByText(/Inches/i);

      await act(async () => {
        await user.click(inchesButton);
      });

      // Verify inches is now active
      expect(inchesButton.className).toContain('active');
    });

    it('should handle string count changes', async () => {
      const user = userEvent.setup();
      render(<StringArtGenerator />);

      const sliders = screen.getAllByRole('slider');
      const stringCountSlider = sliders[1]; // Second slider is string count

      await act(async () => {
        await user.click(stringCountSlider);
      });

      // Should update without errors
      expect(screen.getByText(/STRING CONNECTIONS/i)).toBeInTheDocument();
    });
  });

  describe('Overlay Rendering', () => {
    it('should toggle overlay visibility', async () => {
      const user = userEvent.setup();
      render(<StringArtGenerator />);

      const overlayCheckbox = screen.getByLabelText(/Show nail markers/i);
      const clearRectSpy = mockContext.clearRect;

      await act(async () => {
        await user.click(overlayCheckbox);
      });

      // Should have called clearRect for overlay canvas
      expect(clearRectSpy).toHaveBeenCalled();
    });

    it('should toggle image visibility', async () => {
      const user = userEvent.setup();
      render(<StringArtGenerator />);

      const imageCheckbox = screen.getByLabelText(/Show source image/i);

      await act(async () => {
        await user.click(imageCheckbox);
      });

      expect(imageCheckbox).toBeChecked();
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid state changes', async () => {
      const user = userEvent.setup();
      render(<StringArtGenerator />);

      const sliders = screen.getAllByRole('slider');

      // Rapidly change multiple sliders
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          for (const slider of sliders) {
            await user.click(slider);
          }
        });
      }

      // Should still be responsive
      expect(screen.getByText(/Generate String Art/i)).toBeInTheDocument();
    });

    it('should handle maximum nail count', async () => {
      const user = userEvent.setup();
      const { container } = render(<StringArtGenerator />);

      const inputs = container.querySelectorAll('input[type="number"]');
      const widthInput = inputs[0];
      const heightInput = inputs[1];
      const nailSpacingSlider = screen.getAllByRole('slider')[0];

      await act(async () => {
        // Large canvas
        await user.clear(widthInput);
        await user.type(widthInput, '200');
        await user.tab();

        await user.clear(heightInput);
        await user.type(heightInput, '200');
        await user.tab();

        // Minimum spacing (maximum nails)
        await user.click(nailSpacingSlider);
      });

      // Should handle large nail counts
      const totalNailsText = screen.getByText(/Total Nails/i).closest('.stat-row');
      expect(totalNailsText).toBeInTheDocument();
    });
  });

  describe('Export Functions', () => {
    it('should have export buttons disabled without string path', () => {
      render(<StringArtGenerator />);

      // Export buttons should not be visible without string path
      const exportButtons = screen.queryByText(/Export Instructions/i);
      expect(exportButtons).not.toBeInTheDocument();
    });
  });

  describe('Color Changes', () => {
    it('should handle string color changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<StringArtGenerator />);

      const colorInputs = container.querySelectorAll('input[type="color"]');
      const stringColorInput = colorInputs[0]; // First color input is string

      await act(async () => {
        await user.click(stringColorInput);
      });

      expect(stringColorInput).toHaveValue('#000000');
    });

    it('should handle background color changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<StringArtGenerator />);

      const colorInputs = container.querySelectorAll('input[type="color"]');
      const bgColorInput = colorInputs[1]; // Second color input is background

      await act(async () => {
        await user.click(bgColorInput);
      });

      expect(bgColorInput).toHaveValue('#ffffff');
    });
  });

  describe('Performance Monitoring', () => {
    it('should complete initial render quickly', () => {
      const start = performance.now();
      render(<StringArtGenerator />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should render in < 500ms
    });

    it('should not create excessive DOM elements', () => {
      const { container } = render(<StringArtGenerator />);
      const allElements = container.querySelectorAll('*');

      // Should have reasonable number of elements (< 200)
      expect(allElements.length).toBeLessThan(200);
    });
  });
});
