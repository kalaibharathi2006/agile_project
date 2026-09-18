const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/users
router.get('/users', adminController.getUsers);

// @route   GET /api/admin/trips
router.get('/trips', adminController.getTrips);

// @route   GET /api/admin/reviews
router.get('/reviews', adminController.getReviews);

// @route   GET /api/admin/destinations
router.get('/destinations', adminController.getDestinations);

// @route   GET /api/admin/hotels
router.get('/hotels', adminController.getHotels);

module.exports = router;
