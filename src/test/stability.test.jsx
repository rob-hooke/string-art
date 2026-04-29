import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import StringArtGenerator from '../StringArtGenerator';

describe('StringArtGenerator Stability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
    }
  });

  const uploadImage = async () => {
    const file = new File(['(binary data)'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Drop image or click to upload/i);
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await vi.runAllTimersAsync();
    });
  };

  it('Task 0.1: cancellation: changing physicalWidth during generation sets isProcessing to false', async () => {
    render(<StringArtGenerator />);
    await uploadImage();

    const generateBtn = screen.getByRole('button', { name: /Start string art generation/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      // Wait for the loop to start
      await vi.advanceTimersByTimeAsync(10);
    });
    
    // It should be processing
    // Use queryByText and check it exists
    expect(screen.queryByText(/Stop/i)).not.toBeNull();
    
    const widthInputs = screen.getAllByRole('spinbutton');
    const widthInput = widthInputs[0];
    
    await act(async () => {
      fireEvent.change(widthInput, { target: { value: '50' } });
      fireEvent.blur(widthInput);
      // Wait for useEffect
      await vi.advanceTimersByTimeAsync(100);
    });
    
    // Should be CANCELLED now
    expect(screen.queryByText(/Stop/i)).toBeNull();
  });

  it('Task 0.2: rendering safety: reducing nailCount when a large stringPath exists does not crash', async () => {
    render(<StringArtGenerator />);
    await uploadImage();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start string art generation/i }));
      await vi.advanceTimersByTimeAsync(100);
    });

    // It's okay if it finished or not, we just want some stringPath
    const stopBtn = screen.queryByText(/Stop/i);
    if (stopBtn) {
      await act(async () => {
        fireEvent.click(stopBtn);
        await vi.runAllTimersAsync();
      });
    }
    
    const sliders = screen.getAllByRole('slider');
    const nailSpacingSlider = sliders[0];
    
    await act(async () => {
      fireEvent.change(nailSpacingSlider, { target: { value: '30' } });
      await vi.runAllTimersAsync();
    });
    
    expect(screen.getByText(/STRING ART GENERATOR/i)).toBeInTheDocument();
  });

  it('Task 0.3: clean exit: generateStringArt always resets isProcessing even if aborted', async () => {
    render(<StringArtGenerator />);
    await uploadImage();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start string art generation/i }));
      await vi.advanceTimersByTimeAsync(10);
    });
    
    const stopBtn = screen.queryByText(/Stop/i);
    expect(stopBtn).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(stopBtn);
      await vi.runAllTimersAsync();
    });
    
    expect(screen.queryByText(/Stop/i)).toBeNull();
  });
});
