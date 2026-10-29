import React, { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

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

function sanitizeFileName(name) {
  return (name || 'TTS')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_');
}

export default function CertificateModal({ internship: initialInternship, onClose, onUpdate }) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [internship, setInternship] = useState(initialInternship);
  const [activeDoc, setActiveDoc] = useState('CERTIFICATE'); // 'CERTIFICATE' | 'EVALUATION'
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

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
      notify.success('Đã lưu thông tin sinh viên và trường lớp thành công!', 'Lưu thông tin hồ sơ');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin sinh viên.', 'Lưu hồ sơ thất bại');
    } finally {
      setSavingStudent(false);
    }
  };

  // Hàm tải xuống PDF chất lượng cao, chuẩn 1 trang A4
  const executeDownload = async (element, fileName, docTitle) => {
    if (!element) return;
    setIsDownloading(true);
    try {
      notify.info(`Đang tạo file tải xuống: ${fileName}...`, 'Đang xuất tài liệu');

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, // Tăng gấp đôi độ sắc nét, chữ rõ ràng khi in ấn
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          width: 794,
          windowWidth: 794
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(element).save();
      notify.success(`Đã tải xuống thành công file ${docTitle}! Bạn có thể mở file bằng công cụ bên ngoài để in ấn chuẩn khổ A4.`, 'Tải xuống hoàn tất');
    } catch (err) {
      console.error('Lỗi khi tải file:', err);
      notify.error('Có lỗi xảy ra khi tạo file tải xuống. Vui lòng thử lại!', 'Tải xuống thất bại');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async (docType) => {
    const isCert = docType === 'CERTIFICATE';
    const targetRef = isCert ? certRef : evalRef;
    const docName = isCert ? 'Giay_Xac_Nhan_Thuc_Tap' : 'Phieu_Danh_Gia_Thuc_Tap';
    const internName = sanitizeFileName(internship.custom_intern_name || internship.intern_name || 'TTS');
    const studentCode = sanitizeFileName(internship.student_code || '');
    const fileName = `${docName}_${internName}${studentCode ? `_${studentCode}` : ''}.pdf`;

    if (!targetRef.current) {
      setActiveDoc(docType);
      setTimeout(() => {
        const delayedTarget = isCert ? certRef : evalRef;
        executeDownload(delayedTarget.current, fileName, isCert ? 'Giấy xác nhận thực tập' : 'Phiếu đánh giá thực tập');
      }, 300);
      return;
    }

    await executeDownload(targetRef.current, fileName, isCert ? 'Giấy xác nhận thực tập' : 'Phiếu đánh giá thực tập');
  };

  const handleDownloadBoth = async () => {
    setIsDownloading(true);
    try {
      notify.info('Đang chuẩn bị tải trọn bộ hồ sơ (Giấy xác nhận & Phiếu đánh giá)...', 'Tải bộ hồ sơ');
      
      const internName = sanitizeFileName(internship.custom_intern_name || internship.intern_name || 'TTS');
      const studentCode = sanitizeFileName(internship.student_code || '');

      // 1. Tải Giấy xác nhận
      setActiveDoc('CERTIFICATE');
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (certRef.current) {
        const certName = `Giay_Xac_Nhan_Thuc_Tap_${internName}${studentCode ? `_${studentCode}` : ''}.pdf`;
        const opt1 = {
          margin: 0,
          filename: certName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0, width: 794, windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt1).from(certRef.current).save();
      }

      // 2. Chuyển sang Phiếu đánh giá và tải tiếp
      await new Promise((resolve) => setTimeout(resolve, 800));
      setActiveDoc('EVALUATION');
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (evalRef.current) {
        const evalName = `Phieu_Danh_Gia_Thuc_Tap_${internName}${studentCode ? `_${studentCode}` : ''}.pdf`;
        const opt2 = {
          margin: 0,
          filename: evalName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0, width: 794, windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt2).from(evalRef.current).save();
      }

      notify.success('Đã tải xuống thành công trọn bộ cả 2 tài liệu chuẩn khổ A4!', 'Hoàn tất tải bộ hồ sơ');
    } catch (err) {
      console.error('Lỗi tải trọn bộ:', err);
      notify.error('Có lỗi xảy ra khi tải bộ tài liệu.', 'Tải thất bại');
    } finally {
      setIsDownloading(false);
    }
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
  const displayAcademicYear = internship.academic_year || '';

  return (
    <>
      <div className="modal show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div className="modal-content shadow-lg border-0">
            {/* Modal Header */}
            <div className="modal-header bg-dark text-white py-2.5 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="fw-bold fs-6">
                  <i className="bi bi-file-earmark-medical-fill text-warning me-2" />
                  Hồ Sơ Xác Nhận & Đánh Giá Thực Tập (Chuẩn Khổ A4)
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
                        placeholder="dd/mm/yyyy"
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
                        placeholder="Ví dụ: Khoa Công nghệ Thông tin"
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

            {/* Modal Body: Khung xem trước A4 */}
            <div className="modal-body p-3 p-md-4 bg-secondary bg-opacity-10 overflow-auto" style={{ maxHeight: '78vh' }}>
              <div className="d-flex justify-content-center mb-2">
                <span className="badge bg-light text-secondary border px-3 py-1.5 small">
                  <i className="bi bi-aspect-ratio me-1" /> Kích thước chuẩn khổ A4 (210mm x 297mm) • Tải xuống giữ nguyên 100% định dạng, không đè chữ
                </span>
              </div>

              {/* ================= TÀI LIỆU 1: GIẤY XÁC NHẬN THỰC TẬP (A4 CHUẨN) ================= */}
              <div
                style={{
                  display: activeDoc === 'CERTIFICATE' ? 'flex' : 'none',
                  justifyContent: 'center'
                }}
              >
                <div
                  ref={certRef}
                  style={{
                    width: '794px',
                    minWidth: '794px',
                    maxWidth: '794px',
                    height: '1122px',
                    maxHeight: '1122px',
                    padding: '16mm 18mm 14mm 18mm',
                    boxSizing: 'border-box',
                    fontFamily: "'Times New Roman', Times, serif",
                    lineHeight: 1.45,
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    border: '2px solid #0b3d91',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* PHẦN TRÊN CỦA VĂN BẢN */}
                  <div style={{ flex: '1 0 auto' }}>
                    {/* Header 2 cột: Đơn vị & Quốc hiệu */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', marginBottom: '10px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', color: '#000' }}>
                              CÔNG TY CỔ PHẦN CÔNG NGHỆ & ĐÀO TẠO VYMI
                            </div>
                            <div style={{ fontSize: '9.5pt', color: '#333', marginTop: '2px' }}>
                              Cơ sở: {internship.branch_name || 'Hà Nội'} - ĐT: {internship.branch_phone || '(024) 3888 9999'}
                            </div>
                            <div style={{ fontSize: '9pt', color: '#333' }}>
                              Địa chỉ: {internship.branch_address || 'Số 12 Duy Tân, Cầu Giấy, Hà Nội'}
                            </div>
                            <div style={{ fontSize: '9.5pt', marginTop: '3px' }}>
                              Mã hồ sơ: <span style={{ fontWeight: 'bold', color: '#0b3d91' }}>{internship.certificate_code || 'VYMI-CERT-XXXX'}</span>
                            </div>
                          </td>
                          <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', paddingLeft: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000' }}>
                              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '10.5pt', textDecoration: 'underline', marginTop: '1px' }}>
                              Độc lập – Tự do – Hạnh phúc
                            </div>
                            <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginTop: '4px', color: '#333' }}>
                              Hà Nội, ngày {approvedDate.getDate()} tháng {approvedDate.getMonth() + 1} năm {approvedDate.getFullYear()}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Tiêu đề văn bản */}
                    <div style={{ textAlign: 'center', margin: '12px 0 10px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '16pt', color: '#0b3d91', letterSpacing: '0.5px' }}>
                        GIẤY XÁC NHẬN THỰC TẬP TỐT NGHIỆP
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '10pt', color: '#444', marginTop: '2px' }}>
                        (V/v: Tiếp nhận và chứng nhận hoàn thành chương trình thực tập của sinh viên)
                      </div>
                    </div>

                    {/* Kính gửi */}
                    <div style={{ textAlign: 'center', margin: '8px 0 10px 0' }}>
                      <div style={{ fontSize: '11pt' }}>
                        <strong>Kính gửi: </strong> Ban Giám hiệu, Ban Chủ nhiệm Khoa {displayFaculty}
                      </div>
                      <div style={{ fontSize: '11.5pt', fontWeight: 'bold', color: '#0b3d91' }}>
                        Trường {displaySchool}
                      </div>
                    </div>

                    {/* Lời mở đầu */}
                    <div style={{ fontSize: '10.5pt', textAlign: 'justify', textIndent: '20px', lineHeight: 1.45, margin: '8px 0 10px 0' }}>
                      Căn cứ vào kế hoạch thực tập tốt nghiệp và sự tiếp nhận của doanh nghiệp, <strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ & ĐÀO TẠO VYMI</strong> xác nhận sinh viên có thông tin dưới đây đã tham gia và hoàn thành khóa thực tập tại đơn vị:
                    </div>

                    {/* I. THÔNG TIN SINH VIÊN */}
                    <div style={{ margin: '8px 0 10px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt', color: '#0b3d91', borderBottom: '1px solid #0b3d91', paddingBottom: '2px', marginBottom: '4px' }}>
                        I. THÔNG TIN SINH VIÊN (DO SINH VIÊN TỰ KÊ KHAI)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', fontSize: '10pt', lineHeight: 1.4 }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', padding: '2px 4px' }}>
                              1. Họ và tên: <strong style={{ textTransform: 'uppercase' }}>{displayName}</strong>
                            </td>
                            <td style={{ width: '50%', padding: '2px 4px' }}>
                              2. Ngày sinh: <strong>{displayDob}</strong> &nbsp;|&nbsp; Giới tính: <strong>{displayGender}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 4px' }}>
                              3. Mã sinh viên (MSSV): <strong>{displayCode}</strong>
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                              4. Lớp sinh viên: <strong>{displayClass}</strong> {displayAcademicYear ? `(${displayAcademicYear})` : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 4px' }}>
                              5. Khoa / Viện đào tạo: <strong>{displayFaculty}</strong>
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                              6. Chuyên ngành: <strong>{displayMajor}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 4px' }}>
                              7. Số điện thoại liên hệ: <strong>{displayPhone}</strong>
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                              8. Địa chỉ thường trú: <strong>{displayAddress}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* II. QUÁ TRÌNH THỰC TẬP TẠI DOANH NGHIỆP */}
                    <div style={{ margin: '8px 0 10px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt', color: '#0b3d91', borderBottom: '1px solid #0b3d91', paddingBottom: '2px', marginBottom: '4px' }}>
                        II. QUÁ TRÌNH THỰC TẬP TẠI DOANH NGHIỆP (DO CÔNG TY XÁC NHẬN)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', fontSize: '10pt', lineHeight: 1.4 }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', padding: '2px 4px' }}>
                              1. Đơn vị tiếp nhận: <strong>{internship.branch_name || 'Công ty CP VYMI'}</strong>
                            </td>
                            <td style={{ width: '50%', padding: '2px 4px' }}>
                              2. Bộ phận / Phòng ban: <strong>{internship.department_name || 'Phòng Kỹ thuật & Phát triển'}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 4px' }}>
                              3. Vị trí thực tập: <strong style={{ color: '#0b3d91' }}>{internship.position_title}</strong>
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                              4. Cán bộ hướng dẫn: <strong>{internship.mentor_name || 'Kỹ sư trưởng'}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ padding: '2px 4px' }}>
                              5. Thời gian thực tập: Từ ngày <strong>{startDateStr}</strong> đến ngày <strong>{endDateStr}</strong>.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* III. ĐÁNH GIÁ CHUNG CỦA ĐƠN VỊ THỰC TẬP */}
                    <div style={{ margin: '8px 0 8px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt', color: '#0b3d91', borderBottom: '1px solid #0b3d91', paddingBottom: '2px', marginBottom: '4px' }}>
                        III. ĐÁNH GIÁ CHUNG CỦA ĐƠN VỊ THỰC TẬP (DO CÔNG TY XÁC NHẬN)
                      </div>
                      <div style={{ fontSize: '10pt', lineHeight: 1.4 }}>
                        <div style={{ marginBottom: '3px' }}>
                          - <strong>Về ý thức kỷ luật & tác phong:</strong> Sinh viên chấp hành nghiêm túc thời gian làm việc, nội quy bảo mật thông tin và văn hóa doanh nghiệp. Thái độ nghiêm túc, có tinh thần trách nhiệm cao.
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          - <strong>Về chuyên môn & năng lực hoàn thành nhiệm vụ:</strong> {internship.final_review || 'Nắm bắt nhanh các yêu cầu dự án, chủ động nghiên cứu công nghệ mới, hoàn thành tốt các đầu việc được giao đúng tiến độ và chất lượng.'}
                        </div>

                        {/* Hộp điểm tóm tắt */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #0b3d91', backgroundColor: '#f8fafd' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '50%', padding: '6px 12px', fontSize: '10.5pt' }}>
                                <strong>Đánh giá kết quả chung: </strong>
                                <strong style={{ color: '#198754', fontSize: '11pt', marginLeft: '4px' }}>{rank}</strong>
                              </td>
                              <td style={{ width: '50%', padding: '6px 12px', textAlign: 'right', fontSize: '10.5pt' }}>
                                <strong>Điểm số đánh giá (Thang 10): </strong>
                                <strong style={{ color: '#0b3d91', fontSize: '11.5pt', marginLeft: '4px' }}>{totalScore.toFixed(1)}/10</strong>
                                <span style={{ fontStyle: 'italic', fontSize: '9.5pt', marginLeft: '4px', color: '#444' }}>({getScoreText(totalScore)})</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Ghi chú giá trị pháp lý */}
                    <div style={{ fontStyle: 'italic', fontSize: '9pt', color: '#444', margin: '8px 0 0 0' }}>
                      * Giấy xác nhận này được lập thành 02 bản có giá trị pháp lý như nhau, cấp cho sinh viên nộp về Nhà trường làm căn cứ nghiệm thu và công nhận học phần thực tập tốt nghiệp.
                    </div>
                  </div>

                  {/* PHẦN DƯỚI CỦA VĂN BẢN: CHỮ KÝ 2 BÊN */}
                  <div style={{ flexShrink: 0, marginTop: '10px', paddingTop: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', textAlign: 'center' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '50%', verticalAlign: 'top', padding: '0 10px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt' }}>
                              CÁN BỘ HƯỚNG DẪN TRỰC TIẾP
                            </div>
                            <div style={{ fontStyle: 'italic', fontSize: '9.5pt', color: '#555' }}>
                              (Ký và ghi rõ họ tên)
                            </div>
                            <div style={{ height: '65px' }} />
                            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                              {internship.mentor_name || 'Mentor hướng dẫn'}
                            </div>
                          </td>
                          <td style={{ width: '50%', verticalAlign: 'top', padding: '0 10px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt' }}>
                              ĐẠI DIỆN PHÒNG QUẢN TRỊ NHÂN SỰ
                            </div>
                            <div style={{ fontStyle: 'italic', fontSize: '9.5pt', color: '#555' }}>
                              (Ký tên và đóng dấu xác nhận)
                            </div>
                            <div style={{ height: '65px' }} />
                            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                              {internship.hr_confirmed_by_name || 'Trưởng Phòng Nhân Sự'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ================= TÀI LIỆU 2: PHIẾU NHẬN XÉT & ĐÁNH GIÁ (A4 CHUẨN) ================= */}
              <div
                style={{
                  display: activeDoc === 'EVALUATION' ? 'flex' : 'none',
                  justifyContent: 'center'
                }}
              >
                <div
                  ref={evalRef}
                  style={{
                    width: '794px',
                    minWidth: '794px',
                    maxWidth: '794px',
                    height: '1122px',
                    maxHeight: '1122px',
                    padding: '12mm 16mm 10mm 16mm',
                    boxSizing: 'border-box',
                    fontFamily: "'Times New Roman', Times, serif",
                    lineHeight: 1.35,
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    border: '2px solid #146c43',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* PHẦN TRÊN CỦA VĂN BẢN */}
                  <div style={{ flex: '1 0 auto' }}>
                    {/* Header Quốc hiệu */}
                    <div style={{ textAlign: 'center', margin: '0 0 6px 0' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '10.5pt', textDecoration: 'underline' }}>
                        Độc lập – Tự do – Hạnh phúc
                      </div>
                      <div style={{ fontSize: '9pt', marginTop: '1px', color: '#444' }}>---o0o---</div>
                    </div>

                    {/* Tiêu đề */}
                    <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14.5pt', color: '#146c43', letterSpacing: '0.5px' }}>
                        PHIẾU NHẬN XÉT, ĐÁNH GIÁ THỰC TẬP TỐT NGHIỆP
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '9.5pt', color: '#444', marginTop: '1px' }}>
                        (Dành cho Cơ quan / Doanh nghiệp tiếp nhận sinh viên thực tập)
                      </div>
                    </div>

                    {/* I. THÔNG TIN SINH VIÊN */}
                    <div style={{ margin: '4px 0 6px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', color: '#146c43', borderBottom: '1px solid #146c43', paddingBottom: '1px', marginBottom: '3px' }}>
                        I. THÔNG TIN SINH VIÊN (DO SINH VIÊN TỰ ĐIỀN)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', fontSize: '9.5pt', lineHeight: 1.35 }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', padding: '1px 3px' }}>
                              - Họ tên sinh viên: <strong style={{ textTransform: 'uppercase' }}>{displayName}</strong>
                            </td>
                            <td style={{ width: '50%', padding: '1px 3px' }}>
                              - Ngày sinh: <strong>{displayDob}</strong> &nbsp;|&nbsp; Giới tính: <strong>{displayGender}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '1px 3px' }}>
                              - Mã số sinh viên (MSSV): <strong>{displayCode}</strong>
                            </td>
                            <td style={{ padding: '1px 3px' }}>
                              - Lớp: <strong>{displayClass}</strong> {displayAcademicYear ? `(${displayAcademicYear})` : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '1px 3px' }}>
                              - Trường đào tạo: <strong>{displaySchool}</strong>
                            </td>
                            <td style={{ padding: '1px 3px' }}>
                              - Khoa / Viện: <strong>{displayFaculty}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '1px 3px' }}>
                              - Chuyên ngành: <strong>{displayMajor}</strong>
                            </td>
                            <td style={{ padding: '1px 3px' }}>
                              - Điện thoại: <strong>{displayPhone}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ padding: '1px 3px' }}>
                              - Quê quán / Thường trú: <strong>{displayAddress}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* II. THÔNG TIN ĐƠN VỊ TIẾP NHẬN */}
                    <div style={{ margin: '4px 0 6px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', color: '#146c43', borderBottom: '1px solid #146c43', paddingBottom: '1px', marginBottom: '3px' }}>
                        II. THÔNG TIN ĐƠN VỊ TIẾP NHẬN (DO CÔNG TY XÁC NHẬN)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', fontSize: '9.5pt', lineHeight: 1.35 }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', padding: '1px 3px' }}>
                              - Đơn vị thực tập: <strong>{internship.branch_name || 'Công ty CP VYMI'}</strong>
                            </td>
                            <td style={{ width: '50%', padding: '1px 3px' }}>
                              - Bộ phận: <strong>{internship.department_name || 'Phòng Kỹ thuật'}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '1px 3px' }}>
                              - Vị trí thực tập: <strong style={{ color: '#146c43' }}>{internship.position_title}</strong>
                            </td>
                            <td style={{ padding: '1px 3px' }}>
                              - Cán bộ hướng dẫn: <strong>{internship.mentor_name || 'Mentor phụ trách'}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="2" style={{ padding: '1px 3px' }}>
                              - Thời gian thực tập: Từ ngày <strong>{startDateStr}</strong> đến ngày <strong>{endDateStr}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* III. NỘI DUNG ĐÁNH GIÁ & TIÊU CHÍ CHẤM ĐIỂM */}
                    <div style={{ margin: '4px 0 6px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', color: '#146c43', borderBottom: '1px solid #146c43', paddingBottom: '1px', marginBottom: '3px' }}>
                        III. NỘI DUNG ĐÁNH GIÁ & TIÊU CHÍ CHẤM ĐIỂM (CHUẨN BỘ GD&ĐT - THANG 10)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #333', fontSize: '9pt' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'center' }}>
                            <th style={{ width: '7%', border: '1px solid #333', padding: '2px 4px' }}>TT</th>
                            <th style={{ width: '63%', border: '1px solid #333', padding: '2px 4px' }}>Nội dung và tiêu chí đánh giá chuẩn Bộ GD&ĐT</th>
                            <th style={{ width: '15%', border: '1px solid #333', padding: '2px 4px' }}>Điểm max</th>
                            <th style={{ width: '15%', border: '1px solid #333', padding: '2px 4px' }}>Điểm đánh giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1</td>
                            <td colSpan="3" style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Ý THỨC TỔ CHỨC KỶ LUẬT VÀ TÁC PHONG LÀM VIỆC</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.1</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Chấp hành nghiêm chỉnh nội quy, quy chế và bảo mật công ty</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>0.5</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.5</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.2</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Chấp hành giờ giấc làm việc, đi làm đúng giờ, nghỉ có phép</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>0.5</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.5</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.3</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Tác phong làm việc nghiêm túc, giao tiếp văn minh chuẩn mực</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>0.5</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.5</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.4</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Tinh thần cầu thị, trung thực và tinh thần trách nhiệm cao</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>0.5</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>
                              {(disciplineScore - 1.5 > 0 ? (disciplineScore - 1.5).toFixed(1) : '0.4')}
                            </td>
                          </tr>
                          <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
                            <td colSpan="2" style={{ textAlign: 'right', border: '1px solid #333', padding: '1.5px 3px' }}>Cộng mục 1:</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', color: '#146c43' }}>{disciplineScore.toFixed(1)}</td>
                          </tr>

                          <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2</td>
                            <td colSpan="3" style={{ border: '1px solid #333', padding: '1.5px 3px' }}>NĂNG LỰC CHUYÊN MÔN VÀ KẾT QUẢ THỰC HIỆN CÔNG VIỆC</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2.1</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Khả năng tiếp thu hướng dẫn, nắm bắt quy trình công việc</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.9</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2.2</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Vận dụng kiến thức học đường vào giải quyết công việc thực tế</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>1.8</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2.3</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Kỹ năng giải quyết vấn đề, xử lý tình huống nghiệp vụ phát sinh</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.9</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>2.4</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Chất lượng sản phẩm và tiến độ hoàn thành các nhiệm vụ được giao</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>
                              {(competenceScore - 3.6 > 0 ? (competenceScore - 3.6).toFixed(1) : '0.9')}
                            </td>
                          </tr>
                          <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
                            <td colSpan="2" style={{ textAlign: 'right', border: '1px solid #333', padding: '1.5px 3px' }}>Cộng mục 2:</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>5.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', color: '#146c43' }}>{competenceScore.toFixed(1)}</td>
                          </tr>

                          <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>3</td>
                            <td colSpan="3" style={{ border: '1px solid #333', padding: '1.5px 3px' }}>KỸ NĂNG MỀM VÀ KHẢ NĂNG HÒA NHẬP MÔI TRƯỜNG</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>3.1</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Khả năng giao tiếp, trình bày và báo cáo công việc</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.8</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>3.2</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Tinh thần làm việc nhóm, phối hợp tốt với đồng nghiệp</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>0.9</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>3.3</td>
                            <td style={{ border: '1px solid #333', padding: '1.5px 3px' }}>Tính chủ động, sáng tạo và tự học nâng cao trình độ</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>1.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', fontWeight: 'bold' }}>
                              {(skillsScore - 1.7 > 0 ? (skillsScore - 1.7).toFixed(1) : '0.8')}
                            </td>
                          </tr>
                          <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
                            <td colSpan="2" style={{ textAlign: 'right', border: '1px solid #333', padding: '1.5px 3px' }}>Cộng mục 3:</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px' }}>3.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '1.5px 3px', color: '#146c43' }}>{skillsScore.toFixed(1)}</td>
                          </tr>

                          <tr style={{ backgroundColor: '#e3f2fd', fontWeight: 'bold', fontSize: '9.5pt' }}>
                            <td colSpan="2" style={{ textAlign: 'right', border: '1px solid #333', padding: '2px 4px', textTransform: 'uppercase' }}>
                              TỔNG ĐIỂM TOÀN BỘ (Thang 10):
                            </td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '2px 4px' }}>10.0</td>
                            <td style={{ textAlign: 'center', border: '1px solid #333', padding: '2px 4px', color: '#d32f2f', fontSize: '10.5pt' }}>
                              {totalScore.toFixed(1)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Dòng tóm tắt điểm chữ & xếp loại */}
                      <div style={{ marginTop: '3px', textAlign: 'right', fontSize: '9.5pt' }}>
                        Điểm số bằng chữ: <span style={{ fontStyle: 'italic', fontWeight: 'bold', color: '#0b3d91' }}>{getScoreText(totalScore)}</span>
                        &nbsp;|&nbsp; Xếp loại chung: <strong style={{ color: '#198754' }}>{rank}</strong>
                      </div>
                    </div>

                    {/* IV. Ý KIẾN NHẬN XÉT CỦA CƠ QUAN / DOANH NGHIỆP */}
                    <div style={{ margin: '4px 0 6px 0' }}>
                      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', color: '#146c43', borderBottom: '1px solid #146c43', paddingBottom: '1px', marginBottom: '3px' }}>
                        IV. Ý KIẾN NHẬN XÉT CỦA ĐƠN VỊ TIẾP NHẬN
                      </div>
                      <div style={{ fontSize: '9pt', lineHeight: 1.3 }}>
                        <div style={{ marginBottom: '2px' }}>
                          1. <strong>Ưu điểm nổi bật:</strong> {internship.evaluation_advantages || 'Có tinh thần tự học cao, ham học hỏi, hòa nhập nhanh với văn hóa doanh nghiệp và các dự án thực tế.'}
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          2. <strong>Điểm cần khắc phục:</strong> {internship.evaluation_limitations || 'Cần tích lũy thêm kinh nghiệm thực chiến với các hệ thống quy mô lớn và trau dồi thêm kỹ năng quản lý thời gian.'}
                        </div>
                        <div>
                          3. <strong>Nhận xét tổng kết:</strong> &ldquo;{internship.final_review || 'Hoàn thành xuất sắc chương trình thực tập, đạt đầy đủ chỉ tiêu của doanh nghiệp.'}&rdquo;
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PHẦN DƯỚI CỦA VĂN BẢN: CHỮ KÝ 2 BÊN */}
                  <div style={{ flexShrink: 0, marginTop: '8px', paddingTop: '4px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none', textAlign: 'center' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '50%', verticalAlign: 'top', padding: '0 10px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt' }}>
                              CÁN BỘ HƯỚNG DẪN TRỰC TIẾP
                            </div>
                            <div style={{ fontStyle: 'italic', fontSize: '9pt', color: '#555' }}>
                              (Ký và ghi rõ họ tên)
                            </div>
                            <div style={{ height: '50px' }} />
                            <div style={{ fontWeight: 'bold', fontSize: '10.5pt' }}>
                              {internship.mentor_name || 'Mentor hướng dẫn'}
                            </div>
                          </td>
                          <td style={{ width: '50%', verticalAlign: 'top', padding: '0 10px' }}>
                            <div style={{ fontStyle: 'italic', fontSize: '9pt', color: '#333', marginBottom: '1px' }}>
                              Hà Nội, ngày {approvedDate.getDate()} tháng {approvedDate.getMonth() + 1} năm {approvedDate.getFullYear()}
                            </div>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt' }}>
                              ĐẠI DIỆN ĐƠN VỊ THỰC TẬP
                            </div>
                            <div style={{ fontStyle: 'italic', fontSize: '9pt', color: '#555' }}>
                              (Ký tên và đóng dấu đỏ)
                            </div>
                            <div style={{ height: '50px' }} />
                            <div style={{ fontWeight: 'bold', fontSize: '10.5pt' }}>
                              {internship.hr_confirmed_by_name || 'Phòng Quản Trị Nhân Sự'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Các nút Tải xuống chuyên dụng */}
            <div className="modal-footer bg-white py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-light text-dark border font-monospace">
                  Mã hồ sơ: {internship.certificate_code || 'VYMI-CERT-XXXX'}
                </span>
                <span className="text-muted small">
                  Sinh viên: <strong>{displayName}</strong> ({internship.position_title})
                </span>
              </div>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(!isEditingStudent)}
                  className={`btn btn-sm ${isEditingStudent ? 'btn-outline-warning' : 'btn-outline-primary'}`}
                >
                  <i className="bi bi-pencil me-1" />
                  {isEditingStudent ? 'Đóng form sửa' : 'Sửa thông tin SV'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBoth}
                  disabled={isDownloading}
                  className="btn btn-sm btn-outline-primary fw-semibold px-2.5"
                  title="Tải trọn bộ cả Giấy xác nhận và Phiếu đánh giá về máy"
                >
                  <i className="bi bi-files me-1" />
                  Tải cả 2 tài liệu
                </button>

                {/* Nút Tải xuống tài liệu hiện tại */}
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownloadPdf(activeDoc)}
                  className="btn btn-sm btn-success fw-semibold px-3 shadow-sm"
                  title="Tải file PDF chuẩn A4 về máy để in bằng công cụ chuyên dụng bên ngoài"
                >
                  {isDownloading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1.5" />
                      Đang xử lý tải xuống...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-1.5" />
                      Tải xuống {activeDoc === 'CERTIFICATE' ? 'Giấy xác nhận' : 'Phiếu đánh giá'} (PDF A4)
                    </>
                  )}
                </button>

                <button type="button" onClick={onClose} className="btn btn-sm btn-outline-secondary">
                  Đóng
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
