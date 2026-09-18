const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true },
  type: {
    type: String,
    enum: ['attraction', 'hotel', 'meal', 'rest', 'transport', 'free'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  attraction: { type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  durationMinutes: { type: Number, default: 60 },
  distanceFromPreviousMeters: { type: Number, default: 0 },
  transportMode: {
    type: String,
    enum: ['walk', 'taxi', 'auto', 'bus', 'train', 'car', 'none'],
    default: 'walk',
  },
  accessibilityNotes: { type: String },
  isRestBreak: { type: Boolean, default: false },
  isMealBreak: { type: Boolean, default: false },
  order: { type: Number, required: true },
});

const itinerarySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      unique: true,
    },
    totalDays: { type: Number, required: true },
    items: [itineraryItemSchema],
    generatedAt: { type: Date, default: Date.now },
    lastModifiedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Itinerary', itinerarySchema);
