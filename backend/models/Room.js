const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  maxRoommates: {
    type: Number,
    required: true,
    min: 1
  },
  availableFrom: {
    type: Date,
    required: true
  },
  pricePerMonth: {
    type: Number,
    required: true,
    min: 0
  },
  listingFee: {
    type: Number,
    default: 30,
    required: true
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    benefits: [String]
  },
  images: [{
    url: String, // S3/DO Spaces URL
    key: String  // S3/DO Spaces key
  }],
  contractTerms: {
    rentDeposit: { type: Number, required: true },
    keyDeposit: { type: Number, required: true },
    advancePaymentDays: { type: Number, default: 14 },
    sharedUtilities: { type: Boolean, default: true },
    minLeaseDuration: { type: Number, default: 6 }, // in months
    customTerms: { type: String }
  },
  amenities: {
    wifi: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    dishwasher: { type: Boolean, default: false },
    fridge: { type: Boolean, default: false },
    washingMachine: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    heating: { type: Boolean, default: false },
    furnished: { type: Boolean, default: false },
    othersAmenities: { type: String }
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'filled'],
    default: 'available'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  stripePaymentId: String,
  currentRoommates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inquiries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquiry'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
roomSchema.index({ 'location.coordinates': '2dsphere' });

// Ensure room can't have more roommates than maxRoommates
roomSchema.pre('save', function(next) {
  if (this.currentRoommates && this.currentRoommates.length > this.maxRoommates) {
    next(new Error('Room cannot have more roommates than maxRoommates'));
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
