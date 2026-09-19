const mongoose = require('mongoose');
const Review = require('../models/Review');

// @desc    Create or update a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const {
      entityType,
      entityId,
      trip,
      rating,
      title,
      comment,
      accessibilityRating,
      wheelchairAccessible,
      staffHelpfulness,
      accessibilityComment,
      images,
    } = req.body;

    if (!entityType || !entityId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide entityType, entityId, and a rating between 1 and 5.',
      });
    }

    // Check if user already reviewed this entity
    let review = await Review.findOne({
      user: req.user._id,
      entityType,
      entityId,
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      if (title !== undefined) review.title = title;
      if (comment !== undefined) review.comment = comment;
      if (accessibilityRating !== undefined) review.accessibilityRating = accessibilityRating;
      if (wheelchairAccessible !== undefined) review.wheelchairAccessible = wheelchairAccessible;
      if (staffHelpfulness !== undefined) review.staffHelpfulness = staffHelpfulness;
      if (accessibilityComment !== undefined) review.accessibilityComment = accessibilityComment;
      if (images !== undefined) review.images = images;
      if (trip !== undefined) review.trip = trip;
      // Reset verification on update for review integrity
      review.isVerified = false;
      review.verifiedBy = undefined;
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        user: req.user._id,
        entityType,
        entityId,
        trip,
        rating,
        title,
        comment,
        accessibilityRating,
        wheelchairAccessible,
        staffHelpfulness,
        accessibilityComment,
        images: images || [],
      });
    }

    await review.populate('user', 'name avatar role');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews with filtering and summary rating metrics
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const {
      entityType,
      entityId,
      rating,
      isVerified,
      wheelchairAccessible,
      page = 1,
      limit = 10,
      sort = 'newest',
    } = req.query;

    const query = { isActive: true };
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = new mongoose.Types.ObjectId(entityId);
    if (rating) query.rating = Number(rating);
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (wheelchairAccessible !== undefined) {
      query.wheelchairAccessible = wheelchairAccessible === 'true';
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'rating_high') sortOption = { rating: -1 };
    if (sort === 'rating_low') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1 };
    if (sort === 'accessibility') sortOption = { accessibilityRating: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name avatar role')
        .populate('verifiedBy', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOption),
      Review.countDocuments(query),
    ]);

    // Compute summary breakdown if entityId is specified
    let summary = null;
    if (entityId) {
      const matchCriteria = {
        entityId: new mongoose.Types.ObjectId(entityId),
        isActive: true,
      };
      if (entityType) matchCriteria.entityType = entityType;

      const stats = await Review.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            avgAccessibilityRating: { $avg: '$accessibilityRating' },
            avgStaffHelpfulness: { $avg: '$staffHelpfulness' },
            wheelchairCount: {
              $sum: { $cond: [{ $eq: ['$wheelchairAccessible', true] }, 1, 0] },
            },
            verifiedCount: {
              $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] },
            },
            star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ]);

      if (stats.length > 0) {
        const s = stats[0];
        summary = {
          totalReviews: s.count,
          avgRating: Number((s.avgRating || 0).toFixed(1)),
          avgAccessibilityRating: Number((s.avgAccessibilityRating || 0).toFixed(1)),
          avgStaffHelpfulness: Number((s.avgStaffHelpfulness || 0).toFixed(1)),
          wheelchairAccessiblePercent: s.count > 0 ? Math.round((s.wheelchairCount / s.count) * 100) : 0,
          verifiedReviewsCount: s.verifiedCount,
          starsBreakdown: {
            5: s.star5,
            4: s.star4,
            3: s.star3,
            2: s.star2,
            1: s.star1,
          },
        };
      } else {
        summary = {
          totalReviews: 0,
          avgRating: 0,
          avgAccessibilityRating: 0,
          avgStaffHelpfulness: 0,
          wheelchairAccessiblePercent: 0,
          verifiedReviewsCount: 0,
          starsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      data: reviews,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const userId = req.user._id;
    const hasVoted = review.helpfulUsers && review.helpfulUsers.some((id) => id.equals(userId));

    if (hasVoted) {
      // Toggle off vote
      review.helpfulUsers = review.helpfulUsers.filter((id) => !id.equals(userId));
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add vote
      if (!review.helpfulUsers) review.helpfulUsers = [];
      review.helpfulUsers.push(userId);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpfulCount: review.helpfulCount,
      hasVoted: !hasVoted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or unverify a review (Admin)
// @route   PUT /api/reviews/:id/verify
// @access  Private/Admin
exports.verifyReview = async (req, res, next) => {
  try {
    const { isVerified = true } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isVerified = isVerified;
    review.verifiedBy = isVerified ? req.user._id : undefined;
    await review.save();

    await review.populate('user', 'name avatar');
    await review.populate('verifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: isVerified ? 'Review marked as Verified Accessible' : 'Review verification removed',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check ownership or admin role
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
