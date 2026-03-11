import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { sendMessage, disconnectWebSocket } from '../services/socket';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const {
    roomId,
    playerId,
    players,
    isHost,
    settings,
    gamePhase,
    resetAll,
  } = useGameStore();

  const [copiedType, setCopiedType] = useState(null); // 'code' | 'link' | null
  const [localSettings, setLocalSettings] = useState(settings);
  const copyTimerRef = useRef(null);

  /* ── Sync server settings → local state ───────────────────── */
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  /* ── Redirect to game when it starts ──────────────────────── */
  useEffect(() => {
    const activePhases = ['starting', 'word_selection', 'choosing', 'drawing'];
    if (activePhases.includes(gamePhase)) {
      navigate(`/game/${roomId || urlRoomId}`);
    }
  }, [gamePhase, roomId, urlRoomId, navigate]);

  /* ── Kick back to home if no session exists ────────────────
       If a user lands on /lobby/ABC123 without a session the
       store will be empty. Redirect to Home with ?join= so the
       code is pre-filled in the join form.                     */
  useEffect(() => {
    if (!roomId && !playerId) {
      navigate(urlRoomId ? `/?join=${urlRoomId}` : '/');
    }
  }, [roomId, playerId, urlRoomId, navigate]);

  /* ── Clean up copy timer on unmount ────────────────────────── */
  useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);

  /* ── Clipboard helpers ─────────────────────────────────────── */
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyCode = () => {
    copyToClipboard(roomId || urlRoomId, 'code');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/lobby/${roomId || urlRoomId}`;
    copyToClipboard(link, 'link');
  };

  /* ── Game actions ──────────────────────────────────────────── */
  const handleStartGame = () => {
    sendMessage('start_game');
  };

  const handleSettingChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    sendMessage('update_settings', { [key]: value });
  };

  const handleKick = (targetId) => {
    sendMessage('kick_player', { targetId });
  };

  const handleLeave = () => {
    sendMessage('leave_room');      // notify server first
    disconnectWebSocket();          // close the socket
    resetAll();                     // clear local state
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
          {/* ── Header ───────────────────────────────────── */}
          <div className="bg-gradient-to-r from-primary to-purple-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Game Lobby</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono">
                    Room: {currentRoomId}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="bg-white/20 px-3 py-1 rounded-lg text-sm
                               hover:bg-white/30 transition-colors"
                  >
                    {copiedType === 'code' ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="bg-white/20 px-3 py-1 rounded-lg text-sm
                               hover:bg-white/30 transition-colors"
                  >
                    {copiedType === 'link' ? '✅ Copied!' : '🔗 Copy Link'}
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
              {/* ── Players ─────────────────────────────── */}
              <div>
                <h3 className="font-bold text-gray-700 text-lg mb-3">
                  Players ({players.length}/{localSettings.maxPlayers})
                </h3>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      index={index}
                      playerId={playerId}
                      isHost={isHost}
                      onKick={handleKick}
                    />
                  ))}
                </div>
              </div>

              {/* ── Settings ────────────────────────────── */}
              <div>
                <h3 className="font-bold text-gray-700 text-lg mb-3">
                  Settings
                </h3>
                <div className="space-y-3">
                  <SettingRow label="Max Players" disabled={!isHost}>
                    <SettingSelect
                      value={localSettings.maxPlayers}
                      options={[2, 3, 4, 5, 6, 8, 10, 12, 15, 20]}
                      disabled={!isHost}
                      onChange={(v) => handleSettingChange('maxPlayers', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Rounds" disabled={!isHost}>
                    <SettingSelect
                      value={localSettings.rounds}
                      options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      disabled={!isHost}
                      onChange={(v) => handleSettingChange('rounds', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Draw Time" disabled={!isHost}>
                    <SettingSelect
                      value={localSettings.drawTime}
                      options={[15, 30, 45, 60, 80, 100, 120, 150, 180, 240]}
                      suffix="s"
                      disabled={!isHost}
                      onChange={(v) => handleSettingChange('drawTime', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Word Choices" disabled={!isHost}>
                    <SettingSelect
                      value={localSettings.wordCount}
                      options={[1, 2, 3, 4, 5]}
                      disabled={!isHost}
                      onChange={(v) => handleSettingChange('wordCount', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Hints" disabled={!isHost}>
                    <SettingSelect
                      value={localSettings.maxHints}
                      options={[0, 1, 2, 3, 4, 5]}
                      formatOption={(n) => (n === 0 ? 'Off' : String(n))}
                      disabled={!isHost}
                      onChange={(v) => handleSettingChange('maxHints', v)}
                    />
                  </SettingRow>
                </div>
              </div>
            </div>

            {/* ── Start / Waiting ────────────────────────── */}
            {isHost ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="w-full mt-6 py-4 bg-gradient-to-r from-success to-emerald-400
                           text-white rounded-xl font-bold text-xl shadow-lg
                           hover:shadow-xl transition-shadow
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {players.length < 2
                  ? 'Need at least 2 players'
                  : '🎮 Start Game'}
              </motion.button>
            ) : (
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-lg">
                  ⏳ Waiting for host to start the game...
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function PlayerCard({ player, index, playerId, isHost, onKick }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent
                      flex items-center justify-center text-white font-bold"
        >
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="font-semibold text-gray-700">{player.name}</span>
          {player.isHost && (
            <span
              className="ml-2 text-xs bg-warning text-dark px-2 py-0.5
                         rounded-full font-semibold"
            >
              👑 Host
            </span>
          )}
          {player.id === playerId && (
            <span
              className="ml-2 text-xs bg-primary/10 text-primary px-2
                         py-0.5 rounded-full"
            >
              You
            </span>
          )}
        </div>
      </div>
      {isHost && player.id !== playerId && (
        <button
          onClick={() => onKick(player.id)}
          className="text-danger text-sm hover:underline"
        >
          Kick
        </button>
      )}
    </motion.div>
  );
}

function SettingRow({ label, disabled, children }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </span>
      {children}
    </div>
  );
}

function SettingSelect({
  value,
  options,
  onChange,
  disabled = false,
  suffix = '',
  formatOption,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      disabled={disabled}
      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                 disabled:opacity-50 focus:outline-none focus:border-primary"
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {formatOption ? formatOption(n) : `${n}${suffix}`}
        </option>
      ))}
    </select>
  );
}