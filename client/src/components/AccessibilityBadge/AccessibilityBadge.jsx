import './AccessibilityBadge.css'

/**
 * Accessibility feature badge
 * @param {boolean} available  - whether feature is available
 * @param {string}  label      - text label
 * @param {string}  icon       - emoji icon
 * @param {string}  size       - 'sm' | 'md'
 */
function AccessibilityBadge({ available, label, icon, size = 'sm' }) {
  return (
    <span
      className={`a11y-badge a11y-badge--${available ? 'yes' : 'no'} a11y-badge--${size}`}
      title={`${label}: ${available ? 'Available' : 'Not available'}`}
      aria-label={`${label} ${available ? 'available' : 'not available'}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}

/**
 * Score pill (0–10 or 0–5 scale)
 * @param {number} score  - numeric score
 * @param {number} max    - max possible (default 10)
 * @param {string} label  - e.g. "Accessibility"
 */
export function ScorePill({ score, max = 10, label }) {
  const pct = Math.round((score / max) * 100)
  const level = pct >= 75 ? 'high' : pct >= 45 ? 'medium' : 'low'
  return (
    <span
      className={`score-pill score-pill--${level}`}
      aria-label={`${label}: ${score} out of ${max}`}
    >
      {label} {score}/{max}
    </span>
  )
}

/**
 * Row of accessibility feature badges
 */
export function AccessibilityFeatures({ accessibility, size = 'sm' }) {
  const FEATURES = [
    { key: 'wheelchairAccessible', icon: '♿', label: 'Wheelchair' },
    { key: 'elevatorAvailable',    icon: '🛗', label: 'Elevator'   },
    { key: 'accessibleRestroom',   icon: '🚻', label: 'Restroom'   },
    { key: 'seatingAvailable',     icon: '💺', label: 'Seating'    },
    { key: 'parkingAvailable',     icon: '🅿️', label: 'Parking'    },
    { key: 'guidedToursAvailable', icon: '🎧', label: 'Tours'      },
  ]
  return (
    <div className="a11y-features" role="list" aria-label="Accessibility features">
      {FEATURES.map((f) => (
        <AccessibilityBadge
          key={f.key}
          available={!!accessibility?.[f.key]}
          icon={f.icon}
          label={f.label}
          size={size}
        />
      ))}
    </div>
  )
}

export default AccessibilityBadge
