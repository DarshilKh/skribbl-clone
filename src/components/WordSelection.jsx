import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { sendMessage } from '../services/socket';

export default function WordSelection() {
  const { wordOptions } = useGameStore();

  const handleSelect = (word) => {
    sendMessage('word_chosen', { word });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center bg-gradient-to-br from-primary/90 to-purple-600/90"
      style={{ height: '60vh', minHeight: '400px' }}
    >
      <div className="text-center p-8">
        <motion.h2
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-3xl font-bold text-white mb-8"
        >
          ✏️ Choose a word to draw!
        </motion.h2>

        <div className="flex flex-wrap gap-4 justify-center">
          {wordOptions.map((word, index) => (
            <motion.button
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(word)}
              className="px-8 py-4 bg-white rounded-2xl text-xl font-bold text-primary
                         shadow-xl hover:shadow-2xl transition-shadow capitalize"
            >
              {word}
            </motion.button>
          ))}
        </div>

        <p className="text-white/60 mt-6 text-sm">
          Choose quickly! Auto-selection in 15 seconds...
        </p>
      </div>
    </motion.div>
  );
}