const router = require('express').Router();
const menuController = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/categories', menuController.getCategories);
router.get('/items',      menuController.getMenuItems);
router.get('/items/:id',  menuController.getMenuItemById);
router.get('/recommendations', authenticate, menuController.getAIRecommendations);

router.post('/items',       authenticate, authorize('admin'), menuController.createMenuItem);
router.put('/items/:id',    authenticate, authorize('admin'), menuController.updateMenuItem);
router.delete('/items/:id', authenticate, authorize('admin'), menuController.deleteMenuItem);

module.exports = router;
