const User = require('../models/User');
const Trip = require('../models/Trip');
const Review = require('../models/Review');
const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');

// @desc    Get all users (admin)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) { next(error); }
};

// @desc    Get all trips (admin)
exports.getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find().populate('user', 'name email').populate('destination', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (error) { next(error); }
};

// @desc    Get all reviews (admin)
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) { next(error); }
};

// @desc    Get all destinations (admin)
exports.getDestinations = async (req, res, next) => {
  try {
    const destinations = await Destination.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: destinations.length, data: destinations });
  } catch (error) { next(error); }
};

// @desc    Get all hotels (admin)
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().populate('destination', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: hotels.length, data: hotels });
  } catch (error) { next(error); }
};
