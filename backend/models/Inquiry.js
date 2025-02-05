const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  terms: {
    rentSplit: {
      type: String,
      required: true
    },
    moveInDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    }, // in months
    preferences: {
      smoking: Boolean,
      pets: Boolean,
      quiet: Boolean,
      visitors: {
        type: String,
        enum: ['none', 'occasional', 'frequent']
      },
      additionalNotes: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  matchedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  message: {
    type: String,
    required: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound index to ensure a student can only have one active inquiry per room
inquirySchema.index(
  { student: 1, room: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } }
  }
);

// Validate status transitions
inquirySchema.pre('save', function(next) {
  if (!this.isModified('status')) {
    return next();
  }

  const validTransitions = {
    pending: ['accepted', 'rejected', 'withdrawn'],
    accepted: ['withdrawn'],
    rejected: [],
    withdrawn: []
  };

  if (this.isNew) {
    if (this.status !== 'pending') {
      return next(new Error('New inquiries must have pending status'));
    }
  } else {
    const oldStatus = this._oldStatus || 'pending';
    if (!validTransitions[oldStatus].includes(this.status)) {
      return next(new Error(`Invalid status transition from ${oldStatus} to ${this.status}`));
    }
  }

  this._oldStatus = this.status;
  next();
});

module.exports = mongoose.model('Inquiry', inquirySchema);
