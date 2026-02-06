# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite web-based SCORM 1.2 viewer (MVP). It provides a minimal SCORM runtime with a trimmed-down data model and runtime inspection capabilities.

Part of a monorepo with a sibling `/mobile` Expo app that shares the same SCORM implementation pattern.

## Commands

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build to dist/
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture

### SCORM Runtime (`src/scormRuntime.js`)

Core SCORM 1.2 API exposed as `window.API`:
- `LMSInitialize`, `LMSFinish`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`
- `LMSGetLastError`, `LMSGetErrorString`, `LMSGetDiagnostic`
- `__getState()`, `__reset()` - Non-standard helpers for React UI

**Supported CMI elements:**
- `cmi.core.student_id`, `cmi.core.student_name`, `cmi.core.lesson_location`
- `cmi.core.lesson_status`, `cmi.core.score.raw`, `cmi.suspend_data`

**Storage:** localStorage with key `scorm12_cmi_<PACKAGE_ID>`

### App Flow

1. `App.jsx` mounts and calls `getScormApi()` to access runtime
2. Polls runtime state every 1000ms for inspector UI updates
3. SCORM content loads in iframe (`ScormIframe.jsx`)
4. Content's JavaScript calls `window.API` methods
5. Runtime logs calls and persists CMI on commit/finish

### SCORM Packages

- Served from `/public/scorm/` directory
- Default package: `Quiz18092025` with launch URL `/scorm/res/index.html`
- Example zip at repo root: `Quiz18092025_4.zip`

## Code Style

- JavaScript (JSX), not TypeScript
- ESLint 9 flat config format
- React 19 with Vite 7
