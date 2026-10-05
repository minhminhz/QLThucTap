const BranchModel = require('../models/branchModel');

const BranchController = {
    // GET /api/branches (Public: gets active branches)
    async getBranches(req, res, next) {
        try {
            // If user is ADMIN, can show all branches, otherwise only active
            const onlyActive = !(req.user && req.user.role === 'ADMIN');
            const branches = await BranchModel.findAll(onlyActive);
            return res.status(200).json({
                success: true,
                data: branches
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/branches/:id
    async getBranchById(req, res, next) {
        try {
            const branch = await BranchModel.findById(req.params.id);
            if (!branch) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin cơ sở này.'
                });
            }
            return res.status(200).json({
                success: true,
                data: branch
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = BranchController;
