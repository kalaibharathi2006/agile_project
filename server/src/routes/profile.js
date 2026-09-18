const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Profile controllers (stub — full implementation in Phase 2)
const profileController = require('../controllers/profileController');

// @route   GET /api/profile
router.get('/', protect, profileController.getProfile);

// @route   PUT /api/profile
router.put('/', protect, profileController.updateProfile);

// @route   GET /api/profile/preferences
router.get('/preferences', protect, profileController.getPreferences);

// @route   PUT /api/profile/preferences
router.put('/preferences', protect, profileController.updatePreferences);

module.exports = router;
