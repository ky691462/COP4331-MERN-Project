
const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/mailer');

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000;       // 1 hour

// Same rules as the checklist on the register page.
const passwordProblem = (password) => {
    if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-z]/.test(password)) return 'Password needs a lowercase letter.';
    if (!/[A-Z]/.test(password)) return 'Password needs an uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password needs a number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password needs a special character.';
    return null;
};

const isEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// A random token goes in the email; only its SHA-256 hash is stored.
const newToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
};
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const startVerification = async (user) => {
    const { token, hash } = newToken();
    user.verifyTokenHash = hash;
    user.verifyTokenExpires = new Date(Date.now() + VERIFY_TTL_MS);
    await user.save();
    await sendVerificationEmail(user, token);
};

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: 'Please provide all required fields.'
            });
        }

        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'An account with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        let emailSent = true;
        try {
            await startVerification(user);
        } catch (error) {
            console.error(error);
            emailSent = false;
        }

        return res.status(201).json({
            message: emailSent
                ? 'Account created. Check your email for a link to verify your account.'
                : "Account created, but we couldn't send the verification email. Try resending it.",
            userId: user._id,
            emailSent
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Server error during registration.'
        });
    }
};

// Log in an existing user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in.',
                needsVerification: true
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Server error during login.'
        });
    }
};

// POST /api/verify-email  { token }  (token comes from the emailed link)
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Missing verification token.' });
        }

        const user = await User.findOne({
            verifyTokenHash: hashToken(token),
            verifyTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'This verification link is invalid or has expired. Request a new one.'
            });
        }

        user.emailVerified = true;
        user.verifyTokenHash = undefined;
        user.verifyTokenExpires = undefined;
        await user.save();

        return res.status(200).json({ message: 'Email verified. You can log in now.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error during verification.' });
    }
};

// POST /api/resend-verification  { email }
const resendVerification = async (req, res) => {
    // Same answer whether or not the account exists, so this can't be used
    // to find out who has an account.
    const reply = { message: 'If that account exists and is not verified yet, a new link is on its way.' };
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide your email.' });
        }
        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (user && !user.emailVerified) {
            await startVerification(user);
        }
        return res.status(200).json(reply);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Couldn't send the email. Please try again." });
    }
};

// POST /api/forgot-password  { email }
const forgotPassword = async (req, res) => {
    const reply = { message: 'If an account uses that email, a reset link is on its way.' };
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide your email.' });
        }
        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (user) {
            const { token, hash } = newToken();
            user.resetTokenHash = hash;
            user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
            await user.save();
            await sendPasswordResetEmail(user, token);
        }
        return res.status(200).json(reply);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Couldn't send the email. Please try again." });
    }
};

// POST /api/reset-password  { token, password }
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Missing token or new password.' });
        }

        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const user = await User.findOne({
            resetTokenHash: hashToken(token),
            resetTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'This reset link is invalid or has expired. Request a new one.'
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetTokenHash = undefined;
        user.resetTokenExpires = undefined;
        // Getting the reset email proves they own the address.
        user.emailVerified = true;
        await user.save();

        return res.status(200).json({ message: 'Password updated. You can log in now.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error during password reset.' });
    }
};

module.exports = {
    registerUser, loginUser, verifyEmail, resendVerification, forgotPassword, resetPassword
};
