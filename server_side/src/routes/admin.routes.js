const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard',          adminController.getDashboardStats);
router.get('/users',              adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/chefs/pending',      adminController.getPendingChefs);
router.patch('/chefs/:id/verify', adminController.verifyChef);
router.get('/bookings',           adminController.getAllBookings);
router.get('/disputes',           adminController.getDisputes);
router.patch('/disputes/:id/resolve', adminController.resolveDispute);
router.get('/commission',         adminController.getCommissionSettings);
router.post('/commission',        adminController.updateCommissionSettings);
router.get('/revenue-report',     adminController.getRevenueReport);
router.post('/refunds',           adminController.processRefund);

module.exports = router;
