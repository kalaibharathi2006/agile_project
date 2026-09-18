import './Button.css'

/**
 * Reusable Button component
 * @param {string}  variant  - 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * @param {string}  size     - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth
 * @param {boolean} isLoading
 * @param {string}  type     - button type
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? 'btn--full' : '',
        isLoading ? 'btn--loading' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="btn__spinner" aria-hidden="true" />
      )}
      <span className={isLoading ? 'btn__text--loading' : ''}>
        {children}
      </span>
    </button>
  )
}

export default Button
