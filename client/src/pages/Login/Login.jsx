import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import './Login.css'

function Login() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  // Clear auth errors on unmount
  useEffect(() => () => clearError(), [clearError])

  const validate = () => {
    const errors = {}
    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
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
    const result = await login({ email: form.email.trim(), password: form.password })
    setSubmitting(false)

    if (result.success) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-scale">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon" aria-hidden="true">🔑</div>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Sign in to continue planning your accessible journey</p>
        </div>

        {/* Error */}
        {error && (
          <ErrorMessage message={error} onDismiss={clearError} />
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            label="Email address"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={fieldErrors.email}
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            id="password"
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={fieldErrors.password}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitting || isLoading}
            id="login-submit-btn"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="auth-card__footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link" id="go-to-register-link">
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="auth-demo" role="note">
          <p className="auth-demo__label">🔐 Demo Admin</p>
          <p className="auth-demo__cred">admin@inclusivetrip.com / Admin@12345</p>
        </div>
      </div>
    </div>
  )
}

export default Login
