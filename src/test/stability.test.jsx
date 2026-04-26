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

  it('Task 0.1: cancellation: changing physicalWidth during generation sets isProcessing to false', async () => {
    render(<StringArtGenerator />);
    
    const file = new File(['(binary data)'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Drop image or click to upload/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await vi.runAllTimersAsync();
    });

    const generateBtn = screen.getByRole('button', { name: /Generate String Art/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      // Wait a tiny bit for the loop to start and hit its first await
      await vi.advanceTimersByTimeAsync(1);
    });
    
    expect(screen.getByText(/Stop/i)).toBeInTheDocument();
    
    const widthInputs = screen.getAllByRole('spinbutton');
    const widthInput = widthInputs[0];
    
    await act(async () => {
      fireEvent.change(widthInput, { target: { value: '50' } });
      fireEvent.blur(widthInput);
      // Advance enough to trigger useEffect but NOT enough to finish the loop
      await vi.advanceTimersByTimeAsync(100);
    });
    
    // Should be CANCELLED now
    expect(screen.queryByText(/Stop/i)).toBeNull();
  });

  it('Task 0.2: rendering safety: reducing nailCount when a large stringPath exists does not crash', async () => {
    render(<StringArtGenerator />);
    
    const file = new File(['(binary data)'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Drop image or click to upload/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await vi.runAllTimersAsync();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate String Art/i }));
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(screen.getByText(/Stop/i)).toBeInTheDocument();

    // Advance to get some path
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    
    // Stop it
    const stopBtn = screen.getByText(/Stop/i);
    await act(async () => {
      fireEvent.click(stopBtn);
      await vi.runAllTimersAsync();
    });
    
    // Now increase spacing (reduces nailCount)
    const sliders = screen.getAllByRole('slider');
    const nailSpacingSlider = sliders[0];
    
    await act(async () => {
      fireEvent.change(nailSpacingSlider, { target: { value: '30' } });
      // This should trigger a re-render. If it crashes, this will throw.
      await vi.runAllTimersAsync();
    });
    
    expect(screen.getByText(/STRING ART GENERATOR/i)).toBeInTheDocument();
  });

  it('Task 0.3: clean exit: generateStringArt always resets isProcessing even if aborted', async () => {
    render(<StringArtGenerator />);
    
    const file = new File(['(binary data)'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Drop image or click to upload/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await vi.runAllTimersAsync();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate String Art/i }));
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByText(/Stop/i)).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByText(/Stop/i));
      await vi.runAllTimersAsync();
    });
    
    expect(screen.queryByText(/Stop/i)).toBeNull();
  });
});
