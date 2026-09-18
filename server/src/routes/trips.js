const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const tripController = require('../controllers/tripController');

// @route   POST /api/trips
router.post('/', protect, tripController.createTrip);

// @route   GET /api/trips
router.get('/', protect, tripController.getTrips);

// @route   GET /api/trips/:id
router.get('/:id', protect, tripController.getTrip);

// @route   PUT /api/trips/:id
router.put('/:id', protect, tripController.updateTrip);

// @route   PUT /api/trips/:id/hotel
router.put('/:id/hotel', protect, tripController.assignHotel);

// @route   DELETE /api/trips/:id
router.delete('/:id', protect, tripController.deleteTrip);

// @route   POST /api/trips/:id/itinerary
router.post('/:id/itinerary', protect, tripController.generateItinerary);

// @route   GET /api/trips/:id/itinerary
router.get('/:id/itinerary', protect, tripController.getItinerary);

// @route   PUT /api/trips/:id/itinerary
router.put('/:id/itinerary', protect, tripController.updateItinerary);

module.exports = router;
