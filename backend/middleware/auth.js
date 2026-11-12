const jwt = require('jsonwebtoken');

// Requires "Authorization: Bearer <token>" from POST /api/login.
// Puts the logged-in user's id on req.userId.
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Please log in first.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
};

module.exports = requireAuth;
