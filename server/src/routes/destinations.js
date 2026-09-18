const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

// @route   GET /api/destinations
router.get('/', destinationController.getDestinations);

// @route   GET /api/destinations/:id
router.get('/:id', destinationController.getDestination);

module.exports = router;
