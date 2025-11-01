const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();
const MongoConn = require("./MongoConn");

// Import routes
const authRoutes = require('./Routes/auth');
const packageRoutes = require('./Routes/package');
const bookingRoutes = require('./Routes/bookings');

const app = express();
const port = process.env.PORT || 8000;

// Set up EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user?.role === 'admin' || false;
    next();
});

// API Routes (keep for potential API usage)
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);

// View Routes
const viewRoutes = require('./Routes/viewRoutes');
app.use('/', viewRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server after MongoDB connection
MongoConn.then(() => {
    app.listen(port, () => {
        console.log("Backend is running on port:", port);
        console.log("View application at: http://localhost:" + port);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
});