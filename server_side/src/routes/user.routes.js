const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/profile',    userController.getProfile);
router.put('/profile',    userController.updateProfile);
router.put('/password',   userController.changePassword);

router.get('/addresses',          userController.getAddresses);
router.post('/addresses',         userController.addAddress);
router.put('/addresses/:id',      userController.updateAddress);
router.delete('/addresses/:id',   userController.deleteAddress);

router.get('/favorites',              userController.getFavoriteChefs);
router.post('/favorites/:chef_id',    userController.toggleFavoriteChef);
router.delete('/favorites/:chef_id',  userController.toggleFavoriteChef);

router.get('/loyalty',        userController.getLoyaltyInfo);
router.get('/notifications',  userController.getNotifications);

module.exports = router;
