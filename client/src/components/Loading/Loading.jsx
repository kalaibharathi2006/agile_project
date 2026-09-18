import './Loading.css'

/**
 * Full-page loading spinner
 * @param {string} message - optional loading message
 * @param {boolean} fullPage - true for full viewport height
 */
function Loading({ message = 'Loading...', fullPage = false }) {
  return (
    <div
      className={`loading ${fullPage ? 'loading--fullpage' : ''}`}
      role="status"
      aria-label={message}
    >
      <div className="loading__spinner" aria-hidden="true" />
      <p className="loading__text">{message}</p>
    </div>
  )
}

export default Loading
