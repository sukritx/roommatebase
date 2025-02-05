const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    personality: String,
    morningOrLateNight: String,
    cleanliness: String,
    partying: String,
    smoking: String,
    hobbies: [String],
    faculty: { type: String },
    year: { type: Number },
    contactInfo: { ig: String },
    createdForms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }],
    privacySettings: {
        showLastName: { type: Boolean, default: false },
        showContactInfo: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
