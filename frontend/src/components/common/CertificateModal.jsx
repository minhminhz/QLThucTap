import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SCORE_TEXT = {
  10: 'Mười điểm',
  9.5: 'Chín phẩy năm điểm',
  9: 'Chín điểm',
  8.5: 'Tám phẩy năm điểm',
  8: 'Tám điểm',
  7.5: 'Bảy phẩy năm điểm',
  7: 'Bảy điểm',
  6.5: 'Sáu phẩy năm điểm',
  6: 'Sáu điểm',
  5.5: 'Năm phẩy năm điểm',
  5: 'Năm điểm'
};

function getScoreText(score) {
  if (!score) return 'Chín điểm';
  const num = parseFloat(score);
  return SCORE_TEXT[num] || `${num} điểm`;
}

function getRatingRank(score) {
  const num = parseFloat(score || 9);
  if (num >= 9.0) return 'Xuất sắc';
  if (num >= 8.0) return 'Giỏi';
  if (num >= 6.5) return 'Khá';
  if (num >= 5.0) return 'Trung bình';
  return 'Không đạt';
}

export default function CertificateModal({ internship: initialInternship, onClose, onUpdate }) {
  const { user } = useAuth();
  const [internship, setInternship] = useState(initialInternship);
  const [activeDoc, setActiveDoc] = useState('CERTIFICATE'); // 'CERTIFICATE' | 'EVALUATION'
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form state for student self-filled details
  const [studentForm, setStudentForm] = useState({
    custom_intern_name: '',
    student_dob: '',
    student_gender: 'Nam',
    student_phone: '',
    student_address: '',
    school_name: '',
    faculty_name: '',
    student_code: '',
    university_class: '',
    major_name: '',
    academic_year: ''
  });

  const certRef = useRef(null);
  const evalRef = useRef(null);

  useEffect(() => {
    if (initialInternship) {
      setInternship(initialInternship);
      setStudentForm({
        custom_intern_name: initialInternship.custom_intern_name || initialInternship.intern_name || '',
        student_dob: initialInternship.student_dob || '',
        student_gender: initialInternship.student_gender || 'Nam',
        student_phone: initialInternship.student_phone || initialInternship.intern_phone || '',
        student_address: initialInternship.student_address || '',
        school_name: initialInternship.school_name || '',
        faculty_name: initialInternship.faculty_name || '',
        student_code: initialInternship.student_code || '',
        university_class: initialInternship.university_class || '',
        major_name: initialInternship.major_name || '',
        academic_year: initialInternship.academic_year || ''
      });
    }
  }, [initialInternship]);

  if (!internship) return null;

  // Handle saving student info
  const handleSaveStudentInfo = async (e) => {
    if (e) e.preventDefault();
    setSavingStudent(true);
    setSaveSuccessMsg('');
    try {
      let res;
      if (user?.role === 'HR' || user?.role === 'ADMIN') {
        res = await api.put(`/hr/interns/${internship.id}/student-info`, studentForm);
      } else {
        res = await api.put('/intern/internship/student-info', studentForm);
      }
      
      const updatedData = res.data.data;
      setInternship(updatedData);
      setSaveSuccessMsg('Đã lưu thông tin cá nhân và trường lớp thành công!');
      setIsEditingStudent(false);

      if (onUpdate) {
        onUpdate(updatedData);
      }

      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin sinh viên.');
    } finally {
      setSavingStudent(false);
    }
  };

  const handlePrint = (targetRef, title) => {
    const printContent = targetRef.current;
    if (!printContent) return;

    const win = window.open('', '', 'width=950,height=850');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${internship.intern_name || 'TTS'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 18mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #111;
              margin: 0;
              padding: 15px;
              line-height: 1.5;
              font-size: 13.5pt;
              background: #fff;
            }
            .doc-box {
              border: 2px solid #222;
              padding: 24px 30px;
              position: relative;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              font-family: 'Times New Roman', Times, serif;
            }
            .score-table th, .score-table td {
              border: 1px solid #333;
              padding: 6px 8px;
              font-size: 13pt;
            }
            .score-table th {
              background: #f2f2f2;
              text-align: center;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .fw-bold { font-weight: bold; }
            .fst-italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            .stamp-box {
              height: 75px;
            }
            .no-print {
              display: none !important;
            }
            @media print {
              body { padding: 0; }
              .doc-box { border: 2px solid #000; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="doc-box">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const startDateStr = internship.start_date
    ? new Date(internship.start_date).toLocaleDateString('vi-VN')
    : '...';
  const endDateStr = internship.end_date
    ? new Date(internship.end_date).toLocaleDateString('vi-VN')
    : '...';
  const approvedDate = internship.certificate_approved_at
    ? new Date(internship.certificate_approved_at)
    : new Date();

  const totalScore = parseFloat(internship.rating || 9.0);
  const disciplineScore = parseFloat(internship.score_discipline || (totalScore >= 9 ? 2.0 : 1.8));
  const competenceScore = parseFloat(internship.score_competence || (totalScore >= 9 ? 4.5 : 4.0));
  const skillsScore = parseFloat(internship.score_skills || (totalScore >= 9 ? 2.5 : 2.2));
  const rank = getRatingRank(totalScore);

  const displayName = internship.custom_intern_name || internship.intern_name || '...';
  const displayDob = internship.student_dob || '...';
  const displayGender = internship.student_gender || 'Nam';
  const displayPhone = internship.student_phone || internship.intern_phone || '...';
  const displayAddress = internship.student_address || '...';
  const displaySchool = internship.school_name || 'Đại học / Học viện liên kết đào tạo';
  const displayFaculty = internship.faculty_name || 'Công nghệ Thông tin';
  const displayCode = internship.student_code || 'Theo hồ sơ tiếp nhận';
  const displayClass = internship.university_class || 'Chính quy';
  const displayMajor = internship.major_name || 'Công nghệ phần mềm';
  const displayAcademicYear = internship.academic_year || 'Niên khóa hiện tại';

  return (
    <>
      <div className="modal show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg border-0">
            {/* Modal Header with Switcher Tabs & Edit Button */}
            <div className="modal-header bg-dark text-white py-2.5 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="fw-bold fs-6">
                  <i className="bi bi-file-earmark-medical-fill text-warning me-2" />
                  Hồ Sơ Xác Nhận & Đánh Giá Thực Tập
                </span>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${activeDoc === 'CERTIFICATE' ? 'btn-primary active fw-semibold' : 'btn-outline-light'}`}
                    onClick={() => setActiveDoc('CERTIFICATE')}
                  >
                    <i className="bi bi-patch-check me-1" /> 1. Giấy xác nhận thực tập
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeDoc === 'EVALUATION' ? 'btn-primary active fw-semibold' : 'btn-outline-light'}`}
                    onClick={() => setActiveDoc('EVALUATION')}
                  >
                    <i className="bi bi-clipboard2-data me-1" /> 2. Phiếu nhận xét & đánh giá (Bảng điểm)
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${isEditingStudent ? 'btn-warning fw-semibold' : 'btn-outline-light'}`}
                  onClick={() => setIsEditingStudent(!isEditingStudent)}
                  title="Thực tập sinh tự điền/sửa thông tin cá nhân và trường lớp"
                >
                  <i className="bi bi-pencil-square me-1" />
                  {isEditingStudent ? 'Đóng form chỉnh sửa' : 'Tự điền / Sửa thông tin cá nhân & trường'}
                </button>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>
            </div>

            {/* Alert Save Success */}
            {saveSuccessMsg && (
              <div className="alert alert-success alert-dismissible mb-0 py-2 px-4 rounded-0 small border-bottom d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-success" />
                <span>{saveSuccessMsg}</span>
                <button type="button" className="btn-close py-2" onClick={() => setSaveSuccessMsg('')} />
              </div>
            )}

            {/* Form Drawer: Thực tập sinh tự điền thông tin cá nhân & trường lớp */}
            {isEditingStudent && (
              <div className="bg-light border-bottom p-3 p-md-4 shadow-inner">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h6 className="fw-bold mb-1 text-primary">
                      <i className="bi bi-person-lines-fill me-2" />
                      Thông tin cá nhân & trường lớp (Thực tập sinh tự điền)
                    </h6>
                    <span className="text-muted small">
                      Hệ thống tự động bảo lưu các thông tin công ty và kết quả đánh giá của Mentor. Bạn vui lòng tự điền hoặc chỉnh sửa chính xác các trường cá nhân & trường lớp dưới đây.
                    </span>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                    <i className="bi bi-shield-lock me-1" /> Thông tin công ty đã khóa cố định
                  </span>
                </div>

                <form onSubmit={handleSaveStudentInfo}>
                  <div className="row g-3">
                    {/* Mục cá nhân */}
                    <div className="col-12">
                      <div className="fw-bold text-dark small border-bottom pb-1">
                        1. THÔNG TIN CÁ NHÂN SINH VIÊN
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Họ và tên sinh viên <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm"
                        value={studentForm.custom_intern_name}
                        onChange={(e) => setStudentForm({ ...studentForm, custom_intern_name: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn A"
                      />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold">Ngày sinh</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.student_dob}
                        onChange={(e) => setStudentForm({ ...studentForm, student_dob: e.target.value })}
                        placeholder="dd/mm/yyyy (ví dụ: 15/08/2002)"
                      />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold">Giới tính</label>
                      <select
                        className="form-select form-select-sm"
                        value={studentForm.student_gender}
                        onChange={(e) => setStudentForm({ ...studentForm, student_gender: e.target.value })}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Số điện thoại liên hệ</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.student_phone}
                        onChange={(e) => setStudentForm({ ...studentForm, student_phone: e.target.value })}
                        placeholder="Ví dụ: 0912 345 678"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Quê quán / Địa chỉ thường trú</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.student_address}
                        onChange={(e) => setStudentForm({ ...studentForm, student_address: e.target.value })}
                        placeholder="Ví dụ: Quận Cầu Giấy, TP. Hà Nội"
                      />
                    </div>

                    {/* Mục trường lớp */}
                    <div className="col-12 mt-3">
                      <div className="fw-bold text-dark small border-bottom pb-1">
                        2. THÔNG TIN TRƯỜNG ĐÀO TẠO & KHÓA HỌC
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Tên Trường Đại học / Học viện <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm"
                        value={studentForm.school_name}
                        onChange={(e) => setStudentForm({ ...studentForm, school_name: e.target.value })}
                        placeholder="Ví dụ: Trường Đại học Bách Khoa Hà Nội"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Khoa / Viện đào tạo</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.faculty_name}
                        onChange={(e) => setStudentForm({ ...studentForm, faculty_name: e.target.value })}
                        placeholder="Ví dụ: Trường Công nghệ Thông tin & Truyền thông"
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold">Mã số sinh viên (MSSV) <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm"
                        value={studentForm.student_code}
                        onChange={(e) => setStudentForm({ ...studentForm, student_code: e.target.value })}
                        placeholder="Ví dụ: 20210123"
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold">Lớp sinh viên</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.university_class}
                        onChange={(e) => setStudentForm({ ...studentForm, university_class: e.target.value })}
                        placeholder="Ví dụ: CNTT 02-K65"
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold">Chuyên ngành đào tạo</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.major_name}
                        onChange={(e) => setStudentForm({ ...studentForm, major_name: e.target.value })}
                        placeholder="Ví dụ: Kỹ thuật Phần mềm"
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold">Khóa học / Niên khóa</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={studentForm.academic_year}
                        onChange={(e) => setStudentForm({ ...studentForm, academic_year: e.target.value })}
                        placeholder="Ví dụ: 2021 - 2025"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setIsEditingStudent(false)}
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={savingStudent}
                      className="btn btn-sm btn-primary fw-semibold px-4"
                    >
                      {savingStudent ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang lưu thông tin...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-floppy2-fill me-1" /> Lưu thông tin sinh viên
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal Body */}
            <div className="modal-body p-3 p-md-4 bg-light overflow-auto" style={{ maxHeight: '78vh' }}>
              {/* ================= TÀI LIỆU 1: GIẤY XÁC NHẬN THỰC TẬP ================= */}
              {activeDoc === 'CERTIFICATE' && (
                <div
                  ref={certRef}
                  className="bg-white p-4 p-md-5 mx-auto shadow-sm"
                  style={{
                    maxWidth: '820px',
                    border: '3px double #0d6efd',
                    fontFamily: "'Times New Roman', Times, serif",
                    lineHeight: 1.6,
                    color: '#111'
                  }}
                >
                  {/* Header Quốc hiệu / Đơn vị */}
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="text-start" style={{ width: '48%' }}>
                      <div className="fw-bold uppercase" style={{ fontSize: '13px' }}>
                        CÔNG TY CỔ PHẦN CÔNG NGHỆ & ĐÀO TẠO VYMI
                      </div>
                      <div className="text-muted" style={{ fontSize: '12px' }}>
                        Cơ sở: {internship.branch_name || 'Hà Nội'} - ĐT: {internship.branch_phone || '(024) 3888 9999'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        Địa chỉ: {internship.branch_address || 'Số 12 Duy Tân, Cầu Giấy, Hà Nội'}
                      </div>
                      <div className="mt-1" style={{ fontSize: '12px' }}>
                        Mã số chứng nhận: <strong className="text-primary font-monospace">{internship.certificate_code || 'VYMI-CERT-XXXX'}</strong>
                      </div>
                    </div>

                    <div className="text-center" style={{ width: '48%' }}>
                      <div className="fw-bold" style={{ fontSize: '13px' }}>
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div className="fw-semibold text-decoration-underline" style={{ fontSize: '12px' }}>
                        Độc lập – Tự do – Hạnh phúc
                      </div>
                      <div className="fst-italic text-muted mt-1" style={{ fontSize: '11px' }}>
                        Hà Nội, ngày {approvedDate.getDate()} tháng {approvedDate.getMonth() + 1} năm {approvedDate.getFullYear()}
                      </div>
                    </div>
                  </div>

                  {/* Tiêu đề văn bản */}
                  <div className="text-center my-4">
                    <h3 className="fw-bold uppercase mb-1" style={{ color: '#0b3d91', letterSpacing: '1px' }}>
                      GIẤY XÁC NHẬN THỰC TẬP TỐT NGHIỆP
                    </h3>
                    <div className="fst-italic text-muted" style={{ fontSize: '13.5px' }}>
                      (V/v: Tiếp nhận và chứng nhận hoàn thành chương trình thực tập của sinh viên)
                    </div>
                  </div>

                  {/* Kính gửi */}
                  <div className="mb-3 text-center">
                    <span className="fw-bold">Kính gửi: </span>
                    <span className="fw-semibold">Ban Giám hiệu, Ban Chủ nhiệm Khoa {displayFaculty}</span>
                    <div className="fw-bold text-primary">
                      Trường {displaySchool}
                    </div>
                  </div>

                  {/* Đơn vị tiếp nhận giới thiệu */}
                  <p className="mb-3" style={{ fontSize: '14px', textIndent: '20px' }}>
                    Căn cứ vào kế hoạch thực tập tốt nghiệp và sự tiếp nhận của doanh nghiệp, <strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ & ĐÀO TẠO VYMI</strong> xác nhận sinh viên có thông tin dưới đây đã tham gia và hoàn thành khóa thực tập tại đơn vị:
                  </p>

                  {/* Nội dung I: Thông tin sinh viên (Do sinh viên tự kê khai) */}
                  <div className="mb-3">
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1 d-flex justify-content-between align-items-center" style={{ fontSize: '14px', color: '#0b3d91' }}>
                      <span>I. THÔNG TIN SINH VIÊN (DO SINH VIÊN TỰ KÊ KHAI)</span>
                      <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '11px' }}>Kê khai tự túc</span>
                    </div>
                    <div className="row g-2" style={{ fontSize: '14px' }}>
                      <div className="col-12 col-sm-6">
                        1. Họ và tên sinh viên: <strong className="text-uppercase text-dark">{displayName}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        2. Ngày sinh: <strong>{displayDob}</strong> &nbsp;|&nbsp; Giới tính: <strong>{displayGender}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        3. Mã số sinh viên (MSSV): <strong>{displayCode}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        4. Lớp sinh viên: <strong>{displayClass}</strong> {displayAcademicYear ? `(${displayAcademicYear})` : ''}
                      </div>
                      <div className="col-12 col-sm-6">
                        5. Khoa / Viện đào tạo: <strong>{displayFaculty}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        6. Chuyên ngành đào tạo: <strong>{displayMajor}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        7. Số điện thoại liên hệ: <strong>{displayPhone}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        8. Địa chỉ thường trú: <strong>{displayAddress}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Nội dung II: Quá trình thực tập (Do Công ty xác nhận) */}
                  <div className="mb-3">
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1 d-flex justify-content-between align-items-center" style={{ fontSize: '14px', color: '#0b3d91' }}>
                      <span>II. QUÁ TRÌNH THỰC TẬP TẠI DOANH NGHIỆP (DO CÔNG TY XÁC NHẬN)</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-normal" style={{ fontSize: '11px' }}>Hệ thống công ty cấp</span>
                    </div>
                    <div className="row g-2" style={{ fontSize: '14px' }}>
                      <div className="col-12 col-sm-6">
                        1. Đơn vị tiếp nhận: <strong>{internship.branch_name || 'Công ty CP VYMI'}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        2. Bộ phận / Phòng ban: <strong>{internship.department_name || 'Phòng Kỹ thuật & Phát triển'}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        3. Vị trí thực tập: <strong className="text-primary">{internship.position_title}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        4. Cán bộ hướng dẫn (Mentor): <strong>{internship.mentor_name || 'Kỹ sư trưởng'}</strong>
                      </div>
                      <div className="col-12">
                        5. Thời gian thực tập: Từ ngày <strong>{startDateStr}</strong> đến ngày <strong>{endDateStr}</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Nội dung III: Nhận xét & Đánh giá (Do Công ty đánh giá) */}
                  <div className="mb-4">
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1 d-flex justify-content-between align-items-center" style={{ fontSize: '14px', color: '#0b3d91' }}>
                      <span>III. ĐÁNH GIÁ CHUNG CỦA ĐƠN VỊ THỰC TẬP (DO CÔNG TY XÁC NHẬN)</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-normal" style={{ fontSize: '11px' }}>Khóa cố định</span>
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <p className="mb-2">
                        - <strong>Về ý thức kỷ luật & tác phong:</strong> Sinh viên chấp hành nghiêm túc thời gian làm việc, nội quy bảo mật thông tin và văn hóa doanh nghiệp. Thái độ làm việc nghiêm túc, có tinh thần trách nhiệm cao.
                      </p>
                      <p className="mb-2">
                        - <strong>Về chuyên môn & năng lực hoàn thành nhiệm vụ:</strong> {internship.final_review || 'Nắm bắt nhanh các yêu cầu dự án, chủ động nghiên cứu công nghệ mới, hoàn thành tốt các đầu việc được giao đúng tiến độ và chất lượng.'}
                      </p>
                      <div className="p-2.5 bg-light rounded border d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                        <div>
                          <strong>Đánh giá kết quả chung: </strong>
                          <span className="badge bg-success fs-6 ms-1">{rank}</span>
                        </div>
                        <div>
                          <strong>Điểm số đánh giá (Thang 10): </strong>
                          <span className="fs-6 fw-bold text-primary">{totalScore.toFixed(1)}/10</span>
                          <span className="fst-italic text-muted ms-1">({getScoreText(totalScore)})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="fst-italic small text-muted mb-4">
                    * Giấy xác nhận này được lập thành 02 bản có giá trị pháp lý như nhau, cấp cho sinh viên nộp về Nhà trường làm căn cứ nghiệm thu và công nhận học phần thực tập tốt nghiệp.
                  </p>

                  {/* Chữ ký hai bên */}
                  <div className="row text-center mt-4 pt-2" style={{ fontSize: '14px' }}>
                    <div className="col-6">
                      <div className="fw-bold uppercase">CÁN BỘ HƯỚNG DẪN TRỰC TIẾP</div>
                      <div className="fst-italic text-muted small mb-5">(Ký và ghi rõ họ tên)</div>
                      <div className="fw-bold mt-4">{internship.mentor_name || 'Mentor hướng dẫn'}</div>
                    </div>
                    <div className="col-6">
                      <div className="fw-bold uppercase">ĐẠI DIỆN PHÒNG QUẢN TRỊ NHÂN SỰ</div>
                      <div className="fst-italic text-muted small mb-5">(Ký tên và đóng dấu xác nhận)</div>
                      <div className="fw-bold mt-4">{internship.hr_confirmed_by_name || 'Trưởng Phòng Nhân Sự'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TÀI LIỆU 2: PHIẾU NHẬN XÉT & ĐÁNH GIÁ THỰC TẬP (BẢNG ĐIỂM) ================= */}
              {activeDoc === 'EVALUATION' && (
                <div
                  ref={evalRef}
                  className="bg-white p-4 p-md-5 mx-auto shadow-sm"
                  style={{
                    maxWidth: '820px',
                    border: '3px double #198754',
                    fontFamily: "'Times New Roman', Times, serif",
                    lineHeight: 1.5,
                    color: '#111'
                  }}
                >
                  {/* Quốc hiệu */}
                  <div className="text-center mb-4">
                    <div className="fw-bold" style={{ fontSize: '14px' }}>
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </div>
                    <div className="fw-semibold text-decoration-underline" style={{ fontSize: '13px' }}>
                      Độc lập – Tự do – Hạnh phúc
                    </div>
                    <div className="mt-1" style={{ fontSize: '12px' }}>---o0o---</div>
                  </div>

                  {/* Tiêu đề */}
                  <div className="text-center mb-4">
                    <h3 className="fw-bold uppercase mb-1" style={{ color: '#146c43', letterSpacing: '1px' }}>
                      PHIẾU NHẬN XÉT, ĐÁNH GIÁ THỰC TẬP TỐT NGHIỆP
                    </h3>
                    <div className="fst-italic text-muted" style={{ fontSize: '13.5px' }}>
                      (Dành cho Cơ quan / Doanh nghiệp tiếp nhận sinh viên thực tập)
                    </div>
                  </div>

                  {/* I. Thông tin sinh viên (Do sinh viên tự điền) */}
                  <div className="mb-3" style={{ fontSize: '14px' }}>
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1 d-flex justify-content-between align-items-center" style={{ color: '#146c43' }}>
                      <span>I. THÔNG TIN SINH VIÊN (DO SINH VIÊN TỰ ĐIỀN)</span>
                      <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '11px' }}>Kê khai tự túc</span>
                    </div>
                    <div className="row g-2">
                      <div className="col-12 col-sm-6">
                        - Họ tên sinh viên: <strong className="text-uppercase text-dark">{displayName}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Ngày sinh: <strong>{displayDob}</strong> &nbsp;|&nbsp; Giới tính: <strong>{displayGender}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Mã số sinh viên (MSSV): <strong>{displayCode}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Lớp sinh viên: <strong>{displayClass}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Trường đào tạo: <strong>{displaySchool}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Khoa / Viện: <strong>{displayFaculty}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Chuyên ngành: <strong>{displayMajor}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Khóa học / Niên khóa: <strong>{displayAcademicYear}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Số điện thoại: <strong>{displayPhone}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Địa chỉ thường trú: <strong>{displayAddress}</strong>
                      </div>
                    </div>
                  </div>

                  {/* II. Thông tin đơn vị tiếp nhận (Do công ty xác nhận) */}
                  <div className="mb-3" style={{ fontSize: '14px' }}>
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1 d-flex justify-content-between align-items-center" style={{ color: '#146c43' }}>
                      <span>II. THÔNG TIN CƠ QUAN / DOANH NGHIỆP TIẾP NHẬN (DO CÔNG TY XÁC NHẬN)</span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle fw-normal" style={{ fontSize: '11px' }}>Hệ thống công ty cấp</span>
                    </div>
                    <div className="row g-2">
                      <div className="col-12 col-sm-6">
                        - Đơn vị thực tập: <strong>{internship.branch_name || 'Công ty CP VYMI'}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Bộ phận / Phòng ban: <strong>{internship.department_name || 'Phòng Kỹ thuật'}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Vị trí thực tập: <strong className="text-primary">{internship.position_title}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        - Cán bộ hướng dẫn: <strong>{internship.mentor_name || 'Mentor phụ trách'}</strong>
                      </div>
                      <div className="col-12">
                        - Thời gian thực tập: Từ ngày <strong>{startDateStr}</strong> đến ngày <strong>{endDateStr}</strong>
                      </div>
                    </div>
                  </div>

                  {/* III. Bảng tiêu chí chấm điểm chi tiết (Do công ty đánh giá) */}
                  <div className="mb-3">
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1 d-flex justify-content-between align-items-center" style={{ fontSize: '14px', color: '#146c43' }}>
                      <span>III. NỘI DUNG ĐÁNH GIÁ & TIÊU CHÍ CHẤM ĐIỂM (DO CÔNG TY ĐÁNH GIÁ - KHÓA CỐ ĐỊNH)</span>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-normal" style={{ fontSize: '11px' }}>Khóa cố định</span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle mb-0" style={{ fontSize: '13.5px' }}>
                        <thead className="table-light text-center">
                          <tr>
                            <th style={{ width: '8%' }}>TT</th>
                            <th style={{ width: '62%' }}>Nội dung và tiêu chí đánh giá chuẩn Bộ GD&ĐT</th>
                            <th style={{ width: '15%' }}>Điểm tối đa</th>
                            <th style={{ width: '15%' }}>Điểm đánh giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="fw-bold bg-light">
                            <td className="text-center">1</td>
                            <td colSpan="3">Ý THỨC TỔ CHỨC KỶ LUẬT VÀ TÁC PHONG LÀM VIỆC</td>
                          </tr>
                          <tr>
                            <td className="text-center">1.1</td>
                            <td>Chấp hành nghiêm chỉnh nội quy, quy chế và bảo mật công ty</td>
                            <td className="text-center">0.5</td>
                            <td className="text-center fw-semibold">0.5</td>
                          </tr>
                          <tr>
                            <td className="text-center">1.2</td>
                            <td>Chấp hành giờ giấc làm việc, đi làm đúng giờ, nghỉ có phép</td>
                            <td className="text-center">0.5</td>
                            <td className="text-center fw-semibold">0.5</td>
                          </tr>
                          <tr>
                            <td className="text-center">1.3</td>
                            <td>Tác phong làm việc nghiêm túc, giao tiếp văn minh chuẩn mực</td>
                            <td className="text-center">0.5</td>
                            <td className="text-center fw-semibold">0.5</td>
                          </tr>
                          <tr>
                            <td className="text-center">1.4</td>
                            <td>Tinh thần cầu thị, trung thực và tinh thần trách nhiệm cao</td>
                            <td className="text-center">0.5</td>
                            <td className="text-center fw-semibold">{(disciplineScore - 1.5 > 0 ? (disciplineScore - 1.5).toFixed(1) : '0.4')}</td>
                          </tr>
                          <tr className="table-success fw-bold">
                            <td colSpan="2" className="text-end">Cộng mục 1:</td>
                            <td className="text-center">2.0</td>
                            <td className="text-center text-primary">{disciplineScore.toFixed(1)}</td>
                          </tr>

                          <tr className="fw-bold bg-light">
                            <td className="text-center">2</td>
                            <td colSpan="3">NĂNG LỰC CHUYÊN MÔN VÀ KẾT QUẢ THỰC HIỆN CÔNG VIỆC</td>
                          </tr>
                          <tr>
                            <td className="text-center">2.1</td>
                            <td>Khả năng tiếp thu hướng dẫn, nắm bắt quy trình công việc</td>
                            <td className="text-center">1.0</td>
                            <td className="text-center fw-semibold">0.9</td>
                          </tr>
                          <tr>
                            <td className="text-center">2.2</td>
                            <td>Vận dụng kiến thức học đường vào giải quyết công việc thực tế</td>
                            <td className="text-center">2.0</td>
                            <td className="text-center fw-semibold">1.8</td>
                          </tr>
                          <tr>
                            <td className="text-center">2.3</td>
                            <td>Kỹ năng giải quyết vấn đề, xử lý tình huống nghiệp vụ phát sinh</td>
                            <td className="text-center">1.0</td>
                            <td className="text-center fw-semibold">0.9</td>
                          </tr>
                          <tr>
                            <td className="text-center">2.4</td>
                            <td>Chất lượng sản phẩm và tiến độ hoàn thành các nhiệm vụ được giao</td>
                            <td className="text-center">1.0</td>
                            <td className="text-center fw-semibold">{(competenceScore - 3.6 > 0 ? (competenceScore - 3.6).toFixed(1) : '0.9')}</td>
                          </tr>
                          <tr className="table-success fw-bold">
                            <td colSpan="2" className="text-end">Cộng mục 2:</td>
                            <td className="text-center">5.0</td>
                            <td className="text-center text-primary">{competenceScore.toFixed(1)}</td>
                          </tr>

                          <tr className="fw-bold bg-light">
                            <td className="text-center">3</td>
                            <td colSpan="3">KỸ NĂNG MỀM VÀ KHẢ NĂNG HÒA NHẬP MÔI TRƯỜNG</td>
                          </tr>
                          <tr>
                            <td className="text-center">3.1</td>
                            <td>Khả năng giao tiếp, trình bày và báo cáo công việc</td>
                            <td className="text-center">1.0</td>
                            <td className="text-center fw-semibold">0.8</td>
                          </tr>
                          <tr>
                            <td className="text-center">3.2</td>
                            <td>Tinh thần làm việc nhóm, phối hợp tốt với đồng nghiệp</td>
                            <td className="text-center">1.0</td>
                            <td className="text-center fw-semibold">0.9</td>
                          </tr>
                          <tr>
                            <td className="text-center">3.3</td>
                            <td>Tính chủ động, sáng tạo và tự học nâng cao trình độ</td>
                            <td className="text-center">1.0</td>
                            <td className="text-center fw-semibold">{(skillsScore - 1.7 > 0 ? (skillsScore - 1.7).toFixed(1) : '0.8')}</td>
                          </tr>
                          <tr className="table-success fw-bold">
                            <td colSpan="2" className="text-end">Cộng mục 3:</td>
                            <td className="text-center">3.0</td>
                            <td className="text-center text-primary">{skillsScore.toFixed(1)}</td>
                          </tr>

                          <tr className="table-primary fw-bold fs-6">
                            <td colSpan="2" className="text-uppercase text-end">TỔNG ĐIỂM TOÀN BỘ (Thang 10):</td>
                            <td className="text-center">10.0</td>
                            <td className="text-center text-danger fs-5">{totalScore.toFixed(1)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-end fw-semibold" style={{ fontSize: '13.5px' }}>
                      Điểm bằng chữ: <span className="text-primary fst-italic">{getScoreText(totalScore)}</span> | Xếp loại chung: <span className="badge bg-success">{rank}</span>
                    </div>
                  </div>

                  {/* IV. Nhận xét chung */}
                  <div className="mb-4" style={{ fontSize: '14px' }}>
                    <div className="fw-bold uppercase mb-2 border-bottom pb-1" style={{ color: '#146c43' }}>
                      IV. Ý KIẾN NHẬN XÉT CỦA CƠ QUAN / DOANH NGHIỆP
                    </div>
                    <p className="mb-1">
                      1. <strong>Ưu điểm nổi bật:</strong> {internship.evaluation_advantages || 'Có tinh thần tự học cao, ham học hỏi, hòa nhập nhanh với văn hóa doanh nghiệp và các dự án thực tế.'}
                    </p>
                    <p className="mb-1">
                      2. <strong>Điểm cần khắc phục & phát triển:</strong> {internship.evaluation_limitations || 'Cần tích lũy thêm kinh nghiệm thực chiến với các hệ thống quy mô lớn và trau dồi thêm kỹ năng quản lý thời gian.'}
                    </p>
                    <p className="mb-0">
                      3. <strong>Nhận xét tổng hợp:</strong> &ldquo;{internship.final_review || 'Hoàn thành xuất sắc chương trình thực tập, đạt đầy đủ chỉ tiêu của doanh nghiệp.'}&rdquo;
                    </p>
                  </div>

                  {/* Chữ ký */}
                  <div className="row text-center mt-4 pt-2" style={{ fontSize: '14px' }}>
                    <div className="col-6">
                      <div className="fw-bold uppercase">CÁN BỘ HƯỚNG DẪN TRỰC TIẾP</div>
                      <div className="fst-italic text-muted small mb-5">(Ký và ghi rõ họ tên)</div>
                      <div className="fw-bold mt-4">{internship.mentor_name || 'Mentor hướng dẫn'}</div>
                    </div>
                    <div className="col-6">
                      <div className="fst-italic text-muted small mb-1">
                        Hà Nội, ngày {approvedDate.getDate()} tháng {approvedDate.getMonth() + 1} năm {approvedDate.getFullYear()}
                      </div>
                      <div className="fw-bold uppercase">ĐẠI DIỆN ĐƠN VỊ THỰC TẬP</div>
                      <div className="fst-italic text-muted small mb-5">(Ký tên và đóng dấu đỏ)</div>
                      <div className="fw-bold mt-4">{internship.hr_confirmed_by_name || 'Phòng Quản Trị Nhân Sự'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-white py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-light text-dark border font-monospace">
                  Mã hồ sơ: {internship.certificate_code || 'VYMI-CERT-XXXX'}
                </span>
                <span className="text-muted small">
                  Sinh viên: <strong>{displayName}</strong> ({internship.position_title})
                </span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(!isEditingStudent)}
                  className={`btn btn-sm ${isEditingStudent ? 'btn-outline-warning' : 'btn-outline-primary'}`}
                >
                  <i className="bi bi-pencil me-1" />
                  {isEditingStudent ? 'Đóng chỉnh sửa' : 'Sửa thông tin sinh viên'}
                </button>
                <button type="button" onClick={onClose} className="btn btn-sm btn-outline-secondary">
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePrint(
                      activeDoc === 'CERTIFICATE' ? certRef : evalRef,
                      activeDoc === 'CERTIFICATE' ? 'Giấy xác nhận thực tập' : 'Phiếu đánh giá thực tập'
                    )
                  }
                  className="btn btn-sm btn-success fw-semibold px-3"
                >
                  <i className="bi bi-printer-fill me-1" />
                  In / Xuất PDF ({activeDoc === 'CERTIFICATE' ? 'Giấy xác nhận' : 'Phiếu đánh giá'})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
