import { useState } from 'react'
import Button from '../../components/Button/Button'
import './EditTripModal.css'

function EditTripModal({ trip, isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    title: trip?.title || '',
    startDate: trip?.startDate ? trip.startDate.split('T')[0] : '',
    endDate: trip?.endDate ? trip.endDate.split('T')[0] : '',
    numberOfTravelers: trip?.numberOfTravelers || 1,
    travelRequirements: {
      requiresWheelchair: trip?.travelRequirements?.requiresWheelchair ?? false,
      requiresElevator: trip?.travelRequirements?.requiresElevator ?? false,
      requiresAccessibleRestroom: trip?.travelRequirements?.requiresAccessibleRestroom ?? false,
      requiresSeatingRest: trip?.travelRequirements?.requiresSeatingRest ?? false,
      travelPace: trip?.travelRequirements?.travelPace || 'moderate',
      walkingToleranceMeters: trip?.travelRequirements?.walkingToleranceMeters || 2000,
      restBreakIntervalMinutes: trip?.travelRequirements?.restBreakIntervalMinutes || 90,
      restBreakDurationMinutes: trip?.travelRequirements?.restBreakDurationMinutes || 20,
    },
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleTextChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('req.')) {
      const key = name.replace('req.', '')
      setForm((prev) => ({
        ...prev,
        travelRequirements: {
          ...prev.travelRequirements,
          [key]: value,
        },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCheckboxChange = (key) => {
    setForm((prev) => ({
      ...prev,
      travelRequirements: {
        ...prev.travelRequirements,
        [key]: !prev.travelRequirements[key],
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update trip.')
    } finally {
      setSaving(false)
    }
  }

  const days = form.startDate && form.endDate
    ? Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1)
    : 0

  return (
    <div className="etm-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-trip-title">
      <div className="etm-modal">
        <div className="etm-header">
          <div>
            <h2 id="edit-trip-title" className="etm-title">✏️ Modify Trip Details</h2>
            <p className="etm-sub">Adjust dates, pacing, breaks, and accessibility requirements.</p>
          </div>
          <button className="etm-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        {error && <div className="etm-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="etm-form">
          <div className="etm-group">
            <label className="etm-label" htmlFor="etm-title-input">Trip Title</label>
            <input
              id="etm-title-input"
              name="title"
              type="text"
              className="etm-input"
              value={form.title}
              onChange={handleTextChange}
              required
            />
          </div>

          <div className="etm-row">
            <div className="etm-group">
              <label className="etm-label" htmlFor="etm-start-date">Start Date</label>
              <input
                id="etm-start-date"
                name="startDate"
                type="date"
                className="etm-input"
                value={form.startDate}
                onChange={handleTextChange}
                required
              />
            </div>
            <div className="etm-group">
              <label className="etm-label" htmlFor="etm-end-date">End Date</label>
              <input
                id="etm-end-date"
                name="endDate"
                type="date"
                className="etm-input"
                value={form.endDate}
                onChange={handleTextChange}
                required
              />
            </div>
          </div>

          {days > 0 && (
            <div className="etm-duration-badge">
              🗓️ Total Trip Duration: <strong>{days} Day{days !== 1 ? 's' : ''}</strong>
            </div>
          )}

          <div className="etm-row">
            <div className="etm-group">
              <label className="etm-label" htmlFor="etm-travelers">Travelers</label>
              <input
                id="etm-travelers"
                name="numberOfTravelers"
                type="number"
                min="1"
                className="etm-input"
                value={form.numberOfTravelers}
                onChange={handleTextChange}
                required
              />
            </div>
            <div className="etm-group">
              <label className="etm-label" htmlFor="etm-pace">Travel Pace</label>
              <select
                id="etm-pace"
                name="req.travelPace"
                className="etm-select"
                value={form.travelRequirements.travelPace}
                onChange={handleTextChange}
              >
                <option value="slow">Slow & Relaxed</option>
                <option value="moderate">Moderate</option>
                <option value="fast">Fast-paced</option>
              </select>
            </div>
          </div>

          <div className="etm-row">
            <div className="etm-group">
              <label className="etm-label" htmlFor="etm-break-interval">Rest Break Every (min)</label>
              <input
                id="etm-break-interval"
                name="req.restBreakIntervalMinutes"
                type="number"
                min="30"
                step="15"
                className="etm-input"
                value={form.travelRequirements.restBreakIntervalMinutes}
                onChange={handleTextChange}
              />
            </div>
            <div className="etm-group">
              <label className="etm-label" htmlFor="etm-break-duration">Rest Duration (min)</label>
              <input
                id="etm-break-duration"
                name="req.restBreakDurationMinutes"
                type="number"
                min="10"
                step="5"
                className="etm-input"
                value={form.travelRequirements.restBreakDurationMinutes}
                onChange={handleTextChange}
              />
            </div>
          </div>

          {/* Accessibility requirements */}
          <div className="etm-a11y-section">
            <h3 className="etm-a11y-title">♿ Accessibility Needs</h3>
            <div className="etm-checkbox-grid">
              {[
                { key: 'requiresWheelchair',        label: 'Wheelchair Access', icon: '♿' },
                { key: 'requiresElevator',          label: 'Elevator / Lift',   icon: '🛗' },
                { key: 'requiresAccessibleRestroom', label: 'Accessible Bath',   icon: '🚻' },
                { key: 'requiresSeatingRest',       label: 'Frequent Seating',  icon: '💺' },
              ].map((item) => (
                <label key={item.key} className={`etm-check-card ${form.travelRequirements[item.key] ? 'etm-check-card--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.travelRequirements[item.key]}
                    onChange={() => handleCheckboxChange(item.key)}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {form.travelRequirements[item.key] && <span className="etm-check-tick">✓</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="etm-footer">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating & Adapting…' : 'Save & Adapt Itinerary'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTripModal
