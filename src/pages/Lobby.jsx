import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { sendMessage } from '../services/socket';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const {
    roomId, playerId, players, isHost, settings,
    gamePhase
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (gamePhase === 'starting' || gamePhase === 'word_selection' ||
        gamePhase === 'choosing' || gamePhase === 'drawing') {
      navigate(`/game/${roomId || urlRoomId}`);
    }
  }, [gamePhase, roomId, urlRoomId, navigate]);

  useEffect(() => {
    if (!roomId && !playerId) {
      navigate('/');
    }
  }, [roomId, playerId, navigate]);

  const handleStartGame = () => {
    sendMessage('start_game');
  };

  const handleCopyCode = () => {
    const code = roomId || urlRoomId;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/lobby/${roomId || urlRoomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    sendMessage('update_settings', { [key]: value });
  };

  const handleKick = (targetId) => {
    sendMessage('kick_player', { targetId });
  };

  const handleLeave = () => {
    useGameStore.getState().resetAll();
    navigate('/');
  };

  const currentRoomId = roomId || urlRoomId;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-purple-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Game Lobby</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono">
                    Room: {currentRoomId}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="bg-white/20 px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition-colors"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="bg-white/20 px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition-colors"
                  >
                    🔗 Copy Link
                  </button>
                </div>
              </div>
              <button
                onClick={handleLeave}
                className="bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Players */}
              <div>
                <h3 className="font-bold text-gray-700 text-lg mb-3">
                  Players ({players.length}/{localSettings.maxPlayers})
                </h3>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent
                                        flex items-center justify-center text-white font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">{player.name}</span>
                          {player.isHost && (
                            <span className="ml-2 text-xs bg-warning text-dark px-2 py-0.5 rounded-full font-semibold">
                              👑 Host
                            </span>
                          )}
                          {player.id === playerId && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                      {isHost && player.id !== playerId && (
                        <button
                          onClick={() => handleKick(player.id)}
                          className="text-danger text-sm hover:underline"
                        >
                          Kick
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="font-bold text-gray-700 text-lg mb-3">Settings</h3>
                <div className="space-y-3">
                  <SettingRow label="Max Players" disabled={!isHost}>
                    <select
                      value={localSettings.maxPlayers}
                      onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                      disabled={!isHost}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                                 disabled:opacity-50 focus:outline-none focus:border-primary"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </SettingRow>

                  <SettingRow label="Rounds" disabled={!isHost}>
                    <select
                      value={localSettings.rounds}
                      onChange={(e) => handleSettingChange('rounds', parseInt(e.target.value))}
                      disabled={!isHost}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                                 disabled:opacity-50 focus:outline-none focus:border-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </SettingRow>

                  <SettingRow label="Draw Time" disabled={!isHost}>
                    <select
                      value={localSettings.drawTime}
                      onChange={(e) => handleSettingChange('drawTime', parseInt(e.target.value))}
                      disabled={!isHost}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                                 disabled:opacity-50 focus:outline-none focus:border-primary"
                    >
                      {[15, 30, 45, 60, 80, 100, 120, 150, 180, 240].map((n) => (
                        <option key={n} value={n}>{n}s</option>
                      ))}
                    </select>
                  </SettingRow>

                  <SettingRow label="Word Choices" disabled={!isHost}>
                    <select
                      value={localSettings.wordCount}
                      onChange={(e) => handleSettingChange('wordCount', parseInt(e.target.value))}
                      disabled={!isHost}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                                 disabled:opacity-50 focus:outline-none focus:border-primary"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </SettingRow>

                  <SettingRow label="Hints" disabled={!isHost}>
                    <select
                      value={localSettings.maxHints}
                      onChange={(e) => handleSettingChange('maxHints', parseInt(e.target.value))}
                      disabled={!isHost}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                                 disabled:opacity-50 focus:outline-none focus:border-primary"
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n === 0 ? 'Off' : n}</option>
                      ))}
                    </select>
                  </SettingRow>
                </div>
              </div>
            </div>

            {/* Start Button */}
            {isHost && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="w-full mt-6 py-4 bg-gradient-to-r from-success to-emerald-400 text-white
                           rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-shadow
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {players.length < 2 ? 'Need at least 2 players' : '🎮 Start Game'}
              </motion.button>
            )}

            {!isHost && (
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-lg">⏳ Waiting for host to start the game...</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SettingRow({ label, disabled, children }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      {children}
    </div>
  );
}