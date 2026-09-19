const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// @route   GET /api/reviews
router.get('/', reviewController.getReviews);

// @route   POST /api/reviews
router.post('/', protect, reviewController.createReview);

// @route   POST /api/reviews/:id/helpful
router.post('/:id/helpful', protect, reviewController.voteHelpful);

// @route   PUT /api/reviews/:id/verify (Admin only)
router.put('/:id/verify', protect, authorize('admin'), reviewController.verifyReview);

// @route   DELETE /api/reviews/:id (Owner or Admin)
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;
