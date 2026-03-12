# 🎨 Skribbl Clone

A full-featured multiplayer drawing and guessing game clone built with React and Spring Boot.

## 🌐 Live Demo

**https://skribblclone.netlify.app/**

## ✨ Features

- **Multiplayer Rooms** - Create/join public or private rooms with unique room codes
- **Turn-based Drawing** - Each player takes turns drawing while others guess
- **Real-time Drawing Sync** - Canvas strokes sync instantly via WebSockets
- **Word Selection** - Drawer picks from multiple word options
- **Smart Scoring** - Points based on guess speed and order
- **Hints System** - Letters revealed progressively over time
- **Close Guess Detection** - Levenshtein distance-based near-miss detection
- **Drawing Tools** - Brush, eraser, color picker, size selector, undo, clear
- **Room Settings** - Configurable players, rounds, draw time, hints, word choices
- **Host Moderation** - Kick players, manage settings
- **Responsive Design** - Works on desktop and mobile


### Drawing Flow
1. Drawer mouse/touch events captured on HTML5 Canvas
2. Coordinates normalized (0-1 range) and sent via WebSocket
3. Server broadcasts to all other players
4. Receivers render strokes on their canvas using normalized coords

### Game State Management
- Server maintains authoritative game state per room
- Phases: LOBBY → WORD_SELECTION → DRAWING → ROUND_END → (repeat) → GAME_OVER
- Timer management via ScheduledExecutorService
- Turn rotation through shuffled player order

### WebSocket Protocol
- Raw WebSocket (not STOMP) with JSON messages
- Format: `{ "type": "event_name", "payload": { ... } }`
- Server-side: Spring WebSocket `TextWebSocketHandler`
- Client-side: Native `WebSocket` API

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | TailwindCSS v4 |
| Animation | Framer Motion |
| Routing | React Router v7 |
| State | Zustand v5 |
| Canvas | HTML5 Canvas API |
| Backend | Spring Boot 3.5.3 |
| Language | Java 21 |
| WebSocket | Spring WebSocket (Raw) |
| Storage | ConcurrentHashMap (in-memory) |

## 🚀 Setup & Run

### Prerequisites
- Java 21+
- Node.js 18+
- Maven 3.9+

### Backend

cd backend
mvn clean install
mvn spring-boot:run
# Runs on [http://localhost:8080](https://skribbl-backend-yfpu.onrender.com/)

- Note: Render free tier sleeps after 15 minutes of inactivity.
- First connection may take ~30 seconds for cold start.

## 📝 Key Design Decisions
- Raw WebSocket over STOMP — Simpler protocol, full control over message format, lower overhead
- Normalized coordinates — Drawing works identically across all screen sizes
- In-memory state — No database needed for ephemeral game rooms
- Incremental canvas rendering — Viewers only render new strokes, not full redraws
- Per-room synchronization — Rooms don't block each other during concurrent operations
- Monotonic message IDs — Prevents React key collisions in chat
