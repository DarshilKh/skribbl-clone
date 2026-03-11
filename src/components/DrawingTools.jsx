import { motion } from 'framer-motion';

const COLORS = [
  '#000000', '#FFFFFF', '#808080', '#C0C0C0',
  '#FF0000', '#FF6B6B', '#FF8C00', '#FFD700',
  '#FFFF00', '#00FF00', '#008000', '#00CEC9',
  '#0000FF', '#4169E1', '#800080', '#FF69B4',
  '#8B4513', '#D2691E', '#F5DEB3', '#FFC0CB',
];

const BRUSH_SIZES = [2, 4, 8, 12, 20];

export default function DrawingTools({ canvasRef }) {
  if (!canvasRef?.current) return null;

  const canvas = canvasRef.current;
  const tool = canvas.tool;
  const color = canvas.color;
  const brushSize = canvas.brushSize;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-50 border-t border-gray-200 p-3"
    >
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {/* Colors */}
        <div className="flex flex-wrap gap-1 justify-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                canvas.setColor(c);
                canvas.setTool('brush');
              }}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110
                         ${color === c && tool === 'brush' ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Brush Sizes */}
        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => canvas.setBrushSize(size)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                         ${brushSize === size ? 'bg-primary/20 border-2 border-primary' : 'bg-white border border-gray-200 hover:bg-gray-100'}`}
            >
              <div
                className="rounded-full bg-gray-800"
                style={{ width: Math.min(size + 2, 18), height: Math.min(size + 2, 18) }}
              />
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Tools */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => canvas.setTool('brush')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                       ${tool === 'brush' ? 'bg-primary text-white' : 'bg-white border border-gray-200 hover:bg-gray-100'}`}
          >
            ✏️ Brush
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => canvas.setTool('eraser')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                       ${tool === 'eraser' ? 'bg-primary text-white' : 'bg-white border border-gray-200 hover:bg-gray-100'}`}
          >
            🧹 Eraser
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => canvas.undoStroke()}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-gray-200
                       hover:bg-gray-100 transition-colors"
          >
            ↩️ Undo
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => canvas.clearCanvas()}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-danger text-white
                       hover:opacity-90 transition-opacity"
          >
            🗑️ Clear
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}