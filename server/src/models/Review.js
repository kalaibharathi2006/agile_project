const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    entityType: {
      type: String,
      enum: ['destination', 'attraction', 'hotel'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType',
    },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 200 },
    comment: { type: String, trim: true, maxlength: 2000 },
    // Accessibility-specific ratings
    accessibilityRating: { type: Number, min: 1, max: 5 },
    wheelchairAccessible: { type: Boolean },
    staffHelpfulness: { type: Number, min: 1, max: 5 },
    accessibilityComment: { type: String, trim: true, maxlength: 1000 },
    // Verification
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    images: [{ type: String }],
    helpfulCount: { type: Number, default: 0 },
    helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ entityType: 1, entityId: 1 });
reviewSchema.index({ user: 1, entityType: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
