import { jsPDF } from 'jspdf';

/**
 * Generates a PDF document with project summary and routing instructions.
 * 
 * @param {Object} projectData 
 * @param {number} projectData.physicalWidth
 * @param {number} projectData.physicalHeight
 * @param {string} projectData.unit
 * @param {number} projectData.nailCount
 * @param {number} projectData.actualSpacing
 * @param {number} projectData.stringCount
 * @param {Array} stringPath - Array of { from, to }
 * @returns {jsPDF} The generated jsPDF document instance
 */
export const generatePdf = (projectData, stringPath) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  
  // 1. Project Summary Page
  doc.setFontSize(22);
  doc.text("String Art Instructions", margin, margin + 10);
  
  doc.setFontSize(14);
  let y = margin + 25;
  
  const { physicalWidth, physicalHeight, unit, nailCount, actualSpacing, stringCount } = projectData;
  
  doc.text(`Dimensions: ${physicalWidth} x ${physicalHeight} ${unit}`, margin, y);
  y += 10;
  doc.text(`Nail Count: ${nailCount}`, margin, y);
  y += 10;
  doc.text(`Nail Spacing: ${actualSpacing ? actualSpacing.toFixed(2) : 'N/A'} ${unit}`, margin, y);
  y += 10;
  doc.text(`Total Strings: ${stringCount}`, margin, y);
  y += 20;
  
  doc.setFontSize(16);
  doc.text("Nail Placement Guide", margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("1. Prepare a board of the specified dimensions.", margin, y);
  y += 8;
  doc.text(`2. Mark and place ${nailCount} nails evenly around the perimeter.`, margin, y);
  y += 8;
  doc.text(`3. Each nail should be approximately ${actualSpacing ? actualSpacing.toFixed(2) : 'N/A'} ${unit} apart.`, margin, y);
  y += 8;
  doc.text("4. Follow the routing steps on the following pages.", margin, y);

  return doc;
};
