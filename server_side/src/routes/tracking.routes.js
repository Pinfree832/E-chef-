const router = require('express').Router();
const trackingController = require('../controllers/tracking.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/location',                    authorize('chef'),     trackingController.updateChefLocation);
router.get('/booking/:booking_id',          authorize('customer'), trackingController.getChefLocation);
router.get('/booking/:booking_id/history',  trackingController.getTrackingHistory);

module.exports = router;
