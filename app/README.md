## SCORM Viewer MVP (React + Vite)

This app is a **minimal SCORM 1.2 viewer** built with React and Vite. It is designed to help you **understand how SCORM works** by:

- Serving a SCORM package statically from the `public` folder.
- Exposing a small SCORM 1.2 runtime API on `window.API`.
- Showing a **runtime inspector** with the current `cmi` data and a log of SCORM API calls.

### 1. Getting started

```bash
cd app
npm install
npm run dev
```

Then open the printed URL (usually `http://localhost:5173`) in your browser.

### 2. Where to put SCORM packages

- SCORM packages should be unzipped under `public/scorm/`.
- In this MVP, the example package is:
  - Zip: `Quiz18092025_4.zip` (at the workspace root)
  - Unpacked to: `public/scorm/`
  - Launch file (from `imsmanifest.xml`): `public/scorm/res/index.html`

If you want to try another SCORM 1.2 package:

- Unzip it into a new folder under `public/scorm/your-package/`.
- Update the `DEFAULT_PACKAGE_ID` and `DEFAULT_LAUNCH_URL` constants in `src/App.jsx` and `attachScormApiToWindow` call in `src/scormRuntime.js` to point to your package and launch HTML.

### 3. What SCORM pieces are implemented

The app exposes a **small SCORM 1.2 runtime** attached to `window.API` with these core methods:

- `LMSInitialize("")`
- `LMSFinish("")`
- `LMSGetValue(element)`
- `LMSSetValue(element, value)`
- `LMSCommit("")`
- `LMSGetLastError()`
- `LMSGetErrorString(errorCode)`
- `LMSGetDiagnostic(errorCode)`

The runtime supports a trimmed-down SCORM 1.2 data model:

- `cmi.core.student_id`
- `cmi.core.student_name`
- `cmi.core.lesson_location`
- `cmi.core.lesson_status`
- `cmi.core.score.raw`
- `cmi.suspend_data`

Anything outside these paths will return **“element not implemented”**.

State is kept **in memory** and also saved to `localStorage` under the key:

```text
scorm12_cmi_<PACKAGE_ID>
```

where `<PACKAGE_ID>` defaults to `Quiz18092025`.

### 4. Runtime inspector

The right-hand panel in the UI shows:

- **Session status** (`status` field in the runtime).
- The current **`cmi` object** (pretty-printed JSON).
- A list of recent **SCORM API calls** (method name, arguments, timestamp).

This lets you see exactly what the SCO is doing: which values it reads/writes, when it initializes/finishes, and when it commits.

You can also click **“Reset SCORM state”** to:

- Clear in-memory state.
- Clear the persisted `localStorage` entry for the current package.

### 5. SCORM 2004

For simplicity, this MVP does **not** implement SCORM 2004. A stub `window.API_1484_11` is provided that always returns “not implemented”. You can extend this later by:

- Adding the SCORM 2004 methods (`Initialize`, `Terminate`, `GetValue`, etc.).
- Mapping them to a 2004 data model similar to the 1.2 implementation used here.

### 6. Next steps / ideas

- Parse `imsmanifest.xml` dynamically to compute the launch URL instead of hard-coding it.
- Support multiple SCORM packages and allow selecting them from the UI.
- Add charts or summaries on top of the `cmi` data for deeper analysis.
- Swap `localStorage` for a backend service if you need shared progress between users.

