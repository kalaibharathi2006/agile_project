const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Attraction name is required'],
      trim: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ['heritage', 'nature', 'religious', 'museum', 'park', 'beach', 'shopping', 'food', 'entertainment', 'other'],
      default: 'other',
    },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    address: { type: String, trim: true },
    // Accessibility Info
    accessibility: {
      wheelchairAccessible: { type: Boolean, default: false },
      elevatorAvailable: { type: Boolean, default: false },
      accessibleRestroom: { type: Boolean, default: false },
      seatingAvailable: { type: Boolean, default: false },
      parkingAvailable: { type: Boolean, default: false },
      guidedToursAvailable: { type: Boolean, default: false },
      audioGuideAvailable: { type: Boolean, default: false },
      brailleSignage: { type: Boolean, default: false },
      accessibilityScore: { type: Number, min: 0, max: 10, default: 0 },
      walkingDifficulty: {
        type: String,
        enum: ['easy', 'moderate', 'difficult'],
        default: 'moderate',
      },
      surfaceType: { type: String, trim: true },
      accessibilityNotes: { type: String },
    },
    // Timing
    openingHours: { type: String, trim: true },
    entryFee: { type: Number, default: 0 },
    averageVisitDurationMinutes: { type: Number, default: 60 },
    bestTimeToVisit: { type: String },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

attractionSchema.index({ location: '2dsphere' });
attractionSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Attraction', attractionSchema);
