# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root (`C:/Users/juanf/intima-exclusive/`), not from `src/`:

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built bundle locally
- `npm run lint` — ESLint across the repo (flat config in `eslint.config.js`)

There is no test runner configured.

## Architecture

Single-page React 19 app scaffolded with Vite. The structure is a small product-catalog SPA:

- **Entry**: `src/main.jsx` mounts `<App />` into `#root` and imports `src/index.css` (which is just `@import "tailwindcss";`).
- **Routing**: `src/App.jsx` wraps the app in `BrowserRouter` (react-router-dom v7) and defines three routes outside of which `Navbar` and `Footer` always render:
  - `/` → `pages/Home`
  - `/categoria/:id` → `pages/Categoria`
  - `/producto/:id` → `pages/Producto`
- **Data**: `src/data/productos.js` is the intended single source of product data consumed by the pages and `ProductCard`. Category and product pages are expected to look up entries from it by the `:id` URL param.
- **Components**: `src/components/` holds shared UI (`Navbar`, `Footer`, `ProductCard`, `Corousel` — note the misspelling is the real filename).

Most files under `components/`, `pages/`, and `data/` are currently empty stubs — only `App.jsx`, `main.jsx`, `App.css`, and `index.css` have content. When adding features, fill these existing files rather than creating parallel ones.

## Styling

Tailwind CSS v4 via the PostCSS plugin (`@tailwindcss/postcss`). `tailwind.config.js` scans `index.html` and `src/**/*.{js,ts,jsx,tsx}`. There is also a legacy `src/App.css` from the Vite template — prefer Tailwind utility classes over extending it.

## Lint rule worth knowing

`no-unused-vars` ignores identifiers matching `^[A-Z_]` (see `eslint.config.js`), so unused `PascalCase` imports and `UPPER_CASE` constants will not trigger the rule.
