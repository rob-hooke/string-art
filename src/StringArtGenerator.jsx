import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { generatePdf } from './services/pdfExportService';

const StringArtGenerator = () => {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  
  // Physical canvas dimensions
  const [physicalWidth, setPhysicalWidth] = useState(40);
  const [physicalHeight, setPhysicalHeight] = useState(40);
  const [unit, setUnit] = useState('cm');
  
  // Nail spacing (in mm)
  const [nailSpacing, setNailSpacing] = useState(10);
  const MIN_NAIL_SPACING = 5;
  const MAX_NAIL_SPACING = 30;
  
  const [stringCount, setStringCount] = useState(2000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stringPath, setStringPath] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [lineOpacity, setLineOpacity] = useState(0.15);
  const [stringColor, setStringColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const processingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lastRenderedStepRef = useRef(0);
  const nailPositionsCache = useRef(null);
  const nailPositionsCacheKey = useRef('');

  const physicalWidthMm = useMemo(() => unit === 'cm' ? physicalWidth * 10 : physicalWidth * 25.4, [physicalWidth, unit]);
  const physicalHeightMm = useMemo(() => unit === 'cm' ? physicalHeight * 10 : physicalHeight * 25.4, [physicalHeight, unit]);
  const perimeterMm = useMemo(() => 2 * (physicalWidthMm + physicalHeightMm), [physicalWidthMm, physicalHeightMm]);
  const nailCount = useMemo(() => Math.floor(perimeterMm / nailSpacing), [perimeterMm, nailSpacing]);
  const actualSpacing = useMemo(() => perimeterMm / nailCount, [perimeterMm, nailCount]);
  const maxNails = useMemo(() => Math.floor(perimeterMm / MIN_NAIL_SPACING), [perimeterMm]);
  const minNails = useMemo(() => Math.floor(perimeterMm / MAX_NAIL_SPACING), [perimeterMm]);
  const recommendedNails = useMemo(() => Math.floor(perimeterMm / 10), [perimeterMm]);

  const previewSize = 400;
  const canvasWidth = previewSize;
  const canvasHeight = Math.round(previewSize * (physicalHeight / physicalWidth));

  const calculateNailPositions = useCallback((width, height, count) => {
    const cacheKey = `${width}-${height}-${count}`;
    if (nailPositionsCacheKey.current === cacheKey && nailPositionsCache.current) {
      return nailPositionsCache.current;
    }

    const positions = [];
    const perimeter = 2 * (width + height);
    const spacing = perimeter / count;

    for (let i = 0; i < count; i++) {
      const currentDist = i * spacing;
      let x, y;

      if (currentDist < width) {
        x = currentDist; y = 0;
      } else if (currentDist < width + height) {
        x = width; y = currentDist - width;
      } else if (currentDist < 2 * width + height) {
        x = width - (currentDist - width - height); y = height;
      } else {
        x = 0; y = height - (currentDist - 2 * width - height);
      }
      positions.push({ x, y, index: i });
    }

    nailPositionsCache.current = positions;
    nailPositionsCacheKey.current = cacheKey;
    return positions;
  }, []);

  const getLinePixels = (x0, y0, x1, y1) => {
    const pixels = [];
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    
    while (true) {
      pixels.push({ x: Math.round(x), y: Math.round(y) });
      if (Math.round(x) === Math.round(x1) && Math.round(y) === Math.round(y1)) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return pixels;
  };

  const calculateLineScore = (pixels, imageArray, width, height) => {
    let totalDarkness = 0, count = 0;
    for (const pixel of pixels) {
      if (pixel.x >= 0 && pixel.x < width && pixel.y >= 0 && pixel.y < height) {
        totalDarkness += imageArray[pixel.y * width + pixel.x];
        count++;
      }
    }
    return count > 0 ? totalDarkness / count : 0;
  };

  const generateStringArt = useCallback(async () => {
    if (!imageData) return;
    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);
    setStringPath([]);
    setCurrentStep(0);
    
    try {
      const { data, width, height } = imageData;
      const darknessArray = new Float32Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const brightness = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
        darknessArray[i] = 255 - brightness;
      }
      
      const nails = calculateNailPositions(width, height, nailCount);
      const path = [];
      let currentNail = 0;
      const minDistance = Math.floor(nailCount * 0.1);
      const lineCache = new Map();
      
      for (let iteration = 0; iteration < stringCount; iteration++) {
        if (!processingRef.current) break;
        let bestNail = -1, bestScore = -Infinity;
        
        for (let i = 0; i < nailCount; i++) {
          const distance = Math.min(Math.abs(i - currentNail), nailCount - Math.abs(i - currentNail));
          if (distance < minDistance) continue;
          
          const cacheKey = `${Math.min(currentNail, i)}-${Math.max(currentNail, i)}`;
          let pixels = lineCache.get(cacheKey);
          if (!pixels) {
            pixels = getLinePixels(Math.round(nails[currentNail].x), Math.round(nails[currentNail].y), Math.round(nails[i].x), Math.round(nails[i].y));
            lineCache.set(cacheKey, pixels);
          }
          const score = calculateLineScore(pixels, darknessArray, width, height);
          if (score > bestScore) { bestScore = score; bestNail = i; }
        }
        
        if (bestNail === -1) break;
        
        const cacheKey = `${Math.min(currentNail, bestNail)}-${Math.max(currentNail, bestNail)}`;
        const pixels = lineCache.get(cacheKey);
        for (const pixel of pixels) {
          if (pixel.x >= 0 && pixel.x < width && pixel.y >= 0 && pixel.y < height) {
            darknessArray[pixel.y * width + pixel.x] = Math.max(0, darknessArray[pixel.y * width + pixel.x] - 25);
          }
        }
        
        path.push({ from: currentNail, to: bestNail });
        currentNail = bestNail;
        
        if (iteration % 50 === 0) {
          setProgress(Math.round((iteration / stringCount) * 100));
          setStringPath([...path]);
          await new Promise(resolve => setTimeout(resolve, 0));
          if (!processingRef.current) return;
        }
      }
      
      setStringPath(path);
      setProgress(100);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [imageData, nailCount, stringCount, calculateNailPositions]);

  // Abort generation if critical parameters change
  useEffect(() => {
    processingRef.current = false;
    setIsProcessing(false);
    setStringPath([]);
    setCurrentStep(0);
  }, [physicalWidth, physicalHeight, unit, nailSpacing, imageData]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const x = (canvasWidth - img.width * scale) / 2;
        const y = (canvasHeight - img.height * scale) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setImageData(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (image) {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      const scale = Math.min(canvasWidth / image.width, canvasHeight / image.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(image, (canvasWidth - image.width * scale) / 2, (canvasHeight - image.height * scale) / 2, image.width * scale, image.height * scale);
      setImageData(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
    }
  }, [canvasWidth, canvasHeight, image]);

  // Optimized canvas rendering with incremental drawing
  useEffect(() => {
    if (!canvasRef.current || stringPath.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const nails = calculateNailPositions(canvasWidth, canvasHeight, nailCount);

    const targetStep = currentStep > 0 ? currentStep : stringPath.length;
    const needsFullRedraw = lastRenderedStepRef.current === 0 || targetStep < lastRenderedStepRef.current;

    if (needsFullRedraw) {
      // Full redraw only when necessary
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (showImage && image) {
        ctx.globalAlpha = 0.3;
        const scale = Math.min(canvasWidth / image.width, canvasHeight / image.height);
        ctx.drawImage(image, (canvasWidth - image.width * scale) / 2, (canvasHeight - image.height * scale) / 2, image.width * scale, image.height * scale);
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = stringColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = lineOpacity;

      for (let i = 0; i < targetStep; i++) {
        const line = stringPath[i];
        if (nails[line.from] && nails[line.to]) {
          ctx.beginPath();
          ctx.moveTo(nails[line.from].x, nails[line.from].y);
          ctx.lineTo(nails[line.to].x, nails[line.to].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      lastRenderedStepRef.current = targetStep;
    } else if (targetStep > lastRenderedStepRef.current) {
      // Incremental drawing - only draw new lines
      ctx.strokeStyle = stringColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = lineOpacity;

      for (let i = lastRenderedStepRef.current; i < targetStep; i++) {
        const line = stringPath[i];
        if (nails[line.from] && nails[line.to]) {
          ctx.beginPath();
          ctx.moveTo(nails[line.from].x, nails[line.from].y);
          ctx.lineTo(nails[line.to].x, nails[line.to].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      lastRenderedStepRef.current = targetStep;
    }
  }, [stringPath, canvasWidth, canvasHeight, nailCount, calculateNailPositions, showImage, image, lineOpacity, stringColor, backgroundColor, currentStep]);

  // Trigger full redraw when non-incremental changes occur
  useEffect(() => {
    lastRenderedStepRef.current = 0;
  }, [showImage, lineOpacity, stringColor, backgroundColor, stringPath]);

  // Invalidate nail position cache when dimensions or count change (debounced for slider)
  useEffect(() => {
    // Only invalidate if there's an actual string path to redraw
    if (stringPath.length === 0) return;

    const timer = setTimeout(() => {
      nailPositionsCache.current = null;
      nailPositionsCacheKey.current = '';
      lastRenderedStepRef.current = 0;
    }, 100); // 100ms debounce for smooth slider interaction

    return () => clearTimeout(timer);
  }, [canvasWidth, canvasHeight, nailCount, stringPath.length]);

  useEffect(() => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const nails = calculateNailPositions(canvasWidth, canvasHeight, nailCount);
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!showOverlay) return;
    
    const fontSize = Math.max(6, Math.min(10, 400 / nailCount * 8));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (const nail of nails) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(nail.x, nail.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [canvasWidth, canvasHeight, nailCount, showOverlay, calculateNailPositions]);

  // Optimized animation with requestAnimationFrame and page visibility
  useEffect(() => {
    if (!isPlaying || currentStep >= stringPath.length) {
      if (isPlaying) setIsPlaying(false);
      return;
    }

    let lastTime = performance.now();
    const frameDelay = 16; // ~60fps, adjust for faster/slower playback

    const animate = (currentTime) => {
      if (currentTime - lastTime >= frameDelay) {
        setCurrentStep(prev => {
          if (prev >= stringPath.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        lastTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentStep, stringPath.length]);

  // Pause animation when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  const stopProcessing = () => { processingRef.current = false; setIsProcessing(false); };

  const handleDownloadPdf = async () => {
    if (stringPath.length === 0) return;
    setIsExportingPdf(true);
    
    // Small delay to allow UI to update (show loading state)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const projectData = {
        physicalWidth,
        physicalHeight,
        unit,
        nailCount,
        actualSpacing: unit === 'cm' ? actualSpacing / 10 : actualSpacing / 25.4,
        stringCount: stringPath.length
      };
      
      const doc = generatePdf(projectData, stringPath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      doc.save(`string-art-instructions-${timestamp}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportInstructions = () => {
    if (stringPath.length === 0) return;
    const dimStr = unit === 'cm' ? `${physicalWidth}cm x ${physicalHeight}cm` : `${physicalWidth}" x ${physicalHeight}"`;
    const nailsOnWidth = Math.round(physicalWidthMm / actualSpacing);
    const nailsOnHeight = Math.round(physicalHeightMm / actualSpacing);
    
    let instructions = `STRING ART INSTRUCTIONS\n========================\n\n`;
    instructions += `Canvas Size: ${dimStr}\nPerimeter: ${(perimeterMm / 10).toFixed(1)}cm / ${(perimeterMm / 25.4).toFixed(1)}"\n`;
    instructions += `Number of Nails: ${nailCount}\nNail Spacing: ${actualSpacing.toFixed(1)}mm\nString Connections: ${stringPath.length}\n\n`;
    instructions += `NAIL PLACEMENT:\nPlace ${nailCount} nails evenly around the perimeter, spaced ${actualSpacing.toFixed(1)}mm apart.\n`;
    instructions += `Starting from the top-left corner (nail 0), number them clockwise.\n\n`;
    instructions += `Nails per edge:\n  - Top: ~${nailsOnWidth}\n  - Right: ~${nailsOnHeight}\n  - Bottom: ~${nailsOnWidth}\n  - Left: ~${nailsOnHeight}\n\n`;
    instructions += `STRING ROUTING (${stringPath.length} steps):\nStart at nail ${stringPath[0]?.from}\n\n`;
    stringPath.forEach((step, i) => { instructions += `${i + 1}. ${step.from} → ${step.to}\n`; });
    
    const blob = new Blob([instructions], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'string-art-instructions.txt';
    a.click();
  };

  const exportOverlay = () => {
    const printScale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * printScale;
    canvas.height = canvasHeight * printScale;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 * printScale;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    const nails = calculateNailPositions(canvasWidth * printScale, canvasHeight * printScale, nailCount);
    const fontSize = Math.max(10, Math.min(16, 500 / nailCount * 10)) * printScale;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (const nail of nails) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(nail.x, nail.y, 4 * printScale, 0, Math.PI * 2);
      ctx.fill();
      
      const showEvery = nailCount > 100 ? 10 : nailCount > 50 ? 5 : 1;
      if (nail.index % showEvery === 0) {
        let labelX = nail.x, labelY = nail.y;
        const offset = 18 * printScale;
        const edgeThreshold = 10 * printScale;

        // Detect which edges the nail is on
        const onTop = nail.y < edgeThreshold;
        const onBottom = nail.y > canvas.height - edgeThreshold;
        const onLeft = nail.x < edgeThreshold;
        const onRight = nail.x > canvas.width - edgeThreshold;

        // Handle corners and edges with proper pin-point positioning
        if (onTop && onLeft) {
          // Top-left corner: offset down-right
          labelX += offset;
          labelY += offset;
        } else if (onTop && onRight) {
          // Top-right corner: offset down-left
          labelX -= offset;
          labelY += offset;
        } else if (onBottom && onLeft) {
          // Bottom-left corner: offset up-right
          labelX += offset;
          labelY -= offset;
        } else if (onBottom && onRight) {
          // Bottom-right corner: offset up-left
          labelX -= offset;
          labelY -= offset;
        } else if (onTop) {
          // Top edge: offset down
          labelY += offset;
        } else if (onBottom) {
          // Bottom edge: offset up
          labelY -= offset;
        } else if (onLeft) {
          // Left edge: offset right
          labelX += offset;
        } else if (onRight) {
          // Right edge: offset left
          labelX -= offset;
        }

        ctx.fillStyle = '#2c3e50';
        ctx.fillText(nail.index.toString(), labelX, labelY);
      }
    }
    
    ctx.fillStyle = '#666666';
    ctx.font = `${12 * printScale}px sans-serif`;
    const dimStr = unit === 'cm' ? `${physicalWidth}cm × ${physicalHeight}cm` : `${physicalWidth}" × ${physicalHeight}"`;
    ctx.fillText(`${dimStr} | ${nailCount} nails | ${actualSpacing.toFixed(1)}mm spacing`, canvas.width / 2, canvas.height - 10 * printScale);
    
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `nail-overlay-${timestamp}.png`;
    a.click();
  };

  const getSpacingQuality = () => {
    if (nailSpacing < 6) return { label: 'Very Tight', color: '#e74c3c', desc: 'Difficult to work with' };
    if (nailSpacing < 8) return { label: 'Tight', color: '#f39c12', desc: 'High detail, challenging' };
    if (nailSpacing <= 12) return { label: 'Optimal', color: '#27ae60', desc: 'Best balance' };
    if (nailSpacing <= 18) return { label: 'Relaxed', color: '#3498db', desc: 'Easier to work with' };
    return { label: 'Sparse', color: '#9b59b6', desc: 'Less detail' };
  };

  const spacingQuality = getSpacingQuality();

  return (
    <div className="container">
      <header className="header">
        <h1>STRING ART GENERATOR</h1>
        <p>Transform any image into routable string art</p>
      </header>
        
        <div className="bento-grid">
          <section className="panel card-dimensions">
            <h2 className="section-title">Canvas Dimensions</h2>
            
            <div className="mb-md">
              <div className="unit-toggle">
                <button className={unit === 'cm' ? 'active' : ''} onClick={() => setUnit('cm')}>Centimeters</button>
                <button className={unit === 'in' ? 'active' : ''} onClick={() => setUnit('in')}>Inches</button>
              </div>
            </div>
            
            <div className="grid-2-col">
              <div>
                <label className="label-sub">WIDTH ({unit})</label>
                <input type="number" className="input-number" value={physicalWidth} onChange={(e) => setPhysicalWidth(parseFloat(e.target.value) || '')} onBlur={(e) => setPhysicalWidth(Math.max(5, Math.min(200, parseFloat(e.target.value) || 40)))} min="5" max="200" />
              </div>
              <div>
                <label className="label-sub">HEIGHT ({unit})</label>
                <input type="number" className="input-number" value={physicalHeight} onChange={(e) => setPhysicalHeight(parseFloat(e.target.value) || '')} onBlur={(e) => setPhysicalHeight(Math.max(5, Math.min(200, parseFloat(e.target.value) || 40)))} min="5" max="200" />
              </div>
            </div>
            
            <div className="info-box">
              <div className="stat-row"><span className="stat-label">Perimeter</span><span className="stat-value">{unit === 'cm' ? `${(perimeterMm / 10).toFixed(1)} cm` : `${(perimeterMm / 25.4).toFixed(1)}"`}</span></div>
              <div className="stat-row"><span className="stat-label">Total Nails</span><span className="stat-value">{nailCount}</span></div>
              <div className="stat-row"><span className="stat-label">Actual Spacing</span><span className="stat-value">{actualSpacing.toFixed(1)} mm</span></div>
              <div className="stat-row"><span className="stat-label">Nail Range</span><span className="stat-value">{minNails} – {maxNails}</span></div>
            </div>
            
            <h2 className="section-title mt-lg">Nail Configuration</h2>
            
            <div className="mb-md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>NAIL SPACING</label>
                <span className="quality-badge" style={{ background: spacingQuality.color }}>{spacingQuality.label}</span>
              </div>
              <input type="range" className="input-range" min={MIN_NAIL_SPACING} max={MAX_NAIL_SPACING} step="0.5" value={nailSpacing} onChange={(e) => setNailSpacing(parseFloat(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{MIN_NAIL_SPACING}mm</span>
                <span style={{ fontSize: 12, color: '#e94560' }}>{nailSpacing} mm → {nailCount} nails</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{MAX_NAIL_SPACING}mm</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center' }}>{spacingQuality.desc}</div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 11 }} onClick={() => setNailSpacing(10)}>Recommended ({recommendedNails})</button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 11 }} onClick={() => setNailSpacing(7)}>High Detail</button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 11 }} onClick={() => setNailSpacing(15)}>Easy</button>
            </div>
          </section>

          <section className="panel card-preview">
            <h2 className="section-title">Preview</h2>
            <div className="flex-col-center">
              <div className="canvas-container">
                <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} style={{ display: 'block' }} />
                <canvas ref={overlayCanvasRef} width={canvasWidth} height={canvasHeight} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
              </div>
              
              {stringPath.length > 0 && (
                <div style={{ width: '100%', maxWidth: canvasWidth }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => { if (isPlaying) setIsPlaying(false); else { if (currentStep >= stringPath.length) setCurrentStep(0); setIsPlaying(true); } }}>{isPlaying ? '⏸' : '▶'}</button>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>⏮</button>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setCurrentStep(stringPath.length)}>⏭</button>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Step {currentStep || stringPath.length} / {stringPath.length}</span>
                  </div>
                  <input type="range" className="input-range" min="0" max={stringPath.length} value={currentStep || stringPath.length} onChange={(e) => { setIsPlaying(false); setCurrentStep(parseInt(e.target.value)); }} />
                </div>
              )}
            </div>
          </section>

          <section className="panel card-controls">
            <h2 className="section-title">Image & String</h2>
            
            <div className="mb-lg">
              <label className="upload-zone" style={{ display: 'block' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{image ? 'Click to change image' : 'Drop image or click to upload'}</div>
              </label>
            </div>
            
            <div className="mb-lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>STRING CONNECTIONS</label>
                <span style={{ fontSize: 12, color: '#e94560' }}>{stringCount}</span>
              </div>
              <input type="range" className="input-range" min="500" max="5000" step="100" value={stringCount} onChange={(e) => setStringCount(parseInt(e.target.value))} />
            </div>
            
            <div className="mb-lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>LINE OPACITY</label>
                <span style={{ fontSize: 12, color: '#e94560' }}>{(lineOpacity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" className="input-range" min="0.05" max="0.5" step="0.01" value={lineOpacity} onChange={(e) => setLineOpacity(parseFloat(e.target.value))} />
            </div>
            
            <div className="grid-2-col">
              <div>
                <label className="label-sub">STRING</label>
                <input type="color" value={stringColor} onChange={(e) => setStringColor(e.target.value)} style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              </div>
              <div>
                <label className="label-sub">BACKGROUND</label>
                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
            
            <div className="mb-lg">
              <label className="checkbox-label" style={{ marginBottom: 10 }}><input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} /><span style={{ fontSize: 13 }}>Show nail markers</span></label>
              <label className="checkbox-label"><input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)} /><span style={{ fontSize: 13 }}>Show source image</span></label>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={isProcessing ? stopProcessing : generateStringArt} disabled={!imageData}>{isProcessing ? '⏹ Stop' : '▶ Generate String Art'}</button>
            
            {isProcessing && (
              <div className="mb-md">
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' }}>Processing... {progress}%</div>
              </div>
            )}
            
            {stringPath.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={isExportingPdf}>
                  {isExportingPdf ? '⌛ Generating PDF...' : '📄 Download PDF Instructions'}
                </button>
                <button className="btn btn-secondary" onClick={exportInstructions}>📝 Export Plain Text</button>
                <button className="btn btn-secondary" onClick={exportOverlay}>🖼 Export Nail Overlay</button>
              </div>
            )}
          </section>

          {stringPath.length > 0 && (
            <section className="panel card-steps">
              <h2 className="section-title">Routing Steps</h2>
              <div className="step-display">
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(233,69,96,0.2)', borderRadius: 6 }}><strong>Start:</strong> Nail {stringPath[0]?.from}</div>
                {stringPath.slice(0, 100).map((step, i) => (<div key={i} className={`step-item ${currentStep === i + 1 ? 'current' : ''}`}>{i + 1}. {step.from} → {step.to}</div>))}
                {stringPath.length > 100 && (<div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>... and {stringPath.length - 100} more steps<br /><small>Export full instructions ↓</small></div>)}
              </div>
            </section>
          )}

          <footer className="footer-info card-footer">
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>How to use:</strong> Set your physical canvas dimensions, adjust nail spacing (5-30mm), upload an image, and generate. The algorithm calculates the optimal number of nails based on your canvas size and spacing preference. <strong style={{ color: spacingQuality.color, marginLeft: 8 }}>Recommended: 8-12mm spacing</strong> for best results. Nails are numbered starting from 0 at the top-left corner, going clockwise.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default StringArtGenerator;
