const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
    },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    climate: { type: String, trim: true },
    bestTimeToVisit: { type: String, trim: true },
    // Accessibility Overview
    accessibilityRating: { type: Number, min: 0, max: 5, default: 0 },
    wheelchairFriendly: { type: Boolean, default: false },
    publicTransportAccessible: { type: Boolean, default: false },
    accessibilityNotes: { type: String },
    // Stats
    totalAttractions: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

destinationSchema.index({ location: '2dsphere' });
destinationSchema.index({ name: 'text', state: 'text' });

module.exports = mongoose.model('Destination', destinationSchema);
