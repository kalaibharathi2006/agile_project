const Review = require('../models/Review');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews (with filter)
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const { entityType, entityId, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name avatar')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
