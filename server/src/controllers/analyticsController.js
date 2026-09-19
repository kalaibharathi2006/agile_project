const User = require('../models/User');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const Attraction = require('../models/Attraction');
const UserPreferences = require('../models/UserPreferences');
const Review = require('../models/Review');

// @desc    Get user and trip analytics (Story 1)
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
exports.getUserAndTripAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalTrips,
      tripsByStatus,
      tripActivity,
      popularDestinations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      Trip.countDocuments(),
      // Trips grouped by status
      Trip.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      // Trip activity (grouped by Year-Month)
      Trip.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ]),
      // Popular Destinations by trip count
      Trip.aggregate([
        { $match: { destination: { $ne: null } } },
        {
          $group: {
            _id: '$destination',
            tripCount: { $sum: 1 },
            avgScore: { $avg: '$accessibilityScore' },
          },
        },
        { $sort: { tripCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'destinations',
            localField: '_id',
            foreignField: '_id',
            as: 'dest',
          },
        },
        { $unwind: { path: '$dest', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            destinationId: '$_id',
            name: { $ifNull: ['$dest.name', 'Unknown Destination'] },
            state: '$dest.state',
            tripCount: 1,
            avgScore: { $round: [{ $ifNull: ['$avgScore', 0] }, 1] },
          },
        },
      ]),
    ]);

    // Popular Attractions (by review count and rating)
    const popularAttractions = await Review.aggregate([
      { $match: { entityType: 'attraction' } },
      {
        $group: {
          _id: '$entityId',
          reviewCount: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          avgAccessibility: { $avg: '$accessibilityRating' },
        },
      },
      { $sort: { reviewCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'attractions',
          localField: '_id',
          foreignField: '_id',
          as: 'attr',
        },
      },
      { $unwind: { path: '$attr', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          attractionId: '$_id',
          name: { $ifNull: ['$attr.name', 'Attraction'] },
          category: '$attr.category',
          reviewCount: 1,
          avgRating: { $round: [{ $ifNull: ['$avgRating', 0] }, 1] },
          avgAccessibility: { $round: [{ $ifNull: ['$avgAccessibility', 0] }, 1] },
        },
      },
    ]);

    // Format status breakdown map
    const statusMap = { draft: 0, planned: 0, active: 0, completed: 0, cancelled: 0 };
    tripsByStatus.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
        },
        trips: {
          total: totalTrips,
          byStatus: statusMap,
          activity: tripActivity.map((a) => ({
            period: `${a._id.year}-${String(a._id.month).padStart(2, '0')}`,
            count: a.count,
          })),
        },
        popularDestinations,
        popularAttractions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get accessibility usage reports (Story 2)
// @route   GET /api/admin/analytics/accessibility
// @access  Private/Admin
exports.getAccessibilityUsageReports = async (req, res, next) => {
  try {
    const [
      totalPreferences,
      prefStats,
      tripRequirements,
      reviewsStats,
    ] = await Promise.all([
      UserPreferences.countDocuments(),
      // Aggregate accessibility preferences distribution from UserPreferences
      UserPreferences.aggregate([
        {
          $group: {
            _id: null,
            wheelchairCount: {
              $sum: { $cond: [{ $eq: ['$requiresWheelchair', true] }, 1, 0] },
            },
            elevatorCount: {
              $sum: { $cond: [{ $eq: ['$requiresElevator', true] }, 1, 0] },
            },
            restroomCount: {
              $sum: { $cond: [{ $eq: ['$requiresAccessibleRestroom', true] }, 1, 0] },
            },
            seatingCount: {
              $sum: { $cond: [{ $eq: ['$requiresSeatingRest', true] }, 1, 0] },
            },
            elderlyCount: {
              $sum: { $cond: [{ $eq: ['$hasElderly', true] }, 1, 0] },
            },
            childrenCount: {
              $sum: { $cond: [{ $eq: ['$hasChildren', true] }, 1, 0] },
            },
            caregiverCount: {
              $sum: { $cond: [{ $eq: ['$hasCaregiver', true] }, 1, 0] },
            },
            mobilityFull: {
              $sum: { $cond: [{ $eq: ['$mobilityLevel', 'full'] }, 1, 0] },
            },
            mobilityLimited: {
              $sum: { $cond: [{ $eq: ['$mobilityLevel', 'limited'] }, 1, 0] },
            },
            mobilityWheelchair: {
              $sum: { $cond: [{ $eq: ['$mobilityLevel', 'wheelchair'] }, 1, 0] },
            },
            mobilityAssisted: {
              $sum: { $cond: [{ $eq: ['$mobilityLevel', 'assisted'] }, 1, 0] },
            },
            paceSlow: {
              $sum: { $cond: [{ $eq: ['$travelPace', 'slow'] }, 1, 0] },
            },
            paceModerate: {
              $sum: { $cond: [{ $eq: ['$travelPace', 'moderate'] }, 1, 0] },
            },
            paceFast: {
              $sum: { $cond: [{ $eq: ['$travelPace', 'fast'] }, 1, 0] },
            },
          },
        },
      ]),

      // Aggregate trip accessibility features snapshot
      Trip.aggregate([
        {
          $group: {
            _id: null,
            avgAccessibilityScore: { $avg: '$accessibilityScore' },
            avgComfortScore: { $avg: '$comfortScore' },
            tripsRequiringWheelchair: {
              $sum: {
                $cond: [{ $eq: ['$travelRequirements.requiresWheelchair', true] }, 1, 0],
              },
            },
            tripsRequiringElevator: {
              $sum: {
                $cond: [{ $eq: ['$travelRequirements.requiresElevator', true] }, 1, 0],
              },
            },
            tripsRequiringRestrooms: {
              $sum: {
                $cond: [{ $eq: ['$travelRequirements.requiresAccessibleRestroom', true] }, 1, 0],
              },
            },
          },
        },
      ]),

      // Aggregate reviews accessibility statistics
      Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            verifiedReviews: {
              $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] },
            },
            wheelchairAffirmed: {
              $sum: { $cond: [{ $eq: ['$wheelchairAccessible', true] }, 1, 0] },
            },
            avgOverallRating: { $avg: '$rating' },
            avgAccessibilityRating: { $avg: '$accessibilityRating' },
            avgStaffHelpfulness: { $avg: '$staffHelpfulness' },
          },
        },
      ]),
    ]);

    const p = prefStats[0] || {};
    const t = tripRequirements[0] || {};
    const r = reviewsStats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        userPreferences: {
          totalProfiles: totalPreferences,
          featureUsage: {
            wheelchair: p.wheelchairCount || 0,
            elevator: p.elevatorCount || 0,
            accessibleRestroom: p.restroomCount || 0,
            seatingRest: p.seatingCount || 0,
            elderlySupport: p.elderlyCount || 0,
            childrenSupport: p.childrenCount || 0,
            caregiverSupport: p.caregiverCount || 0,
          },
          mobilityDistribution: {
            full: p.mobilityFull || 0,
            limited: p.mobilityLimited || 0,
            wheelchair: p.mobilityWheelchair || 0,
            assisted: p.mobilityAssisted || 0,
          },
          paceDistribution: {
            slow: p.paceSlow || 0,
            moderate: p.paceModerate || 0,
            fast: p.paceFast || 0,
          },
        },
        tripAccessibility: {
          avgAccessibilityScore: Number((t.avgAccessibilityScore || 0).toFixed(1)),
          avgComfortScore: Number((t.avgComfortScore || 0).toFixed(1)),
          tripsWithWheelchair: t.tripsRequiringWheelchair || 0,
          tripsWithElevator: t.tripsRequiringElevator || 0,
          tripsWithRestrooms: t.tripsRequiringRestrooms || 0,
        },
        reviewsAccessibility: {
          totalReviews: r.totalReviews || 0,
          verifiedReviews: r.verifiedReviews || 0,
          wheelchairAffirmed: r.wheelchairAffirmed || 0,
          avgOverallRating: Number((r.avgOverallRating || 0).toFixed(1)),
          avgAccessibilityRating: Number((r.avgAccessibilityRating || 0).toFixed(1)),
          avgStaffHelpfulness: Number((r.avgStaffHelpfulness || 0).toFixed(1)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
