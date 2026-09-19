const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const analyticsController = require('../controllers/analyticsController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ==========================================
// 1. ANALYTICS & REPORTING (Phase 12)
// ==========================================
router.get('/analytics/overview', analyticsController.getUserAndTripAnalytics);
router.get('/analytics/accessibility', analyticsController.getAccessibilityUsageReports);

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// ==========================================
// 3. DESTINATIONS
// ==========================================
router.get('/destinations', adminController.getDestinations);
router.post('/destinations', adminController.createDestination);
router.put('/destinations/:id', adminController.updateDestination);
router.delete('/destinations/:id', adminController.deleteDestination);

// ==========================================
// 4. ATTRACTIONS
// ==========================================
router.get('/attractions', adminController.getAttractions);
router.post('/attractions', adminController.createAttraction);
router.put('/attractions/:id', adminController.updateAttraction);
router.delete('/attractions/:id', adminController.deleteAttraction);

// ==========================================
// 5. HOTELS
// ==========================================
router.get('/hotels', adminController.getHotels);
router.post('/hotels', adminController.createHotel);
router.put('/hotels/:id', adminController.updateHotel);
router.delete('/hotels/:id', adminController.deleteHotel);

// ==========================================
// 6. REVIEWS & ACCESSIBILITY VERIFICATION
// ==========================================
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/verify', adminController.verifyReview);
router.delete('/reviews/:id', adminController.deleteReview);

// ==========================================
// 7. PARTNERS
// ==========================================
router.get('/partners', adminController.getPartners);
router.post('/partners', adminController.createPartner);
router.put('/partners/:id', adminController.updatePartner);
router.delete('/partners/:id', adminController.deletePartner);

// ==========================================
// 8. TRIPS
// ==========================================
router.get('/trips', adminController.getTrips);

module.exports = router;
