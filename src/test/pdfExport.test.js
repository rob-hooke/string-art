import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePdf } from '../services/pdfExportService';
import { jsPDF } from 'jspdf';

vi.mock('jspdf', () => {
  const mockDoc = {
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    setFontSize: vi.fn(),
    internal: {
      pageSize: {
        getHeight: vi.fn().mockReturnValue(297),
        getWidth: vi.fn().mockReturnValue(210)
      }
    }
  };
  return {
    jsPDF: vi.fn().mockImplementation(function() {
      return mockDoc;
    })
  };
});

describe('PdfExportService', () => {
  const projectData = {
    physicalWidth: 300,
    physicalHeight: 300,
    unit: 'mm',
    nailCount: 100,
    actualSpacing: 9.42,
    stringCount: 50
  };

  const stringPath = Array.from({ length: 50 }, (_, i) => ({ from: i, to: (i + 1) % 100 }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a PDF with project summary', () => {
    generatePdf(projectData, stringPath);
    const mockDoc = new jsPDF();
    
    expect(jsPDF).toHaveBeenCalled();
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('String Art Instructions'), expect.any(Number), expect.any(Number));
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Dimensions: 300 x 300 mm'), expect.any(Number), expect.any(Number));
  });

  it('should correctly calculate column transitions', () => {
    // 500 steps should trigger multiple columns
    const largePath = Array.from({ length: 500 }, (_, i) => ({ from: i, to: i + 1 }));
    generatePdf(projectData, largePath);
    const mockDoc = new jsPDF();
    
    const textCalls = mockDoc.text.mock.calls;
    // Extract unique X positions of the routing steps (ignoring summary text)
    // Routing steps start after summary, usually with smaller font size
    const stepXPositions = new Set(
      textCalls
        .filter(call => typeof call[0] === 'string' && /^\d+\./.test(call[0]))
        .map(call => call[1])
    );
    
    // Should have at least 2 different X positions for steps if multi-column is working
    expect(stepXPositions.size).toBeGreaterThanOrEqual(2);
  });

  it('should add a new page when all columns on the current page are full', () => {
    // 2000 steps should definitely trigger a new page
    const hugePath = Array.from({ length: 2000 }, (_, i) => ({ from: i, to: i + 1 }));
    generatePdf(projectData, hugePath);
    const mockDoc = new jsPDF();
    
    expect(mockDoc.addPage).toHaveBeenCalled();
  });

  it('should handle large paths (3000 steps) without crashing', () => {
    const massivePath = Array.from({ length: 3000 }, (_, i) => ({ from: i, to: i + 1 }));
    expect(() => generatePdf(projectData, massivePath)).not.toThrow();
    
    const mockDoc = new jsPDF();
    expect(mockDoc.text).toHaveBeenCalled();
  });
});
