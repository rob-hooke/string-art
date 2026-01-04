import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

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
      }
    }
    
    setStringPath(path);
    setProgress(100);
    setIsProcessing(false);
    processingRef.current = false;
  }, [imageData, nailCount, stringCount, calculateNailPositions]);

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
        ctx.beginPath();
        ctx.moveTo(nails[line.from].x, nails[line.from].y);
        ctx.lineTo(nails[line.to].x, nails[line.to].y);
        ctx.stroke();
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
        ctx.beginPath();
        ctx.moveTo(nails[line.from].x, nails[line.from].y);
        ctx.lineTo(nails[line.to].x, nails[line.to].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      lastRenderedStepRef.current = targetStep;
    }
  }, [stringPath, canvasWidth, canvasHeight, nailCount, calculateNailPositions, showImage, image, lineOpacity, stringColor, backgroundColor, currentStep]);

  // Trigger full redraw when non-incremental changes occur
  useEffect(() => {
    lastRenderedStepRef.current = 0;
  }, [showImage, lineOpacity, stringColor, backgroundColor, stringPath]);

  // Invalidate nail position cache when dimensions or count change
  useEffect(() => {
    nailPositionsCache.current = null;
    nailPositionsCacheKey.current = '';
    lastRenderedStepRef.current = 0;
  }, [canvasWidth, canvasHeight, nailCount]);

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
      
      const showEvery = nailCount > 100 ? 10 : nailCount > 50 ? 5 : 1;
      if (nail.index % showEvery === 0) {
        let labelX = nail.x, labelY = nail.y;
        const offset = 12;
        if (nail.y === 0) labelY -= offset;
        else if (nail.y >= canvasHeight - 1) labelY += offset;
        else if (nail.x >= canvasWidth - 1) labelX += offset;
        else if (nail.x === 0) labelX -= offset;
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(nail.index.toString(), labelX, labelY);
      }
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
        if (nail.y < 10 * printScale) labelY += offset;
        else if (nail.y > canvas.height - 10 * printScale) labelY -= offset;
        else if (nail.x > canvas.width - 10 * printScale) labelX -= offset;
        else if (nail.x < 10 * printScale) labelX += offset;
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
    a.download = 'nail-overlay.png';
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', fontFamily: "'JetBrains Mono', monospace", color: '#e8e8e8', padding: '24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .panel { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; backdrop-filter: blur(10px); }
        .btn { padding: 10px 20px; border: none; border-radius: 8px; font-family: inherit; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-primary { background: linear-gradient(135deg, #e94560, #ff6b6b); color: white; box-shadow: 0 4px 15px rgba(233,69,96,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(233,69,96,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-secondary { background: rgba(255,255,255,0.1); color: #e8e8e8; border: 1px solid rgba(255,255,255,0.2); }
        .btn-secondary:hover { background: rgba(255,255,255,0.15); }
        .input-range { -webkit-appearance: none; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; outline: none; }
        .input-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #e94560; border-radius: 50%; cursor: pointer; }
        .input-number { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px 12px; color: #e8e8e8; font-family: inherit; font-size: 14px; width: 100%; outline: none; }
        .input-number:focus { border-color: #e94560; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .checkbox-label input { width: 18px; height: 18px; accent-color: #e94560; }
        .step-display { font-size: 11px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; max-height: 200px; overflow-y: auto; }
        .step-item { padding: 4px 8px; border-radius: 4px; margin: 2px 0; }
        .step-item.current { background: rgba(233,69,96,0.3); border-left: 3px solid #e94560; }
        .progress-bar { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #e94560, #ff6b6b); transition: width 0.3s; }
        .canvas-container { position: relative; display: inline-block; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
        .upload-zone { border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 30px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .upload-zone:hover { border-color: #e94560; background: rgba(233,69,96,0.05); }
        .info-box { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .stat-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
        .stat-label { color: rgba(255,255,255,0.5); }
        .stat-value { color: #e94560; font-weight: 500; }
        .unit-toggle { display: flex; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; }
        .unit-toggle button { flex: 1; padding: 6px 12px; border: none; background: transparent; color: rgba(255,255,255,0.6); font-family: inherit; font-size: 12px; cursor: pointer; }
        .unit-toggle button.active { background: #e94560; color: white; }
        .quality-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
      `}</style>
      
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 42, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #e94560, #ff6b6b, #ffc371)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STRING ART GENERATOR</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 14, letterSpacing: '2px', textTransform: 'uppercase' }}>Transform any image into routable string art</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
          <div className="panel" style={{ padding: 24, height: 'fit-content' }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginTop: 0, marginBottom: 20 }}>Canvas Dimensions</h2>
            
            <div style={{ marginBottom: 16 }}>
              <div className="unit-toggle">
                <button className={unit === 'cm' ? 'active' : ''} onClick={() => setUnit('cm')}>Centimeters</button>
                <button className={unit === 'in' ? 'active' : ''} onClick={() => setUnit('in')}>Inches</button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>WIDTH ({unit})</label>
                <input type="number" className="input-number" value={physicalWidth} onChange={(e) => setPhysicalWidth(parseFloat(e.target.value) || '')} onBlur={(e) => setPhysicalWidth(Math.max(5, Math.min(200, parseFloat(e.target.value) || 40)))} min="5" max="200" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>HEIGHT ({unit})</label>
                <input type="number" className="input-number" value={physicalHeight} onChange={(e) => setPhysicalHeight(parseFloat(e.target.value) || '')} onBlur={(e) => setPhysicalHeight(Math.max(5, Math.min(200, parseFloat(e.target.value) || 40)))} min="5" max="200" />
              </div>
            </div>
            
            <div className="info-box">
              <div className="stat-row"><span className="stat-label">Perimeter</span><span className="stat-value">{unit === 'cm' ? `${(perimeterMm / 10).toFixed(1)} cm` : `${(perimeterMm / 25.4).toFixed(1)}"`}</span></div>
              <div className="stat-row"><span className="stat-label">Total Nails</span><span className="stat-value">{nailCount}</span></div>
              <div className="stat-row"><span className="stat-label">Actual Spacing</span><span className="stat-value">{actualSpacing.toFixed(1)} mm</span></div>
              <div className="stat-row"><span className="stat-label">Nail Range</span><span className="stat-value">{minNails} – {maxNails}</span></div>
            </div>
            
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginTop: 24, marginBottom: 16 }}>Nail Configuration</h2>
            
            <div style={{ marginBottom: 16 }}>
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
            
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginTop: 24, marginBottom: 16 }}>Image & String</h2>
            
            <div style={{ marginBottom: 20 }}>
              <label className="upload-zone" style={{ display: 'block' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{image ? 'Click to change image' : 'Drop image or click to upload'}</div>
              </label>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>STRING CONNECTIONS</label>
                <span style={{ fontSize: 12, color: '#e94560' }}>{stringCount}</span>
              </div>
              <input type="range" className="input-range" min="500" max="5000" step="100" value={stringCount} onChange={(e) => setStringCount(parseInt(e.target.value))} />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>LINE OPACITY</label>
                <span style={{ fontSize: 12, color: '#e94560' }}>{(lineOpacity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" className="input-range" min="0.05" max="0.5" step="0.01" value={lineOpacity} onChange={(e) => setLineOpacity(parseFloat(e.target.value))} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>STRING</label>
                <input type="color" value={stringColor} onChange={(e) => setStringColor(e.target.value)} style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>BACKGROUND</label>
                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label className="checkbox-label" style={{ marginBottom: 10 }}><input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} /><span style={{ fontSize: 13 }}>Show nail markers</span></label>
              <label className="checkbox-label"><input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)} /><span style={{ fontSize: 13 }}>Show source image</span></label>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={isProcessing ? stopProcessing : generateStringArt} disabled={!imageData}>{isProcessing ? '⏹ Stop' : '▶ Generate String Art'}</button>
            
            {isProcessing && (
              <div style={{ marginBottom: 16 }}>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' }}>Processing... {progress}%</div>
              </div>
            )}
            
            {stringPath.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                <button className="btn btn-secondary" onClick={exportInstructions}>📄 Export Instructions</button>
                <button className="btn btn-secondary" onClick={exportOverlay}>🖼 Export Nail Overlay</button>
              </div>
            )}
          </div>
          
          <div className="panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginTop: 0, marginBottom: 16 }}>Preview</h3>
                <div className="canvas-container">
                  <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} style={{ display: 'block' }} />
                  <canvas ref={overlayCanvasRef} width={canvasWidth} height={canvasHeight} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
                </div>
                
                {stringPath.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => { if (isPlaying) setIsPlaying(false); else { if (currentStep >= stringPath.length) setCurrentStep(0); setIsPlaying(true); } }}>{isPlaying ? '⏸' : '▶'}</button>
                      <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>⏮</button>
                      <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setCurrentStep(stringPath.length)}>⏭</button>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Step {currentStep || stringPath.length} / {stringPath.length}</span>
                    </div>
                    <input type="range" className="input-range" min="0" max={stringPath.length} value={currentStep || stringPath.length} onChange={(e) => { setIsPlaying(false); setCurrentStep(parseInt(e.target.value)); }} style={{ width: canvasWidth }} />
                  </div>
                )}
              </div>
              
              {stringPath.length > 0 && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', marginTop: 0, marginBottom: 16 }}>Routing Steps</h3>
                  <div className="step-display">
                    <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(233,69,96,0.2)', borderRadius: 6 }}><strong>Start:</strong> Nail {stringPath[0]?.from}</div>
                    {stringPath.slice(0, 100).map((step, i) => (<div key={i} className={`step-item ${currentStep === i + 1 ? 'current' : ''}`}>{i + 1}. {step.from} → {step.to}</div>))}
                    {stringPath.length > 100 && (<div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>... and {stringPath.length - 100} more steps<br /><small>Export full instructions ↓</small></div>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          <strong style={{ color: 'rgba(255,255,255,0.7)' }}>How to use:</strong> Set your physical canvas dimensions, adjust nail spacing (5-30mm), upload an image, and generate. The algorithm calculates the optimal number of nails based on your canvas size and spacing preference. <strong style={{ color: spacingQuality.color, marginLeft: 8 }}>Recommended: 8-12mm spacing</strong> for best results. Nails are numbered starting from 0 at the top-left corner, going clockwise.
        </div>
      </div>
    </div>
  );
};

export default StringArtGenerator;
