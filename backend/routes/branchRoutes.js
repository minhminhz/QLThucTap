const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/branchController');

router.get('/', BranchController.getBranches);
router.get('/:id', BranchController.getBranchById);

module.exports = router;
