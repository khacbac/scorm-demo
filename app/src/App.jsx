import { useEffect, useState } from 'react'
import './App.css'
import ScormIframe from './ScormIframe.jsx'
import { getScormApi } from './scormRuntime'

const DEFAULT_PACKAGE_ID = 'Quiz18092025'
const DEFAULT_LAUNCH_URL = '/scorm/res/index.html'

function App() {
  const [apiState, setApiState] = useState(null)

  useEffect(() => {
    const api = getScormApi()
    if (!api) return

    const update = () => {
      const snapshot = api.__getState()
      setApiState(snapshot)
    }

    // Initial snapshot
    update()

    // Poll occasionally so you can see changes while interacting
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleReset = () => {
    const api = getScormApi()
    if (api && api.__reset) {
      api.__reset()
      setApiState(api.__getState())
    }
    // Also clear persisted data for this package
    try {
      window.localStorage.removeItem(`scorm12_cmi_${DEFAULT_PACKAGE_ID}`)
    } catch {
      // ignore
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>SCORM Viewer MVP</h1>
          <p className="subtitle">
            Package: <code>{DEFAULT_PACKAGE_ID}</code> &mdash; Launch:{' '}
            <code>{DEFAULT_LAUNCH_URL}</code>
          </p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={handleReset}>
            Reset SCORM state
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="viewer-section">
          <ScormIframe launchUrl={DEFAULT_LAUNCH_URL} />
        </section>
        <section className="inspector-section">
          <h2>Runtime inspector</h2>
          {!apiState && <p>Waiting for SCORM API state...</p>}
          {apiState && (
            <>
              <div className="inspector-block">
                <h3>Session</h3>
                <p>
                  Status: <code>{apiState.status}</code>
                </p>
                <pre className="json-view">
                  {JSON.stringify(apiState.cmi, null, 2)}
                </pre>
              </div>

              <div className="inspector-block">
                <h3>Recent API calls</h3>
                {apiState.logs.length === 0 ? (
                  <p>No calls yet. Launch the SCO and interact with it.</p>
                ) : (
                  <ul className="log-list">
                    {apiState.logs
                      .slice()
                      .reverse()
                      .slice(0, 50)
                      .map((log, index) => (
                        <li key={index} className="log-item">
                          <div className="log-header">
                            <span className="log-method">{log.method}</span>
                            <span className="log-time">{log.time}</span>
                          </div>
                          <pre className="json-view small">
                            {JSON.stringify(
                              { args: log.args, result: log.result },
                              null,
                              2,
                            )}
                          </pre>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
