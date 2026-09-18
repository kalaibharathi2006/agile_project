import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
} from '../../services/profileService'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import Loading from '../../components/Loading/Loading'
import './Profile.css'

/* ─────────────────── helpers ─────────────────── */
const SUCCESS_TIMEOUT = 3000

function SuccessBanner({ message }) {
  if (!message) return null
  return (
    <div className="profile__success" role="status" aria-live="polite">
      ✅ {message}
    </div>
  )
}

/* ══════════════════════════════════════════════
   PERSONAL INFO TAB
══════════════════════════════════════════════ */
function PersonalInfoTab() {
  const { user } = useAuth()

  const [form, setForm] = useState({ name: '', phone: '', dateOfBirth: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then((res) => {
        const d = res.data
        setForm({
          name: d.name || '',
          phone: d.phone || '',
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.substring(0, 10) : '',
        })
      })
      .catch(() => setApiError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (form.phone && !/^[+\d\s\-()]{7,15}$/.test(form.phone))
      e.phone = 'Enter a valid phone number'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setSaving(true)
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), SUCCESS_TIMEOUT)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Loading profile..." />

  return (
    <div className="profile__tab-content animate-fade-in">
      <div className="profile__avatar-section">
        <div className="profile__avatar-circle" aria-label={`Avatar for ${user?.name}`}>
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="profile__avatar-name">{user?.name}</p>
          <p className="profile__avatar-email">{user?.email}</p>
          <span className={`profile__role-badge profile__role-badge--${user?.role}`}>
            {user?.role === 'admin' ? '🔐 Admin' : '🌍 Traveler'}
          </span>
        </div>
      </div>

      <SuccessBanner message={success} />
      {apiError && <ErrorMessage message={apiError} onDismiss={() => setApiError('')} />}

      <form className="profile__form" onSubmit={handleSubmit} noValidate>
        <Input
          id="profile-name"
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
          autoComplete="name"
        />
        <Input
          id="profile-phone"
          label="Phone number"
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="+91 98765 43210"
          autoComplete="tel"
          hint="Optional — for trip coordination"
        />
        <Input
          id="profile-dob"
          label="Date of birth"
          type="date"
          name="dateOfBirth"
          value={form.dateOfBirth}
          onChange={handleChange}
          hint="Optional — helps personalise age-appropriate recommendations"
        />

        <div className="profile__read-only">
          <span className="profile__read-only-label">Email address</span>
          <span className="profile__read-only-value">{user?.email}</span>
          <span className="profile__read-only-note">Email cannot be changed</span>
        </div>

        <Button type="submit" variant="primary" size="lg" isLoading={saving} id="save-profile-btn">
          Save Personal Info
        </Button>
      </form>
    </div>
  )
}

/* ══════════════════════════════════════════════
   ACCESSIBILITY PREFERENCES TAB
══════════════════════════════════════════════ */
const DEFAULT_PREFS = {
  travelerType: 'solo',
  mobilityLevel: 'full',
  requiresWheelchair: false,
  requiresElevator: false,
  requiresAccessibleRestroom: false,
  requiresSeatingRest: false,
  hasChildren: false,
  hasElderly: false,
  hasCaregiver: false,
  walkingToleranceMeters: 2000,
  travelPace: 'moderate',
  restBreakIntervalMinutes: 90,
  restBreakDurationMinutes: 20,
  budgetLevel: 'mid-range',
}

function AccessibilityTab() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getPreferences()
      .then((res) => {
        const d = res.data
        setPrefs((prev) => ({ ...prev, ...d }))
      })
      .catch(() => setApiError('Failed to load preferences.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setPrefs((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updatePreferences(prefs)
      setSuccess('Accessibility preferences saved!')
      setTimeout(() => setSuccess(''), SUCCESS_TIMEOUT)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Loading preferences..." />

  return (
    <div className="profile__tab-content animate-fade-in">
      <SuccessBanner message={success} />
      {apiError && <ErrorMessage message={apiError} onDismiss={() => setApiError('')} />}

      <form className="profile__form" onSubmit={handleSubmit}>

        {/* ── Traveler Profile ── */}
        <fieldset className="profile__fieldset">
          <legend className="profile__legend">👤 Traveler Profile</legend>

          <div className="profile__field-group">
            <label className="profile__select-label" htmlFor="travelerType">Traveler type</label>
            <select
              id="travelerType"
              name="travelerType"
              className="profile__select"
              value={prefs.travelerType}
              onChange={handleChange}
            >
              <option value="solo">Solo traveler</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
              <option value="elderly">Elderly</option>
              <option value="group">Group</option>
            </select>
          </div>

          <div className="profile__checkbox-group">
            <CheckboxItem
              id="hasChildren"
              name="hasChildren"
              checked={prefs.hasChildren}
              onChange={handleChange}
              label="Traveling with children"
              icon="👶"
            />
            <CheckboxItem
              id="hasElderly"
              name="hasElderly"
              checked={prefs.hasElderly}
              onChange={handleChange}
              label="Traveling with elderly member"
              icon="👴"
            />
            <CheckboxItem
              id="hasCaregiver"
              name="hasCaregiver"
              checked={prefs.hasCaregiver}
              onChange={handleChange}
              label="Traveling with caregiver"
              icon="🤝"
            />
          </div>
        </fieldset>

        {/* ── Mobility & Accessibility ── */}
        <fieldset className="profile__fieldset">
          <legend className="profile__legend">♿ Mobility & Accessibility</legend>

          <div className="profile__field-group">
            <label className="profile__select-label" htmlFor="mobilityLevel">Mobility level</label>
            <select
              id="mobilityLevel"
              name="mobilityLevel"
              className="profile__select"
              value={prefs.mobilityLevel}
              onChange={handleChange}
            >
              <option value="full">Full mobility</option>
              <option value="limited">Limited mobility</option>
              <option value="wheelchair">Wheelchair user</option>
              <option value="assisted">Requires assistance</option>
            </select>
          </div>

          <div className="profile__checkbox-group">
            <CheckboxItem
              id="requiresWheelchair"
              name="requiresWheelchair"
              checked={prefs.requiresWheelchair}
              onChange={handleChange}
              label="Requires wheelchair access"
              icon="♿"
            />
            <CheckboxItem
              id="requiresElevator"
              name="requiresElevator"
              checked={prefs.requiresElevator}
              onChange={handleChange}
              label="Requires elevator / lift"
              icon="🛗"
            />
            <CheckboxItem
              id="requiresAccessibleRestroom"
              name="requiresAccessibleRestroom"
              checked={prefs.requiresAccessibleRestroom}
              onChange={handleChange}
              label="Requires accessible restroom"
              icon="🚻"
            />
            <CheckboxItem
              id="requiresSeatingRest"
              name="requiresSeatingRest"
              checked={prefs.requiresSeatingRest}
              onChange={handleChange}
              label="Requires regular seating & rest stops"
              icon="💺"
            />
          </div>
        </fieldset>

        {/* ── Walking & Pace ── */}
        <fieldset className="profile__fieldset">
          <legend className="profile__legend">🚶 Walking & Travel Pace</legend>

          <div className="profile__field-group">
            <label className="profile__select-label" htmlFor="travelPace">Travel pace</label>
            <select
              id="travelPace"
              name="travelPace"
              className="profile__select"
              value={prefs.travelPace}
              onChange={handleChange}
            >
              <option value="slow">Slow — lots of rest, short distances</option>
              <option value="moderate">Moderate — balanced pace</option>
              <option value="fast">Fast — more ground covered</option>
            </select>
          </div>

          <div className="profile__slider-group">
            <label className="profile__slider-label" htmlFor="walkingToleranceMeters">
              Max walking distance per day
              <span className="profile__slider-value">
                {prefs.walkingToleranceMeters >= 1000
                  ? `${(prefs.walkingToleranceMeters / 1000).toFixed(1)} km`
                  : `${prefs.walkingToleranceMeters} m`}
              </span>
            </label>
            <input
              id="walkingToleranceMeters"
              type="range"
              name="walkingToleranceMeters"
              className="profile__slider"
              min="500"
              max="15000"
              step="500"
              value={prefs.walkingToleranceMeters}
              onChange={handleChange}
              aria-valuetext={`${prefs.walkingToleranceMeters} meters`}
            />
            <div className="profile__slider-labels">
              <span>500 m</span>
              <span>15 km</span>
            </div>
          </div>
        </fieldset>

        {/* ── Rest Breaks ── */}
        <fieldset className="profile__fieldset">
          <legend className="profile__legend">⏱️ Rest Break Preferences</legend>

          <div className="profile__slider-group">
            <label className="profile__slider-label" htmlFor="restBreakIntervalMinutes">
              Rest break every
              <span className="profile__slider-value">{prefs.restBreakIntervalMinutes} min</span>
            </label>
            <input
              id="restBreakIntervalMinutes"
              type="range"
              name="restBreakIntervalMinutes"
              className="profile__slider"
              min="30"
              max="240"
              step="10"
              value={prefs.restBreakIntervalMinutes}
              onChange={handleChange}
              aria-valuetext={`${prefs.restBreakIntervalMinutes} minutes`}
            />
            <div className="profile__slider-labels">
              <span>30 min</span>
              <span>4 hrs</span>
            </div>
          </div>

          <div className="profile__slider-group">
            <label className="profile__slider-label" htmlFor="restBreakDurationMinutes">
              Each rest duration
              <span className="profile__slider-value">{prefs.restBreakDurationMinutes} min</span>
            </label>
            <input
              id="restBreakDurationMinutes"
              type="range"
              name="restBreakDurationMinutes"
              className="profile__slider"
              min="10"
              max="60"
              step="5"
              value={prefs.restBreakDurationMinutes}
              onChange={handleChange}
              aria-valuetext={`${prefs.restBreakDurationMinutes} minutes`}
            />
            <div className="profile__slider-labels">
              <span>10 min</span>
              <span>60 min</span>
            </div>
          </div>
        </fieldset>

        {/* ── Budget ── */}
        <fieldset className="profile__fieldset">
          <legend className="profile__legend">💰 Budget Preference</legend>
          <div className="profile__budget-options">
            {['budget', 'mid-range', 'luxury'].map((level) => (
              <label
                key={level}
                className={`profile__budget-card ${prefs.budgetLevel === level ? 'profile__budget-card--active' : ''}`}
                htmlFor={`budget-${level}`}
              >
                <input
                  id={`budget-${level}`}
                  type="radio"
                  name="budgetLevel"
                  value={level}
                  checked={prefs.budgetLevel === level}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="profile__budget-icon">
                  {level === 'budget' ? '💵' : level === 'mid-range' ? '💳' : '💎'}
                </span>
                <span className="profile__budget-label">
                  {level === 'budget' ? 'Budget' : level === 'mid-range' ? 'Mid-Range' : 'Luxury'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={saving}
          id="save-preferences-btn"
        >
          Save Accessibility Preferences
        </Button>
      </form>
    </div>
  )
}

/* ── Small reusable checkbox card ── */
function CheckboxItem({ id, name, checked, onChange, label, icon }) {
  return (
    <label className={`profile__checkbox-card ${checked ? 'profile__checkbox-card--checked' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="profile__checkbox-input"
      />
      <span className="profile__checkbox-icon" aria-hidden="true">{icon}</span>
      <span className="profile__checkbox-label">{label}</span>
      <span className="profile__checkbox-tick" aria-hidden="true">{checked ? '✓' : ''}</span>
    </label>
  )
}

/* ══════════════════════════════════════════════
   MAIN PROFILE PAGE
══════════════════════════════════════════════ */
const TABS = [
  { id: 'personal',       label: '👤 Personal Info' },
  { id: 'accessibility',  label: '♿ Accessibility' },
]

function Profile() {
  const [activeTab, setActiveTab] = useState('personal')

  return (
    <main className="profile-page">
      <div className="container">
        <div className="profile-page__header animate-fade-in">
          <h1 className="profile-page__title">My Profile</h1>
          <p className="profile-page__subtitle">
            Manage your personal information and accessibility preferences to get personalised trip recommendations.
          </p>
        </div>

        {/* Tab Nav */}
        <div className="profile__tabs" role="tablist" aria-label="Profile sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`profile__tab-btn ${activeTab === tab.id ? 'profile__tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="profile__panel" id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'personal'      && <PersonalInfoTab />}
          {activeTab === 'accessibility' && <AccessibilityTab />}
        </div>
      </div>
    </main>
  )
}

export default Profile
