const Hotel = require('../models/Hotel');
const Trip = require('../models/Trip');

// @desc    Get hotels with filters
// @route   GET /api/hotels
// @access  Public
exports.getHotels = async (req, res, next) => {
  try {
    const {
      destination,
      search,
      priceCategory,
      starRating,
      wheelchairAccessible,
      elevatorAvailable,
      accessibleRooms,
      accessibleRestroom,
      rampAccess,
      parkingAvailable,
      accessiblePool,
      visualAlerts,
      sort = 'a11y',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };
    if (destination) query.destination = destination;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }
    if (priceCategory) query.priceCategory = priceCategory;
    if (starRating) query.starRating = { $gte: parseInt(starRating) };
    if (wheelchairAccessible === 'true') query['accessibility.wheelchairAccessible'] = true;
    if (elevatorAvailable === 'true') query['accessibility.elevatorAvailable'] = true;
    if (accessibleRooms === 'true') query['accessibility.accessibleRooms'] = true;
    if (accessibleRestroom === 'true') query['accessibility.accessibleRestroom'] = true;
    if (rampAccess === 'true') query['accessibility.rampAccess'] = true;
    if (parkingAvailable === 'true') query['accessibility.parkingAvailable'] = true;
    if (accessiblePool === 'true') query['accessibility.accessiblePool'] = true;
    if (visualAlerts === 'true') query['accessibility.visualAlerts'] = true;

    let sortOption = { 'accessibility.accessibilityScore': -1, rating: -1 };
    if (sort === 'rating') sortOption = { rating: -1, 'accessibility.accessibilityScore': -1 };
    else if (sort === 'priceAsc') sortOption = { pricePerNight: 1 };
    else if (sort === 'priceDesc') sortOption = { pricePerNight: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [hotels, total] = await Promise.all([
      Hotel.find(query)
        .populate('destination', 'name state')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOption),
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
    const hotel = await Hotel.findById(req.params.id).populate('destination', 'name state images');
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended hotels based on destination & traveler accessibility needs
// @route   GET /api/hotels/recommendations
// @access  Public
exports.getHotelRecommendations = async (req, res, next) => {
  try {
    const { destination, tripId } = req.query;

    let reqWheelchair = req.query.requiresWheelchair === 'true';
    let reqElevator = req.query.requiresElevator === 'true';
    let reqRestroom = req.query.requiresAccessibleRestroom === 'true';
    let destId = destination;

    // If tripId is provided, extract requirements from the Trip document
    if (tripId) {
      const trip = await Trip.findById(tripId).populate('destination');
      if (trip) {
        if (!destId && trip.destination) destId = trip.destination._id || trip.destination;
        const r = trip.travelRequirements || {};
        reqWheelchair = r.requiresWheelchair || reqWheelchair;
        reqElevator = r.requiresElevator || reqElevator;
        reqRestroom = r.requiresAccessibleRestroom || reqRestroom;
      }
    }

    const query = { isActive: true };
    if (destId) query.destination = destId;

    const hotels = await Hotel.find(query).populate('destination', 'name state');

    // Score and rank each hotel based on requirements match
    const scoredHotels = hotels.map((hotel) => {
      const a = hotel.accessibility || {};
      let totalCriteria = 0;
      let matchedCriteria = 0;
      const matchedDetails = [];

      if (reqWheelchair) {
        totalCriteria += 2;
        if (a.wheelchairAccessible) { matchedCriteria += 1; matchedDetails.push('Wheelchair Accessible'); }
        if (a.accessibleRooms) { matchedCriteria += 1; matchedDetails.push('Accessible Rooms'); }
      }
      if (reqElevator) {
        totalCriteria += 1;
        if (a.elevatorAvailable) { matchedCriteria += 1; matchedDetails.push('Elevator Available'); }
      }
      if (reqRestroom) {
        totalCriteria += 1;
        if (a.accessibleRestroom) { matchedCriteria += 1; matchedDetails.push('Accessible Restroom'); }
      }

      // Default baseline criteria if no specific flags
      if (totalCriteria === 0) {
        totalCriteria = 3;
        if (a.wheelchairAccessible) matchedCriteria += 1;
        if (a.elevatorAvailable) matchedCriteria += 1;
        if (a.accessibleRooms) matchedCriteria += 1;
      }

      const matchPercent = Math.round((matchedCriteria / totalCriteria) * 100);
      const suitabilityScore = Number(((matchPercent / 10) * 0.7 + ((a.accessibilityScore || 7) * 0.3)).toFixed(1));

      return {
        ...hotel.toObject(),
        matchPercent,
        suitabilityScore,
        matchedDetails,
      };
    });

    // Sort by suitability score descending, then general rating
    scoredHotels.sort((a, b) => b.suitabilityScore - a.suitabilityScore || b.rating - a.rating);

    res.status(200).json({
      success: true,
      count: scoredHotels.length,
      data: scoredHotels,
    });
  } catch (error) {
    next(error);
  }
};

