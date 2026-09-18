/**
 * scoringController.js  —  Phase 6: Accessibility & Comfort Scoring API
 *
 * Routes:
 *   GET /api/scoring/trip/:id          → full score breakdown for a trip
 *   GET /api/scoring/destination/:id   → destination score breakdown
 *   GET /api/scoring/attraction/:id    → attraction score breakdown
 */

'use strict';

const Trip        = require('../models/Trip');
const Destination = require('../models/Destination');
const Attraction  = require('../models/Attraction');
const Hotel       = require('../models/Hotel');
const Itinerary   = require('../models/Itinerary');
const {
  computeAttractionScores,
  computeHotelScores,
  computeDestinationScores,
  computeTripScores,
  getScoreLevel,
  getDifficultyMeta,
} = require('../services/scoringService');

/* ──────────────────────────────────────────────────────────────
   GET /api/scoring/trip/:id
   Returns: full trip accessibility & comfort score breakdown.
   Computes from attractions in itinerary + hotel.
   Saves scores back to Trip document.
────────────────────────────────────────────────────────────── */
exports.getTripScores = async (req, res, next) => {
  try {
    // Find trip (must belong to requesting user)
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id })
      .populate('destination')
      .populate('hotel');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Get the itinerary to find which attractions are actually in this trip
    const itinerary = await Itinerary.findOne({ trip: trip._id })
      .populate('items.attraction');

    // Collect unique attraction documents from itinerary
    let attractions = [];
    if (itinerary && itinerary.items) {
      const seen = new Set();
      for (const item of itinerary.items) {
        if (item.type === 'attraction' && item.attraction && !seen.has(String(item.attraction._id))) {
          seen.add(String(item.attraction._id));
          attractions.push(item.attraction);
        }
      }
    }

    // If no itinerary yet, fall back to all attractions for the destination
    if (!attractions.length && trip.destination) {
      const query = { destination: trip.destination._id, isActive: true };
      if (trip.travelRequirements?.requiresWheelchair) {
        query['accessibility.wheelchairAccessible'] = true;
      }
      attractions = await Attraction.find(query).limit(10);
    }

    // Compute scores from real data
    const scores = computeTripScores(
      trip.travelRequirements || {},
      attractions,
      trip.hotel || null
    );

    // Persist computed scores back to the Trip document
    await Trip.findByIdAndUpdate(trip._id, {
      accessibilityScore:       scores.accessibilityScore,
      comfortScore:             scores.comfortScore,
      overallSuitabilityScore:  scores.overallSuitabilityScore,
    });

    // Build score meta for UI display
    const overall = getScoreLevel(scores.overallSuitabilityScore);
    const a11y    = getScoreLevel(scores.accessibilityScore);
    const comfort = getScoreLevel(scores.comfortScore);
    const walking = getScoreLevel(scores.walkingDifficultyScore);

    res.status(200).json({
      success: true,
      data: {
        tripId: trip._id,
        tripTitle: trip.title,
        scores: {
          overallSuitabilityScore:  scores.overallSuitabilityScore,
          accessibilityScore:       scores.accessibilityScore,
          comfortScore:             scores.comfortScore,
          walkingDifficultyScore:   scores.walkingDifficultyScore,
        },
        meta: {
          overall,
          accessibility: a11y,
          comfort,
          walking,
        },
        requirementsMet: scores.requirementsMet,
        attractionCount: attractions.length,
        hasHotel: !!trip.hotel,
        breakdown: scores.breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /api/scoring/destination/:id
   Public — no auth needed.
   Returns: destination grade + score derived from DB fields.
────────────────────────────────────────────────────────────── */
exports.getDestinationScores = async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination || !destination.isActive) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }

    // Aggregate attraction accessibility stats for this destination
    const attractionStats = await Attraction.aggregate([
      { $match: { destination: destination._id, isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          wheelchairCount:    { $sum: { $cond: ['$accessibility.wheelchairAccessible', 1, 0] } },
          elevatorCount:      { $sum: { $cond: ['$accessibility.elevatorAvailable', 1, 0] } },
          restroomCount:      { $sum: { $cond: ['$accessibility.accessibleRestroom', 1, 0] } },
          seatingCount:       { $sum: { $cond: ['$accessibility.seatingAvailable', 1, 0] } },
          easyCount:          { $sum: { $cond: [{ $eq: ['$accessibility.walkingDifficulty', 'easy'] }, 1, 0] } },
          avgAccessibilityScore: { $avg: '$accessibility.accessibilityScore' },
        },
      },
    ]);

    const stats = attractionStats[0] || {};
    const destScores = computeDestinationScores(destination.toObject());

    res.status(200).json({
      success: true,
      data: {
        destinationId: destination._id,
        name: destination.name,
        scores: destScores,
        attractionStats: {
          total: stats.total || 0,
          wheelchairAccessible: stats.wheelchairCount || 0,
          elevatorAvailable:    stats.elevatorCount   || 0,
          accessibleRestroom:   stats.restroomCount   || 0,
          seatingAvailable:     stats.seatingCount    || 0,
          easyWalking:          stats.easyCount       || 0,
          avgAttractionScore:   Math.round((stats.avgAccessibilityScore || 0) * 10) / 10,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ──────────────────────────────────────────────────────────────
   GET /api/scoring/attraction/:id
   Public — no auth needed.
   Returns: full accessibility sub-scores for one attraction.
────────────────────────────────────────────────────────────── */
exports.getAttractionScores = async (req, res, next) => {
  try {
    const attraction = await Attraction.findById(req.params.id).populate('destination', 'name state');
    if (!attraction || !attraction.isActive) {
      return res.status(404).json({ success: false, message: 'Attraction not found.' });
    }

    const scores   = computeAttractionScores(attraction.accessibility || {});
    const overall  = getScoreLevel(scores.overallScore);
    const diffMeta = getDifficultyMeta(scores.walkingDifficulty);

    res.status(200).json({
      success: true,
      data: {
        attractionId: attraction._id,
        name: attraction.name,
        destination: attraction.destination,
        accessibility: attraction.accessibility,
        scores: {
          overallScore:   scores.overallScore,
          mobilityScore:  scores.mobilityScore,
          comfortScore:   scores.comfortScore,
          routeScore:     scores.routeScore,
          sensoryScore:   scores.sensoryScore,
          walkingDifficulty: scores.walkingDifficulty,
        },
        meta: {
          overall,
          walkingDifficulty: diffMeta,
        },
        breakdown: scores.breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
