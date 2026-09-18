const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// @route   POST /api/reviews
router.post('/', protect, reviewController.createReview);

// @route   GET /api/reviews
router.get('/', reviewController.getReviews);

module.exports = router;
