const express = require('express');
const router = express.Router();
const PositionController = require('../controllers/positionController');

router.get('/', PositionController.getPositions);
router.get('/:id', PositionController.getPositionById);

module.exports = router;
