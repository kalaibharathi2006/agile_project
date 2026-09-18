/**
 * Accessibility scoring utilities for Phase 6
 * Covers: ITD-38 (Accessibility Score), ITD-40 (Walking/Route), ITD-41 (Mobility), ITD-42 (Comfort)
 */

/* ─── Walking difficulty ─── */
export const DIFFICULTY_META = {
  easy:     { label: 'Easy',     color: 'green',  icon: '🟢', desc: 'Flat, smooth paths — suitable for all mobility levels' },
  moderate: { label: 'Moderate', color: 'yellow', icon: '🟡', desc: 'Some uneven terrain — manageable with assistance' },
  difficult:{ label: 'Difficult',color: 'red',    icon: '🔴', desc: 'Steep or rough terrain — may not suit wheelchair users' },
}

/* ─── Score level ─── */
export function getScoreLevel(score, max = 10) {
  const pct = (score / max) * 100
  if (pct >= 75) return { level: 'high',   label: 'Excellent', color: 'green',  icon: '⭐' }
  if (pct >= 50) return { level: 'medium', label: 'Good',      color: 'yellow', icon: '🔶' }
  if (pct >= 25) return { level: 'low',    label: 'Fair',      color: 'orange', icon: '⚠️' }
  return           { level: 'poor',   label: 'Poor',      color: 'red',    icon: '❌' }
}

/* ─── Attraction accessibility sub-scores ─── */
export function computeAttractionScores(accessibility = {}) {
  // Mobility score (0–10): wheelchair + elevator
  const mobilityPoints =
    (accessibility.wheelchairAccessible ? 5 : 0) +
    (accessibility.elevatorAvailable    ? 3 : 0) +
    (accessibility.parkingAvailable     ? 2 : 0)
  const mobilityScore = Math.min(10, mobilityPoints)

  // Comfort score (0–10): seating + restroom + tours
  const comfortPoints =
    (accessibility.accessibleRestroom   ? 4 : 0) +
    (accessibility.seatingAvailable     ? 3 : 0) +
    (accessibility.guidedToursAvailable ? 2 : 0) +
    (accessibility.audioGuideAvailable  ? 1 : 0)
  const comfortScore = Math.min(10, comfortPoints)

  // Route difficulty score (0–10) — easy=10, moderate=5, difficult=2
  const difficultyMap = { easy: 10, moderate: 5, difficult: 2 }
  const routeScore = difficultyMap[accessibility.walkingDifficulty] ?? 5

  // Sensory score (0–10): braille + audio guide
  const sensoryPoints =
    (accessibility.brailleSignage      ? 5 : 0) +
    (accessibility.audioGuideAvailable ? 5 : 0)
  const sensoryScore = Math.min(10, sensoryPoints)

  // Overall (use API score if available, else compute average)
  const overallScore = accessibility.accessibilityScore ??
    Math.round((mobilityScore + comfortScore + routeScore + sensoryScore) / 4)

  return { mobilityScore, comfortScore, routeScore, sensoryScore, overallScore }
}

/* ─── Destination accessibility grade ─── */
export function getDestinationGrade(accessibilityRating = 0) {
  // accessibilityRating is 0–5
  const pct = (accessibilityRating / 5) * 100
  if (pct >= 80) return { grade: 'A', label: 'Highly Accessible', color: 'green' }
  if (pct >= 60) return { grade: 'B', label: 'Accessible',        color: 'teal'  }
  if (pct >= 40) return { grade: 'C', label: 'Partially Accessible', color: 'yellow' }
  if (pct >= 20) return { grade: 'D', label: 'Limited Access',    color: 'orange' }
  return                { grade: 'F', label: 'Not Accessible',    color: 'red'   }
}

/* ─── Trip suitability for user preferences ─── */
export function computeTripSuitability(travelRequirements = {}, attractionScores = []) {
  if (!attractionScores.length) return null

  const avgMobility = attractionScores.reduce((s, a) => s + a.mobilityScore, 0) / attractionScores.length
  const avgComfort  = attractionScores.reduce((s, a) => s + a.comfortScore,  0) / attractionScores.length
  const avgRoute    = attractionScores.reduce((s, a) => s + a.routeScore,    0) / attractionScores.length

  // Penalise if user needs wheelchair but avg mobility < 7
  let suitability = (avgMobility + avgComfort + avgRoute) / 3
  if (travelRequirements.requiresWheelchair && avgMobility < 7) suitability *= 0.8
  if (travelRequirements.requiresSeatingRest && avgComfort  < 5) suitability *= 0.9

  return Math.min(10, Math.round(suitability * 10) / 10)
}

/* ─── Colour token map ─── */
export const SCORE_COLORS = {
  green:  { bg: 'var(--color-success-light)', text: '#15803d', border: '#86efac' },
  teal:   { bg: '#f0fdfa',                    text: '#0f766e', border: '#99f6e4' },
  yellow: { bg: 'var(--color-warning-light)', text: '#92400e', border: '#fcd34d' },
  orange: { bg: '#fff7ed',                    text: '#c2410c', border: '#fdba74' },
  red:    { bg: 'var(--color-danger-light)',  text: '#991b1b', border: '#fca5a5' },
  blue:   { bg: 'var(--color-primary-bg)',    text: 'var(--color-primary)', border: '#bfdbfe' },
}
