const DepartmentModel = require('../models/departmentModel');

const DepartmentController = {
    // GET /api/departments
    async getDepartments(req, res, next) {
        try {
            const departments = await DepartmentModel.findAll();
            return res.status(200).json({
                success: true,
                count: departments.length,
                data: departments
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = DepartmentController;
