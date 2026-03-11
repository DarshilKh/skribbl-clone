import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { connectWebSocket, sendMessage, disconnectWebSocket } from '../services/socket';

export default function Home() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showPublic, setShowPublic] = useState(false);
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    maxHints: 3,
    isPrivate: false,
  });

  const { roomId, playerId, publicRooms, setPlayerName: setStoreName, resetAll } = useGameStore();

  useEffect(() => {
    resetAll();
    disconnectWebSocket();
  }, []);

  useEffect(() => {
    if (roomId && playerId) {
      navigate(`/lobby/${roomId}`);
    }
  }, [roomId, playerId, navigate]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setStoreName(playerName.trim());
    connectWebSocket(() => {
      sendMessage('create_room', {
        hostName: playerName.trim(),
        isPrivate: settings.isPrivate,
        maxPlayers: settings.maxPlayers,
        rounds: settings.rounds,
        drawTime: settings.drawTime,
        wordCount: settings.wordCount,
        maxHints: settings.maxHints,
      });
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError('');
    setStoreName(playerName.trim());
    connectWebSocket(() => {
      sendMessage('join_room', {
        roomId: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
      });
    });
  };

  const handleJoinPublicRoom = (id) => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setStoreName(playerName.trim());
    connectWebSocket(() => {
      sendMessage('join_room', {
        roomId: id,
        playerName: playerName.trim(),
      });
    });
  };

  const handleShowPublicRooms = () => {
    setShowPublic(true);
    setShowCreate(false);
    setShowJoin(false);
    connectWebSocket(() => {
      sendMessage('get_public_rooms');
    });
  };

  const refreshPublicRooms = () => {
    sendMessage('get_public_rooms');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <h1 className="text-6xl font-bold text-white drop-shadow-lg mb-2">
            ✏️ Skribbl
          </h1>
          <p className="text-white/80 text-lg">Draw, Guess & Have Fun!</p>
        </motion.div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary
                         focus:outline-none text-lg transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-danger text-sm mb-4 text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowCreate(true); setShowJoin(false); setShowPublic(false); }}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-lg
                         hover:bg-primary-dark transition-colors shadow-lg"
            >
              🎨 Create Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowJoin(true); setShowCreate(false); setShowPublic(false); }}
              className="w-full py-3 bg-secondary text-white rounded-xl font-semibold text-lg
                         hover:opacity-90 transition-opacity shadow-lg"
            >
              🚪 Join Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShowPublicRooms}
              className="w-full py-3 bg-warning text-dark rounded-xl font-semibold text-lg
                         hover:opacity-90 transition-opacity shadow-lg"
            >
              🌐 Public Rooms
            </motion.button>
          </div>

          {/* Create Room Panel */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6"
              >
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-700 text-lg">Room Settings</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max Players</label>
                      <select
                        value={settings.maxPlayers}
                        onChange={(e) => setSettings({ ...settings, maxPlayers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                      >
                        {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Rounds</label>
                      <select
                        value={settings.rounds}
                        onChange={(e) => setSettings({ ...settings, rounds: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Draw Time (s)</label>
                      <select
                        value={settings.drawTime}
                        onChange={(e) => setSettings({ ...settings, drawTime: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                      >
                        {[15, 30, 45, 60, 80, 100, 120, 150, 180, 240].map((n) => (
                          <option key={n} value={n}>{n}s</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Word Choices</label>
                      <select
                        value={settings.wordCount}
                        onChange={(e) => setSettings({ ...settings, wordCount: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Hints</label>
                      <select
                        value={settings.maxHints}
                        onChange={(e) => setSettings({ ...settings, maxHints: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                      >
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n === 0 ? 'Disabled' : n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.isPrivate}
                          onChange={(e) => setSettings({ ...settings, isPrivate: e.target.checked })}
                          className="w-5 h-5 rounded accent-primary"
                        />
                        <span className="text-sm text-gray-600">Private Room</span>
                      </label>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateRoom}
                    className="w-full py-3 bg-success text-white rounded-xl font-semibold
                               hover:opacity-90 transition-opacity"
                  >
                    Create & Join
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join Room Panel */}
          <AnimatePresence>
            {showJoin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6"
              >
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter Room Code"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-secondary
                               focus:outline-none text-lg text-center tracking-widest font-bold uppercase"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinRoom}
                    className="w-full py-3 bg-secondary text-white rounded-xl font-semibold
                               hover:opacity-90 transition-opacity"
                  >
                    Join Room
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Public Rooms Panel */}
          <AnimatePresence>
            {showPublic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6"
              >
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Public Rooms</h3>
                    <button
                      onClick={refreshPublicRooms}
                      className="text-sm text-primary hover:underline"
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {publicRooms.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No public rooms available</p>
                  ) : (
                    publicRooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <span className="font-semibold text-gray-700">{room.id}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            {room.playerCount}/{room.maxPlayers} players
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleJoinPublicRoom(room.id)}
                          className="px-4 py-1.5 bg-secondary text-white rounded-lg text-sm font-semibold"
                        >
                          Join
                        </motion.button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}