# SimPol — CLAUDE.md

## Project Overview

SimPol is a turn-based strategic political simulation game. Players choose a party ideology and compete across 6 states over 4, 8, or 12 in-game years — taking polls, running campaigns, and winning elections to align the country's reality with their ideology. The game rules are documented in `SimPol_GameRules.pdf`.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript** (strict mode)
- **Tailwind CSS 4** via PostCSS for all styling
- **ESLint 9** flat config (`eslint.config.mjs`) with Next.js + TypeScript rules
- No external state libraries — React Context + `useReducer`

## Key Directories

```
src/
  app/          Next.js App Router — layout, global styles, root page
  components/
    game/       All UI components (SetupScreen, GameBoard, panels, etc.)
  game/         All game logic — pure modules, no React dependencies
    types.ts    Canonical source of all types, constants, and presets
    store.tsx   GameContext + GameDispatchContext + reducer
    engine.ts   Phase state machine and game loop
```

Full component and module descriptions: [`.claude/docs/architectural_patterns.md`](.claude/docs/architectural_patterns.md)

## Essential Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

TypeScript checking runs as part of `next build`. To check types standalone:
```bash
npx tsc --noEmit
```

## Additional Documentation

Check these files when working on the relevant area:

| Topic | File |
|---|---|
| Architecture, patterns, data flow | [`.claude/docs/architectural_patterns.md`](.claude/docs/architectural_patterns.md) |
| Game rules and design intent | `SimPol_GameRules.pdf` |
