const router = require('express').Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.get('/chef/:chef_id', reviewController.getChefReviews);
router.post('/booking/:booking_id', authenticate, authorize('customer'), validate(schemas.createReview), reviewController.createReview);
router.post('/:review_id/reply', authenticate, authorize('chef'), reviewController.replyToReview);

module.exports = router;
