import { motion } from 'framer-motion';

export default function RoundEnd({ data }) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full mx-4"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-2">⏰ Round Over!</h2>
        <p className="text-lg text-gray-500 mb-4">
          The word was: <span className="font-bold text-primary text-xl">{data.word}</span>
        </p>

        <div className="space-y-2 mb-4">
          {data.players
            ?.sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((player, i) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-400">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span className="font-semibold text-gray-700">{player.name}</span>
                </div>
                <span className="font-bold text-primary">{player.score} pts</span>
              </div>
            ))}
        </div>

        <p className="text-gray-400 text-sm">Next round starting soon...</p>
      </motion.div>
    </motion.div>
  );
}