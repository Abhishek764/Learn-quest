# LearnQuest — Frontend Architecture

> **Last Updated:** 2026-05-14  |  **Owner:** Frontend Team  |  **Status:** Living Document

---

## Current Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Build tool | Vite | 8.x |
| Routing | react-router-dom | 6.x |
| HTTP client | Axios | 1.x |
| Icons | lucide-react | 0.390+ |
| Charts | Recharts | 2.x |
| Styling | Vanilla CSS (replacing CDN Tailwind) | — |

## Target Stack (Migration Path)

| Layer | Target | Reasoning |
|-------|--------|-----------|
| Framework | Next.js + TypeScript | SSR, file-based routing, better SEO |
| State | Zustand | Lightweight, no boilerplate |
| Data fetching | React Query (TanStack) | Caching, revalidation, loading states |
| Animations | Framer Motion | Production-grade animations |
| Styling | Tailwind CSS (proper install, not CDN) | Utility-first, tree-shaking |

**Migration is NOT required for initial launch.** Current Vite+React works. Migrate when adding SSR/SEO requirements.

---

## App Structure

### Student App (`student-app/`)

```
student-app/
├── index.html              # Entry point, fonts, meta tags
├── vite.config.js          # Vite config, port 5173
├── src/
│   ├── main.jsx            # React DOM render
│   ├── App.jsx             # Router + PrivateRoute wrapper
│   ├── api.js              # Axios instance with JWT interceptor
│   ├── index.css           # Design system (custom properties, animations)
│   ├── components/
│   │   ├── Navbar.jsx      # Glassmorphic nav with XP ring
│   │   └── ...             # Shared components
│   └── pages/
│       ├── Login.jsx       # Auth - split layout
│       ├── Register.jsx    # Auth - step form
│       ├── Dashboard.jsx   # Home - stats, heatmap, tips
│       ├── Games.jsx       # Game lobby - mode cards
│       ├── GamePlay.jsx    # Core game loop
│       ├── SkillTree.jsx   # Knowledge graph visualization
│       ├── Quests.jsx      # Personalized learning paths
│       ├── Progress.jsx    # Analytics + charts
│       ├── Leaderboard.jsx # Rankings + podium
│       └── Profile.jsx     # Settings + badges
```

### Educator App (`educator-app/`)

```
educator-app/
├── src/
│   ├── App.jsx
│   ├── api.js
│   ├── components/Navbar.jsx
│   └── pages/
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── Dashboard.jsx   # AI analytics, at-risk students
│       ├── Classes.jsx     # Class management + create modal
│       ├── ClassDetail.jsx # Members + per-student analytics
│       └── Content.jsx     # Question bank CRUD
```

---

## Authentication Flow

```
1. User submits login form
2. POST /auth/login → receives { token, refreshToken, user }
3. Store token in localStorage.token
4. Store user in localStorage.user
5. Redirect to /dashboard
6. All API calls include Authorization: Bearer <token> (via axios interceptor)
7. On 401 response → clear storage, redirect to /login
```

### PrivateRoute Pattern

```jsx
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}
```

**Future improvement:** Replace localStorage with httpOnly cookies for XSS protection.

---

## API Client (`api.js`)

```javascript
const API = axios.create({ baseURL: 'http://localhost:3000' });

// Attach JWT to every request
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
API.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(err);
});
```

---

## Design System

### CSS Custom Properties

```css
:root {
  --color-bg: #0a0a0f;
  --color-surface: #12121a;
  --color-surface-hover: #1a1a25;
  --color-border: #1e1e2e;
  --color-text: #a0a0b0;
  --color-text-heading: #f0f0f5;
  --color-primary: #10b981;          /* Emerald - student accent */
  --color-primary-glow: rgba(16, 185, 129, 0.3);
  --color-secondary: #8b5cf6;       /* Purple - educator accent */
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-xp: #fbbf24;
  --radius: 12px;
  --radius-lg: 16px;
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

### Animation Keyframes

- `fadeIn` — opacity 0→1 (page transitions)
- `slideUp` — translateY(20px)→0 (card entrance)
- `pulse` — scale 1→1.05→1 (level up badge)
- `glow` — box-shadow intensity oscillation (active states)
- `shake` — translateX ±4px (wrong answer)
- `float` — translateY ±8px (idle icons)
- `confetti` — particle explosion (session complete)
- `countUp` — number increment animation (XP display)

### Component Classes

- `.card` — glassmorphic surface with backdrop-blur
- `.btn-primary` — emerald gradient button with hover glow
- `.btn-secondary` — ghost button with border
- `.input` — dark input with focus glow ring
- `.badge` — small pill with icon
- `.progress-ring` — circular SVG progress indicator

---

## Page Rendering Patterns

### Data Fetching

```jsx
// Current pattern: useEffect + useState
useEffect(() => {
  API.get(`/analytics/user/${user.id}/stats`)
    .then(r => setStats(r.data))
    .catch(() => {});
}, [user.id]);
```

**Target pattern (React Query):**
```jsx
const { data: stats, isLoading } = useQuery({
  queryKey: ['stats', user.id],
  queryFn: () => API.get(`/analytics/user/${user.id}/stats`).then(r => r.data),
  staleTime: 30000,
});
```

### Loading States

Every page must handle: Loading → Data → Empty → Error states.

### Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| Mobile | < 640px | Phone portrait |
| Tablet | 640-1024px | Tablet/phone landscape |
| Desktop | > 1024px | Laptop/monitor |

---

## Key UI Components

### Navbar (Student)
- Sticky, glassmorphic (backdrop-blur)
- Logo with glow animation
- Nav links with active indicator underline
- Circular XP progress ring (not flat bar)
- Level badge with pulse
- Mobile: hamburger → slide-in drawer

### GamePlay Timer
- Circular SVG ring countdown (not linear bar)
- Color transitions: green → amber → red
- Pulsing animation when < 10 seconds

### Skill Tree
- Canvas/SVG-based node graph
- Nodes positioned using `position_x`, `position_y` from knowledge_nodes
- Dashed lines between connected nodes
- Mastery-based coloring per node
- Click interaction → modal with mastery details

### Leaderboard Podium
- Top 3 displayed as elevated cards with gold/silver/bronze styling
- Rest as list rows with rank numbers
- Current user row has glow border
