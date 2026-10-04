# ZRideAdminPanel

Portable dummy/demo admin panel for ZRide. It includes the SplashFrontScreen, RoleSelectScreen, local demo login, Super Admin, City Admin, and Support Admin screens with sample data and local interactions.

## Run from source

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

## Static hosting

The `dist/` folder already contains a production build. Upload the contents of `dist/` to any static website host.

## Project structure

- `src/App.js` — central app flow and imports for every screen
- `src/screens/` — separate JavaScript screen files with their own dummy data/options
- `src/components/ControlRoom.js` — shared controls and admin shell
- `src/index.css` — visual theme

This is intentionally frontend-only. Replace the screen-local demo data and action handlers with your real API/backend later.
