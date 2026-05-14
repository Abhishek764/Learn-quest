# LearnQuest — Tech Stack

> **Last Updated:** 2026-05-14  |  **Owner:** Engineering

---

## Runtime & Language

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20+ |
| Language | JavaScript (ES2022) | — |
| Package Manager | npm workspaces | 10+ |

---

## Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Framework | Express.js | All 7 microservices |
| Database | PostgreSQL (Neon.tech) | Serverless, auto-scaling |
| DB Client | pg (node-postgres) | Raw SQL queries |
| Auth | jsonwebtoken (JWT) | Token-based auth |
| Password Hashing | bcryptjs | Salted hashing |
| Real-time | Socket.io | WebSocket rooms |
| HTTP Client | axios | Inter-service calls |
| UUID | uuid v4 | Entity IDs |
| Rate Limiting | express-rate-limit | Gateway protection |
| Process Manager | concurrently + nodemon | Dev multi-service |

---

## Frontend — Student App

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 | UI components |
| Build Tool | Vite 8 | Dev server + bundler |
| Routing | react-router-dom v7 | Client-side routing |
| Animation | **Framer Motion** | Cinematic transitions, hover effects |
| Charts | Recharts | Line charts, engagement graphs |
| Icons | Lucide React | Consistent icon system |
| HTTP | axios | API calls via gateway |
| Styling | Vanilla CSS | Custom design system |

---

## Frontend — Educator App

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 | UI components |
| Build Tool | Vite 8 | Dev server + bundler |
| Routing | react-router-dom v7 | Client-side routing |
| Animation | Framer Motion | Premium UI animations |
| Icons | Lucide React | Icon system |
| HTTP | axios | API calls |
| Custom Components | SpotlightCard, GlareCard | Premium interactive cards |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#06060a` | Deep black base |
| Card BG | `rgba(14,14,20,0.7)` | Glassmorphic cards |
| Accent | `#6366f1` → `#8b5cf6` → `#a855f7` | Indigo-purple gradient |
| Cyan | `#22d3ee` | Secondary accent |
| Success | `#10b981` | Correct answers, streaks |
| Danger | `#ef4444` | Wrong answers, errors |
| XP Color | `#fbbf24` | XP badges, gold |
| Border Radius | 16px / 24px / 28px | Cards and buttons |
| Font Primary | Inter | Body text |
| Font Display | Space Grotesk | Headings |
| Font Mono | JetBrains Mono | Stats, code, timers |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` | Premium transitions |

---

## Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker + docker-compose | Full stack deployment |
| Database Hosting | Neon.tech | Serverless PostgreSQL |
| Version Control | Git + GitHub | Source management |
| Monorepo | npm workspaces | 9 workspaces |

---

## Service Ports

| Service | Port |
|---------|------|
| Gateway | 3000 |
| Auth | 3001 |
| User | 3002 |
| Game | 3003 |
| ABOA (AI) | 3004 |
| Analytics | 3005 |
| Real-time | 3006 |
| Student App | 5173 |
| Educator App | 5174 |
