# VYMI Tech - Hệ Thống Quản Lý Tuyển Dụng & Đào Tạo Thực Tập Sinh Đa Cơ Sở
**Internship Management System (IMS)** — Giải pháp số hóa toàn diện quy trình tuyển dụng, quản trị đào tạo thực tập sinh, đánh giá năng lực và cấp chứng nhận doanh nghiệp chuẩn hóa.

---

## 1. Giới thiệu tổng quan

**VYMI Tech Internship Management System** là nền tảng quản trị khép kín dành cho các doanh nghiệp công nghệ hoạt động theo mô hình đa cơ sở/chi nhánh (Hà Nội, Đà Nẵng, TP. Hồ Chí Minh,...). Hệ thống kết nối liền mạch 5 nhóm người dùng trong cùng một hệ sinh thái:

```
[ ỨNG VIÊN ] ──(Nộp CV)──> [ HR DUYỆT ĐƠN ] ──(Nâng cấp)──> [ THỰC TẬP SINH ]
                                    │                               │
                               (Phân công)                     (Giao việc)
                                    ▼                               ▼
                             [ MENTOR HƯỚNG DẪN ] ──────────> [ CHẤM BÀI & ĐÁNH GIÁ ]
                                                                    │
                             [ KÝ & CẤP CHỨNG CHỈ ] <───────────────┘
                                    │
                             [ DEAL TUYỂN DỤNG ]
```

---

## 2. Hệ thống phân quyền (5 Roles)

| Vai trò | Phân quyền & Chức năng chính |
| :--- | :--- |
| **ADMIN**<br>*(Quản trị viên)* | • Toàn quyền quản trị hệ thống đa chi nhánh.<br>• Quản lý cơ sở (Hà Nội, Đà Nẵng, HCM, Cần Thơ...), phòng ban chuyên môn.<br>• Quản trị tài khoản tập trung: Tạo, khóa, phân quyền và giám sát tất cả người dùng.<br>• Xem bảng điều khiển thống kê tổng thể toàn hệ thống. |
| **HR**<br>*(Quản lý nhân sự)* | • Đăng tin, cập nhật và quản lý các vị trí tuyển dụng theo từng cơ sở.<br>• Tiếp nhận, xem trước CV trực tuyến và xét duyệt/từ chối hồ sơ ứng viên.<br>• Duyệt trúng tuyển $\rightarrow$ tự động nâng cấp ứng viên thành Thực tập sinh (Intern).<br>• Phân công Mentor cùng cơ sở hướng dẫn thực tập sinh.<br>• Đặt lịch hẹn Deal Meeting phỏng vấn tuyển dụng chính thức sau kỳ thực tập.<br>• Xét duyệt yêu cầu và phát hành Chứng chỉ / Giấy chứng nhận thực tập số. |
| **MENTOR**<br>*(Người hướng dẫn)* | • Quản lý danh sách thực tập sinh được phân công theo cơ sở.<br>• Tạo và giao nhiệm vụ (Task) kèm hạn chót và tài liệu hướng dẫn đính kèm.<br>• Kiểm tra tiến độ, tải bài nộp, nghiệm thu và chấm điểm bài tập.<br>• Thực hiện Đánh giá cuối kỳ đa tiêu chí (Hiệu suất, Kỷ luật, Năng lực chuyên môn, Kỹ năng mềm) và đề xuất tuyển dụng (PASS/FAIL). |
| **INTERN**<br>*(Thực tập sinh)* | • Xem thông tin kỳ thực tập, thông tin người hướng dẫn (Mentor) trực tiếp.<br>• Quản lý danh sách nhiệm vụ được giao (TODO $\rightarrow$ IN PROGRESS $\rightarrow$ SUBMITTED $\rightarrow$ COMPLETED).<br>• Nộp bài làm kèm ghi chú mô tả và file đính kèm đa định dạng.<br>• Cập nhật thông tin sinh viên (MSSV, Trường, Khoa, Niên khóa) để in chứng nhận.<br>• Xem bảng đánh giá năng lực của Mentor và phản hồi lịch hẹn Deal tuyển dụng.<br>• Yêu cầu cấp và tải xuống Giấy chứng nhận thực tập chuẩn PDF. |
| **APPLICANT**<br>*(Ứng viên)* | • Tra cứu các vị trí thực tập đang mở theo từng cơ sở và phòng ban.<br>• Tải lên, quản lý kho CV cá nhân (PDF, DOC, DOCX) và xem trước trực tuyến.<br>• Nộp đơn ứng tuyển trực tuyến kèm thư giới thiệu (Cover Letter).<br>• Theo dõi trạng thái xét duyệt hồ sơ theo thời gian thực (PENDING $\rightarrow$ REVIEWING $\rightarrow$ APPROVED / REJECTED). |

---

## 3. Công nghệ sử dụng (Tech Stack)

### **Backend**
- **Runtime**: Node.js (v18 trở lên)
- **Framework**: Express.js (RESTful API architecture)
- **Database**: MySQL 8.x (sử dụng connection pool qua `mysql2/promise`)
- **Xác thực & Bảo mật**: JSON Web Token (JWT), `bcryptjs` băm mật khẩu đa lớp
- **Upload dữ liệu**: `multer` hỗ trợ upload CV, đính kèm đề bài và bài nộp an toàn
- **Xử lý ngoại lệ & Kiểm soát dữ liệu**: 
  - Kiến trúc Global Exception Handler (`AppError`, `asyncHandler`, `errorMiddleware`)
  - Chuyển đổi mã lỗi MySQL (`ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW`,...) thành HTTP status code thân thiện
  - Bộ kiểm tra dữ liệu tập trung (`validators.js` cho email, số điện thoại, thang điểm 0–10, ngày tháng)

### **Frontend**
- **Thư viện UI**: React 19
- **Build tool**: Vite 8 (Hot Module Replacement siêu tốc)
- **Định tuyến**: React Router DOM v7
- **Giao diện**: Bootstrap 5.3 + Bootstrap Icons
- **Kết nối API**: Axios (tích hợp Global Interceptor tự động đính kèm JWT và bắt lỗi 401)
- **Xuất văn bản**: `html2pdf.js` hỗ trợ tải xuống Giấy xác nhận & Chứng chỉ thực tập chuẩn A4 sắc nét

---

## 4. Cấu trúc thư mục dự án

```
QLThucTap/
├── backend/                        # Nguồn mã nguồn Backend API
│   ├── config/                     # Cấu hình CSDL (db.js)
│   ├── controllers/                # Bộ điều khiển xử lý nghiệp vụ
│   │   ├── adminController.js      # Nghiệp vụ Quản trị viên
│   │   ├── applicationController.js# Nghiệp vụ nộp & xét duyệt đơn
│   │   ├── authController.js       # Xác thực, đăng ký, đăng nhập, đổi MK
│   │   ├── branchController.js     # Quản lý cơ sở / chi nhánh
│   │   ├── cvController.js         # Upload và tải/xem CV
│   │   ├── departmentController.js # Quản lý phòng ban
│   │   ├── hrController.js         # Nghiệp vụ nhân sự, tuyển dụng & chứng chỉ
│   │   ├── mentorController.js     # Đánh giá & hướng dẫn thực tập
│   │   ├── notificationController.js# Thông báo nội bộ hệ thống
│   │   ├── positionController.js   # Vị trí thực tập
│   │   └── taskController.js       # Giao việc, nộp bài, deal meeting
│   ├── middlewares/                # Auth, Role, Upload & Error Middlewares
│   ├── models/                     # Thao tác dữ liệu trực tiếp với MySQL
│   ├── routes/                     # Định nghĩa các endpoint API
│   ├── services/                   # Dịch vụ thông báo (notificationService.js)
│   ├── uploads/                    # Thư mục lưu trữ CV và tệp tin đính kèm
│   ├── utils/                      # AppError, asyncHandler, validators.js
│   ├── .env.example                # Mẫu biến môi trường Backend
│   ├── app.js                      # Cấu hình Express app
│   └── server.js                   # Điểm khởi động máy chủ HTTP
│
├── frontend/                       # Nguồn mã nguồn giao diện React
│   ├── src/
│   │   ├── components/             # Navbar, Footer, Loading, Modal, Cards
│   │   ├── contexts/               # AuthContext, NotificationContext
│   │   ├── layouts/                # PublicLayout, DashboardLayout
│   │   ├── pages/                  # Các trang theo phân quyền (admin, hr, mentor, intern, applicant)
│   │   ├── routes/                 # Cấu hình router & Protected Routes
│   │   └── services/               # Axios client (api.js)
│   └── vite.config.js              # Cấu hình Vite & Reverse Proxy
│
├── database/                       # Kịch bản cơ sở dữ liệu
│   ├── schema.sql                  # Cấu trúc bảng CSDL
│   ├── seed.sql                    # Dữ liệu mẫu (Cơ sở, Phòng ban, Tài khoản demo)
│   ├── migrate_deal_and_evaluation.js # Migration lịch hẹn phỏng vấn & tiêu chí điểm
│   ├── migrate_student_fields.js   # Migration trường thông tin sinh viên
│   └── migrate_completion_flow.js  # Migration quy trình kết thúc thực tập
└── README.md                       # Tài liệu hướng dẫn dự án
```

---

## 5. Hướng dẫn cài đặt và chạy dự án

### 5.1. Yêu cầu môi trường
- **Node.js**: Phiên bản `>= 18.0.0` ([Tải Node.js](https://nodejs.org/))
- **MySQL Server**: Phiên bản `>= 8.0` (XAMPP, WampServer hoặc MySQL Community Server)
- **Git**: Đã cài đặt trên máy tính

---

### 5.2. Bước 1: Khởi tạo Cơ sở dữ liệu MySQL

1. Mở công cụ quản trị MySQL (phpMyAdmin, MySQL Workbench, DBeaver hoặc dòng lệnh `mysql`).
2. Tạo cơ sở dữ liệu có tên `vymi_internship`:
   ```sql
   CREATE DATABASE IF NOT EXISTS `vymi_internship` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Chạy lần lượt các file script trong thư mục `database/`:
   - Import file `database/schema.sql` (Tạo bảng).
   - Import file `database/seed.sql` (Nạp dữ liệu mẫu ban đầu).
4. *(Tùy chọn nếu cần cập nhật cấu trúc mới nhất)*: Chạy các file migration bổ sung:
   ```bash
   node database/migrate_student_fields.js
   node database/migrate_deal_and_evaluation.js
   node database/migrate_completion_flow.js
   ```

---

### 5.3. Bước 2: Cài đặt và cấu hình Backend

1. Mở cửa sổ dòng lệnh và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env`:
   - Sao chép từ file mẫu:
     ```bash
     cp .env.example .env
     ```
   - Chỉnh sửa nội dung file `.env` phù hợp với máy tính của bạn:
     ```env
     PORT=5000
     NODE_ENV=development

     # Cấu hình MySQL của bạn
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=vymi_internship

     # Khóa bí mật JWT
     JWT_SECRET=vymi_tech_internship_secret_key_2026_jwt
     JWT_EXPIRES_IN=7d
     ```
4. Khởi chạy Backend Server:
   ```bash
   npm start
   ```
   > Server sẽ chạy tại: **http://localhost:5000**  
   > Kiểm tra sức khỏe API: **http://localhost:5000/api/health**

---

### 5.4. Bước 3: Cài đặt và chạy Frontend

1. Mở một cửa sổ dòng lệnh **mới** và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
   > Giao diện người dùng sẽ chạy tại: **http://localhost:5173**

---

## 6. Danh sách tài khoản thử nghiệm (Demo Accounts)

**Mật khẩu chung cho tất cả các tài khoản mặc định:** `123456`

| Vai trò | Email đăng nhập | Mô tả & Cơ sở |
| :--- | :--- | :--- |
| **Admin** | `admin@vymi.tech` | Toàn quyền quản trị cấp cao toàn hệ thống |
| **HR (Hà Nội)** | `hr.hanoi@vymi.tech` | Quản lý tuyển dụng & thực tập cơ sở Hà Nội |
| **HR (Đà Nẵng)** | `hr.danang@vymi.tech` | Quản lý tuyển dụng & thực tập cơ sở Đà Nẵng |
| **HR (TP. HCM)** | `hr.hcm@vymi.tech` | Quản lý tuyển dụng & thực tập cơ sở Hồ Chí Minh |
| **Mentor (Hà Nội)** | `mentor.hn1@vymi.tech` | Hướng dẫn chuyên môn Kỹ thuật phần mềm (HN) |
| **Mentor (Đà Nẵng)** | `mentor.dn@vymi.tech` | Hướng dẫn chuyên môn QA/QC (Đà Nẵng) |
| **Mentor (TP. HCM)** | `mentor.hcm@vymi.tech` | Hướng dẫn chuyên môn AI & Data (TP. HCM) |
| **Intern (Hà Nội)** | `intern.hn@vymi.tech` | Thực tập sinh đang tham gia kỳ thực tập tại Hà Nội |
| **Intern (Đà Nẵng)** | `intern.dn@vymi.tech` | Thực tập sinh đang tham gia kỳ thực tập tại Đà Nẵng |
| **Ứng viên 1** | `applicant1@gmail.com` | Ứng viên đã nộp hồ sơ tuyển dụng |
| **Ứng viên 2** | `applicant2@gmail.com` | Ứng viên mới đăng ký tài khoản |

---

## 7. Các tính năng nổi bật của dự án

1. **Phân quyền và cô lập dữ liệu theo Chi nhánh (Branch-Scoped Isolation)**:
   - HR và Mentor chỉ xem và quản lý thực tập sinh, vị trí và công việc thuộc cơ sở của mình.
   - Admin có góc nhìn toàn cục, điều phối xuyên suốt các chi nhánh.
2. **Quy trình đánh giá 4 tiêu chí chuẩn hóa**:
   - Thang điểm 0–10 đánh giá chi tiết: Hiệu suất làm việc, Kỷ luật/Tác phong, Năng lực chuyên môn, Kỹ năng mềm.
   - Tự động tính điểm trung bình tổng kết và đưa ra khuyến nghị tuyển dụng chính thức (`PASS` / `FAIL`).
3. **Phỏng vấn tuyển dụng sau thực tập (Hiring Deal Meeting)**:
   - HR đề xuất lịch hẹn và mức lương kỳ vọng; Thực tập sinh có thể bấm Xác nhận tham gia hoặc Từ chối lời mời trực tiếp trên giao diện.
4. **Cấp phát Giấy chứng nhận số & Xuất bản in A4**:
   - Tích hợp xem trước và tải file PDF Giấy chứng nhận hoàn thành thực tập và Bảng đánh giá chi tiết đạt chuẩn văn phòng.
5. **Hệ thống thông báo thời gian thực (In-app Notifications)**:
   - Tự động gửi thông báo khi có nhiệm vụ mới, kết quả xét duyệt đơn, phân công Mentor hoặc phản hồi bài nộp.
6. **Kiến trúc Global Error Handling & Input Validation chặt chẽ**:
   - Ngăn chặn triệt để lỗi sập server do Unhandled Rejection.
   - Chuẩn hóa thông báo lỗi tiếng Việt dễ hiểu cho người dùng cuối.

