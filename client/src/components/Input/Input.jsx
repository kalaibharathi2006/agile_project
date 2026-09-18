import './Input.css'

/**
 * Reusable Input / Textarea component
 * @param {string}  label      - visible label text
 * @param {string}  id         - unique input ID (for label association)
 * @param {string}  type       - input type (text, email, password, etc.)
 * @param {string}  error      - error message
 * @param {string}  hint       - helper text below input
 * @param {boolean} required
 * @param {boolean} multiline  - render <textarea> instead
 */
function Input({
  label,
  id,
  type = 'text',
  error,
  hint,
  required = false,
  multiline = false,
  className = '',
  ...props
}) {
  const Field = multiline ? 'textarea' : 'input'
  const ariaDescribedBy = [
    error ? `${id}-error` : null,
    hint  ? `${id}-hint`  : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
          {required && <span className="input-required" aria-label="required"> *</span>}
        </label>
      )}

      <Field
        id={id}
        type={multiline ? undefined : type}
        className={`input-field ${multiline ? 'input-field--textarea' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy || undefined}
        required={required}
        {...props}
      />

      {error && (
        <p id={`${id}-error`} className="input-error" role="alert">
          ⚠ {error}
        </p>
      )}

      {hint && !error && (
        <p id={`${id}-hint`} className="input-hint">
          {hint}
        </p>
      )}
    </div>
  )
}

export default Input
