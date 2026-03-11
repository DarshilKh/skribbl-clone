import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

export default function GameHeader() {
  const {
    gamePhase, currentRound, totalRounds, timeLeft, hint, currentWord,
    drawerId, drawerName, playerId
  } = useGameStore();

  const isDrawer = playerId === drawerId;

  const getTimerColor = () => {
    if (timeLeft > 30) return 'text-success';
    if (timeLeft > 10) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 md:p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Round Info */}
        <div className="flex items-center gap-3">
          <span className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold">
            Round {currentRound}/{totalRounds}
          </span>
          {gamePhase === 'drawing' && (
            <motion.span
              key={timeLeft}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-bold ${getTimerColor()}`}
            >
              ⏱️ {timeLeft}s
            </motion.span>
          )}
        </div>

        {/* Word/Hint */}
        <div className="flex-1 text-center">
          {gamePhase === 'drawing' && (
            <div>
              {isDrawer ? (
                <span className="text-lg font-bold text-primary tracking-wider">
                  ✏️ Draw: {currentWord}
                </span>
              ) : (
                <span className="text-lg font-bold text-gray-600 tracking-[0.3em] font-mono">
                  {hint || '_ _ _ _ _'}
                </span>
              )}
            </div>
          )}
          {gamePhase === 'choosing' && (
            <span className="text-gray-500">{drawerName} is picking a word...</span>
          )}
          {gamePhase === 'word_selection' && (
            <span className="text-primary font-semibold">Choose a word to draw!</span>
          )}
        </div>

        {/* Drawer Info */}
        <div className="text-sm text-gray-500">
          {gamePhase === 'drawing' && !isDrawer && (
            <span>🎨 {drawerName} is drawing</span>
          )}
          {gamePhase === 'drawing' && isDrawer && (
            <span className="text-primary font-semibold">You are drawing!</span>
          )}
        </div>
      </div>
    </div>
  );
}