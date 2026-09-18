/**
 * scoringService.js  —  Phase 6: Accessibility & Comfort Scoring
 *
 * All scores come from real MongoDB document fields.
 * No random numbers, no hardcoded values.
 *
 * Covers Jira stories:
 *   ITD-38 Accessibility Score
 *   ITD-39 Walking & Route Difficulty
 *   ITD-40 Mobility Accessibility
 *   ITD-41 Comfort & Facilities
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   ATTRACTION SCORING
   Input: attraction.accessibility sub-document from MongoDB
   Output: { mobilityScore, comfortScore, routeScore, sensoryScore,
             overallScore, walkingDifficulty, breakdown }
═══════════════════════════════════════════════════════════════ */
const computeAttractionScores = (accessibility = {}) => {
  /* ── Mobility score (0–10) ──
     Measures how accessible the physical space is for mobility aids */
  const mobilityBreakdown = {
    wheelchairAccessible: accessibility.wheelchairAccessible ? 5 : 0,
    elevatorAvailable:    accessibility.elevatorAvailable    ? 3 : 0,
    parkingAvailable:     accessibility.parkingAvailable     ? 2 : 0,
  };
  const mobilityScore = Math.min(10,
    Object.values(mobilityBreakdown).reduce((s, v) => s + v, 0)
  );

  /* ── Comfort score (0–10) ──
     Measures rest, hygiene, and guided-support availability */
  const comfortBreakdown = {
    accessibleRestroom:   accessibility.accessibleRestroom   ? 4 : 0,
    seatingAvailable:     accessibility.seatingAvailable     ? 3 : 0,
    guidedToursAvailable: accessibility.guidedToursAvailable ? 2 : 0,
    audioGuideAvailable:  accessibility.audioGuideAvailable  ? 1 : 0,
  };
  const comfortScore = Math.min(10,
    Object.values(comfortBreakdown).reduce((s, v) => s + v, 0)
  );

  /* ── Route / walking difficulty score (0–10) ──
     Easy terrain = high score (good for accessibility) */
  const difficultyMap = { easy: 10, moderate: 5, difficult: 2 };
  const routeScore = difficultyMap[accessibility.walkingDifficulty] ?? 5;

  /* ── Sensory accessibility score (0–10) ──
     Covers visitors with visual/auditory needs */
  const sensoryBreakdown = {
    brailleSignage:      accessibility.brailleSignage      ? 5 : 0,
    audioGuideAvailable: accessibility.audioGuideAvailable ? 5 : 0,
  };
  const sensoryScore = Math.min(10,
    Object.values(sensoryBreakdown).reduce((s, v) => s + v, 0)
  );

  /* ── Overall score (0–10) ──
     If the DB already has a manually curated accessibilityScore, trust it.
     Otherwise derive from the 4 sub-scores (weighted: mobility + comfort matter most). */
  let overallScore;
  if (typeof accessibility.accessibilityScore === 'number' &&
      accessibility.accessibilityScore > 0) {
    overallScore = accessibility.accessibilityScore;
  } else {
    // Weighted: mobility 35%, comfort 30%, route 25%, sensory 10%
    overallScore = Math.round(
      (mobilityScore * 0.35 +
       comfortScore  * 0.30 +
       routeScore    * 0.25 +
       sensoryScore  * 0.10) * 10
    ) / 10;
  }

  return {
    mobilityScore,
    comfortScore,
    routeScore,
    sensoryScore,
    overallScore,
    walkingDifficulty: accessibility.walkingDifficulty || 'moderate',
    breakdown: {
      mobility: mobilityBreakdown,
      comfort:  comfortBreakdown,
      sensory:  sensoryBreakdown,
    },
  };
};

/* ═══════════════════════════════════════════════════════════════
   HOTEL SCORING
   Input: hotel.accessibility sub-document
   Output: { mobilityScore, comfortScore, overallScore, breakdown }
═══════════════════════════════════════════════════════════════ */
const computeHotelScores = (accessibility = {}) => {
  const mobilityBreakdown = {
    wheelchairAccessible: accessibility.wheelchairAccessible ? 3 : 0,
    rampAccess:           accessibility.rampAccess           ? 2 : 0,
    elevatorAvailable:    accessibility.elevatorAvailable    ? 2 : 0,
    accessibleRooms:      accessibility.accessibleRooms      ? 2 : 0,
    parkingAvailable:     accessibility.parkingAvailable     ? 1 : 0,
  };
  const mobilityScore = Math.min(10,
    Object.values(mobilityBreakdown).reduce((s, v) => s + v, 0)
  );

  const comfortBreakdown = {
    accessibleRestroom: accessibility.accessibleRestroom ? 3 : 0,
    accessiblePool:     accessibility.accessiblePool     ? 2 : 0,
    visualAlerts:       accessibility.visualAlerts       ? 2 : 0,
  };
  const comfortScore = Math.min(10,
    Object.values(comfortBreakdown).reduce((s, v) => s + v, 0)
  );

  let overallScore;
  if (typeof accessibility.accessibilityScore === 'number' &&
      accessibility.accessibilityScore > 0) {
    overallScore = accessibility.accessibilityScore;
  } else {
    overallScore = Math.round(
      (mobilityScore * 0.6 + comfortScore * 0.4) * 10
    ) / 10;
  }

  return {
    mobilityScore,
    comfortScore,
    overallScore,
    breakdown: { mobility: mobilityBreakdown, comfort: comfortBreakdown },
  };
};

/* ═══════════════════════════════════════════════════════════════
   DESTINATION SCORING
   Input: destination document
   Output: { grade, label, accessibilityScore, wheelchairFriendly,
             publicTransportAccessible, accessibilityRating }
═══════════════════════════════════════════════════════════════ */
const computeDestinationScores = (destination = {}) => {
  // accessibilityRating in DB is 0–5; convert to 0–10 for consistency
  const ratingOutOf10 = Math.round((destination.accessibilityRating || 0) * 2 * 10) / 10;

  const grade = (() => {
    const pct = (destination.accessibilityRating / 5) * 100;
    if (pct >= 80) return { grade: 'A', label: 'Highly Accessible',   color: 'green'  };
    if (pct >= 60) return { grade: 'B', label: 'Accessible',          color: 'teal'   };
    if (pct >= 40) return { grade: 'C', label: 'Partially Accessible',color: 'yellow' };
    if (pct >= 20) return { grade: 'D', label: 'Limited Access',      color: 'orange' };
    return              { grade: 'F', label: 'Not Accessible',       color: 'red'    };
  })();

  return {
    ...grade,
    accessibilityScore: ratingOutOf10,
    accessibilityRating: destination.accessibilityRating || 0,
    wheelchairFriendly: destination.wheelchairFriendly || false,
    publicTransportAccessible: destination.publicTransportAccessible || false,
    accessibilityNotes: destination.accessibilityNotes || null,
  };
};

/* ═══════════════════════════════════════════════════════════════
   TRIP SUITABILITY SCORING
   Input:
     travelRequirements  — snapshot from Trip.travelRequirements
     attractions         — array of Attraction documents from MongoDB
     hotel               — Hotel document (optional)
   Output:
     { accessibilityScore, comfortScore, overallSuitabilityScore,
       walkingDifficultyScore, requirementsMet, breakdown }
═══════════════════════════════════════════════════════════════ */
const computeTripScores = (travelRequirements = {}, attractions = [], hotel = null) => {
  if (!attractions.length) {
    return {
      accessibilityScore: 0,
      comfortScore: 0,
      overallSuitabilityScore: 0,
      walkingDifficultyScore: 0,
      requirementsMet: {},
      breakdown: { attractions: [], hotel: null },
    };
  }

  // Score each attraction from its DB data
  const attractionScores = attractions.map((attr) =>
    computeAttractionScores(attr.accessibility || {})
  );

  const avg = (key) =>
    Math.round(
      (attractionScores.reduce((s, a) => s + a[key], 0) / attractionScores.length) * 10
    ) / 10;

  const avgMobility  = avg('mobilityScore');
  const avgComfort   = avg('comfortScore');
  const avgRoute     = avg('routeScore');
  const avgSensory   = avg('sensoryScore');
  const avgOverall   = avg('overallScore');

  // Hotel score boost
  let hotelMobilityBoost = 0;
  let hotelComfortBoost  = 0;
  let hotelScores = null;
  if (hotel && hotel.accessibility) {
    hotelScores      = computeHotelScores(hotel.accessibility);
    hotelMobilityBoost = hotelScores.mobilityScore * 0.1; // 10% weight
    hotelComfortBoost  = hotelScores.comfortScore  * 0.1;
  }

  // Accessibility score = mobility + route (how physically accessible the trip is)
  let accessibilityScore = Math.min(10,
    Math.round((avgMobility * 0.6 + avgRoute * 0.4 + hotelMobilityBoost) * 10) / 10
  );

  // Comfort score = comfort facilities + sensory
  let comfortScore = Math.min(10,
    Math.round((avgComfort * 0.8 + avgSensory * 0.1 + hotelComfortBoost) * 10) / 10
  );

  // Check if user requirements are met across attractions
  const requirementsMet = {};

  if (travelRequirements.requiresWheelchair) {
    const wcCount = attractions.filter(a => a.accessibility?.wheelchairAccessible).length;
    requirementsMet.wheelchair = {
      required: true,
      metCount: wcCount,
      total: attractions.length,
      satisfied: wcCount === attractions.length,
    };
    // Penalise suitability if wheelchair not fully met
    if (wcCount < attractions.length) {
      const missingRatio = (attractions.length - wcCount) / attractions.length;
      accessibilityScore = Math.max(0, Math.round((accessibilityScore * (1 - missingRatio * 0.4)) * 10) / 10);
    }
  }

  if (travelRequirements.requiresElevator) {
    const elvCount = attractions.filter(a => a.accessibility?.elevatorAvailable).length;
    requirementsMet.elevator = {
      required: true,
      metCount: elvCount,
      total: attractions.length,
      satisfied: elvCount >= Math.ceil(attractions.length * 0.5),
    };
    if (elvCount < attractions.length * 0.5) {
      accessibilityScore = Math.max(0, Math.round((accessibilityScore * 0.85) * 10) / 10);
    }
  }

  if (travelRequirements.requiresAccessibleRestroom) {
    const restCount = attractions.filter(a => a.accessibility?.accessibleRestroom).length;
    requirementsMet.accessibleRestroom = {
      required: true,
      metCount: restCount,
      total: attractions.length,
      satisfied: restCount >= Math.ceil(attractions.length * 0.6),
    };
    if (restCount < attractions.length * 0.6) {
      comfortScore = Math.max(0, Math.round((comfortScore * 0.9) * 10) / 10);
    }
  }

  if (travelRequirements.requiresSeatingRest) {
    const seatCount = attractions.filter(a => a.accessibility?.seatingAvailable).length;
    requirementsMet.seating = {
      required: true,
      metCount: seatCount,
      total: attractions.length,
      satisfied: seatCount >= Math.ceil(attractions.length * 0.5),
    };
    if (seatCount < attractions.length * 0.5) {
      comfortScore = Math.max(0, Math.round((comfortScore * 0.9) * 10) / 10);
    }
  }

  // Walking difficulty score (ease of walking across the trip)
  const walkingDifficultyScore = avgRoute;

  // Overall suitability: weighted blend + requirement satisfaction bonus/penalty
  const reqSatisfaction = Object.values(requirementsMet).length === 0
    ? 1.0
    : Object.values(requirementsMet).filter(r => r.satisfied).length /
      Object.values(requirementsMet).length;

  let overallSuitabilityScore = Math.round(
    (accessibilityScore * 0.4 +
     comfortScore        * 0.3 +
     walkingDifficultyScore * 0.2 +
     avgOverall          * 0.1) *
    (0.7 + reqSatisfaction * 0.3) * 10
  ) / 10;

  overallSuitabilityScore = Math.min(10, Math.max(0, overallSuitabilityScore));

  console.log(`[ScoringService] Trip scores computed from ${attractions.length} attraction(s):`, {
    accessibilityScore,
    comfortScore,
    walkingDifficultyScore,
    overallSuitabilityScore,
    requirementsMet,
  });

  return {
    accessibilityScore,
    comfortScore,
    walkingDifficultyScore,
    overallSuitabilityScore,
    requirementsMet,
    breakdown: {
      attractions: attractionScores,
      hotel: hotelScores,
      averages: { avgMobility, avgComfort, avgRoute, avgSensory, avgOverall },
    },
  };
};

/* ═══════════════════════════════════════════════════════════════
   SCORE METADATA HELPERS (shared between service layers)
═══════════════════════════════════════════════════════════════ */
const getScoreLevel = (score, max = 10) => {
  const pct = (score / max) * 100;
  if (pct >= 75) return { level: 'high',   label: 'Excellent', color: 'green',  icon: '⭐' };
  if (pct >= 50) return { level: 'medium', label: 'Good',      color: 'yellow', icon: '🔶' };
  if (pct >= 25) return { level: 'low',    label: 'Fair',      color: 'orange', icon: '⚠️' };
  return              { level: 'poor',   label: 'Poor',      color: 'red',    icon: '❌' };
};

const getDifficultyMeta = (difficulty) => {
  const map = {
    easy:     { label: 'Easy',     color: 'green',  icon: '🟢', desc: 'Flat, smooth paths — suitable for all' },
    moderate: { label: 'Moderate', color: 'yellow', icon: '🟡', desc: 'Some uneven terrain — manageable with assistance' },
    difficult:{ label: 'Difficult',color: 'red',    icon: '🔴', desc: 'Steep/rough terrain — may not suit wheelchair users' },
  };
  return map[difficulty] || map.moderate;
};

module.exports = {
  computeAttractionScores,
  computeHotelScores,
  computeDestinationScores,
  computeTripScores,
  getScoreLevel,
  getDifficultyMeta,
};
