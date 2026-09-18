const express = require('express');
const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌍 Inclusive Trip Designer API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
