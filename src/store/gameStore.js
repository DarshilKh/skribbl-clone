import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Connection
  socket: null,
  connected: false,

  // Player
  playerId: null,
  playerName: '',
  isHost: false,

  // Room
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

  // Game State
  gamePhase: 'lobby', // lobby, word_selection, choosing, drawing, round_end, game_over
  currentRound: 0,
  totalRounds: 3,
  drawerId: null,
  drawerName: '',
  currentWord: null,
  hint: '',
  wordLength: 0,
  timeLeft: 0,
  wordOptions: [],

  // Chat
  messages: [],

  // Drawing
  drawHistory: [],

  // Round End / Game Over
  roundEndData: null,
  gameOverData: null,

  // Public Rooms
  publicRooms: [],

  // Actions
  setSocket: (socket) => set({ socket }),
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

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: Date.now() + Math.random() }]
  })),

  clearMessages: () => set({ messages: [] }),

  addDrawAction: (action) => set((state) => ({
    drawHistory: [...state.drawHistory, action]
  })),

  clearDrawHistory: () => set({ drawHistory: [] }),
  setDrawHistory: (drawHistory) => set({ drawHistory }),

  isDrawer: () => {
    const state = get();
    return state.playerId === state.drawerId;
  },

  resetGame: () => set({
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

  resetAll: () => set({
    socket: null,
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