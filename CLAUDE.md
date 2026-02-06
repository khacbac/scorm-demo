# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SCORM 1.2 demo workspace containing two projects that share a common architecture for rendering and managing SCORM learning content:

- **app/** - React + Vite web-based SCORM viewer with runtime inspector UI
- **mobile/** - Expo (React Native) app that plays SCORM content in a WebView

Both implementations expose a `window.API` SCORM 1.2 runtime with identical CMI data model support.

## Quick Commands

### Web App (from `app/`)
```bash
npm run dev      # Vite dev server at localhost:5173
npm run build    # Production build
npm run lint     # ESLint
```

### Mobile App (from `mobile/`)
```bash
npm start        # Expo dev server
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run lint     # ESLint
```

## Architecture

### Shared SCORM 1.2 Data Model

Both projects implement the same subset of SCORM 1.2 CMI elements:
- `cmi.core.student_id`, `cmi.core.student_name`, `cmi.core.lesson_location`
- `cmi.core.lesson_status`, `cmi.core.score.raw`, `cmi.suspend_data`

Storage key format: `scorm12_cmi_{packageId}` (localStorage for web, AsyncStorage for mobile)

### Key Difference: Runtime Injection

**Web (`app/src/scormRuntime.js`)**: Attaches `window.API` directly; SCORM content in iframe accesses parent's API.

**Mobile (`mobile/scorm/scormRuntime.ts`)**: Generates JavaScript string via `createInjectedScormRuntime()` that is injected into WebView. Uses `ReactNativeWebView.postMessage()` bridge to communicate state changes back to React Native.

### SCORM Package Location

- **Web**: Unzipped packages go in `app/public/scorm/`
- **Mobile**: Asset files registered in `mobile/scorm/scormAssets.ts`, stored in `mobile/assets/scorm/`
- Example zip at repo root: `Quiz18092025_4.zip`

## Code Style

- 2-space indentation, LF line endings
- Web app: JavaScript (JSX)
- Mobile app: TypeScript
- Component names: PascalCase; hook names: use-prefixed camelCase
- No automated tests configured; validate manually by loading SCORM packages
