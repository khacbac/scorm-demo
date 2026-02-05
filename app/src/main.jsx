import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { attachScormApiToWindow } from './scormRuntime'

// Attach SCORM API as early as possible
attachScormApiToWindow()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
