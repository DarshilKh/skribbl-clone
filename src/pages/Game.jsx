import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import WordSelection from '../components/WordSelection';
import DrawingTools from '../components/DrawingTools';
import GameHeader from '../components/GameHeader';
import Scoreboard from '../components/Scoreboard';
import RoundEnd from '../components/RoundEnd';

export default function Game() {
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const {
    roomId,
    playerId,
    gamePhase,
    drawerId,
    roundEndData,
    gameOverData,
    drawerName,
  } = useGameStore();

  const canvasRef = useRef(null);

  /* ── Redirect to home if no session ──────────────────────────
       Uses urlRoomId so the Home page can pre-fill the join form
       when the user doesn't have an active session.             */
  useEffect(() => {
    if (!roomId && !playerId) {
      navigate(urlRoomId ? `/?join=${urlRoomId}` : '/');
    }
  }, [roomId, playerId, urlRoomId, navigate]);

  /* ── Return to lobby when server resets the phase ──────────── */
  useEffect(() => {
    if (gamePhase === 'lobby') {
      navigate(`/lobby/${roomId || urlRoomId}`);
    }
  }, [gamePhase, roomId, urlRoomId, navigate]);

  const isDrawer = playerId === drawerId;
  const showCanvas = gamePhase === 'drawing' || gamePhase === 'round_end';

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <GameHeader />

        <div className="grid grid-cols-12 gap-2 md:gap-4 mt-2">
          {/* ── Player List — Left ──────────────────────── */}
          <div className="col-span-12 md:col-span-2">
            <PlayerList />
          </div>

          {/* ── Canvas Area — Center ───────────────────── */}
          <div className="col-span-12 md:col-span-7">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
              {/* Word Selection Overlay */}
              <AnimatePresence>
                {gamePhase === 'word_selection' && <WordSelection />}
              </AnimatePresence>

              {/* Choosing Word Overlay */}
              <AnimatePresence>
                {gamePhase === 'choosing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center bg-gradient-to-br
                               from-gray-100 to-gray-200"
                    style={{ height: '60vh', minHeight: '400px' }}
                  >
                    <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
                      <div className="text-4xl mb-3">🤔</div>
                      <p className="text-xl font-semibold text-gray-700">
                        {drawerName} is choosing a word...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Canvas + Drawing Tools */}
              {showCanvas && (
                <>
                  <Canvas ref={canvasRef} />
                  {isDrawer && gamePhase === 'drawing' && (
                    <DrawingTools canvasRef={canvasRef} />
                  )}
                </>
              )}

              {/* Round End Overlay (on top of canvas) */}
              <AnimatePresence>
                {gamePhase === 'round_end' && roundEndData && (
                  <RoundEnd data={roundEndData} />
                )}
              </AnimatePresence>

              {/* Game Over */}
              <AnimatePresence>
                {gamePhase === 'game_over' && gameOverData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Scoreboard data={gameOverData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Chat — Right ───────────────────────────── */}
          <div className="col-span-12 md:col-span-3">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
}