import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
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

  // Incremental rendering tracking
  const prevHistoryLengthRef = useRef(0);

  // Refs for stable access inside resize/touch handlers
  const isDrawerRef = useRef(false);
  const fullRedrawRef = useRef(null);
  const redrawLocalStrokesRef = useRef(null);

  const { drawerId, playerId, gamePhase, drawHistory } = useGameStore();
  const isDrawer = playerId === drawerId && gamePhase === 'drawing';

  // Keep ref in sync
  isDrawerRef.current = isDrawer;

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

  // ── Canvas helpers ──────────────────────────────────────────

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

  const renderActions = useCallback(
    (actions) => {
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
    },
    [getCanvasDimensions]
  );

  const fullRedraw = useCallback(
    (actions) => {
      clearCanvasLocal();
      renderActions(actions);
    },
    [clearCanvasLocal, renderActions]
  );

  const redrawLocalStrokes = useCallback(() => {
    clearCanvasLocal();
    for (const stroke of localStrokesRef.current) {
      renderActions(stroke);
    }
  }, [clearCanvasLocal, renderActions]);

  // Keep refs current for resize and touch handlers
  fullRedrawRef.current = fullRedraw;
  redrawLocalStrokesRef.current = redrawLocalStrokes;

  // ── Canvas sizing ───────────────────────────────────────────

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

      if (isDrawerRef.current) {
        redrawLocalStrokesRef.current();
      } else {
        const currentHistory = useGameStore.getState().drawHistory;
        fullRedrawRef.current(currentHistory);
        prevHistoryLengthRef.current = currentHistory.length;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════
  // ── TOUCH SCROLL FIX ─────────────────────────────────────────
  // React registers touch listeners as PASSIVE by default.
  // Passive listeners cannot call preventDefault(), so the browser
  // scrolls even when we try to prevent it.
  //
  // Solution: attach NATIVE event listeners with { passive: false }
  // so preventDefault() actually works. The CSS `touch-action: none`
  // handles most cases, but this is the belt-and-suspenders fix
  // for older Android browsers.
  // ══════════════════════════════════════════════════════════════

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouchScroll = (e) => {
      if (isDrawerRef.current) {
        e.preventDefault();
      }
    };

    // { passive: false } tells the browser: "I WILL call preventDefault,
    // so don't start scrolling before I've had a chance to cancel it"
    canvas.addEventListener('touchstart', preventTouchScroll, { passive: false });
    canvas.addEventListener('touchmove', preventTouchScroll, { passive: false });
    canvas.addEventListener('touchend', preventTouchScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventTouchScroll);
      canvas.removeEventListener('touchmove', preventTouchScroll);
      canvas.removeEventListener('touchend', preventTouchScroll);
    };
  }, []);

  // ── Viewer rendering — incremental ─────────────────────────

  useEffect(() => {
    if (isDrawer) {
      prevHistoryLengthRef.current = drawHistory.length;
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    animFrameRef.current = requestAnimationFrame(() => {
      const prevLen = prevHistoryLengthRef.current;
      const currLen = drawHistory.length;

      if (currLen === 0 && prevLen > 0) {
        clearCanvasLocal();
      } else if (currLen > prevLen) {
        renderActions(drawHistory.slice(prevLen));
      } else if (currLen < prevLen) {
        fullRedraw(drawHistory);
      }

      prevHistoryLengthRef.current = currLen;
    });

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [drawHistory, isDrawer, clearCanvasLocal, renderActions, fullRedraw]);

  // ── Input handling ──────────────────────────────────────────

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

  const startDrawing = useCallback(
    (e) => {
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
    },
    [isDrawer, tool, color, brushSize, getPos, getCanvasDimensions]
  );

  const draw = useCallback(
    (e) => {
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
    },
    [isDrawing, isDrawer, tool, color, brushSize, getPos, getCanvasDimensions]
  );

  const stopDrawing = useCallback(
    (e) => {
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
    },
    [isDrawing]
  );

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

  // Reset local strokes on new round
  useEffect(() => {
    if (
      gamePhase === 'drawing' ||
      gamePhase === 'word_selection' ||
      gamePhase === 'choosing'
    ) {
      localStrokesRef.current = [];
      currentStrokeRef.current = [];
      prevHistoryLengthRef.current = 0;
    }
  }, [gamePhase]);

  return (
    <div
      ref={containerRef}
      className="relative bg-white"
      style={{
        height: '60vh',
        minHeight: '400px',
        // ── TOUCH FIX: prevent scroll/zoom on the container too ──
        touchAction: isDrawer ? 'none' : 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          isDrawer
            ? tool === 'eraser'
              ? 'eraser-cursor'
              : 'drawing-canvas'
            : 'cursor-default'
        }`}
        // Mouse events (desktop) — React handlers work fine
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        // Touch events (mobile) — React handlers for drawing logic
        // preventDefault is handled by native listeners above
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
});

export default Canvas;