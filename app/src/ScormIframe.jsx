import './App.css'

function ScormIframe({ launchUrl }) {
  return (
    <div className="scorm-iframe-container">
      <iframe
        title="SCORM Player"
        src={launchUrl}
        className="scorm-iframe"
        frameBorder="0"
        width="100%"
        height="100%"
      />
    </div>
  )
}

export default ScormIframe

