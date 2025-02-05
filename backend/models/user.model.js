const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String },
  googleId: { type: String },
  role: {
    type: String,
    enum: ['student', 'owner'],
    required: true,
    default: 'student'
  },
  profile: {
    age: { type: Number },
    gender: { type: String },
    university: String,
    work: String,
    hobbies: [String],
    profilePicture: {
      url: String,
      key: String
    },
    roommatePreferences: {
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      noise: { type: String, enum: ['quiet', 'moderate', 'loud'] },
      visitors: { type: String, enum: ['none', 'occasional', 'frequent'] },
      lifestyle: [String],
      morningOrLateNight: { 
        type: String,
        enum: ['morning', 'night', 'flexible']
      },
      cleanliness: {
        type: String,
        enum: ['very_clean', 'clean', 'moderate', 'relaxed']
      },
      partying: {
        type: String,
        enum: ['never', 'occasionally', 'frequently']
      }
    }
  },
  faculty: { type: String },
  year: { type: Number },
  contactInfo: {
    ig: String,
    phone: String,
    email: String
  },
  createdRooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  sentInquiries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquiry'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  privacySettings: {
    showLastName: { type: Boolean, default: false },
    showContactInfo: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure user has required fields based on role
userSchema.pre('save', function(next) {
  if (this.role === 'student' && !this.profile.roommatePreferences) {
    next(new Error('Student users must have roommate preferences'));
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
