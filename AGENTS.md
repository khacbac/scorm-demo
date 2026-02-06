# Repository Guidelines

## Project Structure & Module Organization
- `app/` is the React + Vite SCORM 1.2 web viewer. Source code lives in `app/src/`, static assets in `app/public/`, and SCORM packages should be unzipped under `app/public/scorm/` (e.g., `app/public/scorm/res/index.html`).
- `mobile/` is an Expo (React Native) app. Routes live in `mobile/app/`, SCORM runtime code in `mobile/scorm/`, shared UI in `mobile/components/`, and bundled SCORM assets in `mobile/assets/scorm/`.
- Example SCORM zip at repo root: `Quiz18092025_4.zip`.

## Build, Test, and Development Commands
Web app commands (run from `app/`).
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server.
- `npm run build` builds to `app/dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.

Mobile app commands (run from `mobile/`).
- `npm install` installs dependencies.
- `npm start` runs the Expo dev server.
- `npm run ios`, `npm run android`, `npm run web` launch platform targets.
- `npm run lint` runs Expo’s ESLint config.

## Coding Style & Naming Conventions
- Indentation: 2 spaces, LF line endings.
- Components use `PascalCase` (e.g., `ScormIframe.jsx`, `ScormViewer.tsx`). Hooks are prefixed with `use`.
- Prefer small, named functions for handlers (e.g., `handleReset`).
- Linting is enforced via ESLint (`app/eslint.config.js`, `mobile/eslint.config.js`).

## Testing Guidelines
- No automated tests are configured in either project. Validate changes manually by running the app and loading a SCORM package.
- If tests are added, keep them near source (`app/src/` or `mobile/`) and use `*.test.*` or `*.spec.*` naming.

## Commit & Pull Request Guidelines
- Git history is minimal and does not show a strict convention. Use short, imperative messages (e.g., `add scorm runtime` or `fix iframe sizing`).
- PRs should include a summary of changes and rationale.
- PRs should include local validation steps (commands, URLs, or devices).
- PRs should include screenshots or recordings for UI changes, including the runtime inspector or mobile WebView.

## Configuration & SCORM Notes
- Web runtime state is persisted in `localStorage` with keys like `scorm12_cmi_<PACKAGE_ID>` (see `app/src/scormRuntime.js`).
- Mobile runtime state persists via AsyncStorage with keys like `scorm12_cmi_{packageId}` (see `mobile/scorm/scormRuntime.ts`).
- Treat SCORM packages as trusted content; avoid loading remote packages without review.
