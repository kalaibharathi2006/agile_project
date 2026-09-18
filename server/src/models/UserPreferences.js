const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Mobility & Accessibility
    requiresWheelchair: { type: Boolean, default: false },
    requiresElevator: { type: Boolean, default: false },
    requiresAccessibleRestroom: { type: Boolean, default: false },
    requiresSeatingRest: { type: Boolean, default: false },
    mobilityLevel: {
      type: String,
      enum: ['full', 'limited', 'wheelchair', 'assisted'],
      default: 'full',
    },
    // Walking & Pace
    walkingToleranceMeters: {
      type: Number,
      default: 2000,
      min: 100,
      max: 20000,
    },
    travelPace: {
      type: String,
      enum: ['slow', 'moderate', 'fast'],
      default: 'moderate',
    },
    // Rest Requirements
    restBreakIntervalMinutes: {
      type: Number,
      default: 90,
      min: 30,
      max: 240,
    },
    restBreakDurationMinutes: {
      type: Number,
      default: 20,
      min: 10,
      max: 60,
    },
    // Traveler Profile
    travelerType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'elderly', 'group'],
      default: 'solo',
    },
    hasChildren: { type: Boolean, default: false },
    childrenAges: [{ type: Number }],
    hasElderly: { type: Boolean, default: false },
    hasCaregiver: { type: Boolean, default: false },
    // Dietary & Other
    dietaryRestrictions: [{ type: String }],
    preferredLanguage: { type: String, default: 'en' },
    budgetLevel: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury'],
      default: 'mid-range',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
