const Attraction = require('../models/Attraction');

// @desc    Get attractions with optional filters
// @route   GET /api/attractions
// @access  Public
exports.getAttractions = async (req, res, next) => {
  try {
    const {
      destination,
      category,
      wheelchairAccessible,
      elevatorAvailable,
      accessibleRestroom,
      walkingDifficulty,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };
    if (destination) query.destination = destination;
    if (category) query.category = category;
    if (wheelchairAccessible === 'true') query['accessibility.wheelchairAccessible'] = true;
    if (elevatorAvailable === 'true') query['accessibility.elevatorAvailable'] = true;
    if (accessibleRestroom === 'true') query['accessibility.accessibleRestroom'] = true;
    if (walkingDifficulty) query['accessibility.walkingDifficulty'] = walkingDifficulty;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [attractions, total] = await Promise.all([
      Attraction.find(query)
        .populate('destination', 'name state')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ 'accessibility.accessibilityScore': -1 }),
      Attraction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: attractions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: attractions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single attraction
// @route   GET /api/attractions/:id
// @access  Public
exports.getAttraction = async (req, res, next) => {
  try {
    const attraction = await Attraction.findById(req.params.id).populate('destination', 'name state');
    if (!attraction || !attraction.isActive) {
      return res.status(404).json({ success: false, message: 'Attraction not found.' });
    }
    res.status(200).json({ success: true, data: attraction });
  } catch (error) {
    next(error);
  }
};
