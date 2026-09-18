const Destination = require('../models/Destination');

// @desc    Get all destinations with optional search/filter
// @route   GET /api/destinations
// @access  Public
exports.getDestinations = async (req, res, next) => {
  try {
    const { search, wheelchairFriendly, state, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (state) query.state = new RegExp(state, 'i');
    if (wheelchairFriendly === 'true') query.wheelchairFriendly = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [destinations, total] = await Promise.all([
      Destination.find(query).skip(skip).limit(parseInt(limit)).sort({ popularityScore: -1 }),
      Destination.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: destinations.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: destinations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single destination
// @route   GET /api/destinations/:id
// @access  Public
exports.getDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination || !destination.isActive) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }
    res.status(200).json({ success: true, data: destination });
  } catch (error) {
    next(error);
  }
};
