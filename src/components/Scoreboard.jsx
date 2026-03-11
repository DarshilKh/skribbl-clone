import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

export default function Scoreboard({ data }) {
  if (!data) return null;

  const { leaderboard, winner } = data;

  return (
    <div className="flex items-center justify-center p-8" style={{ minHeight: '60vh' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-lg w-full"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-700 mb-2">Game Over!</h2>
          <p className="text-xl text-primary font-semibold mb-6">
            {winner} wins!
          </p>
        </motion.div>

        <div className="space-y-2">
          {leaderboard?.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className={`flex items-center justify-between px-5 py-3 rounded-xl
                         ${index === 0 ? 'bg-warning/20 border-2 border-warning' :
                           index === 1 ? 'bg-gray-100 border border-gray-200' :
                           index === 2 ? 'bg-orange-50 border border-orange-200' :
                           'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className={`font-bold ${index === 0 ? 'text-lg' : ''} text-gray-700`}>
                  {player.name}
                </span>
              </div>
              <span className={`font-bold ${index === 0 ? 'text-xl text-warning' : 'text-gray-600'}`}>
                {player.score} pts
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-gray-400 text-sm mt-6">
          Returning to lobby in 10 seconds...
        </p>
      </motion.div>
    </div>
  );
}