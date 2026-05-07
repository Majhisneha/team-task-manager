const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);
router.get('/', requireProjectAdmin, getDashboard);

module.exports = router;
