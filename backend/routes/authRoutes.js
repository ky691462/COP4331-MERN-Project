
const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser
} = require('../controllers/authController');

// Registration endpoint
router.post('/register', registerUser);

// Login endpoint
router.post('/login', loginUser);

module.exports = router;
