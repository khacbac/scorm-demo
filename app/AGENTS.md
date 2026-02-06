# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + Vite app.
- Key modules: `src/App.jsx` (UI shell), `src/ScormIframe.jsx` (SCO host iframe), `src/scormRuntime.js` (SCORM 1.2 runtime), `src/main.jsx` (entry), and styles in `src/*.css`.
- Static assets live in `public/`. SCORM packages should be unzipped under `public/scorm/` (e.g., `public/scorm/res/index.html`).
- Build output is written to `dist/` (ignored by ESLint).

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server for local development.
- `npm run build` produces a production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint across the repository.

## Coding Style & Naming Conventions
- JavaScript/JSX uses 2-space indentation, single quotes, and no semicolons (match existing files).
- Components use `PascalCase` (e.g., `ScormIframe.jsx`).
- Constants use `SCREAMING_SNAKE_CASE` (e.g., `DEFAULT_PACKAGE_ID`).
- Prefer named functions and clear event handler names like `handleReset`.
- Linting: ESLint with React Hooks and React Refresh rules (`eslint.config.js`).

## Testing Guidelines
- No automated tests are configured yet. Validate changes manually by running `npm run dev` and loading a SCORM package under `public/scorm/`.
- If tests are added, place them under `src/` and name them `*.test.jsx` or `*.spec.jsx`.

## Commit & Pull Request Guidelines
- Current Git history does not show a strict commit convention. Use short, imperative messages (e.g., `add scorm parser` or `fix iframe sizing`).
- PRs should include:
  - A concise summary of the change and why it’s needed.
  - Steps to validate locally (commands and URLs).
  - Screenshots or screen recordings for UI changes, especially the runtime inspector.

## Configuration & SCORM Notes
- The default package and launch URL are set in `src/App.jsx` and should match the unzipped SCORM package path in `public/scorm/`.
- Runtime state is stored in memory and persisted to `localStorage` with the key `scorm12_cmi_<PACKAGE_ID>`.
