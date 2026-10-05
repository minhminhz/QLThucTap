const fs   = require('fs');
const path = require('path');
const CvModel = require('../models/cvModel');

const CvController = {

    // POST /api/cvs/upload (Applicant)
    async upload(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn file CV (PDF, DOC hoặc DOCX).'
                });
            }

            const relativePath = path.join('uploads', 'cvs', req.file.filename).replace(/\\/g, '/');

            const cvId = await CvModel.create({
                user_id:       req.user.id,
                original_name: req.file.originalname,
                stored_name:   req.file.filename,
                file_path:     relativePath,
                file_size:     req.file.size,
                file_type:     req.file.mimetype
            });

            const newCv = await CvModel.findById(cvId);

            return res.status(201).json({
                success: true,
                message: 'Tải lên CV thành công!',
                data: newCv
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/cvs/my (Applicant)
    async getMyCVs(req, res, next) {
        try {
            const cvs = await CvModel.findByUserId(req.user.id);
            return res.status(200).json({
                success: true,
                data: cvs
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/cvs/:id/view  —  stream file to browser (authenticated)
    // • APPLICANT: can only view their own CV
    // • ADMIN / HR / MENTOR: can view any CV
    async viewCV(req, res, next) {
        try {
            const cv = await CvModel.findById(req.params.id);

            if (!cv) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy CV.' });
            }

            // Ownership check: Applicants and Interns can only view their own CV. Admin, HR, Mentor can view any CV.
            if (['APPLICANT', 'INTERN'].includes(req.user.role) && cv.user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xem CV này.' });
            }

            const cleanPath = (cv.file_path || '').replace(/^[/\\]+/, '');
            const fullPath = path.resolve(__dirname, '..', cleanPath);

            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ success: false, message: 'File CV không còn tồn tại trên server.' });
            }

            const ext = path.extname(cv.original_name || cv.file_path).toLowerCase();
            const stat = fs.statSync(fullPath);

            // Set correct MIME type for browser rendering
            let contentType = cv.file_type || 'application/octet-stream';
            if (ext === '.pdf') {
                contentType = 'application/pdf';
            } else if (ext === '.docx') {
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            } else if (ext === '.doc') {
                contentType = 'application/msword';
            }

            const forceDownload = req.query.download === '1' || req.query.download === 'true';
            const inline = ext === '.pdf' && !forceDownload;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stat.size);
            res.setHeader(
                'Content-Disposition',
                `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(cv.original_name)}"`
            );
            res.setHeader('Cache-Control', 'private, max-age=3600');

            const stream = fs.createReadStream(fullPath);
            stream.pipe(res);

            stream.on('error', (streamErr) => {
                next(streamErr);
            });
        } catch (err) {
            next(err);
        }
    },

    // DELETE /api/cvs/:id (Applicant / Admin)
    async deleteCV(req, res, next) {
        try {
            const cv = await CvModel.findById(req.params.id);
            if (!cv) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy CV này.' });
            }

            if (cv.user_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa CV này.' });
            }

            // Remove file from disk
            const fullPath = path.join(__dirname, '..', cv.file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }

            await CvModel.delete(cv.id);

            return res.status(200).json({ success: true, message: 'Đã xóa CV thành công!' });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = CvController;
