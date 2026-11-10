
const express = require('express');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Impostor Game API is running!' });
});

// Connect to database and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
