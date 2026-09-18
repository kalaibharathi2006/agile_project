const Hotel = require('../models/Hotel');

// @desc    Get hotels with filters
// @route   GET /api/hotels
// @access  Public
exports.getHotels = async (req, res, next) => {
  try {
    const {
      destination,
      priceCategory,
      starRating,
      wheelchairAccessible,
      elevatorAvailable,
      accessibleRooms,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };
    if (destination) query.destination = destination;
    if (priceCategory) query.priceCategory = priceCategory;
    if (starRating) query.starRating = { $gte: parseInt(starRating) };
    if (wheelchairAccessible === 'true') query['accessibility.wheelchairAccessible'] = true;
    if (elevatorAvailable === 'true') query['accessibility.elevatorAvailable'] = true;
    if (accessibleRooms === 'true') query['accessibility.accessibleRooms'] = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [hotels, total] = await Promise.all([
      Hotel.find(query)
        .populate('destination', 'name state')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ 'accessibility.accessibilityScore': -1, rating: -1 }),
      Hotel.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('destination', 'name state');
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};
