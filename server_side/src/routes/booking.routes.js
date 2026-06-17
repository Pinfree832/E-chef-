const router = require('express').Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.use(authenticate);

router.post('/',             authorize('customer'), validate(schemas.createBooking), bookingController.createBooking);
router.get('/',              bookingController.getMyBookings);
router.get('/:id',           bookingController.getBookingById);
router.patch('/:id/status',  bookingController.updateBookingStatus);
router.post('/:id/cancel',   bookingController.cancelBooking);

module.exports = router;
