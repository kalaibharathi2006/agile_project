const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfTravelers: { type: Number, required: true, min: 1 },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    // Traveler Requirements (snapshot at time of trip creation)
    travelRequirements: {
      requiresWheelchair: { type: Boolean, default: false },
      requiresElevator: { type: Boolean, default: false },
      requiresAccessibleRestroom: { type: Boolean, default: false },
      requiresSeatingRest: { type: Boolean, default: false },
      mobilityLevel: { type: String, default: 'full' },
      walkingToleranceMeters: { type: Number, default: 2000 },
      travelPace: { type: String, default: 'moderate' },
      restBreakIntervalMinutes: { type: Number, default: 90 },
      restBreakDurationMinutes: { type: Number, default: 20 },
      travelerType: { type: String, default: 'solo' },
      hasChildren: { type: Boolean, default: false },
      hasElderly: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['draft', 'planned', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    // Scores
    accessibilityScore: { type: Number, min: 0, max: 10, default: 0 },
    comfortScore: { type: Number, min: 0, max: 10, default: 0 },
    overallSuitabilityScore: { type: Number, min: 0, max: 10, default: 0 },
    estimatedBudget: { type: Number, default: 0 },
    notes: { type: String },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
