const User = require('../models/User');
const UserPreferences = require('../models/UserPreferences');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'dateOfBirth', 'avatar'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get accessibility preferences
// @route   GET /api/profile/preferences
// @access  Private
exports.getPreferences = async (req, res, next) => {
  try {
    let prefs = await UserPreferences.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await UserPreferences.create({ user: req.user._id });
    }
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

// @desc    Update accessibility preferences
// @route   PUT /api/profile/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const prefs = await UserPreferences.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true, upsert: true }
    );
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};
