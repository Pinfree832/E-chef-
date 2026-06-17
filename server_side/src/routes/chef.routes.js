const router = require('express').Router();
const chefController = require('../controllers/chef.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/portfolio')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public
router.get('/', chefController.getChefs);
router.get('/:id', chefController.getChefById);
router.get('/:id/availability', chefController.getAvailability);

// Chef only
router.put('/me/profile',      authenticate, authorize('chef'), chefController.updateChefProfile);
router.put('/me/availability', authenticate, authorize('chef'), chefController.setAvailability);
router.post('/me/portfolio',   authenticate, authorize('chef'), upload.single('image'), chefController.addPortfolio);
router.get('/me/earnings',     authenticate, authorize('chef'), chefController.getEarnings);
router.put('/me/menu',         authenticate, authorize('chef'), chefController.updateMenuItems);
router.post('/me/location',    authenticate, authorize('chef'), chefController.updateLocation);

module.exports = router;
