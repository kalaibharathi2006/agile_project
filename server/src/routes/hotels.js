const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

// @route   GET /api/hotels
router.get('/', hotelController.getHotels);

// @route   GET /api/hotels/:id
router.get('/:id', hotelController.getHotel);

module.exports = router;
