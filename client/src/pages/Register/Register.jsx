import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import '../Login/Login.css'
import './Register.css'

/* Password strength helper */
function getPasswordStrength(pwd) {
  if (!pwd) return null
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { level: 'weak',   label: 'Weak',   pct: '25%' }
  if (score === 2) return { level: 'fair',   label: 'Fair',   pct: '50%' }
  if (score === 3) return { level: 'good',   label: 'Good',   pct: '75%' }
  return            { level: 'strong', label: 'Strong', pct: '100%' }
}

function Register() {
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const strength = getPasswordStrength(form.password)

  // If already logged in, go to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => () => clearError(), [clearError])

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) {
      errors.name = 'Full name is required'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (error) clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    })
    setSubmitting(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-scale">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon" aria-hidden="true">✨</div>
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">
            Start planning accessible trips across India — completely free
          </p>
        </div>

        {/* Error */}
        {error && <ErrorMessage message={error} onDismiss={clearError} />}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="name"
            label="Full name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Rajan Sharma"
            error={fieldErrors.name}
            required
            autoComplete="name"
            autoFocus
          />

          <Input
            id="reg-email"
            label="Email address"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <div>
            <Input
              id="reg-password"
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              error={fieldErrors.password}
              required
              autoComplete="new-password"
              hint="Use uppercase, numbers, and symbols for a stronger password"
            />
            {/* Password strength bar */}
            {strength && (
              <div className="password-strength">
                <div className="password-strength__bar-track">
                  <div
                    className={`password-strength__bar-fill password-strength__bar-fill--${strength.level}`}
                    style={{ width: strength.pct }}
                    aria-label={`Password strength: ${strength.label}`}
                  />
                </div>
                <p className={`password-strength__label password-strength__label--${strength.level}`}>
                  {strength.label} password
                </p>
              </div>
            )}
          </div>

          <Input
            id="confirm-password"
            label="Confirm password"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            error={fieldErrors.confirmPassword}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitting || isLoading}
            id="register-submit-btn"
          >
            Create Account
          </Button>

          <p className="auth-terms">
            By creating an account you agree to our{' '}
            <Link to="/">Terms of Service</Link> and{' '}
            <Link to="/">Privacy Policy</Link>.
          </p>
        </form>

        {/* Footer */}
        <div className="auth-card__footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link" id="go-to-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
