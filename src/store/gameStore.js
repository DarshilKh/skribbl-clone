import { create } from 'zustand';

const MAX_MESSAGES = 200;
const MAX_DRAW_HISTORY = 5000;

let messageCounter = 0;

const useGameStore = create((set) => ({
  // ── Connection ──────────────────────────────────────────────
  connected: false,

  // ── Player ──────────────────────────────────────────────────
  playerId: null,
  playerName: '',
  isHost: false,

  // ── Room ────────────────────────────────────────────────────
  roomId: null,
  players: [],
  hostId: null,
  settings: {
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    maxHints: 3,
    isPrivate: false,
  },

  // ── Game State ──────────────────────────────────────────────
  gamePhase: 'lobby',
  currentRound: 0,
  totalRounds: 3,
  drawerId: null,
  drawerName: '',
  currentWord: null,
  hint: '',
  wordLength: 0,
  timeLeft: 0,
  wordOptions: [],

  // ── Chat ────────────────────────────────────────────────────
  messages: [],

  // ── Drawing ─────────────────────────────────────────────────
  drawHistory: [],

  // ── End Screens ─────────────────────────────────────────────
  roundEndData: null,
  gameOverData: null,

  // ── Public Rooms ────────────────────────────────────────────
  publicRooms: [],

  // ── Setters ─────────────────────────────────────────────────
  setConnected: (connected) => set({ connected }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  setIsHost: (isHost) => set({ isHost }),
  setRoomId: (roomId) => set({ roomId }),
  setPlayers: (players) => set({ players }),
  setHostId: (hostId) => set({ hostId }),
  setSettings: (settings) => set({ settings }),
  setGamePhase: (gamePhase) => set({ gamePhase }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setTotalRounds: (totalRounds) => set({ totalRounds }),
  setDrawerId: (drawerId) => set({ drawerId }),
  setDrawerName: (drawerName) => set({ drawerName }),
  setCurrentWord: (currentWord) => set({ currentWord }),
  setHint: (hint) => set({ hint }),
  setWordLength: (wordLength) => set({ wordLength }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setWordOptions: (wordOptions) => set({ wordOptions }),
  setPublicRooms: (publicRooms) => set({ publicRooms }),
  setRoundEndData: (roundEndData) => set({ roundEndData }),
  setGameOverData: (gameOverData) => set({ gameOverData }),

  // ── Messages (bounded) ─────────────────────────────────────
  addMessage: (message) =>
    set((state) => {
      const id = ++messageCounter;
      const updated = [...state.messages, { ...message, id }];
      // Keep only the most recent messages
      return { messages: updated.length > MAX_MESSAGES
        ? updated.slice(-MAX_MESSAGES)
        : updated };
    }),

  clearMessages: () => set({ messages: [] }),

  // ── Draw History (bounded) ──────────────────────────────────
  addDrawAction: (action) =>
    set((state) => {
      const updated = [...state.drawHistory, action];
      return { drawHistory: updated.length > MAX_DRAW_HISTORY
        ? updated.slice(-MAX_DRAW_HISTORY)
        : updated };
    }),

  clearDrawHistory: () => set({ drawHistory: [] }),
  setDrawHistory: (drawHistory) => set({ drawHistory }),

  // ── Reset (game only — keeps room/player) ───────────────────
  resetGame: () =>
    set({
      gamePhase: 'lobby',
      currentRound: 0,
      drawerId: null,
      drawerName: '',
      currentWord: null,
      hint: '',
      wordLength: 0,
      timeLeft: 0,
      wordOptions: [],
      messages: [],
      drawHistory: [],
      roundEndData: null,
      gameOverData: null,
    }),

  // ── Full reset (everything) ─────────────────────────────────
  resetAll: () =>
    set({
      connected: false,
      playerId: null,
      playerName: '',
      isHost: false,
      roomId: null,
      players: [],
      hostId: null,
      settings: {
        maxPlayers: 8,
        rounds: 3,
        drawTime: 80,
        wordCount: 3,
        maxHints: 3,
        isPrivate: false,
      },
      gamePhase: 'lobby',
      currentRound: 0,
      totalRounds: 3,
      drawerId: null,
      drawerName: '',
      currentWord: null,
      hint: '',
      wordLength: 0,
      timeLeft: 0,
      wordOptions: [],
      messages: [],
      drawHistory: [],
      roundEndData: null,
      gameOverData: null,
      publicRooms: [],
    }),
}));

export default useGameStore;