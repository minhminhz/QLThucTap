import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import eventBus from '../../services/eventBus';

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div className="col-6 col-md-3">
      <span className="text-muted small d-block mb-1">{label}</span>
      <strong className="text-dark small">{value}</strong>
    </div>
  );
}

// ─── Apply Form ───────────────────────────────────────────────────────────────
function ApplyForm({ position, user, onSuccess, onCancel }) {
  const [step, setStep]           = useState(1); // 1=contact+cv, 2=confirm
  const [name,  setName]          = useState(user?.full_name || '');
  const [email, setEmail]         = useState(user?.email     || '');
  const [phone, setPhone]         = useState(user?.phone     || '');
  const [cvFile, setCvFile]       = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // ── Validate step 1 ────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim())  e.name  = 'Vui lòng nhập họ và tên.';
    if (!email.trim()) e.email = 'Vui lòng nhập địa chỉ email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Email không đúng định dạng.';
    if (!phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^(\+84|0)[0-9]{8,10}$/.test(phone.trim().replace(/\s/g, '')))
      e.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
    if (!cvFile)       e.cvFile = 'Vui lòng chọn file CV.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (ev) => {
    ev.preventDefault();
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      // Step A: Upload CV
      const cvForm = new FormData();
      cvForm.append('cv', cvFile);
      const cvRes = await api.post('/cvs/upload', cvForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const cvId = cvRes.data.data.id;

      // Step B: Submit application
      const appRes = await api.post('/applications', {
        position_id:      position.id,
        cv_id:            cvId,
        cover_letter:     coverLetter || null,
        applicant_name:   name.trim(),
        applicant_email:  email.trim(),
        applicant_phone:  phone.trim().replace(/\s/g, ''),
      });

      onSuccess(appRes.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setServerError(msg);
      setStep(1); // go back so user can fix
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card border shadow-sm mt-3">
      {/* Header */}
      <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between py-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-file-earmark-arrow-up fs-5" />
          <span className="fw-semibold">Nộp hồ sơ ứng tuyển</span>
        </div>
        <div className="d-flex align-items-center gap-2 small">
          <span className={`badge ${step >= 1 ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>
            1. Thông tin
          </span>
          <i className="bi bi-chevron-right" />
          <span className={`badge ${step === 2 ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>
            2. Xác nhận
          </span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Server error */}
        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{serverError}</span>
          </div>
        )}

        {/* ─── Step 1 ─── */}
        {step === 1 && (
          <form onSubmit={handleNext} noValidate>
            <p className="text-muted small mb-3">
              <i className="bi bi-info-circle text-primary me-1" />
              Vui lòng điền đầy đủ thông tin để nhà tuyển dụng có thể liên hệ với bạn.
            </p>

            <div className="row g-3 mb-3">
              {/* Họ và tên */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold" htmlFor="app_name">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-person" /></span>
                  <input
                    id="app_name"
                    type="text"
                    className={`form-control${errors.name ? ' is-invalid' : ''}`}
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
              </div>

              {/* Email */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold" htmlFor="app_email">
                  Email liên hệ <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope" /></span>
                  <input
                    id="app_email"
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="example@email.com"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold" htmlFor="app_phone">
                  Số điện thoại <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-telephone" /></span>
                  <input
                    id="app_phone"
                    type="tel"
                    className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
                    placeholder="0912345678"
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>
              </div>

              {/* File CV */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold" htmlFor="app_cv">
                  File CV (PDF, DOC, DOCX) <span className="text-danger">*</span>
                </label>
                <input
                  id="app_cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className={`form-control${errors.cvFile ? ' is-invalid' : ''}`}
                  onChange={(e) => { setCvFile(e.target.files[0] || null); setErrors((p) => ({ ...p, cvFile: '' })); }}
                />
                {errors.cvFile
                  ? <div className="invalid-feedback">{errors.cvFile}</div>
                  : <div className="form-text small">PDF được khuyến khích, dưới 5 MB.</div>}
              </div>

              {/* Thư giới thiệu */}
              <div className="col-12">
                <label className="form-label small fw-semibold" htmlFor="app_cover">
                  Thư giới thiệu / Mục tiêu thực tập{' '}
                  <span className="text-muted fw-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  id="app_cover"
                  rows={3}
                  className="form-control"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu kỹ năng, định hướng và nguyện vọng của bạn..."
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary fw-semibold px-4">
                Tiếp theo <i className="bi bi-arrow-right ms-1" />
              </button>
              <button type="button" onClick={onCancel} className="btn btn-outline-secondary px-3">
                Hủy bỏ
              </button>
            </div>
          </form>
        )}

        {/* ─── Step 2: Confirm ─── */}
        {step === 2 && (
          <div>
            <p className="text-muted small mb-3">
              <i className="bi bi-check2-circle text-success me-1" />
              Kiểm tra lại thông tin trước khi gửi hồ sơ.
            </p>

            <div className="table-responsive mb-4">
              <table className="table table-bordered table-sm small align-middle">
                <tbody>
                  <tr>
                    <th className="bg-light text-muted fw-semibold" style={{ width: '35%' }}>Vị trí ứng tuyển</th>
                    <td className="fw-bold text-dark">{position.title}</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-muted fw-semibold">Họ và tên</th>
                    <td>{name}</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-muted fw-semibold">Email liên hệ</th>
                    <td>{email}</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-muted fw-semibold">Số điện thoại</th>
                    <td>{phone}</td>
                  </tr>
                  <tr>
                    <th className="bg-light text-muted fw-semibold">File CV</th>
                    <td>
                      <i className="bi bi-file-earmark-pdf text-danger me-1" />
                      {cvFile?.name}
                      <span className="text-muted ms-2">({(cvFile?.size / 1024).toFixed(1)} KB)</span>
                    </td>
                  </tr>
                  {coverLetter && (
                    <tr>
                      <th className="bg-light text-muted fw-semibold">Thư giới thiệu</th>
                      <td className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{coverLetter}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="alert alert-warning small py-2 d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>Sau khi gửi, bạn không thể chỉnh sửa hồ sơ ứng tuyển này.</span>
            </div>

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-success fw-semibold px-4"
              >
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Đang gửi...</>
                ) : (
                  <><i className="bi bi-send-fill me-2" />Gửi hồ sơ ứng tuyển</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="btn btn-outline-secondary px-3"
              >
                <i className="bi bi-arrow-left me-1" />Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PositionDetail() {
  const { id }      = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [position,            setPosition]            = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [showApplyForm,       setShowApplyForm]       = useState(false);
  const [successMsg,          setSuccessMsg]          = useState('');
  const [existingApplication, setExistingApplication] = useState(null);

  const checkMyApplication = async () => {
    if (user?.role === 'APPLICANT') {
      try {
        const res = await api.get('/applications/my');
        const myApps = res.data.data || [];
        const found = myApps.find((a) => String(a.position_id) === String(id));
        setExistingApplication(found || null);
      } catch {
        setExistingApplication(null);
      }
    } else {
      setExistingApplication(null);
    }
  };

  useEffect(() => {
    api.get(`/positions/${id}`)
      .then((r) => setPosition(r.data.data))
      .catch(() => navigate('/positions'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    checkMyApplication();
  }, [id, user]);

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Loading text="Đang tải thông tin chi tiết vị trí..." />
      </div>
    );
  }

  if (!position) return null;

  const isExpired = new Date(position.deadline) < new Date();
  const canApply  = user?.role === 'APPLICANT' && position.status === 'OPEN' && !isExpired;

  return (
    <div className="container py-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small text-muted">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none text-muted">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/positions" className="text-decoration-none text-muted">Vị trí thực tập</Link>
          </li>
          <li className="breadcrumb-item active text-dark fw-medium text-truncate" style={{ maxWidth: 300 }}>
            {position.title}
          </li>
        </ol>
      </nav>

      {/* Header Card */}
      <div className="card shadow-sm border mb-4">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">TOP THỰC TẬP</span>
                <span className="text-muted small fw-medium">
                  <i className="bi bi-geo-alt text-primary me-1" />{position.branch_name}
                </span>
              </div>
              <h1 className="h3 fw-bold text-dark mb-0">{position.title}</h1>
            </div>
            <StatusBadge status={isExpired ? 'CLOSED' : position.status} />
          </div>

          {/* Quick Metrics */}
          <div className="row g-3 py-3 px-3 my-3 bg-light rounded-3 border">
            <InfoRow label="Phòng ban"            value={position.department_name} />
            <InfoRow label="Thời gian thực tập"   value={position.internship_duration} />
            <InfoRow label="Chỉ tiêu tuyển"       value={`${position.quantity} người`} />
            <InfoRow
              label="Hạn nộp hồ sơ"
              value={
                <span className={isExpired ? 'text-danger' : ''}>
                  {formatDate(position.deadline)}
                  {isExpired && <span className="ms-1 fw-normal">(Hết hạn)</span>}
                </span>
              }
            />
          </div>

          {/* Success alert */}
          {successMsg && (
            <div className="alert alert-success d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3 mb-4 p-3 shadow-sm rounded-3">
              <div className="d-flex align-items-start gap-2">
                <i className="bi bi-check-circle-fill text-success fs-4 mt-0.5" />
                <div>
                  <div className="fw-bold fs-6 text-success-emphasis">Nộp hồ sơ ứng tuyển thành công!</div>
                  <div className="small text-muted">{successMsg}</div>
                </div>
              </div>
              <Link to="/applicant/dashboard" className="btn btn-sm btn-success px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 flex-shrink-0">
                <i className="bi bi-arrow-right-circle" /> Xem Dashboard của tôi
              </Link>
            </div>
          )}

          {/* Already applied banner */}
          {existingApplication && (
            <div className="card bg-primary-subtle border-primary-subtle mb-4">
              <div className="card-body p-3 p-md-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                    <strong className="text-dark">Bạn đã nộp hồ sơ cho vị trí này</strong>
                    <StatusBadge status={existingApplication.status} />
                  </div>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-calendar3 me-1"></i>
                    Ngày nộp: {new Date(existingApplication.created_at).toLocaleDateString('vi-VN')}
                    {existingApplication.cv_original_name && (
                      <span className="ms-2">
                        | File CV: <strong className="text-dark">{existingApplication.cv_original_name}</strong>
                      </span>
                    )}
                  </p>
                  {existingApplication.hr_note && (
                    <div className="mt-2 text-dark small p-2 bg-white rounded border">
                      <i className="bi bi-chat-quote-fill text-primary me-1"></i>
                      <strong>Phản hồi từ HR:</strong> {existingApplication.hr_note}
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <Link to="/applicant/dashboard" className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm px-3">
                    <i className="bi bi-folder2-open"></i> Xem hồ sơ trong Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          {canApply && !existingApplication && !showApplyForm && !successMsg && (
            <button
              onClick={() => setShowApplyForm(true)}
              className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
            >
              <i className="bi bi-send-fill" />
              Ứng tuyển vị trí này
            </button>
          )}

          {!user && position.status === 'OPEN' && !isExpired && (
            <div className="d-flex flex-wrap gap-2">
              <Link to="/login" className="btn btn-primary px-4 py-2 fw-semibold">
                Đăng nhập để nộp CV
              </Link>
              <Link to="/register" className="btn btn-outline-secondary px-4 py-2 fw-semibold">
                Đăng ký tài khoản
              </Link>
            </div>
          )}

          {/* Apply Form */}
          {showApplyForm && !existingApplication && (
            <ApplyForm
              position={position}
              user={user}
              onCancel={() => setShowApplyForm(false)}
              onSuccess={(newApp) => {
                setShowApplyForm(false);
                setExistingApplication(newApp);
                setSuccessMsg('Hồ sơ ứng tuyển của bạn đã được gửi thành công! Nhà tuyển dụng sẽ xem xét và phản hồi sớm nhất.');
                // Broadcast to all other open tabs (HR, Admin, Applicant Dashboard)
                eventBus.emit('APPLICATION_SUBMITTED', { positionId: position.id, application: newApp });
              }}
            />
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="row g-4">
        {/* Main column */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-card-text text-primary me-2" />Mô tả công việc thực tập
              </h5>
            </div>
            <div className="card-body p-4 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>
              {position.description}
            </div>
          </div>

          {position.requirements && (
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-list-check text-primary me-2" />Yêu cầu ứng viên
                </h5>
              </div>
              <div className="card-body p-4 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>
                {position.requirements}
              </div>
            </div>
          )}

          {position.benefits && (
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-gift text-primary me-2" />Quyền lợi &amp; Phụ cấp thực tập
                </h5>
              </div>
              <div className="card-body p-4 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>
                {position.benefits}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0 text-dark">
                <i className="bi bi-building text-primary me-2" />Thông tin cơ sở
              </h6>
            </div>
            <div className="card-body p-3 small text-secondary">
              <div className="mb-2">
                <span className="text-muted d-block">Cơ sở tiếp nhận:</span>
                <strong className="text-dark">{position.branch_name}</strong>
              </div>
              <div className="mb-2">
                <span className="text-muted d-block">Doanh nghiệp:</span>
                <strong className="text-dark">VYMI Tech Solutions</strong>
              </div>
              <div>
                <span className="text-muted d-block">Hình thức làm việc:</span>
                <strong className="text-dark">On-site / Hybrid linh hoạt</strong>
              </div>
            </div>
          </div>

          <div className="card border-primary border-opacity-25 bg-primary-subtle shadow-sm">
            <div className="card-body p-4 text-dark small">
              <h6 className="fw-bold text-primary mb-2">
                <i className="bi bi-shield-check me-1" /> Cam kết đào tạo VYMI Tech
              </h6>
              <p className="mb-0 text-muted">
                100% thực tập sinh được hướng dẫn 1-1 bởi Mentor có kinh nghiệm,
                tham gia các dự án thực tế và được cấp chứng nhận thực tập chính thức sau khi hoàn thành.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
