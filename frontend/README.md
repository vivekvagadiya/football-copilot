# Football Copilot - AI-Powered Football Operating System

Football Copilot is a complete, production-quality React 19 single-page application designed for gaffers, analysts, and advanced football tacticians. It models football stats, live predictions, scouting lists, transfer monitor indices, and incorporates a live streaming AI Copilot chat experience.

## Design Philosophy

The UI is built to feel clean, dark, and premium - drawing design aesthetics from Linear, Perplexity, Notion, and Apple:
- Minimal layout boundaries with thin `#1E3528` border dividers
- Elegant typography using **Plus Jakarta Sans** and **Outfit**
- Micro-interactions and spring overlays using **Framer Motion**
- Vibrant green primary accents (`#2ECC71` / `#1F9D55`)
- Supports **Light mode** and **Dark mode** with global toggling and browser cache persistence

## Tech Stack

- **React 19**
- **Vite**
- **Tailwind CSS v4** (utilizing Vite plugins and `@theme` directives)
- **React Router v7** (using `HashRouter` mapping for standalone local access)
- **TanStack Query (React Query)**
- **Framer Motion**
- **Lucide React**
- **Recharts** (visualizing attributes radar charts and scoring records)
- **React Hook Form** + **Zod** (profile, setting, and login authentication inputs validation)
- **React Dropzone** (scouting file console imports)
- **Sonner** (broadcast telemetry toasts)

## Scalable Folder Structure

```
src/
├── assets/         # Project logo & asset directories
├── components/     # UI atoms & modules
│   ├── ui/         # Buttons, Cards, Badges, Modals, Tabs, Command Search
│   └── football/   # ScoreCard, FixtureCard, PlayerCard, TeamCard, TransferCard
├── constants/      # Match timelines, rosters, and news mock database
├── context/        # AppContext for theme, notifications, and favorites
├── layouts/        # Dashboard layout, Mobile menus, and Public landing shells
├── pages/          # Pages (Dashboard, Live, Fixtures, Scouting, AI Chat, etc.)
├── routes/         # Router paths map
├── services/       # apiService mock REST wrapper
└── styles/         # Global styling (index.css with dark/light tokens)
```

## Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Development Server**:
   ```bash
   npm run dev
   ```

3. **Verify Build Output**:
   ```bash
   npm run build
   ```
