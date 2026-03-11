import useGameStore from '../store/gameStore';

let ws = null;
let reconnectAttempts = 0;
let reconnectTimerId = null;
let waitForOpenId = null;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const WAIT_FOR_OPEN_TIMEOUT = 5000; // 5s max wait

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

console.log('WebSocket will connect to:', WS_URL);

export function connectWebSocket(onOpenCallback) {
  // Already open → fire callback immediately
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (onOpenCallback) onOpenCallback();
    return;
  }

  // Currently connecting → wait with a timeout
  if (ws && ws.readyState === WebSocket.CONNECTING) {
    clearInterval(waitForOpenId);
    let elapsed = 0;
    const POLL = 100;

    waitForOpenId = setInterval(() => {
      elapsed += POLL;

      if (ws && ws.readyState === WebSocket.OPEN) {
        clearInterval(waitForOpenId);
        waitForOpenId = null;
        if (onOpenCallback) onOpenCallback();
      } else if (
        !ws ||
        ws.readyState >= WebSocket.CLOSING ||
        elapsed >= WAIT_FOR_OPEN_TIMEOUT
      ) {
        clearInterval(waitForOpenId);
        waitForOpenId = null;
        console.warn('WebSocket failed or timed out while waiting to open');
      }
    }, POLL);
    return;
  }

  // ── Fresh connection ────────────────────────────────────────
  // Reset attempts so reconnection works for this new session
  reconnectAttempts = 0;
  clearTimeout(reconnectTimerId);
  reconnectTimerId = null;

  console.log('Initiating WebSocket connection to:', WS_URL);
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    reconnectAttempts = 0;
    useGameStore.getState().setConnected(true);
    if (onOpenCallback) onOpenCallback();
  };

  ws.onmessage = (event) => {
    try {
      handleMessage(JSON.parse(event.data));
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  };

  ws.onclose = (event) => {
    console.log('WebSocket closed — code:', event.code, 'reason:', event.reason);
    useGameStore.getState().setConnected(false);
    ws = null;

    // Don't reconnect on clean close (1000) or if max attempts reached
    if (event.code === 1000 || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
      }
      return;
    }

    reconnectAttempts++;
    const delay = RECONNECT_DELAY * reconnectAttempts;
    console.log(
      `Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
    );

    reconnectTimerId = setTimeout(() => {
      reconnectTimerId = null;
      const state = useGameStore.getState();

      // Only attempt rejoin if the user is still in a room
      if (state.roomId && state.playerName) {
        connectWebSocket(() => {
          sendMessage('join_room', {
            roomId: state.roomId,
            playerName: state.playerName,
          });
        });
      }
      // If state was reset (user left), do nothing
    }, delay);
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };
}

export function sendMessage(type, payload = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  } else {
    console.warn('WebSocket not connected, cannot send:', type);
  }
}

export function disconnectWebSocket() {
  // Cancel any pending reconnect
  clearTimeout(reconnectTimerId);
  reconnectTimerId = null;

  // Cancel any pending waitForOpen poll
  clearInterval(waitForOpenId);
  waitForOpenId = null;

  // Prevent further reconnection
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS;

  if (ws) {
    ws.close(1000, 'User disconnected');
    ws = null;
  }

  useGameStore.getState().setConnected(false);
}

// ── Message handler ──────────────────────────────────────────

function handleMessage(message) {
  const { type, payload } = message;
  const store = useGameStore.getState();

  switch (type) {
    case 'room_created':
      store.setRoomId(payload.roomId);
      store.setPlayerId(payload.playerId);
      store.setPlayers(payload.players);
      store.setIsHost(payload.isHost);
      if (payload.settings) store.setSettings(payload.settings);
      break;

    case 'room_joined':
      store.setRoomId(payload.roomId);
      store.setPlayerId(payload.playerId);
      store.setPlayers(payload.players);
      store.setIsHost(payload.isHost);
      store.setHostId(payload.hostId);
      if (payload.settings) store.setSettings(payload.settings);
      break;

    case 'player_joined':
      store.setPlayers(payload.players);
      store.addMessage({
        type: 'system',
        text: `${payload.playerName} joined the room`,
      });
      break;

    case 'player_left':
      store.setPlayers(payload.players);
      store.setHostId(payload.hostId);
      if (payload.hostId === store.playerId) {
        store.setIsHost(true);
      }
      store.addMessage({
        type: 'system',
        text: `${payload.playerName} left the room`,
      });
      break;

    case 'settings_updated':
      if (payload.settings) store.setSettings(payload.settings);
      break;

    case 'game_starting':
      store.setGamePhase('starting');
      store.clearMessages();
      store.addMessage({ type: 'system', text: 'Game is starting!' });
      break;

    case 'word_selection':
      store.setGamePhase('word_selection');
      store.setWordOptions(payload.words);
      store.setCurrentRound(payload.round);
      store.setTotalRounds(payload.totalRounds);
      store.setTimeLeft(payload.drawTime);
      store.clearDrawHistory();
      break;

    case 'choosing_word':
      store.setGamePhase('choosing');
      store.setDrawerId(payload.drawerId);
      store.setDrawerName(payload.drawerName);
      store.setCurrentRound(payload.round);
      store.setTotalRounds(payload.totalRounds);
      store.setCurrentWord(null);
      store.setHint('');
      store.clearDrawHistory();
      store.addMessage({
        type: 'system',
        text: `${payload.drawerName} is choosing a word...`,
      });
      break;

    case 'round_start_drawer':
      store.setGamePhase('drawing');
      store.setCurrentWord(payload.word);
      store.setHint(payload.hint);
      store.setTimeLeft(payload.drawTime);
      store.setCurrentRound(payload.round);
      store.setTotalRounds(payload.totalRounds);
      store.setDrawerId(store.playerId);
      break;

    case 'round_start_guesser':
      store.setGamePhase('drawing');
      store.setHint(payload.hint);
      store.setTimeLeft(payload.drawTime);
      store.setDrawerId(payload.drawerId);
      store.setDrawerName(payload.drawerName);
      store.setCurrentRound(payload.round);
      store.setTotalRounds(payload.totalRounds);
      store.setWordLength(payload.wordLength);
      store.setCurrentWord(null);
      break;

    case 'timer_update':
      store.setTimeLeft(payload.timeLeft);
      break;

    case 'hint_update':
      store.setHint(payload.hint);
      break;

    case 'draw_data':
      store.addDrawAction(payload);
      break;

    case 'canvas_clear':
      store.clearDrawHistory();
      break;

    case 'draw_undo':
      store.setDrawHistory(payload.drawHistory || []);
      break;

    case 'correct_guess':
      store.setPlayers(payload.players);
      store.addMessage({
        type: 'correct',
        text: `${payload.playerName} guessed the word! (+${payload.points})`,
        playerName: payload.playerName,
      });
      break;

    case 'chat_message':
      store.addMessage({
        type: payload.isClose ? 'close' : 'chat',
        text: payload.text,
        playerName: payload.playerName,
        playerId: payload.playerId,
        isGuess: payload.isGuess,
      });
      break;

    case 'close_guess':
      store.addMessage({
        type: 'close',
        text: payload.message,
      });
      break;

    case 'round_end':
      store.setGamePhase('round_end');
      store.setRoundEndData(payload);
      store.setPlayers(payload.players);
      store.addMessage({
        type: 'system',
        text: `Round ended! The word was: ${payload.word}`,
      });
      break;

    case 'game_over':
      store.setGamePhase('game_over');
      store.setGameOverData(payload);
      store.addMessage({
        type: 'system',
        text: `Game over! ${payload.winner} wins!`,
      });
      break;

    case 'return_to_lobby':
      store.resetGame();
      store.setPlayers(payload.players);
      store.setHostId(payload.hostId);
      if (payload.hostId === store.playerId) {
        store.setIsHost(true);
      }
      break;

    case 'kicked':
      store.resetAll();
      alert(payload.message || 'You have been kicked!');
      window.location.href = '/';
      break;

    case 'error':
      store.addMessage({
        type: 'error',
        text: payload.message,
      });
      console.error('Server error:', payload.message);
      break;

    case 'public_rooms':
      store.setPublicRooms(payload.rooms);
      break;

    default:
      console.log('Unknown message type:', type, payload);
  }
}