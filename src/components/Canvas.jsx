import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import useGameStore from '../store/gameStore';
import { sendMessage } from '../services/socket';

const Canvas = forwardRef(function Canvas(props, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const lastPointRef = useRef(null);
  const localStrokesRef = useRef([]);
  const currentStrokeRef = useRef([]);
  const animFrameRef = useRef(null);

  const { drawerId, playerId, gamePhase, drawHistory } = useGameStore();
  const isDrawer = playerId === drawerId && gamePhase === 'drawing';

  useImperativeHandle(ref, () => ({
    clearCanvas: handleClear,
    undoStroke: handleUndo,
    setTool,
    setColor,
    setBrushSize,
    tool,
    color,
    brushSize,
  }));

  const getCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { width: 800, height: 600 };
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const clearCanvasLocal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions();
    ctx.clearRect(0, 0, dims.width, dims.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, dims.width, dims.height);
  }, [getCanvasDimensions]);

  const renderActions = useCallback((actions) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions();

    for (const action of actions) {
      if (action.type === 'draw_start') {
        ctx.beginPath();
        ctx.strokeStyle = action.color || '#000000';
        ctx.lineWidth = action.size || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(action.x * dims.width, action.y * dims.height);
      } else if (action.type === 'draw_move') {
        ctx.strokeStyle = action.color || '#000000';
        ctx.lineWidth = action.size || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(action.x * dims.width, action.y * dims.height);
        ctx.stroke();
      } else if (action.type === 'draw_end') {
        ctx.closePath();
      }
    }
  }, [getCanvasDimensions]);

  const fullRedraw = useCallback((actions) => {
    clearCanvasLocal();
    renderActions(actions);
  }, [clearCanvasLocal, renderActions]);

  const redrawLocalStrokes = useCallback(() => {
    clearCanvasLocal();
    for (const stroke of localStrokesRef.current) {
      renderActions(stroke);
    }
  }, [clearCanvasLocal, renderActions]);

  // Initialize canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Re-render content after resize
      if (isDrawer) {
        redrawLocalStrokes();
      } else {
        fullRedraw(drawHistory);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isDrawer]);

  // FIXED: Full redraw for viewers whenever drawHistory changes
  // This handles: new strokes, canvas clear, undo - all cases
  const prevDrawHistoryRef = useRef(drawHistory);
  useEffect(() => {
    if (isDrawer) {
      prevDrawHistoryRef.current = drawHistory;
      return;
    }

    // Cancel any pending frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    animFrameRef.current = requestAnimationFrame(() => {
      fullRedraw(drawHistory);
    });

    prevDrawHistoryRef.current = drawHistory;

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [drawHistory, isDrawer, fullRedraw]);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const startDrawing = useCallback((e) => {
    if (!isDrawer) return;
    e.preventDefault();

    const pos = getPos(e);
    setIsDrawing(true);
    lastPointRef.current = pos;

    const currentColor = tool === 'eraser' ? '#FFFFFF' : color;
    const currentSize = tool === 'eraser' ? brushSize * 4 : brushSize;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions();

    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(pos.x * dims.width, pos.y * dims.height);

    // Draw a dot for single clicks
    ctx.lineTo(pos.x * dims.width + 0.1, pos.y * dims.height + 0.1);
    ctx.stroke();

    const action = {
      type: 'draw_start',
      x: pos.x,
      y: pos.y,
      color: currentColor,
      size: currentSize,
    };

    currentStrokeRef.current = [action];
    sendMessage('draw_data', action);
  }, [isDrawer, tool, color, brushSize, getPos, getCanvasDimensions]);

  const draw = useCallback((e) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();

    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions();

    ctx.lineTo(pos.x * dims.width, pos.y * dims.height);
    ctx.stroke();

    const currentColor = tool === 'eraser' ? '#FFFFFF' : color;
    const currentSize = tool === 'eraser' ? brushSize * 4 : brushSize;

    const action = {
      type: 'draw_move',
      x: pos.x,
      y: pos.y,
      color: currentColor,
      size: currentSize,
    };

    currentStrokeRef.current.push(action);
    lastPointRef.current = pos;
    sendMessage('draw_data', action);
  }, [isDrawing, isDrawer, tool, color, brushSize, getPos, getCanvasDimensions]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();

    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.closePath();
    }

    const endAction = { type: 'draw_end' };
    currentStrokeRef.current.push(endAction);
    localStrokesRef.current.push([...currentStrokeRef.current]);
    currentStrokeRef.current = [];
    sendMessage('draw_data', endAction);
  }, [isDrawing]);

  const handleClear = useCallback(() => {
    if (!isDrawer) return;
    clearCanvasLocal();
    localStrokesRef.current = [];
    currentStrokeRef.current = [];
    sendMessage('canvas_clear');
  }, [isDrawer, clearCanvasLocal]);

  const handleUndo = useCallback(() => {
    if (!isDrawer) return;
    if (localStrokesRef.current.length > 0) {
      localStrokesRef.current.pop();
      redrawLocalStrokes();
      sendMessage('draw_undo');
    }
  }, [isDrawer, redrawLocalStrokes]);

  // Reset local strokes when game phase changes to drawing (new round)
  useEffect(() => {
    if (gamePhase === 'drawing' || gamePhase === 'word_selection' || gamePhase === 'choosing') {
      localStrokesRef.current = [];
      currentStrokeRef.current = [];
    }
  }, [gamePhase]);

  return (
    <div
      ref={containerRef}
      className="relative bg-white"
      style={{ height: '60vh', minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDrawer ? (tool === 'eraser' ? 'eraser-cursor' : 'drawing-canvas') : 'cursor-default'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
});

export default Canvas;