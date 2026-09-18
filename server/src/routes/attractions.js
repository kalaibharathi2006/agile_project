const express = require('express');
const router = express.Router();
const attractionController = require('../controllers/attractionController');

// @route   GET /api/attractions
router.get('/', attractionController.getAttractions);

// @route   GET /api/attractions/:id
router.get('/:id', attractionController.getAttraction);

module.exports = router;
