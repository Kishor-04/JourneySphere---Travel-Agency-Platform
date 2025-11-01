# 💳 Razorpay Payment Integration - Setup Guide

## 🎯 What's Been Implemented

✅ **Complete Razorpay payment flow integrated into booking system**

### Features Added:
1. **Payment Gateway Integration**
   - Razorpay Checkout popup
   - Secure payment verification
   - Payment signature validation

2. **Updated Booking Model**
   - `totalAmount` - Calculated price (travellers × package price)
   - `paymentStatus` - 4 states: pending, completed, failed, refunded
   - `razorpayOrderId` - Order ID from Razorpay
   - `razorpayPaymentId` - Payment ID after successful payment
   - `razorpaySignature` - Signature for verification

3. **New Payment Routes** (`Backend/Routes/payment.js`)
   - `POST /api/payment/create-order` - Creates Razorpay order
   - `POST /api/payment/verify-payment` - Verifies payment and creates booking
   - `POST /api/payment/payment-failed` - Handles payment failures

4. **Updated UI**
   - Booking form now opens Razorpay checkout
   - Payment status badges on dashboards (green=completed, yellow=pending, red=failed)
   - Loading states during payment processing

---

## 🚀 Getting Started with Demo/Test Mode

### Step 1: Get Razorpay Test Credentials

1. **Sign up** at [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. After signup, you'll be in **Test Mode** by default
3. Go to **Settings** → **API Keys**
4. Click **Generate Test Key**
5. You'll get:
   - **Key ID**: `rzp_test_xxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxx`

### Step 2: Update `.env` File

Open `Backend/.env` and replace the placeholder values:

```env
# Razorpay Configuration (Test/Demo Mode)
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
```

### Step 3: Restart Your Server

```bash
cd Backend
npm run dev
```

---

## 🧪 Testing Payment Flow

### Test Cards (Razorpay Test Mode)

Use these **test card numbers** for different scenarios:

#### ✅ Successful Payment
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date (e.g., 12/25)
Name: Any name
```

#### ❌ Failed Payment
```
Card Number: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

#### 🔄 Other Test Cards
- **5555 5555 5555 4444** - Mastercard success
- **3782 822463 10005** - American Express success

### Testing Steps:

1. **Login as a user** (not admin)
2. **Go to Dashboard** → Click "Book Now" on any package
3. **Fill booking form** with test data
4. **Click "Proceed to Payment"**
5. **Razorpay popup opens** → Use test card above
6. **Complete payment** → You'll see success message
7. **Check User Dashboard** → Booking shows "Completed" status
8. **Check Admin Dashboard** → Admin can see payment status

---

## 💡 Payment Flow Explained

```
User fills booking form
        ↓
Click "Proceed to Payment"
        ↓
Frontend calls /api/payment/create-order
        ↓
Backend creates Razorpay order
        ↓
Razorpay checkout popup opens
        ↓
User enters card details
        ↓
Payment processed by Razorpay
        ↓
Frontend receives payment response
        ↓
Frontend calls /api/payment/verify-payment
        ↓
Backend verifies signature with crypto
        ↓
Booking created with "completed" status
        ↓
User redirected to dashboard
```

---

## 🎨 Payment Status Badges

| Status | Color | Meaning |
|--------|-------|---------|
| **Completed** | Green | Payment successful |
| **Pending** | Yellow | Payment not yet done |
| **Failed** | Red | Payment attempt failed |
| **Refunded** | Blue | Payment was refunded |

---

## 🔒 Security Features

1. **Signature Verification** - Prevents payment tampering
2. **Server-side validation** - Amount calculated on backend
3. **HTTPS recommended** - For production use
4. **Session-based auth** - Only logged-in users can pay

---

## 🚨 Important Notes

### Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Real Money | ❌ No | ✅ Yes |
| Test Cards | ✅ Works | ❌ Doesn't work |
| Key Prefix | `rzp_test_` | `rzp_live_` |
| Verification | ✅ Required | ✅ Required |

### Before Going Live:

1. **Complete KYC** on Razorpay
2. **Add bank account** for settlements
3. **Switch to Live keys** in `.env`
4. **Test thoroughly** with real cards (small amounts)
5. **Set up webhooks** for payment notifications
6. **Enable HTTPS** on your domain

---

## 📊 Dashboard Features

### User Dashboard
- See all bookings
- Payment status for each booking
- Total amount paid
- Payment ID (for reference)

### Admin Dashboard
- Statistics: Total bookings, total revenue
- All bookings with payment status
- Payment IDs for tracking
- Filter by payment status (future enhancement)

---

## 🛠️ Troubleshooting

### Payment popup doesn't open
- Check browser console for errors
- Verify Razorpay script is loaded: `https://checkout.razorpay.com/v1/checkout.js`
- Check if `RAZORPAY_KEY_ID` is set in `.env`

### Payment verification fails
- Check if `RAZORPAY_KEY_SECRET` is correct
- Look at backend console for error messages
- Verify signature calculation logic

### Booking not created after payment
- Check `/api/payment/verify-payment` endpoint logs
- Verify booking model has all required fields
- Check MongoDB connection

---

## 🎯 Next Steps (Future Enhancements)

1. **Email Notifications** - Send confirmation emails after payment
2. **Refund System** - Admin can issue refunds
3. **Payment History** - Detailed payment logs
4. **Auto-capture** - Configure payment auto-capture time
5. **UPI/Wallet Support** - Enable more payment methods
6. **Invoice Generation** - PDF receipts for bookings

---

## 📞 Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **API Reference**: https://razorpay.com/docs/api/

---

## ✅ Verification Checklist

Before testing, ensure:
- [ ] `razorpay` package installed (`npm list razorpay`)
- [ ] `.env` has valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [ ] Server restarted after .env changes
- [ ] MongoDB connected successfully
- [ ] User is logged in (not admin)
- [ ] Package exists in database

---

**Happy Testing! 🎉**

*Note: This is demo/test mode - no real money is charged. Perfect for development and testing!*
