const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../Models/Booking');
const Package = require('../Models/Package');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Please login to continue' });
}

// Create Razorpay order
router.post('/create-order', isAuthenticated, async (req, res) => {
    try {
        const { packageId, travellers } = req.body;

        // Validate input
        if (!packageId || !travellers || travellers < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid booking details' 
            });
        }

        // Get package details
        const package = await Package.findById(packageId);
        if (!package) {
            return res.status(404).json({ 
                success: false, 
                message: 'Package not found' 
            });
        }

        // Calculate total amount
        const totalAmount = package.price * parseInt(travellers);
        const amountInPaise = Math.round(totalAmount * 100); // Razorpay expects amount in paise

        // Create Razorpay order
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                packageId: package._id.toString(),
                packageTitle: package.title,
                userId: req.session.user.id,
                travellers: travellers
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            orderId: order.id,
            amount: totalAmount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            packageTitle: package.title
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create payment order' 
        });
    }
});

// Verify payment and create booking
router.post('/verify-payment', isAuthenticated, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingDetails
        } = req.body;

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed' 
            });
        }

        // Get package details
        const package = await Package.findById(bookingDetails.packageId);
        if (!package) {
            return res.status(404).json({ 
                success: false, 
                message: 'Package not found' 
            });
        }

        // Calculate total amount
        const totalAmount = package.price * parseInt(bookingDetails.travellers);

        // Create booking
        const booking = await Booking.create({
            packageId: package._id,
            packageTitle: package.title,
            userId: req.session.user.id,
            userEmail: bookingDetails.email,
            name: bookingDetails.name,
            phone: bookingDetails.phone,
            travellers: parseInt(bookingDetails.travellers),
            startDate: new Date(bookingDetails.startDate),
            totalAmount: totalAmount,
            paymentStatus: 'completed',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });

        res.json({
            success: true,
            message: 'Booking confirmed successfully!',
            bookingId: booking._id
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify payment' 
        });
    }
});

// Handle payment failure
router.post('/payment-failed', isAuthenticated, async (req, res) => {
    try {
        const { orderId, bookingDetails } = req.body;

        // Get package details
        const package = await Package.findById(bookingDetails.packageId);
        if (!package) {
            return res.status(404).json({ 
                success: false, 
                message: 'Package not found' 
            });
        }

        // Calculate total amount
        const totalAmount = package.price * parseInt(bookingDetails.travellers);

        // Create booking with failed payment status
        const booking = await Booking.create({
            packageId: package._id,
            packageTitle: package.title,
            userId: req.session.user.id,
            userEmail: bookingDetails.email,
            name: bookingDetails.name,
            phone: bookingDetails.phone,
            travellers: parseInt(bookingDetails.travellers),
            startDate: new Date(bookingDetails.startDate),
            totalAmount: totalAmount,
            paymentStatus: 'failed',
            razorpayOrderId: orderId
        });

        res.json({
            success: true,
            message: 'Booking saved with failed payment status',
            bookingId: booking._id
        });

    } catch (error) {
        console.error('Error handling failed payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save booking' 
        });
    }
});

module.exports = router;
