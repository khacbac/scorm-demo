# SCORM Demo Workspace

This repository contains a small demo workspace with two projects:

- `app/`: A React + Vite **SCORM 1.2 viewer MVP** that serves SCORM packages, exposes a minimal `window.API` runtime, and includes a runtime inspector UI.
- `mobile/`: An **Expo (React Native)** app scaffold created via `create-expo-app` for mobile experimentation.

## Quick start

### Web viewer

```bash
cd app
npm install
npm run dev
```

### Mobile app

```bash
cd mobile
npm install
npx expo start
```

## SCORM package notes

- Example SCORM zip at repository root: `Quiz18092025_4.zip`
- Unzipped content should live under `app/public/scorm/`

For detailed SCORM runtime behavior and configuration, see `app/README.md`.
