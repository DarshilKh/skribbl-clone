<div align="center">

# 🎨 Skribbl Clone — Real-time Multiplayer Drawing Game

A production-grade, real-time multiplayer drawing and guessing game built with React + Spring Boot + WebSockets.  
Designed for low-latency communication, scalable room-based gameplay, and clean system architecture.

[![Live Demo](https://img.shields.io/badge/▲%20LIVE%20DEMO-PLAY-6366f1?style=for-the-badge)](https://skribblclone.netlify.app)

<br/>

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/SpringBoot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=flat-square&logo=socket.io&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)

</div>
---

## 🚀 Highlights

- Real-time multiplayer sync (sub-second latency)  
- Event-driven architecture with authoritative server state  
- Intelligent guess detection (Levenshtein distance)  
- Scalable room-based system (concurrent users)  
- Optimized canvas rendering (incremental updates)  
- Fully responsive (desktop + mobile)  

---

## ✨ Core Features

### 🎮 Gameplay

- Multiplayer rooms (public/private with unique codes)  
- Turn-based drawing system  
- Word selection with multiple options  
- Progressive hints system  
- Smart scoring (based on speed + accuracy)  

### ⚡ Real-Time System

- Instant canvas sync using WebSockets  
- Event-based communication protocol  
- Low-latency message broadcasting  
- Multi-user synchronization  

### 🎨 Drawing Engine

- Brush, eraser, color picker, size control  
- Undo + clear canvas  
- Smooth stroke rendering  
- Cross-device consistent drawing  

### 🛠️ Room & Control

- Configurable game settings (rounds, timers, players)  
- Host moderation (kick users, control flow)  
- Isolated room state (no cross-room interference)  

---

## 🏗️ System Architecture

Client (React + Canvas)  
        ↓  
WebSocket Layer (Event-based)  
        ↓  
Spring Boot Server (Game Engine)  
        ↓  
In-Memory State (Room-based)  

---

## ⚡ Real-Time Flow

1. User draws → Canvas captures coordinates  
2. Coordinates normalized (0–1 range)  
3. Sent via WebSocket to backend  
4. Server broadcasts to all players in room  
5. Clients render strokes in real-time  

---

## 🧠 Game State Management

- Server maintains authoritative state per room  

Finite State Machine:  
LOBBY → WORD_SELECTION → DRAWING → ROUND_END → GAME_OVER  

- Turn rotation via shuffled player queue  
- Timers managed using ScheduledExecutorService  
- State transitions handled server-side (prevents cheating)  

---

## 📡 WebSocket Protocol

- Raw WebSocket (no STOMP overhead)  

Message format:  
{ "type": "event_name", "payload": { ... } }  

- Backend: TextWebSocketHandler  
- Frontend: Native WebSocket API  

---

## 🛠️ Tech Stack

### 💻 Frontend

- React 19 (Vite)  
- TailwindCSS v4  
- Framer Motion  
- React Router v7  
- Zustand  
- HTML5 Canvas API  

### ⚙️ Backend

- Spring Boot 3.5.3  
- Java 21  
- Spring WebSocket (Raw)  

### 🧠 System

- In-memory storage (ConcurrentHashMap)  
- Event-driven architecture  
- Room-based isolation  

---

## ⚡ Performance Optimizations

- Normalized coordinates → device-independent rendering  
- Incremental canvas updates (no full redraw)  
- Per-room state isolation → parallel scalability  
- Lightweight WebSocket protocol → reduced overhead  

---

## 🚀 Setup

### Prerequisites

- Java 21+  
- Node.js 18+  
- Maven 3.9+  

### Backend

cd backend  
mvn clean install  
mvn spring-boot:run  

Runs on: http://localhost:8080  
(Deployed on Render — cold start ~30s)

---

## 🧾 Key Engineering Decisions

- Raw WebSockets over STOMP → lower latency, full protocol control  
- Server-authoritative state → prevents client-side manipulation  
- Normalized coordinates → consistent rendering across devices  
- In-memory storage → optimized for ephemeral sessions  
- Event-driven design → scalable and maintainable  

---

## 📈 What This Project Demonstrates

- Real-time system design  
- WebSocket-based communication  
- Multiplayer state synchronization  
- Backend architecture (Spring Boot)  
- Frontend performance optimization  
- Clean, production-ready structure  

---

## 🤝 Contributing

Open to improvements, optimizations, and feature ideas.

---

## ⭐ If you found this useful

Consider giving a star — it helps visibility.
