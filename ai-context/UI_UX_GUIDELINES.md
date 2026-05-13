# LearnQuest — UI/UX Guidelines

> **Last Updated:** 2026-05-14  |  **Owner:** Design/Frontend  |  **Status:** Living Document

---

## Design Philosophy

LearnQuest should feel like a **gaming platform**, NOT an educational tool. Every pixel should communicate: "This is fun. This is immersive. This is yours."

### Inspiration Sources

| Platform | What to Borrow |
|----------|---------------|
| **Duolingo** | Streak mechanics, daily motivation, character personality |
| **Roblox** | World exploration feel, avatar progression, social discovery |
| **Kahoot** | Energetic colors, countdown excitement, competitive energy |
| **Valorant** | Clean dark UI, rank progression, battlepass aesthetic |
| **GitHub** | Activity heatmap, contribution graphs, profile badges |

### What to AVOID

- ❌ Generic admin dashboards (Material UI defaults)
- ❌ Boring LMS interfaces (Canvas, Moodle aesthetic)
- ❌ Static educational interfaces (textbook-on-screen)
- ❌ Corporate enterprise UI (Salesforce/SAP feel)
- ❌ Light themes with white backgrounds (feels clinical)

---

## Color Palette

### Student App (Emerald Accent)

```
Background:       #0a0a0f (deep black)
Surface:          #12121a (card background)
Surface Hover:    #1a1a25 (interactive)
Border:           #1e1e2e (subtle dividers)
Text Primary:     #f0f0f5 (headings)
Text Secondary:   #a0a0b0 (body text)
Text Muted:       #55556a (labels)

Primary:          #10b981 (emerald green — success, XP, play)
Primary Glow:     rgba(16, 185, 129, 0.3)
Secondary:        #8b5cf6 (purple — special actions)
Danger:           #ef4444 (wrong answers)
Warning:          #f59e0b (amber — streaks, caution)
XP Gold:          #fbbf24 (XP amounts, achievements)
```

### Educator App (Purple Accent)

Same base palette but primary is `#8b5cf6` (purple) instead of emerald. This visually distinguishes the educator experience.

---

## Typography

```
Headings:     'Space Grotesk', sans-serif (bold, modern)
Body text:    'Inter', sans-serif (clean, readable)
Monospace:    'JetBrains Mono', monospace (XP amounts, codes, stats)
```

**Load via Google Fonts in `index.html`:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
```

### Scale

| Element | Size | Weight |
|---------|------|--------|
| Page title (h1) | 28-32px | 700 |
| Section title (h2) | 20-24px | 600 |
| Card title (h3) | 16-18px | 600 |
| Body text | 14-16px | 400 |
| Labels/captions | 12-13px | 500 |
| Monospace stats | 14-16px | 600 |

---

## Component Patterns

### Cards (Glassmorphic)

```css
.card {
  background: rgba(18, 18, 26, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(30, 30, 46, 0.8);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
```

### Buttons

| Variant | Style |
|---------|-------|
| Primary | Emerald gradient, white text, glow on hover |
| Secondary | Transparent, border, text color, fill on hover |
| Danger | Red background, white text |
| Ghost | No border, text only, underline on hover |

### Inputs

Dark background (#1a1a25), subtle border, emerald glow ring on focus. No outline — use box-shadow for focus indicator.

---

## Animation Guidelines

### Principles

1. **Purpose:** Every animation must serve UX (guide attention, provide feedback, create delight)
2. **Performance:** Use CSS transforms/opacity only (GPU-accelerated). Never animate layout properties.
3. **Duration:** 150-300ms for micro-interactions, 300-500ms for page transitions, 500-1000ms for celebrations
4. **Easing:** `ease-out` for entrances, `ease-in` for exits, `spring` for playful bounces

### Required Animations

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Page load | Cards fade in + slide up | 300ms staggered |
| Correct answer | Green glow + XP float-up | 500ms |
| Wrong answer | Shake + red flash | 300ms |
| Level up | Scale pulse + confetti | 1000ms |
| Badge earned | Bounce in + glow | 500ms |
| Streak increment | Flame icon pulse | 200ms |
| Button hover | Scale 1.02 + shadow increase | 150ms |
| Card hover | Border glow + slight lift | 200ms |
| Timer < 10s | Pulsing red ring | 500ms loop |
| Nav link active | Underline slide in | 200ms |

### Celebration System

**Confetti:** Triggered on ≥ 80% session accuracy, level ups, badge unlocks. Use CSS particles or canvas-confetti library. Short burst (1-2 seconds), not sustained.

**XP Float:** "+15 XP" text rises from the answer area and fades out. Yellow/gold color. Monospace font.

---

## Layout Patterns

### Page Structure
```
┌────────────────────────────────────────┐
│ Navbar (sticky, glassmorphic)          │
├────────────────────────────────────────┤
│                                        │
│   Page Content                         │
│   max-width: 1200px                    │
│   padding: 32px horizontal             │
│   margin: 0 auto                       │
│                                        │
│   ┌──────────┐ ┌──────────┐           │
│   │ Card     │ │ Card     │           │
│   └──────────┘ └──────────┘           │
│                                        │
└────────────────────────────────────────┘
```

### Grid System
- Dashboard: 4-column stats row, 3-column content grid
- Games: 3-column card grid
- Progress: 2-column chart layout
- All grids collapse to single column on mobile

### Responsive Strategy
- **Mobile-first** design in CSS
- Breakpoints: 640px (sm), 768px (md), 1024px (lg)
- Navigation: horizontal links on desktop → hamburger drawer on mobile
- Cards: multi-column on desktop → stacked on mobile

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | 4.5:1 minimum for text on backgrounds |
| Focus indicators | Visible focus rings on all interactive elements |
| Keyboard navigation | All actions reachable via keyboard |
| Screen reader | Semantic HTML, aria-labels on icon-only buttons |
| Motion reduction | Respect `prefers-reduced-motion` media query |
| Touch targets | Minimum 44x44px for mobile |

---

## Emotional Design

The UI should evoke specific emotions at key moments:

| Moment | Emotion | How |
|--------|---------|-----|
| Dashboard load | Pride/motivation | XP counter, streak flame, badges visible |
| Starting a game | Excitement | Energetic CTA, game mode descriptions |
| Correct answer | Satisfaction | Green glow, XP animation, streak fire |
| Wrong answer | Gentle challenge | Brief red, explanation (not punishing) |
| Level up | Achievement | Full-screen celebration, confetti, fanfare |
| Skill tree | Mastery/progress | Visual growth, gold nodes, unlock paths |
| Leaderboard | Competition | Rank display, movement arrows, "You" highlight |
| Returning after break | Welcome back | Gentle greeting, review recommendations |
