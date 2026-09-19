const User = require('../models/User');
const Trip = require('../models/Trip');
const Review = require('../models/Review');
const Destination = require('../models/Destination');
const Attraction = require('../models/Attraction');
const Hotel = require('../models/Hotel');
const Partner = require('../models/Partner');

// ==========================================
// 1. USER MANAGEMENT
// ==========================================

// @desc    Get all users (with search and role filter)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (user <-> admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    // Prevent self-demotion
    if (req.user._id.equals(req.params.id) && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke your own admin rights.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: `User role updated to ${role}`, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active/deactivated status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user._id.equals(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.equals(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. DESTINATION MANAGEMENT
// ==========================================

// @desc    Get all destinations
// @route   GET /api/admin/destinations
// @access  Private/Admin
exports.getDestinations = async (req, res, next) => {
  try {
    const destinations = await Destination.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: destinations.length, data: destinations });
  } catch (error) {
    next(error);
  }
};

// @desc    Create destination
// @route   POST /api/admin/destinations
// @access  Private/Admin
exports.createDestination = async (req, res, next) => {
  try {
    const destination = await Destination.create(req.body);
    res.status(201).json({ success: true, data: destination });
  } catch (error) {
    next(error);
  }
};

// @desc    Update destination
// @route   PUT /api/admin/destinations/:id
// @access  Private/Admin
exports.updateDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }
    res.status(200).json({ success: true, data: destination });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete destination
// @route   DELETE /api/admin/destinations/:id
// @access  Private/Admin
exports.deleteDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }
    res.status(200).json({ success: true, message: 'Destination deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. ATTRACTION MANAGEMENT
// ==========================================

// @desc    Get all attractions (with destination populated)
// @route   GET /api/admin/attractions
// @access  Private/Admin
exports.getAttractions = async (req, res, next) => {
  try {
    const attractions = await Attraction.find().populate('destination', 'name state').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: attractions.length, data: attractions });
  } catch (error) {
    next(error);
  }
};

// @desc    Create attraction
// @route   POST /api/admin/attractions
// @access  Private/Admin
exports.createAttraction = async (req, res, next) => {
  try {
    const attraction = await Attraction.create(req.body);
    // Increment totalAttractions on destination
    await Destination.findByIdAndUpdate(attraction.destination, {
      $inc: { totalAttractions: 1 },
    });
    res.status(201).json({ success: true, data: attraction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attraction
// @route   PUT /api/admin/attractions/:id
// @access  Private/Admin
exports.updateAttraction = async (req, res, next) => {
  try {
    const attraction = await Attraction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('destination', 'name state');
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.status(200).json({ success: true, data: attraction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attraction
// @route   DELETE /api/admin/attractions/:id
// @access  Private/Admin
exports.deleteAttraction = async (req, res, next) => {
  try {
    const attraction = await Attraction.findByIdAndDelete(req.params.id);
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    await Destination.findByIdAndUpdate(attraction.destination, {
      $inc: { totalAttractions: -1 },
    });
    res.status(200).json({ success: true, message: 'Attraction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. HOTEL MANAGEMENT
// ==========================================

// @desc    Get all hotels
// @route   GET /api/admin/hotels
// @access  Private/Admin
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().populate('destination', 'name state').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: hotels.length, data: hotels });
  } catch (error) {
    next(error);
  }
};

// @desc    Create hotel
// @route   POST /api/admin/hotels
// @access  Private/Admin
exports.createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel
// @route   PUT /api/admin/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('destination', 'name state');
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hotel
// @route   DELETE /api/admin/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    res.status(200).json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. REVIEW & ACCESSIBILITY VERIFICATION MANAGEMENT
// ==========================================

// @desc    Get all reviews (with filters)
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getReviews = async (req, res, next) => {
  try {
    const { status, entityType } = req.query;
    const query = {};
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;
    if (entityType) query.entityType = entityType;

    const reviews = await Review.find(query)
      .populate('user', 'name email avatar')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or revoke verification of a review
// @route   PUT /api/admin/reviews/:id/verify
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

    await review.populate('user', 'name email avatar');
    await review.populate('verifiedBy', 'name');

    res.status(200).json({
      success: true,
      message: isVerified ? 'Review marked as Verified Accessible Experience' : 'Verification status revoked',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (Admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. PARTNER MANAGEMENT
// ==========================================

// @desc    Get all partners
// @route   GET /api/admin/partners
// @access  Private/Admin (or public for directory)
exports.getPartners = async (req, res, next) => {
  try {
    const { category, isVerified } = req.query;
    const query = {};
    if (category) query.category = category;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const partners = await Partner.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: partners.length, data: partners });
  } catch (error) {
    next(error);
  }
};

// @desc    Create partner
// @route   POST /api/admin/partners
// @access  Private/Admin
exports.createPartner = async (req, res, next) => {
  try {
    const partner = await Partner.create(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    next(error);
  }
};

// @desc    Update partner
// @route   PUT /api/admin/partners/:id
// @access  Private/Admin
exports.updatePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete partner
// @route   DELETE /api/admin/partners/:id
// @access  Private/Admin
exports.deletePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.status(200).json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. TRIPS LISTING (ADMIN)
// ==========================================
exports.getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find()
      .populate('user', 'name email')
      .populate('destination', 'name state')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    next(error);
  }
};
