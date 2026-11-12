
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // Email verification: users can't log in until they click the link.
    emailVerified: {
        type: Boolean,
        default: false
    },
    // Only a hash of each emailed token is stored, so a database leak
    // can't be used to verify accounts or reset passwords.
    verifyTokenHash: String,
    verifyTokenExpires: Date,
    resetTokenHash: String,
    resetTokenExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
