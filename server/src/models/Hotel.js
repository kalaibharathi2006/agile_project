const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    description: { type: String, trim: true },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: { type: String, trim: true },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    // Pricing
    pricePerNight: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    priceCategory: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury'],
      default: 'mid-range',
    },
    // Accessibility
    accessibility: {
      wheelchairAccessible: { type: Boolean, default: false },
      elevatorAvailable: { type: Boolean, default: false },
      accessibleRooms: { type: Boolean, default: false },
      accessibleRestroom: { type: Boolean, default: false },
      rampAccess: { type: Boolean, default: false },
      parkingAvailable: { type: Boolean, default: false },
      accessiblePool: { type: Boolean, default: false },
      visualAlerts: { type: Boolean, default: false },
      accessibilityScore: { type: Number, min: 0, max: 10, default: 0 },
      accessibilityNotes: { type: String },
    },
    // Amenities
    amenities: [{ type: String }],
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hotelSchema.index({ location: '2dsphere' });
hotelSchema.index({ name: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
