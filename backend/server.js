
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

// Game routes (themes, lobbies, rounds, voting)
const gameRoutes = require('./routes/gameRoutes');
app.use('/api', gameRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Impostor Game API is running!' });
});

// Connect to database and start server (skipped when tests import the app)
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

module.exports = app;
