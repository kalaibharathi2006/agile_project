/**
 * scoring.js  —  Phase 6: Scoring API routes
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const scoringController = require('../controllers/scoringController');

// @route   GET /api/scoring/trip/:id
// @desc    Get full accessibility & comfort score breakdown for a trip
// @access  Private (user must own the trip)
router.get('/trip/:id', protect, scoringController.getTripScores);

// @route   GET /api/scoring/destination/:id
// @desc    Get destination accessibility grade and attraction stats
// @access  Public
router.get('/destination/:id', scoringController.getDestinationScores);

// @route   GET /api/scoring/attraction/:id
// @desc    Get full accessibility sub-scores for one attraction
// @access  Public
router.get('/attraction/:id', scoringController.getAttractionScores);

module.exports = router;
