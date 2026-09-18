import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDestinations } from '../../services/destinationService'
import { getPreferences } from '../../services/profileService'
import { createTrip, generateItinerary } from '../../services/tripService'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import './CreateTrip.css'


/* ─── Step indicators ─── */
const STEPS = [
  { id: 1, label: 'Destination', icon: '🏛️' },
  { id: 2, label: 'Dates & Travelers', icon: '📅' },
  { id: 3, label: 'Accessibility', icon: '♿' },
  { id: 4, label: 'Review & Create', icon: '✅' },
]

function StepIndicator({ current }) {
  return (
    <nav className="ct-steps" aria-label="Trip creation steps">
      {STEPS.map((step, idx) => {
        const status = step.id < current ? 'done' : step.id === current ? 'active' : 'upcoming'
        return (
          <div key={step.id} className={`ct-step ct-step--${status}`}>
            <div className="ct-step__circle" aria-label={`Step ${step.id}: ${step.label} — ${status}`}>
              {status === 'done' ? '✓' : step.icon}
            </div>
            <span className="ct-step__label">{step.label}</span>
            {idx < STEPS.length - 1 && <div className={`ct-step__line ct-step__line--${status === 'done' ? 'done' : 'pending'}`} aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

/* ─── Step 1: Pick destination ─── */
function StepDestination({ value, onChange }) {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getDestinations({ limit: 50 })
      .then((r) => setDestinations(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = destinations.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.state.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="ct-step-content">
      <h2 className="ct-section-title">Where do you want to go?</h2>
      <p className="ct-section-sub">Select an accessible destination in India</p>

      <input
        type="search"
        className="ct-search"
        placeholder="🔍 Search destinations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search destinations"
      />

      {loading ? <Loading message="Loading destinations..." /> : (
        <div className="ct-dest-grid" role="listbox" aria-label="Destinations">
          {filtered.map((dest) => (
            <button
              key={dest._id}
              role="option"
              aria-selected={value === dest._id}
              className={`ct-dest-card ${value === dest._id ? 'ct-dest-card--selected' : ''}`}
              onClick={() => onChange(dest._id, dest)}
              id={`dest-option-${dest._id}`}
            >
              <span className="ct-dest-emoji" aria-hidden="true">{getEmoji(dest.name)}</span>
              <div className="ct-dest-info">
                <p className="ct-dest-name">{dest.name}</p>
                <p className="ct-dest-state">📍 {dest.state}</p>
                {dest.wheelchairFriendly && (
                  <span className="ct-dest-wc" aria-label="Wheelchair friendly">♿ Accessible</span>
                )}
              </div>
              {value === dest._id && <span className="ct-dest-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Step 2: Dates & Travelers ─── */
function StepDates({ form, onChange, errors }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="ct-step-content">
      <h2 className="ct-section-title">When are you traveling?</h2>
      <p className="ct-section-sub">Set your travel dates and group size</p>

      <div className="ct-form-grid">
        <Input
          id="trip-title"
          label="Trip name"
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="e.g. Chennai Heritage Tour"
          error={errors.title}
          required
          hint="Give your trip a memorable name"
        />

        <Input
          id="trip-start-date"
          label="Start date"
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={onChange}
          error={errors.startDate}
          required
          min={today}
        />

        <Input
          id="trip-end-date"
          label="End date"
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={onChange}
          error={errors.endDate}
          required
          min={form.startDate || today}
        />

        <div className="ct-field-group">
          <label className="ct-label" htmlFor="num-travelers">
            Number of travelers <span className="ct-required" aria-hidden="true">*</span>
          </label>
          <div className="ct-number-input">
            <button
              type="button"
              className="ct-num-btn"
              onClick={() => onChange({ target: { name: 'numberOfTravelers', value: Math.max(1, form.numberOfTravelers - 1) } })}
              aria-label="Decrease travelers"
              disabled={form.numberOfTravelers <= 1}
            >−</button>
            <input
              id="num-travelers"
              type="number"
              name="numberOfTravelers"
              value={form.numberOfTravelers}
              onChange={onChange}
              min="1"
              max="20"
              className="ct-num-field"
              aria-label="Number of travelers"
            />
            <button
              type="button"
              className="ct-num-btn"
              onClick={() => onChange({ target: { name: 'numberOfTravelers', value: Math.min(20, form.numberOfTravelers + 1) } })}
              aria-label="Increase travelers"
            >+</button>
          </div>
          {errors.numberOfTravelers && <p className="ct-field-error">{errors.numberOfTravelers}</p>}
        </div>
      </div>

      {form.startDate && form.endDate && form.startDate <= form.endDate && (
        <div className="ct-trip-duration">
          <span>📅</span>
          <strong>
            {Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1)} day trip
          </strong>
          <span>· {form.numberOfTravelers} traveler{form.numberOfTravelers > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Step 3: Accessibility requirements ─── */
function StepAccessibility({ form, onChange }) {
  return (
    <div className="ct-step-content">
      <h2 className="ct-section-title">Accessibility Requirements</h2>
      <p className="ct-section-sub">We'll use these to filter attractions and plan rest breaks</p>

      <div className="ct-a11y-grid">
        {/* Mobility */}
        <fieldset className="ct-fieldset">
          <legend className="ct-legend">♿ Mobility</legend>

          <div className="ct-field-group">
            <label className="ct-label" htmlFor="mobility-level">Mobility level</label>
            <select id="mobility-level" name="travelRequirements.mobilityLevel" className="ct-select" value={form.travelRequirements.mobilityLevel} onChange={onChange}>
              <option value="full">Full mobility</option>
              <option value="limited">Limited mobility</option>
              <option value="wheelchair">Wheelchair user</option>
              <option value="assisted">Requires assistance</option>
            </select>
          </div>

          <div className="ct-field-group">
            <label className="ct-label" htmlFor="travel-pace">Travel pace</label>
            <select id="travel-pace" name="travelRequirements.travelPace" className="ct-select" value={form.travelRequirements.travelPace} onChange={onChange}>
              <option value="slow">Slow — lots of rest</option>
              <option value="moderate">Moderate</option>
              <option value="fast">Fast — more coverage</option>
            </select>
          </div>

          <div className="ct-checkboxes">
            {[
              { name: 'travelRequirements.requiresWheelchair',        icon: '♿', label: 'Requires wheelchair access' },
              { name: 'travelRequirements.requiresElevator',          icon: '🛗', label: 'Requires elevator / lift' },
              { name: 'travelRequirements.requiresAccessibleRestroom', icon: '🚻', label: 'Requires accessible restroom' },
              { name: 'travelRequirements.requiresSeatingRest',       icon: '💺', label: 'Requires regular seating' },
            ].map((item) => (
              <label key={item.name} className={`ct-check-card ${getNestedValue(form, item.name) ? 'ct-check-card--on' : ''}`}>
                <input
                  type="checkbox"
                  name={item.name}
                  checked={getNestedValue(form, item.name)}
                  onChange={onChange}
                  className="sr-only"
                />
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {getNestedValue(form, item.name) && <span className="ct-check-tick" aria-hidden="true">✓</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Walking & Rest */}
        <fieldset className="ct-fieldset">
          <legend className="ct-legend">🚶 Walking & Rest</legend>

          <div className="ct-slider-group">
            <label className="ct-slider-label" htmlFor="walking-tolerance">
              Max walking distance / day
              <span className="ct-slider-value">
                {form.travelRequirements.walkingToleranceMeters >= 1000
                  ? `${(form.travelRequirements.walkingToleranceMeters / 1000).toFixed(1)} km`
                  : `${form.travelRequirements.walkingToleranceMeters} m`}
              </span>
            </label>
            <input
              id="walking-tolerance"
              type="range"
              name="travelRequirements.walkingToleranceMeters"
              className="ct-slider"
              min="500" max="15000" step="500"
              value={form.travelRequirements.walkingToleranceMeters}
              onChange={onChange}
            />
            <div className="ct-slider-ends"><span>500 m</span><span>15 km</span></div>
          </div>

          <div className="ct-slider-group">
            <label className="ct-slider-label" htmlFor="rest-interval">
              Rest break every
              <span className="ct-slider-value">{form.travelRequirements.restBreakIntervalMinutes} min</span>
            </label>
            <input
              id="rest-interval"
              type="range"
              name="travelRequirements.restBreakIntervalMinutes"
              className="ct-slider"
              min="30" max="240" step="10"
              value={form.travelRequirements.restBreakIntervalMinutes}
              onChange={onChange}
            />
            <div className="ct-slider-ends"><span>30 min</span><span>4 hrs</span></div>
          </div>

          <div className="ct-slider-group">
            <label className="ct-slider-label" htmlFor="rest-duration">
              Rest break duration
              <span className="ct-slider-value">{form.travelRequirements.restBreakDurationMinutes} min</span>
            </label>
            <input
              id="rest-duration"
              type="range"
              name="travelRequirements.restBreakDurationMinutes"
              className="ct-slider"
              min="10" max="60" step="5"
              value={form.travelRequirements.restBreakDurationMinutes}
              onChange={onChange}
            />
            <div className="ct-slider-ends"><span>10 min</span><span>60 min</span></div>
          </div>
        </fieldset>

        {/* Companion */}
        <fieldset className="ct-fieldset">
          <legend className="ct-legend">👥 Travelers</legend>
          <div className="ct-field-group">
            <label className="ct-label" htmlFor="traveler-type">Group type</label>
            <select id="traveler-type" name="travelRequirements.travelerType" className="ct-select" value={form.travelRequirements.travelerType} onChange={onChange}>
              <option value="solo">Solo</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
              <option value="elderly">Elderly</option>
              <option value="group">Group</option>
            </select>
          </div>
          <div className="ct-checkboxes">
            {[
              { name: 'travelRequirements.hasChildren', icon: '👶', label: 'Includes children' },
              { name: 'travelRequirements.hasElderly',  icon: '👴', label: 'Includes elderly' },
            ].map((item) => (
              <label key={item.name} className={`ct-check-card ${getNestedValue(form, item.name) ? 'ct-check-card--on' : ''}`}>
                <input type="checkbox" name={item.name} checked={getNestedValue(form, item.name)} onChange={onChange} className="sr-only" />
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {getNestedValue(form, item.name) && <span className="ct-check-tick" aria-hidden="true">✓</span>}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}

/* ─── Step 4: Review & Create ─── */
function StepReview({ form, destObj }) {
  const days = form.startDate && form.endDate
    ? Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1)
    : 0

  return (
    <div className="ct-step-content">
      <h2 className="ct-section-title">Review your trip</h2>
      <p className="ct-section-sub">Confirm details and generate your personalized itinerary</p>

      <div className="ct-review-cards">
        <div className="ct-review-card">
          <h3 className="ct-review-section">🏛️ Destination</h3>
          <p className="ct-review-value">{destObj?.name || '—'}</p>
          <p className="ct-review-meta">📍 {destObj?.state}, India</p>
        </div>

        <div className="ct-review-card">
          <h3 className="ct-review-section">📋 Trip Details</h3>
          <p className="ct-review-value">{form.title || '—'}</p>
          <p className="ct-review-meta">
            📅 {form.startDate} → {form.endDate} ({days} days)<br />
            👥 {form.numberOfTravelers} traveler{form.numberOfTravelers > 1 ? 's' : ''}
          </p>
        </div>

        <div className="ct-review-card">
          <h3 className="ct-review-section">♿ Accessibility</h3>
          <div className="ct-review-a11y">
            <p>Pace: <strong>{form.travelRequirements.travelPace}</strong></p>
            <p>Mobility: <strong>{form.travelRequirements.mobilityLevel}</strong></p>
            <p>Max walk: <strong>{form.travelRequirements.walkingToleranceMeters}m/day</strong></p>
            {form.travelRequirements.requiresWheelchair && <span className="ct-req-badge">♿ Wheelchair</span>}
            {form.travelRequirements.requiresElevator    && <span className="ct-req-badge">🛗 Elevator</span>}
            {form.travelRequirements.requiresAccessibleRestroom && <span className="ct-req-badge">🚻 Restroom</span>}
            {form.travelRequirements.requiresSeatingRest && <span className="ct-req-badge">💺 Seating</span>}
          </div>
        </div>
      </div>

      <div className="ct-review-note" role="note">
        <span aria-hidden="true">🤖</span>
        <p>After saving, we'll automatically generate a personalized day-wise itinerary based on your accessibility requirements — including meal breaks, rest stops, and wheelchair-friendly attractions.</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN CREATE TRIP WIZARD
══════════════════════════════════════════ */
const DEFAULT_FORM = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  numberOfTravelers: 1,
  travelRequirements: {
    requiresWheelchair: false,
    requiresElevator: false,
    requiresAccessibleRestroom: false,
    requiresSeatingRest: false,
    mobilityLevel: 'full',
    walkingToleranceMeters: 2000,
    travelPace: 'moderate',
    restBreakIntervalMinutes: 90,
    restBreakDurationMinutes: 20,
    travelerType: 'solo',
    hasChildren: false,
    hasElderly: false,
  },
}

function CreateTrip() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [destObj, setDestObj] = useState(null)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [apiError, setApiError] = useState('')

  // Pre-fill from saved preferences
  useEffect(() => {
    getPreferences()
      .then((res) => {
        const p = res.data
        setForm((prev) => ({
          ...prev,
          travelRequirements: {
            ...prev.travelRequirements,
            requiresWheelchair:        p.requiresWheelchair        ?? false,
            requiresElevator:          p.requiresElevator          ?? false,
            requiresAccessibleRestroom: p.requiresAccessibleRestroom ?? false,
            requiresSeatingRest:       p.requiresSeatingRest       ?? false,
            mobilityLevel:             p.mobilityLevel             || 'full',
            walkingToleranceMeters:    p.walkingToleranceMeters    || 2000,
            travelPace:                p.travelPace                || 'moderate',
            restBreakIntervalMinutes:  p.restBreakIntervalMinutes  || 90,
            restBreakDurationMinutes:  p.restBreakDurationMinutes  || 20,
            travelerType:              p.travelerType              || 'solo',
            hasChildren:               p.hasChildren               ?? false,
            hasElderly:                p.hasElderly                ?? false,
          },
        }))
      })
      .catch(() => {}) // graceful — preferences are optional
  }, [])

  // Generic change handler — supports nested keys like "travelRequirements.mobilityLevel"
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value

    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setForm((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: val },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: val }))
    }
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const validateStep = () => {
    const e = {}
    if (step === 1 && !form.destination) e.destination = 'Please select a destination'
    if (step === 2) {
      if (!form.title.trim())   e.title     = 'Trip name is required'
      if (!form.startDate)      e.startDate = 'Start date is required'
      if (!form.endDate)        e.endDate   = 'End date is required'
      if (form.startDate && form.endDate && form.endDate < form.startDate)
        e.endDate = 'End date must be after start date'
      if (!form.numberOfTravelers || form.numberOfTravelers < 1)
        e.numberOfTravelers = 'At least 1 traveler required'
    }
    return e
  }

  const next = () => {
    const e = validateStep()
    if (Object.keys(e).length) { setErrors(e); return }
    setStep((s) => Math.min(s + 1, 4))
  }

  const back = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setSaving(true)
    setApiError('')
    try {
      // 1. Create trip
      const res = await createTrip(form)
      const tripId = res.data._id

      // 2. Auto-generate itinerary
      await generateItinerary(tripId)

      // 3. Navigate to trip detail
      navigate(`/trips/${tripId}`)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create trip. Please try again.')
      setSaving(false)
    }
  }

  return (
    <main className="create-trip-page">
      <div className="container">
        <div className="ct-header animate-fade-in">
          <h1 className="ct-title">Plan Your Accessible Trip</h1>
          <p className="ct-subtitle">We'll build a personalized, accessible day-by-day itinerary for you</p>
        </div>

        <StepIndicator current={step} />

        <div className="ct-card animate-fade-in">
          {errors.destination && step === 1 && (
            <p className="ct-field-error ct-field-error--top" role="alert">{errors.destination}</p>
          )}
          {apiError && <ErrorMessage message={apiError} onDismiss={() => setApiError('')} />}

          {step === 1 && (
            <StepDestination
              value={form.destination}
              onChange={(id, obj) => { setForm((p) => ({ ...p, destination: id })); setDestObj(obj); setErrors({}) }}
            />
          )}
          {step === 2 && <StepDates form={form} onChange={handleChange} errors={errors} />}
          {step === 3 && <StepAccessibility form={form} onChange={handleChange} />}
          {step === 4 && <StepReview form={form} destObj={destObj} />}

          {/* Navigation */}
          <div className="ct-nav">
            {step > 1 && (
              <Button variant="ghost" size="lg" onClick={back} id="ct-back-btn">
                ← Back
              </Button>
            )}
            <div className="ct-nav-right">
              {step < 4 ? (
                <Button variant="primary" size="lg" onClick={next} id="ct-next-btn">
                  Next →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  isLoading={saving}
                  id="ct-create-btn"
                >
                  🗺️ Create Trip & Generate Itinerary
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* helpers */
function getEmoji(name) {
  const m = { chennai:'🌊',ooty:'🌿',madurai:'🕌',thanjavur:'🏯',coimbatore:'🏭',tiruchirappalli:'🏛️',bengaluru:'🌆',kochi:'🌴',mysuru:'🏰',jaipur:'🎪',goa:'🏖️' }
  return m[name?.toLowerCase()] || '🗺️'
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj)
}

export default CreateTrip
