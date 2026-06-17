const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.post('/register', validate(schemas.register), authController.register);
router.post('/login',    validate(schemas.login),    authController.login);
router.post('/refresh',  authController.refreshToken);
router.post('/logout',   authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
