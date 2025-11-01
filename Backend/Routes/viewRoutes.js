const express = require('express');
const router = express.Router();
const Package = require('../Models/Package');
const Booking = require('../Models/Booking');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).render('error', { 
        message: 'Access denied. Admin only.',
        error: { status: 403 }
    });
}

// Home/Dashboard - Public view
router.get('/', async (req, res) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.render('dashboard', { 
            title: 'JourneySphere - Travel Dashboard',
            packages
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            error
        });
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us - JourneySphere' });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us - JourneySphere' });
});

// Help page
router.get('/help', (req, res) => {
    res.render('help', { title: 'Help - JourneySphere' });
});

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/user-dashboard');
    }
    res.render('login', { 
        title: 'Login - JourneySphere', 
        error: null,
        currentPage: 'login'
    });
});

// Signup page
router.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/user-dashboard');
    }
    res.render('signup', { 
        title: 'Sign Up - JourneySphere', 
        error: null,
        currentPage: 'signup'
    });
});

// Admin login page
router.get('/admin-login', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.render('admin-login', { 
        title: 'Admin Login - JourneySphere', 
        error: null,
        currentPage: 'admin-login'
    });
});

// User dashboard (requires authentication)
router.get('/user-dashboard', isAuthenticated, async (req, res) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        const bookings = await Booking.find({ userId: req.session.user.id })
            .populate('packageId')
            .sort({ createdAt: -1 });
        
        res.render('user-dashboard', { 
            title: 'My Dashboard - JourneySphere',
            packages,
            bookings
        });
    } catch (error) {
        console.error('Error loading user dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            error
        });
    }
});

// Admin dashboard (requires admin authentication)
router.get('/admin', isAdmin, async (req, res) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        const bookings = await Booking.find()
            .populate('packageId')
            .populate('userId')
            .sort({ createdAt: -1 });
        
        const stats = {
            totalPackages: await Package.countDocuments(),
            totalBookings: await Booking.countDocuments(),
            totalRevenue: await Booking.aggregate([
                {
                    $lookup: {
                        from: 'packages',
                        localField: 'packageId',
                        foreignField: '_id',
                        as: 'package'
                    }
                },
                { $unwind: '$package' },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$package.price', '$travellers'] } }
                    }
                }
            ]).then(result => result[0]?.total || 0)
        };
        
        res.render('admin', { 
            title: 'Admin Dashboard - JourneySphere',
            packages,
            bookings,
            stats
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error loading admin dashboard',
            error
        });
    }
});

// Package form (admin only)
router.get('/package-form', isAdmin, (req, res) => {
    res.render('package-form', { 
        title: 'Add Package - JourneySphere',
        package: null,
        error: null
    });
});

// Edit package (admin only)
router.get('/package-form/:id', isAdmin, async (req, res) => {
    try {
        const package = await Package.findById(req.params.id);
        if (!package) {
            return res.status(404).render('error', { 
                message: 'Package not found',
                error: { status: 404 }
            });
        }
        res.render('package-form', { 
            title: 'Edit Package - JourneySphere',
            package,
            error: null
        });
    } catch (error) {
        console.error('Error loading package:', error);
        res.status(500).render('error', { 
            message: 'Error loading package',
            error
        });
    }
});

// Booking form (requires authentication)
router.get('/booking-form/:packageId', isAuthenticated, async (req, res) => {
    try {
        const package = await Package.findById(req.params.packageId);
        if (!package) {
            return res.status(404).render('error', { 
                message: 'Package not found',
                error: { status: 404 }
            });
        }
        res.render('booking-form', { 
            title: 'Book Package - JourneySphere',
            package,
            error: null
        });
    } catch (error) {
        console.error('Error loading booking form:', error);
        res.status(500).render('error', { 
            message: 'Error loading booking form',
            error
        });
    }
});

// Handle login form submission
router.post('/login', async (req, res) => {
    try {
        const User = require('../Models/User');
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.render('login', { 
                title: 'Login - JourneySphere',
                error: 'Invalid email or password',
                currentPage: 'login'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { 
                title: 'Login - JourneySphere',
                error: 'Invalid email or password',
                currentPage: 'login'
            });
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.redirect('/user-dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            title: 'Login - JourneySphere',
            error: 'An error occurred. Please try again.',
            currentPage: 'login'
        });
    }
});

// Handle signup form submission
router.post('/signup', async (req, res) => {
    try {
        const User = require('../Models/User');
        const { name, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('signup', { 
                title: 'Sign Up - JourneySphere',
                error: 'Passwords do not match',
                currentPage: 'signup'
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.render('signup', { 
                title: 'Sign Up - JourneySphere',
                error: 'Email already registered',
                currentPage: 'signup'
            });
        }

        const user = await User.createWithPassword({
            name,
            email: email.toLowerCase(),
            password,
            role: 'user'
        });

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.redirect('/user-dashboard');
    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup', { 
            title: 'Sign Up - JourneySphere',
            error: 'An error occurred. Please try again.',
            currentPage: 'signup'
        });
    }
});

// Handle admin login
router.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple admin check (in production, use database)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'kishor';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kishor@2004';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.user = {
            id: 'admin',
            name: 'Administrator',
            email: 'admin@journeysphere.com',
            role: 'admin'
        };
        res.redirect('/admin');
    } else {
        res.render('admin-login', { 
            title: 'Admin Login - JourneySphere',
            error: 'Invalid admin credentials',
            currentPage: 'admin-login'
        });
    }
});

// Handle package creation/update
router.post('/package-form', isAdmin, async (req, res) => {
    try {
        const { id, title, description, location, days, price, imageUrl } = req.body;

        const packageData = {
            title,
            description,
            location,
            days: parseInt(days),
            price: parseFloat(price),
            imageUrl: imageUrl || ''
        };

        if (id) {
            // Update existing package
            await Package.findByIdAndUpdate(id, packageData);
        } else {
            // Create new package
            await Package.create(packageData);
        }

        res.redirect('/admin');
    } catch (error) {
        console.error('Error saving package:', error);
        res.render('package-form', { 
            title: 'Package Form - JourneySphere',
            package: req.body,
            error: 'Error saving package. Please try again.'
        });
    }
});

// Handle package deletion
router.post('/package-delete/:id', isAdmin, async (req, res) => {
    try {
        await Package.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting package:', error);
        res.redirect('/admin');
    }
});

// Handle booking creation
router.post('/booking-form/:packageId', isAuthenticated, async (req, res) => {
    try {
        const package = await Package.findById(req.params.packageId);
        if (!package) {
            return res.status(404).render('error', { 
                message: 'Package not found',
                error: { status: 404 }
            });
        }

        const { name, email, phone, travellers, startDate } = req.body;

        await Booking.create({
            packageId: package._id,
            packageTitle: package.title,
            userId: req.session.user.id,
            userEmail: email,
            name,
            phone,
            travellers: parseInt(travellers),
            startDate: new Date(startDate)
        });

        res.redirect('/user-dashboard');
    } catch (error) {
        console.error('Error creating booking:', error);
        const package = await Package.findById(req.params.packageId);
        res.render('booking-form', { 
            title: 'Book Package - JourneySphere',
            package,
            error: 'Error creating booking. Please try again.'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
