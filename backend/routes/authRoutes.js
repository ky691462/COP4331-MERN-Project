
const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// Registration endpoint (sends a verification email)
router.post('/register', registerUser);

// Login endpoint (only for verified emails)
router.post('/login', loginUser);

// Email verification
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset by email
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
