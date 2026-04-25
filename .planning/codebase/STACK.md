# Technology Stack

**Analysis Date:** 2025-01-24

## Languages

**Primary:**
- JavaScript (ES6+) - Core application logic and React components. Used in `src/main.jsx` and `src/StringArtGenerator.jsx`.

**Secondary:**
- JSX - UI structure within React components. Used in `src/StringArtGenerator.jsx` and `src/main.jsx`.
- HTML5 - Entry point of the application. Used in `index.html`.
- CSS3 - Component styling, included via CSS-in-JS/Inline styles within `src/StringArtGenerator.jsx`.

## Runtime

**Environment:**
- Node.js 20 - Specified in `.nvmrc`.

**Package Manager:**
- npm - Managed via `package-lock.json` and `package.json`.
- Lockfile: present (`package-lock.json`).

## Frameworks

**Core:**
- React 18.2.0 - UI library for building the generator interface. Used in `src/main.jsx` and `src/StringArtGenerator.jsx`.

**Testing:**
- Vitest 4.0.16 - Test runner compatible with Vite. Configured in `vite.config.js`.
- React Testing Library 16.3.1 - For testing React components. Used in `src/test/rendering.test.jsx`.
- Happy DOM / jsdom - Browser environment simulation for testing. Configured in `vite.config.js`.

**Build/Dev:**
- Vite 5.0.0 - Build tool and development server. Configured in `vite.config.js`.

## Key Dependencies

**Critical:**
- `react` 18.2.0 - Core framework.
- `react-dom` 18.2.0 - Rendering engine for web.

**Infrastructure:**
- `@vitejs/plugin-react` - Vite plugin for React support.
- `@testing-library/jest-dom` - Custom jest matchers for DOM testing.

## Configuration

**Environment:**
- No environment variables detected in the codebase.

**Build:**
- `vite.config.js` - Main configuration for Vite and Vitest.
- `package.json` - Defines scripts for `dev`, `build`, and `test`.

## Platform Requirements

**Development:**
- Node.js 20+
- npm (Node Package Manager)
- WSL support (optional but explicitly supported via `setup.sh`)

**Production:**
- Static web hosting (Vite build outputs to `dist/` as per `README.md`).

---

*Stack analysis: 2025-01-24*
