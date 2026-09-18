import { computeAttractionScores, getScoreLevel, getDestinationGrade, DIFFICULTY_META, SCORE_COLORS } from '../../utils/accessibilityUtils'
import './AccessibilityScoreCard.css'

/* ─── Score bar row ─── */
function ScoreBar({ label, score, max = 10, icon }) {
  const pct    = Math.round((score / max) * 100)
  const meta   = getScoreLevel(score, max)
  const colors = SCORE_COLORS[meta.color] || SCORE_COLORS.blue

  return (
    <div className="asc-bar" role="group" aria-label={`${label}: ${score} out of ${max}`}>
      <div className="asc-bar__header">
        <span className="asc-bar__icon" aria-hidden="true">{icon}</span>
        <span className="asc-bar__label">{label}</span>
        <span className="asc-bar__score" style={{ color: colors.text }}>
          {score}/{max}
        </span>
      </div>
      <div className="asc-bar__track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={max}>
        <div
          className="asc-bar__fill"
          style={{ width: `${pct}%`, background: colors.text }}
        />
      </div>
      <p className="asc-bar__level" style={{ color: colors.text }}>{meta.label}</p>
    </div>
  )
}

/* ─── Feature check list ─── */
function FeatureCheck({ available, label, icon }) {
  return (
    <div
      className={`asc-feature ${available ? 'asc-feature--yes' : 'asc-feature--no'}`}
      aria-label={`${label}: ${available ? 'Available' : 'Not available'}`}
    >
      <span className="asc-feature__status" aria-hidden="true">
        {available ? '✓' : '✕'}
      </span>
      <span className="asc-feature__icon" aria-hidden="true">{icon}</span>
      <span className="asc-feature__label">{label}</span>
    </div>
  )
}

/* ══════════════════════════════════════════
   ATTRACTION ACCESSIBILITY SCORE CARD
   Shows: overall score, 4 sub-scores, feature checklist, difficulty badge
══════════════════════════════════════════ */
export function AttractionScoreCard({ accessibility = {} }) {
  const scores = computeAttractionScores(accessibility)
  const overall = getScoreLevel(scores.overallScore)
  const colors  = SCORE_COLORS[overall.color] || SCORE_COLORS.blue
  const diff    = DIFFICULTY_META[accessibility.walkingDifficulty || 'moderate']

  return (
    <div className="asc-card" aria-labelledby="asc-title">
      <h2 id="asc-title" className="asc-card__title">♿ Accessibility Score</h2>

      {/* Overall score ring */}
      <div className="asc-overall" style={{ borderColor: colors.text, background: colors.bg }}>
        <span className="asc-overall__score" style={{ color: colors.text }}>
          {scores.overallScore}
        </span>
        <span className="asc-overall__max">/10</span>
        <p className="asc-overall__label" style={{ color: colors.text }}>{overall.label}</p>
      </div>

      {/* Walking difficulty */}
      <div className={`asc-difficulty asc-difficulty--${diff.color}`} role="note">
        <span aria-hidden="true">{diff.icon}</span>
        <div>
          <p className="asc-difficulty__label">Walking Difficulty</p>
          <p className="asc-difficulty__value">{diff.label}</p>
          <p className="asc-difficulty__desc">{diff.desc}</p>
        </div>
      </div>

      {/* Sub-score bars */}
      <div className="asc-bars">
        <ScoreBar label="Mobility Access"   score={scores.mobilityScore} icon="♿" />
        <ScoreBar label="Comfort & Rest"    score={scores.comfortScore}  icon="💺" />
        <ScoreBar label="Route Difficulty"  score={scores.routeScore}    icon="🛤️" />
        <ScoreBar label="Sensory Access"    score={scores.sensoryScore}  icon="🎧" />
      </div>

      {/* Feature checklist */}
      <div className="asc-features" role="list" aria-label="Accessibility facilities">
        <h3 className="asc-features__title">Facilities</h3>
        <div className="asc-features__grid">
          <FeatureCheck available={accessibility.wheelchairAccessible} label="Wheelchair Access"  icon="♿" />
          <FeatureCheck available={accessibility.elevatorAvailable}    label="Elevator / Lift"    icon="🛗" />
          <FeatureCheck available={accessibility.accessibleRestroom}   label="Accessible Restroom" icon="🚻" />
          <FeatureCheck available={accessibility.seatingAvailable}     label="Seating Areas"      icon="💺" />
          <FeatureCheck available={accessibility.parkingAvailable}     label="Accessible Parking" icon="🅿️" />
          <FeatureCheck available={accessibility.guidedToursAvailable} label="Guided Tours"       icon="🎧" />
          <FeatureCheck available={accessibility.audioGuideAvailable}  label="Audio Guide"        icon="📻" />
          <FeatureCheck available={accessibility.brailleSignage}       label="Braille Signage"    icon="👁️" />
        </div>
      </div>

      {/* Surface type */}
      {accessibility.surfaceType && (
        <div className="asc-surface" role="note">
          <span aria-hidden="true">🛤️</span>
          <span>Surface: <strong>{accessibility.surfaceType}</strong></span>
        </div>
      )}

      {/* Notes */}
      {accessibility.accessibilityNotes && (
        <div className="asc-notes" role="note">
          <p className="asc-notes__title">📋 Notes</p>
          <p className="asc-notes__text">{accessibility.accessibilityNotes}</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   DESTINATION ACCESSIBILITY GRADE CARD
   Shows: grade, rating/5, wheelchair, transport badges
══════════════════════════════════════════ */
export function DestinationScoreCard({ destination }) {
  const grade  = getDestinationGrade(destination.accessibilityRating)
  const colors = SCORE_COLORS[grade.color] || SCORE_COLORS.blue
  const pct    = Math.round((destination.accessibilityRating / 5) * 100)

  return (
    <div className="asc-card asc-card--destination" aria-labelledby="dst-score-title">
      <h2 id="dst-score-title" className="asc-card__title">♿ Accessibility Overview</h2>

      <div className="asc-grade-row">
        {/* Grade badge */}
        <div className="asc-grade" style={{ background: colors.bg, borderColor: colors.text }}>
          <span className="asc-grade__letter" style={{ color: colors.text }}>{grade.grade}</span>
        </div>
        <div>
          <p className="asc-grade__level" style={{ color: colors.text }}>{grade.label}</p>
          <p className="asc-grade__rating">{destination.accessibilityRating}/5 rating</p>
        </div>
      </div>

      {/* Rating bar */}
      <div className="asc-bar" role="group" aria-label={`Accessibility: ${destination.accessibilityRating} out of 5`}>
        <div className="asc-bar__track" role="progressbar" aria-valuenow={destination.accessibilityRating} aria-valuemin={0} aria-valuemax={5}>
          <div className="asc-bar__fill" style={{ width: `${pct}%`, background: colors.text }} />
        </div>
      </div>

      {/* Features */}
      <div className="asc-features__grid" style={{ marginTop: '1rem' }}>
        <FeatureCheck available={destination.wheelchairFriendly}        label="Wheelchair Friendly"  icon="♿" />
        <FeatureCheck available={destination.publicTransportAccessible}  label="Public Transport"     icon="🚌" />
      </div>

      {destination.accessibilityNotes && (
        <div className="asc-notes" role="note" style={{ marginTop: '1rem' }}>
          <p className="asc-notes__title">📋 Notes</p>
          <p className="asc-notes__text">{destination.accessibilityNotes}</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   TRIP ACCESSIBILITY SCORE CARD  (Phase 6)
   Displays real scores from /api/scoring/trip/:id
   Props:
     trip        — Trip document (for travelRequirements)
     scoreData   — response.data from getTripScores()
     loading     — boolean
══════════════════════════════════════════ */
function RequirementRow({ icon, label, info }) {
  if (!info) return null
  const color = info.satisfied ? 'green' : 'red'
  const colors = SCORE_COLORS[color]
  return (
    <div
      className="asc-req-row"
      style={{ borderColor: colors.border, background: colors.bg }}
      role="status"
      aria-label={`${label}: ${info.satisfied ? 'met' : 'not fully met'}`}
    >
      <span className="asc-req-row__icon" aria-hidden="true">{icon}</span>
      <div className="asc-req-row__text">
        <p className="asc-req-row__label">{label}</p>
        <p className="asc-req-row__detail" style={{ color: colors.text }}>
          {info.metCount}/{info.total} attractions
          {info.satisfied ? ' ✓ Requirement met' : ' ⚠ Not fully met'}
        </p>
      </div>
      <span
        className="asc-req-row__status"
        style={{ color: colors.text }}
        aria-hidden="true"
      >
        {info.satisfied ? '✓' : '✕'}
      </span>
    </div>
  )
}

export function TripScoreCard({ trip, scoreData, loading = false }) {
  // When no live data yet, fall back to what's stored on the trip document
  const scores = scoreData?.scores || {
    overallSuitabilityScore: trip?.overallSuitabilityScore || 0,
    accessibilityScore:      trip?.accessibilityScore      || 0,
    comfortScore:            trip?.comfortScore            || 0,
    walkingDifficultyScore:  0,
  }
  const requirementsMet = scoreData?.requirementsMet || {}

  const overall  = getScoreLevel(scores.overallSuitabilityScore)
  const colors   = SCORE_COLORS[overall.color] || SCORE_COLORS.blue

  const reqEntries = [
    { key: 'wheelchair',       icon: '♿', label: 'Wheelchair Access' },
    { key: 'elevator',         icon: '🛗', label: 'Elevator / Lift'   },
    { key: 'accessibleRestroom', icon: '🚻', label: 'Accessible Restroom' },
    { key: 'seating',          icon: '💺', label: 'Seating Areas'     },
  ]

  return (
    <div className="asc-card" aria-labelledby="trip-score-title">
      <h2 id="trip-score-title" className="asc-card__title">🎯 Trip Suitability</h2>

      {loading ? (
        <div className="asc-loading" role="status" aria-label="Calculating scores">
          <div className="asc-loading__spinner" aria-hidden="true" />
          <p>Calculating accessibility scores…</p>
        </div>
      ) : (
        <>
          {/* Overall suitability ring */}
          <div
            className="asc-overall"
            style={{ borderColor: colors.text, background: colors.bg }}
            role="img"
            aria-label={`Overall suitability: ${scores.overallSuitabilityScore} out of 10 — ${overall.label}`}
          >
            <span className="asc-overall__score" style={{ color: colors.text }}>
              {scores.overallSuitabilityScore}
            </span>
            <span className="asc-overall__max">/10</span>
            <p className="asc-overall__label" style={{ color: colors.text }}>{overall.label}</p>
          </div>

          {/* Sub-score bars */}
          <div className="asc-bars">
            <ScoreBar label="Accessibility"      score={scores.accessibilityScore}     icon="♿" />
            <ScoreBar label="Comfort Level"      score={scores.comfortScore}            icon="💺" />
            <ScoreBar label="Walking Ease"       score={scores.walkingDifficultyScore}  icon="🚶" />
          </div>

          {/* Requirement match section */}
          {Object.keys(requirementsMet).length > 0 && (
            <div className="asc-requirements" role="group" aria-label="Your accessibility requirements">
              <h3 className="asc-features__title">Your Requirements</h3>
              <div className="asc-requirements__list">
                {reqEntries.map(({ key, icon, label }) =>
                  requirementsMet[key] ? (
                    <RequirementRow
                      key={key}
                      icon={icon}
                      label={label}
                      info={requirementsMet[key]}
                    />
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Source note */}
          {scoreData && (
            <p className="asc-source-note">
              📊 Scores calculated from {scoreData.attractionCount} attraction{scoreData.attractionCount !== 1 ? 's' : ''}
              {scoreData.hasHotel ? ' + hotel' : ''}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default AttractionScoreCard
