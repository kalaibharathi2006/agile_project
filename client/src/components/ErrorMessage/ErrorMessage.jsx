import './ErrorMessage.css'

/**
 * Displays an error alert
 * @param {string} message  - error text
 * @param {function} onDismiss - optional dismiss callback
 */
function ErrorMessage({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <span className="error-message__icon" aria-hidden="true">⚠</span>
      <p className="error-message__text">{message}</p>
      {onDismiss && (
        <button
          className="error-message__close"
          onClick={onDismiss}
          aria-label="Dismiss error"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
