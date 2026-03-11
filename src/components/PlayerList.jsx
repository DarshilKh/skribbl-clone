import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

export default function PlayerList() {
  const { players, drawerId, playerId, gamePhase } = useGameStore();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3">
      <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">Players</h3>
      <div className="space-y-1.5">
        {sortedPlayers.map((player, index) => {
          const isCurrentDrawer = player.id === drawerId;
          const isMe = player.id === playerId;
          const hasGuessed = player.hasGuessedCorrectly && gamePhase === 'drawing';

          return (
            <motion.div
              key={player.id}
              layout
              className={`flex items-center gap-2 p-2 rounded-xl text-sm transition-colors
                         ${isCurrentDrawer ? 'bg-primary/10 border border-primary/20' : ''}
                         ${hasGuessed ? 'bg-success/10' : ''}
                         ${isMe ? 'ring-1 ring-primary/30' : ''}`}
            >
              {/* Rank */}
              <span className="text-xs font-bold text-gray-400 w-4">
                {index === 0 && players.some(p => p.score > 0) ? '🥇' :
                 index === 1 && players.some(p => p.score > 0) ? '🥈' :
                 index === 2 && players.some(p => p.score > 0) ? '🥉' :
                 `#${index + 1}`}
              </span>

              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                              ${hasGuessed ? 'bg-success' : isCurrentDrawer ? 'bg-primary' : 'bg-gray-400'}`}>
                {isCurrentDrawer ? '✏️' : player.name.charAt(0).toUpperCase()}
              </div>

              {/* Name & Score */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold truncate text-xs
                                   ${isMe ? 'text-primary' : 'text-gray-700'}`}>
                    {player.name}
                  </span>
                  {hasGuessed && <span className="text-success text-xs">✓</span>}
                </div>
              </div>

              {/* Score */}
              <span className="font-bold text-xs text-gray-600">
                {player.score}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}