const PositionModel = require('../models/positionModel');
const BranchModel = require('../models/branchModel');

const PositionController = {
    // GET /api/positions (Public)
    async getPositions(req, res, next) {
        try {
            const { branch_id, department_id, search } = req.query;

            const positions = await PositionModel.findAll({
                onlyActive: true, // Only OPEN, branch ACTIVE, deadline valid
                branch_id: branch_id ? parseInt(branch_id, 10) : null,
                department_id: department_id ? parseInt(department_id, 10) : null,
                search: search ? search.trim() : null
            });

            return res.status(200).json({
                success: true,
                count: positions.length,
                data: positions
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/positions/:id (Public)
    async getPositionById(req, res, next) {
        try {
            const position = await PositionModel.findById(req.params.id);
            if (!position) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy vị trí tuyển dụng này.'
                });
            }

            return res.status(200).json({
                success: true,
                data: position
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = PositionController;
