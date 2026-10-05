const ApplicationModel = require('../models/applicationModel');
const PositionModel = require('../models/positionModel');
const CvModel = require('../models/cvModel');
const UserModel = require('../models/userModel');

const ApplicationController = {
    // POST /api/applications (Applicant)
    async apply(req, res, next) {
        try {
            const { position_id, cv_id, cover_letter, applicant_name, applicant_email, applicant_phone } = req.body;

            // ── Validate required contact fields ──────────────────────────────
            if (!applicant_name || !String(applicant_name).trim()) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập họ và tên của bạn.' });
            }
            if (!applicant_email || !String(applicant_email).trim()) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email liên hệ.' });
            }
            // Basic email format check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(applicant_email).trim())) {
                return res.status(400).json({ success: false, message: 'Địa chỉ email không đúng định dạng.' });
            }
            if (!applicant_phone || !String(applicant_phone).trim()) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại liên hệ.' });
            }
            // Phone: 10-11 digits, may start with +84
            const phoneRegex = /^(\+84|0)[0-9]{8,10}$/;
            if (!phoneRegex.test(String(applicant_phone).trim().replace(/\s/g, ''))) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không đúng định dạng (VD: 0912345678).' });
            }

            if (!position_id || !cv_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn Vị trí thực tập và File CV đính kèm.'
                });
            }

            // 1. Check Position
            const position = await PositionModel.findById(position_id);
            if (!position) {
                return res.status(404).json({
                    success: false,
                    message: 'Vị trí thực tập không tồn tại.'
                });
            }

            // 2. Check Branch Status
            if (position.branch_status !== 'ACTIVE') {
                return res.status(400).json({
                    success: false,
                    message: 'Cơ sở tuyển dụng này hiện đang tạm ngừng hoạt động.'
                });
            }

            // 3. Check Position Status
            if (position.status !== 'OPEN') {
                return res.status(400).json({
                    success: false,
                    message: 'Vị trí thực tập này đã đóng tuyển dụng.'
                });
            }

            // 4. Check Deadline
            const today = new Date().toISOString().split('T')[0];
            const deadline = new Date(position.deadline).toISOString().split('T')[0];
            if (deadline < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Vị trí thực tập này đã hết hạn nộp hồ sơ.'
                });
            }

            // 5. Check CV ownership
            const cv = await CvModel.findById(cv_id);
            if (!cv || cv.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'CV đính kèm không hợp lệ hoặc không thuộc về bạn.'
                });
            }

            // 6. Check duplicate active application
            const activeApp = await ApplicationModel.findActiveApplication(req.user.id, position_id);
            if (activeApp) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã có hồ sơ đang được xét duyệt cho vị trí này. Vui lòng không nộp trùng lặp.'
                });
            }

            // 7. Auto-update user profile with provided contact info (fill missing fields)
            try {
                const currentUser = await UserModel.findById(req.user.id);
                const updatePayload = {};
                if (!currentUser.full_name || currentUser.full_name !== String(applicant_name).trim()) {
                    updatePayload.full_name = String(applicant_name).trim();
                }
                if (!currentUser.phone && applicant_phone) {
                    updatePayload.phone = String(applicant_phone).trim().replace(/\s/g, '');
                }
                if (Object.keys(updatePayload).length > 0) {
                    await UserModel.updateProfile(req.user.id, updatePayload);
                }
            } catch (_) {
                // Profile update is best-effort; don't block application
            }

            // 8. Create application
            const applicationId = await ApplicationModel.create({
                position_id,
                applicant_id: req.user.id,
                cv_id,
                cover_letter
            });

            const newApp = await ApplicationModel.findById(applicationId);

            return res.status(201).json({
                success: true,
                message: 'Nộp đơn ứng tuyển thành công!',
                data: newApp
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/applications/my (Applicant)
    async getMyApplications(req, res, next) {
        try {
            const applications = await ApplicationModel.findByApplicantId(req.user.id);
            return res.status(200).json({
                success: true,
                data: applications
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/applications/:id
    async getApplicationById(req, res, next) {
        try {
            const application = await ApplicationModel.findById(req.params.id);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hồ sơ ứng tuyển này.'
                });
            }

            // Ownership & scope check
            if (req.user.role === 'APPLICANT' && application.applicant_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem đơn ứng tuyển của người khác.'
                });
            }

            if (req.user.role === 'HR' && application.branch_id !== req.user.branch_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền xem hồ sơ thuộc cơ sở của mình.'
                });
            }

            return res.status(200).json({
                success: true,
                data: application
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = ApplicationController;
