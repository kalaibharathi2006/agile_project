import { useState, useEffect } from 'react'
import Button from '../../components/Button/Button'
import './EditItemModal.css'

const ITEM_TYPES = [
  { value: 'attraction', label: '🏛️ Attraction' },
  { value: 'meal',       label: '🍽️ Meal Break' },
  { value: 'rest',       label: '💺 Rest Break' },
  { value: 'transport',  label: '🚌 Transportation' },
  { value: 'hotel',      label: '🏨 Hotel Stop' },
  { value: 'free',       label: '🌟 Free Time' },
]

const TRANSPORT_MODES = [
  { value: 'walk',  label: '🚶 Walk' },
  { value: 'taxi',  label: '🚕 Taxi / Cab' },
  { value: 'auto',  label: '🛺 Auto Rickshaw' },
  { value: 'bus',   label: '🚌 Accessible Bus' },
  { value: 'train', label: '🚆 Metro / Train' },
  { value: 'car',   label: '🚗 Car' },
  { value: 'none',  label: '— None' },
]

function EditItemModal({ isOpen, onClose, onSave, item, defaultDay = 1, totalDays = 1 }) {
  const isEditing = !!item

  const [form, setForm] = useState({
    dayNumber: defaultDay,
    title: '',
    type: 'rest',
    startTime: '10:00',
    endTime: '10:45',
    durationMinutes: 45,
    transportMode: 'walk',
    description: '',
    accessibilityNotes: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        dayNumber: item.dayNumber || defaultDay,
        title: item.title || '',
        type: item.type || 'rest',
        startTime: item.startTime || '10:00',
        endTime: item.endTime || '10:45',
        durationMinutes: item.durationMinutes || 45,
        transportMode: item.transportMode || 'walk',
        description: item.description || '',
        accessibilityNotes: item.accessibilityNotes || '',
      })
    } else {
      setForm({
        dayNumber: defaultDay,
        title: 'Rest & Refreshment Stop',
        type: 'rest',
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 30,
        transportMode: 'walk',
        description: 'Take a comfortable rest break and hydrate.',
        accessibilityNotes: 'Level access with seating and accessible restroom.',
      })
    }
  }, [item, defaultDay])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...form,
        dayNumber: Number(form.dayNumber),
        durationMinutes: Number(form.durationMinutes),
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save itinerary stop.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="eim-backdrop" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
      <div className="eim-modal">
        <div className="eim-header">
          <div>
            <h2 id="item-modal-title" className="eim-title">
              {isEditing ? '✏️ Modify Activity / Break' : '➕ Add Stop / Rest Break'}
            </h2>
            <p className="eim-sub">Customize timing, transportation mode, or rest interval.</p>
          </div>
          <button className="eim-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        {error && <div className="eim-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="eim-form">
          <div className="eim-row">
            <div className="eim-group">
              <label className="eim-label" htmlFor="eim-day">Day</label>
              <select
                id="eim-day"
                name="dayNumber"
                className="eim-select"
                value={form.dayNumber}
                onChange={handleChange}
              >
                {Array.from({ length: totalDays || 1 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
            </div>

            <div className="eim-group">
              <label className="eim-label" htmlFor="eim-type">Stop Type</label>
              <select
                id="eim-type"
                name="type"
                className="eim-select"
                value={form.type}
                onChange={handleChange}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="eim-group">
            <label className="eim-label" htmlFor="eim-title-input">Title</label>
            <input
              id="eim-title-input"
              name="title"
              type="text"
              className="eim-input"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="eim-row eim-row--3">
            <div className="eim-group">
              <label className="eim-label" htmlFor="eim-start">Start Time</label>
              <input
                id="eim-start"
                name="startTime"
                type="time"
                className="eim-input"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="eim-group">
              <label className="eim-label" htmlFor="eim-end">End Time</label>
              <input
                id="eim-end"
                name="endTime"
                type="time"
                className="eim-input"
                value={form.endTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="eim-group">
              <label className="eim-label" htmlFor="eim-duration">Duration (min)</label>
              <input
                id="eim-duration"
                name="durationMinutes"
                type="number"
                min="5"
                step="5"
                className="eim-input"
                value={form.durationMinutes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="eim-group">
            <label className="eim-label" htmlFor="eim-transport">Transportation Mode</label>
            <select
              id="eim-transport"
              name="transportMode"
              className="eim-select"
              value={form.transportMode}
              onChange={handleChange}
            >
              {TRANSPORT_MODES.map((tm) => (
                <option key={tm.value} value={tm.value}>{tm.label}</option>
              ))}
            </select>
          </div>

          <div className="eim-group">
            <label className="eim-label" htmlFor="eim-desc">Notes / Instructions</label>
            <textarea
              id="eim-desc"
              name="description"
              rows="2"
              className="eim-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="E.g., Seating available near entrance, wide doorway..."
            />
          </div>

          <div className="eim-footer">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add to Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditItemModal
