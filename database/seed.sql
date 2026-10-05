-- ====================================================================
-- VYMI Tech Internship Management System
-- Seed Data: seed.sql
-- All default user passwords are: 123456
-- (Bcrypt hash: $2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.)
-- ====================================================================

USE `vymi_internship`;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `interns`;
TRUNCATE TABLE `applications`;
TRUNCATE TABLE `cvs`;
TRUNCATE TABLE `internship_positions`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `departments`;
TRUNCATE TABLE `branches`;
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- 1. SEED BRANCHES
-- ====================================================================
INSERT INTO `branches` (`id`, `name`, `address`, `phone`, `status`) VALUES
(1, 'Hà Nội', 'Số 1 Đại Cồ Việt, Quận Hai Bà Trưng, Hà Nội', '024-3869-1234', 'ACTIVE'),
(2, 'Đà Nẵng', 'Tòa nhà FPT, KCN An Đồn, Quận Sơn Trà, Đà Nẵng', '0236-3987-654', 'ACTIVE'),
(3, 'TP. Hồ Chí Minh', 'Tòa nhà Landmark 81, Quận Bình Thạnh, TP. Hồ Chí Minh', '028-3999-8888', 'ACTIVE'),
(4, 'Cần Thơ', 'Đường 30 Tháng 4, Quận Ninh Kiều, Cần Thơ', '0292-3888-999', 'INACTIVE');

-- ====================================================================
-- 2. SEED DEPARTMENTS
-- ====================================================================
INSERT INTO `departments` (`id`, `name`, `description`) VALUES
(1, 'Kỹ thuật phần mềm', 'Phát triển các hệ thống Backend, Frontend và Fullstack'),
(2, 'Kiểm thử chất lượng (QA/QC)', 'Đảm bảo chất lượng sản phẩm phần mềm, viết test case và test tự động'),
(3, 'Trí tuệ nhân tạo (AI & Data)', 'Nghiên cứu ứng dụng mô hình học máy, dữ liệu lớn và AI'),
(4, 'Thiết kế UI/UX', 'Thiết kế giao diện và trải nghiệm người dùng hiện đại'),
(5, 'Quản trị nhân sự (HR)', 'Tuyển dụng, đào tạo và quản lý nguồn nhân lực');

-- ====================================================================
-- 3. SEED USERS
-- Password for all accounts: 123456
-- ====================================================================
INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `phone`, `role`, `branch_id`, `department_id`, `status`) VALUES
-- 3.1 ADMIN (Toàn quyền, không thuộc riêng cơ sở nào: branch_id = NULL)
(1, 'Admin VYMI Tech', 'admin@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0901000001', 'ADMIN', NULL, NULL, 'ACTIVE'),

-- 3.2 HR CÁC CƠ SỞ
(2, 'Nguyễn Thị Mai', 'hr.hanoi@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0901000002', 'HR', 1, 5, 'ACTIVE'),
(3, 'Trần Văn Bình', 'hr.danang@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0901000003', 'HR', 2, 5, 'ACTIVE'),
(4, 'Lê Hoàng Nam', 'hr.hcm@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0901000004', 'HR', 3, 5, 'ACTIVE'),

-- 3.3 MENTOR CÁC CƠ SỞ
(5, 'Phạm Đức Thắng', 'mentor.hn1@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0902000001', 'MENTOR', 1, 1, 'ACTIVE'),
(6, 'Hoàng Thùy Linh', 'mentor.hn2@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0902000002', 'MENTOR', 1, 1, 'ACTIVE'),
(7, 'Vũ Minh Tuấn', 'mentor.dn@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0902000003', 'MENTOR', 2, 2, 'ACTIVE'),
(8, 'Đặng Quốc Huy', 'mentor.hcm@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0902000004', 'MENTOR', 3, 3, 'ACTIVE'),

-- 3.4 INTERN (Đã được duyệt trúng tuyển)
(9, 'Đỗ Hải Đăng', 'intern.hn@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0903000001', 'INTERN', 1, 1, 'ACTIVE'),
(10, 'Bùi Phương Anh', 'intern.dn@vymi.tech', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0903000002', 'INTERN', 2, 2, 'ACTIVE'),

-- 3.5 APPLICANT (Đang trong quá trình nộp đơn, chưa gắn cơ sở)
(11, 'Lê Minh Khôi', 'applicant1@gmail.com', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0904000001', 'APPLICANT', NULL, NULL, 'ACTIVE'),
(12, 'Trần Ngọc Ánh', 'applicant2@gmail.com', '$2y$10$rtNTnKK1WiUMvM4zZL2WuOV3SIAh2WHunGZJ.8mgHeTbq/eUMfBe.', '0904000002', 'APPLICANT', NULL, NULL, 'ACTIVE');

-- ====================================================================
-- 4. SEED INTERNSHIP POSITIONS
-- ====================================================================
INSERT INTO `internship_positions` (`id`, `branch_id`, `department_id`, `title`, `description`, `requirements`, `benefits`, `quantity`, `internship_duration`, `deadline`, `status`) VALUES
(1, 1, 1, 'Backend Node.js Intern - Hà Nội', 
 'Tham gia phát triển hệ thống REST API với ExpressJS và MySQL. Thiết kế cơ sở dữ liệu và tối ưu hóa truy vấn.', 
 'Nắm vững JavaScript/Node.js cơ bản, kiến thức về SQL (MySQL). Tinh thần học hỏi cao, chịu khó nghiên cứu.', 
 'Phụ cấp thực tập 3.000.000 - 5.000.000 VNĐ/tháng. Được Mentor 1-1 hướng dẫn, cơ hội lên nhân viên chính thức.', 
 3, '3 tháng', '2026-12-31', 'OPEN'),

(2, 1, 1, 'Frontend React.js Intern - Hà Nội', 
 'Xây dựng giao diện ứng dụng web Single Page Application với React và Tailwind CSS. Kết nối RESTful API.', 
 'Hiểu biết về HTML/CSS, JavaScript ES6+, React Hooks. Ưu tiên có sản phẩm demo cá nhân.', 
 'Môi trường làm việc trẻ trung, linh hoạt, hỗ trợ dấu thực tập và đồ án tốt nghiệp.', 
 2, '3 tháng', '2026-12-31', 'OPEN'),

(3, 2, 2, 'QA/QC Tester Intern - Đà Nẵng', 
 'Viết Test Case, thực hiện kiểm thử chức năng (Manual Testing), kiểm tra lỗi giao diện và báo cáo bug.', 
 'Cẩn thận, tỉ mỉ, có tư duy logic tốt. Hiểu quy trình kiểm thử phần mềm cơ bản.', 
 'Trợ cấp thực tập cạnh tranh, được đào tạo bài bản các công cụ test chuyên nghiệp.', 
 2, '3 tháng', '2026-11-30', 'OPEN'),

(4, 3, 3, 'AI/Machine Learning Intern - TP.HCM', 
 'Tham gia tiền xử lý dữ liệu, thử nghiệm các mô hình học máy và LLM phục vụ bài toán nội bộ doanh nghiệp.', 
 'Thành thạo Python, hiểu biết về Pandas, Scikit-learn, PyTorch hoặc TensorFlow. Đọc hiểu tài liệu tiếng Anh tốt.', 
 'Hỗ trợ máy tính cấu hình cao, phụ cấp hấp dẫn, tham gia dự án thực tế.', 
 2, '3 tháng', '2026-12-15', 'OPEN'),

(5, 1, 4, 'UI/UX Designer Intern - Hà Nội', 
 'Thiết kế wireframe, mockup và prototype cho website trên Figma. Phối hợp với team Frontend.', 
 'Sử dụng thành thạo Figma, tư duy thẩm mỹ hiện đại, hiểu về Design System cơ bản.', 
 'Được Mentor hướng dẫn nâng cao portfolio, trang thiết bị làm việc đầy đủ.', 
 1, '3 tháng', '2026-10-31', 'OPEN'),

(6, 1, 1, 'Java Spring Boot Intern - Hà Nội', 
 'Vị trí thực tập Java Backend đợt trước (đã kết thúc thời hạn tuyển dụng).', 
 'Java core, OOP, Spring Boot cơ bản.', 
 'Phụ cấp hàng tháng.', 
 1, '3 tháng', '2026-01-01', 'CLOSED');

-- ====================================================================
-- 5. SEED CVS
-- ====================================================================
INSERT INTO `cvs` (`id`, `user_id`, `original_name`, `stored_name`, `file_path`, `file_size`, `file_type`) VALUES
(1, 9, 'CV_DoHaiDang_Backend.pdf', 'cv_1727330001_DoHaiDang.pdf', 'uploads/cvs/cv_1727330001_DoHaiDang.pdf', 245000, 'application/pdf'),
(2, 10, 'CV_BuiPhuongAnh_QA.pdf', 'cv_1727330002_BuiPhuongAnh.pdf', 'uploads/cvs/cv_1727330002_BuiPhuongAnh.pdf', 312000, 'application/pdf'),
(3, 11, 'CV_LeMinhKhoi_Frontend.pdf', 'cv_1727330003_LeMinhKhoi.pdf', 'uploads/cvs/cv_1727330003_LeMinhKhoi.pdf', 198000, 'application/pdf'),
(4, 12, 'CV_TranNgocAnh_AI.pdf', 'cv_1727330004_TranNgocAnh.pdf', 'uploads/cvs/cv_1727330004_TranNgocAnh.pdf', 420000, 'application/pdf');

-- ====================================================================
-- 6. SEED APPLICATIONS
-- ====================================================================
INSERT INTO `applications` (`id`, `position_id`, `applicant_id`, `cv_id`, `cover_letter`, `status`, `hr_note`) VALUES
-- 6.1 Đơn của Đỗ Hải Đăng (Đã APPROVED trúng tuyển vào vị trí 1 - Backend HN)
(1, 1, 9, 1, 'Em mong muốn được rèn luyện kỹ năng lập trình Backend thực tế tại cơ sở Hà Nội của công ty.', 'APPROVED', 'Ứng viên kiến thức cơ bản tốt, phỏng vấn đạt, tiếp nhận vào kỳ thực tập.'),

-- 6.2 Đơn của Bùi Phương Anh (Đã APPROVED trúng tuyển vào vị trí 3 - QA ĐN)
(2, 3, 10, 2, 'Em muốn phát triển chuyên sâu trong ngành kiểm thử phần mềm tại Đà Nẵng.', 'APPROVED', 'Thái độ tốt, tư duy test logic, đạt yêu cầu.'),

-- 6.3 Đơn của Lê Minh Khôi (Đang PENDING tại vị trí 2 - Frontend HN)
(3, 2, 11, 3, 'Em có niềm đam mê lớn với ReactJS và muốn đóng góp cho dự án của VYMI Tech.', 'PENDING', NULL),

-- 6.4 Đơn của Trần Ngọc Ánh (Đang REVIEWING tại vị trí 4 - AI TP.HCM)
(4, 4, 12, 4, 'Hồ sơ nghiên cứu học máy của em phù hợp với định hướng của phòng AI tại cơ sở TP.HCM.', 'REVIEWING', 'Hồ sơ bảng điểm xuất sắc, đang xếp lịch phỏng vấn online.');

-- ====================================================================
-- 7. SEED INTERNS
-- ====================================================================
INSERT INTO `interns` (`id`, `user_id`, `application_id`, `position_id`, `branch_id`, `mentor_id`, `start_date`, `end_date`, `status`) VALUES
-- Intern 1: Đỗ Hải Đăng (thuộc Cơ sở 1 - Hà Nội, được gán Mentor 5: Phạm Đức Thắng)
(1, 9, 1, 1, 1, 5, '2026-09-01', '2026-11-30', 'IN_PROGRESS'),

-- Intern 2: Bùi Phương Anh (thuộc Cơ sở 2 - Đà Nẵng, được gán Mentor 7: Vũ Minh Tuấn)
(2, 10, 2, 3, 2, 7, '2026-09-15', '2026-12-15', 'IN_PROGRESS');

-- ====================================================================
-- 8. SEED TASKS
-- ====================================================================
INSERT INTO `tasks` (`id`, `intern_id`, `mentor_id`, `title`, `description`, `deadline`, `status`, `submission_content`, `feedback`) VALUES
-- Task 1 cho Intern 1 (Đã hoàn thành)
(1, 1, 5, 'Tìm hiểu cấu trúc MVC trong Express.js', 
 'Đọc tài liệu Node.js và xây dựng một ứng dụng demo CRUD nhỏ áp dụng mô hình Controller - Model - Route.', 
 '2026-09-15', 'COMPLETED', 
 'Em đã hoàn thành bài tập tại repository: https://github.com/vymi-intern/sample-mvc. Đã triển khai đầy đủ các tầng.', 
 'Làm rất tốt! Code rõ ràng, phân tách đúng trách nhiệm giữa controller và model.'),

-- Task 2 cho Intern 1 (Đang làm)
(2, 1, 5, 'Xây dựng API Authentication với JWT và Bcrypt', 
 'Thực hiện các endpoint: POST /api/auth/register, POST /api/auth/login và middleware verifyToken để bảo vệ route.', 
 '2026-10-15', 'IN_PROGRESS', 
 NULL, NULL),

-- Task 3 cho Intern 2 (Đã nộp bài, chờ Mentor duyệt)
(3, 2, 7, 'Thiết kế Test Case cho tính năng nộp đơn ứng tuyển', 
 'Viết tài liệu Test Case bao gồm kiểm tra validation file CV, kiểm tra trùng lặp đơn nộp, và kiểm tra deadline của vị trí.', 
 '2026-10-05', 'SUBMITTED', 
 'Bản thảo Test Case đã upload lên Google Sheet: https://docs.google.com/spreadsheets/d/vymi-testcase-demo/edit', 
 NULL);
