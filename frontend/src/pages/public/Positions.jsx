import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/common/EmptyState';
import eventBus from '../../services/eventBus';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDeptIconClass(name) {
  if (!name) return 'bi-laptop';
  if (name.includes('AI') || name.includes('Data') || name.includes('Trí tuệ')) return 'bi-cpu';
  if (name.includes('QA') || name.includes('Kiểm thử') || name.includes('QC')) return 'bi-check2-circle';
  if (name.includes('UI') || name.includes('UX') || name.includes('Thiết kế')) return 'bi-palette';
  if (name.includes('HR') || name.includes('Nhân sự')) return 'bi-people';
  return 'bi-code-slash';
}

function getAllowanceInfo(benefits) {
  if (!benefits) return { text: 'Hỗ trợ thực tập', type: 'info' };
  const text = benefits.toLowerCase();
  if (text.includes('5.000.000') || text.includes('5 triệu') || text.includes('trên 5')) {
    return { text: '3 - 5+ triệu/tháng', type: 'success' };
  }
  if (text.includes('3.000.000') || text.includes('3 triệu')) {
    return { text: '3 - 5 triệu/tháng', type: 'success' };
  }
  if (text.includes('phụ cấp') || text.includes('trợ cấp')) {
    return { text: 'Có phụ cấp', type: 'primary' };
  }
  return { text: 'Hỗ trợ thực tập', type: 'secondary' };
}

// ─── Apply Form Component (Tích hợp nộp đơn trực tiếp) ────────────────────────
function InlineApplyForm({ position, user, onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ và tên.';
    if (!email.trim()) e.email = 'Vui lòng nhập địa chỉ email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Email không đúng định dạng.';
    if (!phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^(\+84|0)[0-9]{8,10}$/.test(phone.trim().replace(/\s/g, ''))) e.phone = 'Số điện thoại không hợp lệ.';
    if (!cvFile) e.cvFile = 'Vui lòng tải lên file CV (PDF, DOCX).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      // 1. Upload CV
      const cvForm = new FormData();
      cvForm.append('cv', cvFile);
      const cvRes = await api.post('/cvs/upload', cvForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const cvId = cvRes.data.data.id;

      // 2. Submit application
      const appRes = await api.post('/applications', {
        position_id: position.id,
        cv_id: cvId,
        cover_letter: coverLetter || null,
        applicant_name: name.trim(),
        applicant_email: email.trim(),
        applicant_phone: phone.trim().replace(/\s/g, ''),
      });

      onSuccess(appRes.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.';
      setServerError(msg);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card border-primary border-opacity-50 shadow-sm mt-3">
      <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between py-2.5">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-file-earmark-arrow-up-fill" />
          <span className="fw-semibold small">Nộp hồ sơ ứng tuyển trực tuyến</span>
        </div>
        <div className="d-flex align-items-center gap-1.5 small">
          <span className={`badge ${step === 1 ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>1. Thông tin</span>
          <i className="bi bi-chevron-right text-white-50" style={{ fontSize: '0.75rem' }} />
          <span className={`badge ${step === 2 ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>2. Xác nhận</span>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {serverError && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{serverError}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext}>
            <div className="row g-2.5 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold mb-1">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="Nguyễn Văn A"
                />
                {errors.name && <div className="invalid-feedback small">{errors.name}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold mb-1">
                  Email liên hệ <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className={`form-control form-control-sm ${errors.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                  placeholder="applicant@email.com"
                />
                {errors.email && <div className="invalid-feedback small">{errors.email}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold mb-1">
                  Số điện thoại <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className={`form-control form-control-sm ${errors.phone ? 'is-invalid' : ''}`}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })); }}
                  placeholder="0912345678"
                />
                {errors.phone && <div className="invalid-feedback small">{errors.phone}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold mb-1">
                  Tải lên File CV <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className={`form-control form-control-sm ${errors.cvFile ? 'is-invalid' : ''}`}
                  onChange={(e) => { setCvFile(e.target.files[0] || null); setErrors(prev => ({ ...prev, cvFile: '' })); }}
                />
                {errors.cvFile ? (
                  <div className="invalid-feedback small">{errors.cvFile}</div>
                ) : (
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Định dạng PDF/DOCX, dưới 5MB.</div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold mb-1">
                  Thư giới thiệu / Mục tiêu thực tập <span className="text-muted fw-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  rows={2}
                  className="form-control form-control-sm"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Chia sẻ ngắn gọn về kỹ năng, dự án hoặc lý do bạn quan tâm đến vị trí này..."
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" onClick={onCancel} className="btn btn-sm btn-outline-secondary px-3">
                Hủy
              </button>
              <button type="submit" className="btn btn-sm btn-primary px-4 fw-semibold">
                Tiếp tục <i className="bi bi-arrow-right ms-1" />
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="p-3 bg-light rounded-3 border mb-3 small">
              <div className="row g-2">
                <div className="col-sm-4 text-muted">Vị trí:</div>
                <div className="col-sm-8 fw-bold text-dark">{position.title}</div>
                <div className="col-sm-4 text-muted">Họ tên:</div>
                <div className="col-sm-8 text-dark">{name}</div>
                <div className="col-sm-4 text-muted">Email:</div>
                <div className="col-sm-8 text-dark">{email}</div>
                <div className="col-sm-4 text-muted">Số điện thoại:</div>
                <div className="col-sm-8 text-dark">{phone}</div>
                <div className="col-sm-4 text-muted">File CV đính kèm:</div>
                <div className="col-sm-8 text-dark">
                  <i className="bi bi-file-earmark-pdf text-danger me-1" />
                  {cvFile?.name} <span className="text-muted">({(cvFile?.size / 1024).toFixed(0)} KB)</span>
                </div>
              </div>
            </div>

            <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-shield-check text-warning fs-5" />
              <span>Hồ sơ sau khi gửi sẽ được chuyển trực tiếp tới phòng nhân sự cơ sở <strong>{position.branch_name}</strong>.</span>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="btn btn-sm btn-outline-secondary px-3"
              >
                <i className="bi bi-arrow-left me-1" /> Sửa thông tin
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-sm btn-success px-4 fw-bold shadow-xs"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1.5" />
                    Đang gửi hồ sơ...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill me-1.5" />
                    Xác nhận nộp đơn
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Positions Page ───────────────────────────────────────────────────────
export default function Positions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const querySearch = searchParams.get('search') || '';
  const queryBranch = searchParams.get('branch_id') || '';
  const queryDept = searchParams.get('department_id') || '';
  const queryPositionId = searchParams.get('id') || '';

  // Local state for search & filter inputs
  const [keyword, setKeyword] = useState(querySearch);
  const [selectedBranch, setSelectedBranch] = useState(queryBranch);
  const [selectedDept, setSelectedDept] = useState(queryDept);
  const [selectedAllowance, setSelectedAllowance] = useState('ALL'); // ALL, HAS_ALLOWANCE, FROM_3M
  const [selectedDuration, setSelectedDuration] = useState('ALL'); // ALL, 3_MONTHS
  const [selectedTech, setSelectedTech] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST'); // NEWEST, DEADLINE, QUANTITY

  // Data states
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected position for Master-Detail view
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [myApplications, setMyApplications] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const detailRef = useRef(null);

  // Sync keyword from URL if URL search changes externally
  useEffect(() => {
    setKeyword(querySearch);
    setSelectedBranch(queryBranch);
    setSelectedDept(queryDept);
  }, [querySearch, queryBranch, queryDept]);

  // Load branches and departments
  useEffect(() => {
    // Branches
    api.get('/branches')
      .then((res) => setBranches(res.data.data || []))
      .catch(() => setBranches([]));

    // Departments (if route exists, otherwise will be extracted from positions)
    api.get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  // Fetch applicant's existing applications
  const fetchMyApplications = async () => {
    if (user?.role === 'APPLICANT') {
      try {
        const res = await api.get('/applications/my');
        setMyApplications(res.data.data || []);
      } catch {
        setMyApplications([]);
      }
    } else {
      setMyApplications([]);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [user]);

  // Listen to application submit events from other tabs
  useEffect(() => {
    const unsub = eventBus.on('APPLICATION_SUBMITTED', () => {
      fetchMyApplications();
    });
    return () => unsub();
  }, []);

  // Load positions from backend
  const fetchPositions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBranch) params.set('branch_id', selectedBranch);
    if (selectedDept) params.set('department_id', selectedDept);
    if (keyword.trim()) params.set('search', keyword.trim());

    api.get(`/positions?${params.toString()}`)
      .then((res) => {
        const list = res.data.data || [];
        setPositions(list);

        // Fallback: extract unique departments if departments API was not populated
        if (departments.length === 0) {
          const deptMap = new Map();
          list.forEach((p) => {
            if (p.department_id && p.department_name) {
              deptMap.set(p.department_id, { id: p.department_id, name: p.department_name });
            }
          });
          if (deptMap.size > 0) {
            setDepartments(Array.from(deptMap.values()));
          }
        }
      })
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
  }, [selectedBranch, selectedDept, querySearch]);

  // If queryPositionId exists in URL, select that position
  useEffect(() => {
    if (!queryPositionId) return;
    const found = positions.find((p) => String(p.id) === String(queryPositionId));
    if (found) {
      setSelectedPosition(found);
    } else if (positions.length > 0) {
      // If position id is not in current filtered list, fetch it directly
      setIsDetailLoading(true);
      api.get(`/positions/${queryPositionId}`)
        .then((r) => {
          if (r.data.data) setSelectedPosition(r.data.data);
        })
        .catch(() => {})
        .finally(() => setIsDetailLoading(false));
    }
  }, [queryPositionId, positions]);

  // Handle Search submit from Top Search Bar
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (keyword.trim()) newParams.set('search', keyword.trim());
    else newParams.delete('search');

    if (selectedBranch) newParams.set('branch_id', selectedBranch);
    else newParams.delete('branch_id');

    if (selectedDept) newParams.set('department_id', selectedDept);
    else newParams.delete('department_id');

    setSearchParams(newParams);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setKeyword('');
    setSelectedBranch('');
    setSelectedDept('');
    setSelectedAllowance('ALL');
    setSelectedDuration('ALL');
    setSelectedTech('');
    setSortBy('NEWEST');
    setSelectedPosition(null);
    setSearchParams(new URLSearchParams());
  };

  // Select a position
  const handleSelectPosition = (pos) => {
    setSelectedPosition(pos);
    setShowApplyForm(false);
    setApplySuccessMsg('');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('id', pos.id);
    setSearchParams(newParams);

    // Smooth scroll into detail view on mobile
    if (window.innerWidth < 992 && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Close detail view (return to full list view)
  const handleCloseDetail = () => {
    setSelectedPosition(null);
    setShowApplyForm(false);
    setApplySuccessMsg('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('id');
    setSearchParams(newParams);
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    const url = `${window.location.origin}/positions?id=${selectedPosition.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  // Check if current user already applied for selected position
  const currentApplication = useMemo(() => {
    if (!selectedPosition || !user) return null;
    return myApplications.find((a) => String(a.position_id) === String(selectedPosition.id)) || null;
  }, [selectedPosition, user, myApplications]);

  // Client-side filtering & sorting for rich interactive sidebar
  const filteredPositions = useMemo(() => {
    let result = [...positions];

    // Filter by Allowance
    if (selectedAllowance === 'HAS_ALLOWANCE') {
      result = result.filter((p) => {
        const text = (p.benefits || '').toLowerCase();
        return text.includes('phụ cấp') || text.includes('trợ cấp') || text.includes('triệu') || text.includes('000');
      });
    } else if (selectedAllowance === 'FROM_3M') {
      result = result.filter((p) => {
        const text = (p.benefits || '').toLowerCase();
        return text.includes('3.000.000') || text.includes('3 triệu') || text.includes('5.000.000') || text.includes('5 triệu');
      });
    }

    // Filter by Duration
    if (selectedDuration === '3_MONTHS') {
      result = result.filter((p) => (p.internship_duration || '').includes('3 tháng'));
    }

    // Filter by Tech Tag
    if (selectedTech) {
      const term = selectedTech.toLowerCase();
      result = result.filter((p) => {
        const combined = `${p.title} ${p.description || ''} ${p.requirements || ''}`.toLowerCase();
        return combined.includes(term);
      });
    }

    // Sort
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'DEADLINE') {
      result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === 'QUANTITY') {
      result.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    }

    return result;
  }, [positions, selectedAllowance, selectedDuration, selectedTech, sortBy]);

  // Popular Tech Tags for quick filtering
  const popularTechs = ['React', 'Node.js', 'Python', 'Java', 'AI / ML', 'QA Tester', 'UI/UX', 'SQL', 'Docker'];

  // Has active filters
  const hasActiveFilters = Boolean(
    keyword || selectedBranch || selectedDept || selectedAllowance !== 'ALL' || selectedDuration !== 'ALL' || selectedTech || sortBy !== 'NEWEST'
  );

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* ═══════════════════════════════════════════════════════════════════════════
          1. TOP SEARCH SECTION (Đúng độ rộng màn hình chuẩn, thanh tìm kiếm trên cùng)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-bottom shadow-xs py-4 mb-4">
        <div className="container">
          {/* Breadcrumb & Header Title */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb small text-muted mb-1">
                  <li className="breadcrumb-item">
                    <Link to="/" className="text-decoration-none text-muted">
                      <i className="bi bi-house-door me-1" />Trang chủ
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                    Vị trí tuyển dụng thực tập
                  </li>
                </ol>
              </nav>
              <h1 className="h4 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-briefcase-fill text-primary" />
                Cơ hội Thực tập Doanh nghiệp VYMI Tech
              </h1>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill small fw-semibold">
                <i className="bi bi-check-circle-fill me-1" />
                {filteredPositions.length} Vị trí đang tuyển
              </span>
            </div>
          </div>

          {/* Search Form Card */}
          <form onSubmit={handleSearchSubmit} className="card border shadow-xs p-2.5 bg-white">
            <div className="row g-2 align-items-center">
              {/* Keyword Input */}
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 text-primary">
                    <i className="bi bi-search fs-6" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 shadow-none ps-1"
                    placeholder="Tìm theo vị trí, công nghệ (React, Node.js, AI, QA...)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  {keyword && (
                    <button
                      type="button"
                      className="btn btn-link text-muted p-0 me-2 text-decoration-none"
                      onClick={() => { setKeyword(''); }}
                      title="Xóa từ khóa"
                    >
                      <i className="bi bi-x-circle-fill" />
                    </button>
                  )}
                </div>
              </div>

              {/* Branch Select */}
              <div className="col-12 col-md-3 border-start-md">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 text-muted">
                    <i className="bi bi-geo-alt-fill text-danger text-opacity-75" />
                  </span>
                  <select
                    className="form-select border-0 shadow-none ps-1"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    <option value="">Tất cả cơ sở</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department Select */}
              <div className="col-12 col-md-2 border-start-md">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 text-muted">
                    <i className="bi bi-building text-secondary" />
                  </span>
                  <select
                    className="form-select border-0 shadow-none ps-1"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="">Tất cả phòng ban</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="col-12 col-md-2">
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                >
                  <i className="bi bi-search" />
                  <span>Tìm kiếm</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Filter Tags (Chips) */}
          <div className="d-flex align-items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-muted small fw-medium">
              <i className="bi bi-lightning-charge-fill text-warning me-1" />
              Gợi ý nhanh:
            </span>
            {popularTechs.map((tech) => {
              const active = selectedTech.toLowerCase() === tech.toLowerCase() || keyword.toLowerCase().includes(tech.toLowerCase());
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => {
                    if (selectedTech.toLowerCase() === tech.toLowerCase()) {
                      setSelectedTech('');
                    } else {
                      setSelectedTech(tech);
                    }
                  }}
                  className={`btn btn-sm py-0.5 px-2.5 rounded-pill small transition-all ${
                    active
                      ? 'btn-primary shadow-xs'
                      : 'btn-outline-secondary bg-white text-secondary'
                  }`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {tech}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-link text-danger p-0 ms-auto text-decoration-none small d-flex align-items-center gap-1"
              >
                <i className="bi bi-arrow-counterclockwise" />
                <span>Đặt lại tất cả lọc</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          2. MAIN CONTENT (Độ rộng chuẩn container, Sidebar lọc bên trái, Tin & Chi tiết)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="container">
        <div className="row g-4">
          {/* ───────────────────────────────────────────────────────────────────
              CỘT TRÁI: SIDEBAR BỘ LỌC NÂNG CAO (Advanced Filter Sidebar)
              ─────────────────────────────────────────────────────────────────── */}
          <div className="col-12 col-lg-3">
            <div className="card border shadow-xs sticky-top" style={{ top: '80px', zIndex: 10 }}>
              <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-primary" />
                  Bộ lọc nâng cao
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none small"
                    title="Xóa lọc"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              <div className="card-body p-3 p-xl-3.5">
                {/* 1. Bộ lọc Cơ sở (Branch) */}
                <div className="mb-4">
                  <label className="fw-bold text-dark small mb-2 d-flex align-items-center justify-content-between">
                    <span><i className="bi bi-geo-alt me-1 text-danger" /> Cơ sở làm việc</span>
                    <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                      {branches.length} cơ sở
                    </span>
                  </label>
                  <div className="d-flex flex-column gap-1.5">
                    <label className={`form-check-label d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer ${selectedBranch === '' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary small'}`}>
                      <span className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="branch_radio"
                          className="form-check-input mt-0"
                          checked={selectedBranch === ''}
                          onChange={() => setSelectedBranch('')}
                        />
                        Tất cả cơ sở
                      </span>
                      <span className="badge bg-white text-muted border">{positions.length}</span>
                    </label>

                    {branches.map((b) => {
                      const count = positions.filter((p) => Number(p.branch_id) === Number(b.id)).length;
                      const isSelected = String(selectedBranch) === String(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`form-check-label d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer ${isSelected ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary small'}`}
                        >
                          <span className="d-flex align-items-center gap-2">
                            <input
                              type="radio"
                              name="branch_radio"
                              className="form-check-input mt-0"
                              checked={isSelected}
                              onChange={() => setSelectedBranch(String(b.id))}
                            />
                            {b.name}
                          </span>
                          <span className="badge bg-white text-muted border">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Bộ lọc Phòng ban / Bộ phận (Department) */}
                <div className="mb-4 pt-3 border-top">
                  <label className="fw-bold text-dark small mb-2 d-flex align-items-center justify-content-between">
                    <span><i className="bi bi-building me-1 text-primary" /> Phòng ban / Lĩnh vực</span>
                    <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                      {departments.length} ngành
                    </span>
                  </label>
                  <div className="d-flex flex-column gap-1.5">
                    <label className={`form-check-label d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer ${selectedDept === '' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary small'}`}>
                      <span className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          name="dept_radio"
                          className="form-check-input mt-0"
                          checked={selectedDept === ''}
                          onChange={() => setSelectedDept('')}
                        />
                        Tất cả phòng ban
                      </span>
                    </label>

                    {departments.map((d) => {
                      const count = positions.filter((p) => Number(p.department_id) === Number(d.id)).length;
                      const isSelected = String(selectedDept) === String(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`form-check-label d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer ${isSelected ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary small'}`}
                        >
                          <span className="d-flex align-items-center gap-2 text-truncate me-1" title={d.name}>
                            <input
                              type="radio"
                              name="dept_radio"
                              className="form-check-input mt-0"
                              checked={isSelected}
                              onChange={() => setSelectedDept(String(d.id))}
                            />
                            <span className="text-truncate">{d.name}</span>
                          </span>
                          <span className="badge bg-white text-muted border flex-shrink-0">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Bộ lọc Mức trợ cấp (Allowance) */}
                <div className="mb-4 pt-3 border-top">
                  <label className="fw-bold text-dark small mb-2 d-flex align-items-center">
                    <i className="bi bi-cash-stack me-1 text-success" /> Mức trợ cấp thực tập
                  </label>
                  <div className="d-flex flex-column gap-1.5 small">
                    <label className={`form-check-label p-2 rounded-2 cursor-pointer d-flex align-items-center gap-2 ${selectedAllowance === 'ALL' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary'}`}>
                      <input
                        type="radio"
                        name="allowance_radio"
                        className="form-check-input mt-0"
                        checked={selectedAllowance === 'ALL'}
                        onChange={() => setSelectedAllowance('ALL')}
                      />
                      Tất cả mức trợ cấp
                    </label>
                    <label className={`form-check-label p-2 rounded-2 cursor-pointer d-flex align-items-center gap-2 ${selectedAllowance === 'HAS_ALLOWANCE' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary'}`}>
                      <input
                        type="radio"
                        name="allowance_radio"
                        className="form-check-input mt-0"
                        checked={selectedAllowance === 'HAS_ALLOWANCE'}
                        onChange={() => setSelectedAllowance('HAS_ALLOWANCE')}
                      />
                      Có phụ cấp hàng tháng
                    </label>
                    <label className={`form-check-label p-2 rounded-2 cursor-pointer d-flex align-items-center gap-2 ${selectedAllowance === 'FROM_3M' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary'}`}>
                      <input
                        type="radio"
                        name="allowance_radio"
                        className="form-check-input mt-0"
                        checked={selectedAllowance === 'FROM_3M'}
                        onChange={() => setSelectedAllowance('FROM_3M')}
                      />
                      3.000.000 - 5.000.000 VNĐ
                    </label>
                  </div>
                </div>

                {/* 4. Thời gian thực tập (Duration) */}
                <div className="mb-4 pt-3 border-top">
                  <label className="fw-bold text-dark small mb-2 d-flex align-items-center">
                    <i className="bi bi-clock-history me-1 text-info" /> Thời gian thực tập
                  </label>
                  <div className="d-flex flex-column gap-1.5 small">
                    <label className={`form-check-label p-2 rounded-2 cursor-pointer d-flex align-items-center gap-2 ${selectedDuration === 'ALL' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary'}`}>
                      <input
                        type="radio"
                        name="duration_radio"
                        className="form-check-input mt-0"
                        checked={selectedDuration === 'ALL'}
                        onChange={() => setSelectedDuration('ALL')}
                      />
                      Tất cả thời hạn
                    </label>
                    <label className={`form-check-label p-2 rounded-2 cursor-pointer d-flex align-items-center gap-2 ${selectedDuration === '3_MONTHS' ? 'bg-primary-subtle text-primary fw-semibold' : 'hover-bg-light text-secondary'}`}>
                      <input
                        type="radio"
                        name="duration_radio"
                        className="form-check-input mt-0"
                        checked={selectedDuration === '3_MONTHS'}
                        onChange={() => setSelectedDuration('3_MONTHS')}
                      />
                      Tiêu chuẩn 3 tháng
                    </label>
                  </div>
                </div>

                {/* 5. Sắp xếp kết quả */}
                <div className="pt-3 border-top">
                  <label className="fw-bold text-dark small mb-2 d-flex align-items-center">
                    <i className="bi bi-arrow-down-up me-1 text-muted" /> Sắp xếp theo
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="DEADLINE">Hạn nộp hồ sơ gần nhất</option>
                    <option value="QUANTITY">Chỉ tiêu tuyển nhiều nhất</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────────
              VÙNG CHÍNH: DANH SÁCH TIN VÀ CHI TIẾT TIN (Master-Detail Split View)
              Theo yêu cầu người dùng:
              "khi nhấn vào tin thì sẽ cho trường mô tả tin gọn lại rồi đặt các
               tin liên quan đấy sang bên trái, bên phải để trường mô tả chi tiết của tin"
              ─────────────────────────────────────────────────────────────────── */}
          <div className="col-12 col-lg-9">
            {loading ? (
              <div className="card border shadow-xs p-5 text-center bg-white">
                <Loading text="Đang tải danh sách tin tuyển dụng..." />
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="card border shadow-xs p-5 text-center bg-white">
                <EmptyState
                  icon="bi-briefcase"
                  title="Không tìm thấy vị trí tuyển dụng phù hợp"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc chọn lại cơ sở và phòng ban trong bộ lọc bên trái."
                  actionLabel="Đặt lại bộ lọc"
                  onAction={handleResetFilters}
                />
              </div>
            ) : (
              <div>
                {/* Thanh trạng thái phía trên danh sách */}
                <div className="d-flex align-items-center justify-content-between mb-3 bg-white p-2.5 px-3 rounded-3 border shadow-xs">
                  <div className="small text-muted">
                    Hiển thị <strong className="text-dark">{filteredPositions.length}</strong> cơ hội thực tập phù hợp
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {selectedPosition ? (
                      <button
                        type="button"
                        onClick={handleCloseDetail}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
                        title="Đóng chi tiết để xem danh sách mở rộng"
                      >
                        <i className="bi bi-grid-fill text-primary" />
                        <span>Xem danh sách đầy đủ</span>
                      </button>
                    ) : (
                      <span className="small text-muted fst-italic d-none d-sm-inline">
                        <i className="bi bi-info-circle me-1" />
                        Nhấn vào một tin để xem chi tiết & nộp hồ sơ trực tuyến
                      </span>
                    )}
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    CHẾ ĐỘ 1: KHI CHƯA CHỌN TIN NÀO (selectedPosition === null)
                    -> Hiển thị đầy đủ danh sách các thẻ tin với phần mô tả của từng tin một
                    ══════════════════════════════════════════════════════════════ */}
                {!selectedPosition && (
                  <div className="d-flex flex-column gap-3">
                    {filteredPositions.map((pos) => {
                      const isExpired = new Date(pos.deadline) < new Date();
                      const allowance = getAllowanceInfo(pos.benefits);
                      const myApp = myApplications.find((a) => String(a.position_id) === String(pos.id));

                      return (
                        <div
                          key={pos.id}
                          onClick={() => handleSelectPosition(pos)}
                          className="card border shadow-xs hover-shadow-md transition-all cursor-pointer bg-white position-hover-card"
                          style={{ borderLeft: '4px solid var(--vymi-primary)' }}
                        >
                          <div className="card-body p-3.5 p-md-4">
                            <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-3 mb-2">
                              {/* Header & Title */}
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                    {pos.branch_name}
                                  </span>
                                  <span className="text-muted small">
                                    {pos.department_name}
                                  </span>
                                  {myApp && (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                                      Đã ứng tuyển
                                    </span>
                                  )}
                                </div>

                                <h5 className="fw-bold text-dark mb-1 hover-text-primary transition-colors">
                                  {pos.title}
                                </h5>
                              </div>

                              {/* Right status badge */}
                              <div className="flex-shrink-0 text-md-end">
                                <StatusBadge status={isExpired ? 'CLOSED' : pos.status} />
                              </div>
                            </div>

                            {/* Mô tả công việc tóm tắt của tin */}
                            <p
                              className="text-secondary small mb-3 text-break"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.5',
                              }}
                            >
                              {pos.description}
                            </p>

                            {/* Badges Info Bar */}
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2.5 border-top">
                              <div className="d-flex flex-wrap gap-2">
                                <span className={`badge bg-${allowance.type}-subtle text-${allowance.type} border border-${allowance.type}-subtle`}>
                                  {allowance.text}
                                </span>
                                <span className="badge bg-light text-dark border">
                                  {pos.internship_duration || '3 tháng'}
                                </span>
                                <span className="badge bg-light text-dark border">
                                  Tuyển {pos.quantity} chỉ tiêu
                                </span>
                              </div>

                              <div className="d-flex align-items-center gap-3">
                                <span className="small text-muted">
                                  {isExpired ? (
                                    <span className="text-danger fw-medium">
                                      Đã hết hạn
                                    </span>
                                  ) : (
                                    <span>
                                      Hạn: {formatDate(pos.deadline)}
                                    </span>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary fw-semibold px-3 shadow-xs"
                                >
                                  <span>Xem chi tiết</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    CHẾ ĐỘ 2: KHI ĐÃ NHẤN VÀO TIN (Master-Detail Split View)
                    "khi nhấn vào tin thì sẽ cho trường mô tả tin gọn lại rồi đặt các
                     tin liên quan đấy sang bên trái, bên phải để trường mô tả chi tiết của tin"
                    ══════════════════════════════════════════════════════════════ */}
                {selectedPosition && (
                  <div className="row g-3" ref={detailRef}>
                    {/* CỘT TRÁI (hoặc giữa): DANH SÁCH CÁC TIN THU GỌN (Compact Cards) */}
                    <div className="col-12 col-md-5">
                      <div className="card border shadow-xs bg-white mb-3">
                        <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                            <i className="bi bi-list-ul text-primary" />
                            Danh sách vị trí ({filteredPositions.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleCloseDetail}
                            className="btn btn-link text-muted p-0 text-decoration-none small"
                            title="Đóng chi tiết"
                          >
                            <i className="bi bi-arrows-angle-expand me-1" />
                            <span style={{ fontSize: '0.75rem' }}>Mở rộng</span>
                          </button>
                        </div>

                        {/* List items cuộn mượt */}
                        <div
                          className="d-flex flex-column gap-2 p-2"
                          style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
                        >
                          {filteredPositions.map((pos) => {
                            const isSelected = String(pos.id) === String(selectedPosition.id);
                            const isExpired = new Date(pos.deadline) < new Date();
                            const allowance = getAllowanceInfo(pos.benefits);

                            return (
                              <div
                                key={pos.id}
                                onClick={() => handleSelectPosition(pos)}
                                className={`p-3 rounded-3 border transition-all cursor-pointer position-relative ${
                                  isSelected
                                    ? 'bg-primary-subtle bg-opacity-25 border-primary border-2 shadow-xs'
                                    : 'bg-white hover-bg-light border-light-subtle'
                                }`}
                              >
                                <div className="d-flex align-items-start justify-content-between gap-2 mb-1.5">
                                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                    <span className="badge bg-white text-primary border border-primary-subtle" style={{ fontSize: '0.7rem' }}>
                                      {pos.branch_name}
                                    </span>
                                    <span className="text-muted text-truncate" style={{ fontSize: '0.75rem', maxWidth: '140px' }}>
                                      {pos.department_name}
                                    </span>
                                  </div>

                                  {isSelected ? (
                                    <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                                      Đang xem
                                    </span>
                                  ) : (
                                    <StatusBadge status={isExpired ? 'CLOSED' : pos.status} />
                                  )}
                                </div>

                                {/* Tiêu đề tin thu gọn */}
                                <h6 className={`fw-bold mb-1.5 leading-tight ${isSelected ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '0.92rem' }}>
                                  {pos.title}
                                </h6>

                                {/* Phụ cấp & Hạn nộp gọn gàng */}
                                <div className="d-flex align-items-center justify-content-between pt-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                  <span className="text-success fw-medium">
                                    {allowance.text}
                                  </span>
                                  <span>
                                    Hạn: {formatDate(pos.deadline)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* CỘT PHẢI: TRƯỜNG MÔ TẢ CHI TIẾT CỦA TIN ĐƯỢC CHỌN (Job Detail Panel) */}
                    <div className="col-12 col-md-7">
                      <div className="card border shadow-xs bg-white sticky-top" style={{ top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                        {isDetailLoading ? (
                          <div className="p-5 text-center">
                            <Loading text="Đang tải chi tiết vị trí..." />
                          </div>
                        ) : (
                          <div className="card-body p-4 p-xl-4.5">
                            {/* Header chi tiết & Nút đóng */}
                            <div className="d-flex align-items-start justify-content-between gap-3 mb-3 pb-3 border-bottom">
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                  <span className="badge bg-primary text-white">
                                    <i className="bi bi-geo-alt-fill me-1" />
                                    {selectedPosition.branch_name}
                                  </span>
                                  <span className="badge bg-light text-dark border">
                                    <i className="bi bi-building me-1" />
                                    {selectedPosition.department_name}
                                  </span>
                                  <StatusBadge status={new Date(selectedPosition.deadline) < new Date() ? 'CLOSED' : selectedPosition.status} />
                                </div>

                                <h2 className="h4 fw-bold text-dark mb-1 leading-tight">
                                  {selectedPosition.title}
                                </h2>
                                <p className="text-muted small mb-0">
                                  Đăng tuyển bởi <strong>VYMI Tech Solutions</strong> • Cơ sở {selectedPosition.branch_name}
                                </p>
                              </div>

                              <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={handleCopyLink}
                                  className="btn btn-sm btn-outline-secondary p-1.5 px-2"
                                  title="Sao chép link vị trí này"
                                >
                                  <i className={`bi ${copyFeedback ? 'bi-check-lg text-success' : 'bi-share'}`} />
                                  <span className="ms-1 small d-none d-sm-inline">{copyFeedback ? 'Đã chép!' : 'Chia sẻ'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={handleCloseDetail}
                                  className="btn btn-sm btn-outline-secondary p-1.5 px-2"
                                  title="Đóng xem chi tiết"
                                >
                                  <i className="bi bi-x-lg" />
                                </button>
                              </div>
                            </div>

                            {/* Thông báo thành công nếu vừa nộp hồ sơ */}
                            {applySuccessMsg && (
                              <div className="alert alert-success d-flex align-items-center justify-content-between gap-3 p-3 mb-3 rounded-3 shadow-xs">
                                <div className="d-flex align-items-center gap-2">
                                  <i className="bi bi-check-circle-fill fs-5 text-success" />
                                  <span className="small fw-semibold">{applySuccessMsg}</span>
                                </div>
                                <Link to="/dashboard" className="btn btn-sm btn-success px-3 fw-semibold flex-shrink-0">
                                  Xem Dashboard
                                </Link>
                              </div>
                            )}

                            {/* Banner nếu đã ứng tuyển trước đó */}
                            {currentApplication && (
                              <div className="alert alert-primary py-2.5 px-3 mb-3 rounded-3 border-primary-subtle d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                                <div className="small">
                                  <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                    <i className="bi bi-patch-check-fill text-primary" />
                                    Bạn đã nộp hồ sơ cho vị trí này
                                  </div>
                                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    Ngày nộp: {formatDate(currentApplication.created_at)} • Trạng thái: <StatusBadge status={currentApplication.status} />
                                  </div>
                                </div>
                                <Link to="/dashboard" className="btn btn-sm btn-primary px-3 fw-semibold flex-shrink-0">
                                  Kiểm tra hồ sơ
                                </Link>
                              </div>
                            )}

                            {/* Quick Metrics Grid */}
                            <div className="row g-2 p-3 bg-light rounded-3 border mb-4 small">
                              <div className="col-6 col-sm-3">
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Trợ cấp thực tập</span>
                                <strong className="text-success">{getAllowanceInfo(selectedPosition.benefits).text}</strong>
                              </div>
                              <div className="col-6 col-sm-3">
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Thời lượng</span>
                                <strong className="text-dark">{selectedPosition.internship_duration || '3 tháng'}</strong>
                              </div>
                              <div className="col-6 col-sm-3">
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Chỉ tiêu tuyển</span>
                                <strong className="text-dark">{selectedPosition.quantity} người</strong>
                              </div>
                              <div className="col-6 col-sm-3">
                                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Hạn nộp</span>
                                <strong className={new Date(selectedPosition.deadline) < new Date() ? 'text-danger' : 'text-dark'}>
                                  {formatDate(selectedPosition.deadline)}
                                </strong>
                              </div>
                            </div>

                            {/* Quick CTA Action Box */}
                            {selectedPosition.status === 'OPEN' && new Date(selectedPosition.deadline) >= new Date() && !currentApplication && (
                              <div className="p-3 bg-primary-subtle bg-opacity-30 rounded-3 border border-primary-subtle d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
                                <div>
                                  <h6 className="fw-bold text-dark mb-0.5">Sẵn sàng khởi đầu sự nghiệp?</h6>
                                  <p className="text-muted small mb-0">Hồ sơ sẽ được chuyển trực tiếp tới Mentor và phòng nhân sự.</p>
                                </div>
                                {user ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowApplyForm(!showApplyForm)}
                                    className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 shadow-xs flex-shrink-0"
                                  >
                                    <i className="bi bi-send-fill" />
                                    <span>{showApplyForm ? 'Ẩn form nộp đơn' : 'Ứng tuyển ngay'}</span>
                                  </button>
                                ) : (
                                  <div className="d-flex gap-2 flex-shrink-0">
                                    <Link to="/login" className="btn btn-primary px-3 py-1.5 fw-semibold small shadow-xs">
                                      Đăng nhập để ứng tuyển
                                    </Link>
                                    <Link to="/register" className="btn btn-outline-primary px-3 py-1.5 fw-semibold small bg-white">
                                      Đăng ký
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Inline Apply Form nếu được kích hoạt */}
                            {showApplyForm && !currentApplication && (
                              <InlineApplyForm
                                position={selectedPosition}
                                user={user}
                                onCancel={() => setShowApplyForm(false)}
                                onSuccess={(newApp) => {
                                  setShowApplyForm(false);
                                  setApplySuccessMsg('Nộp hồ sơ thành công! Nhà tuyển dụng sẽ liên hệ với bạn trong thời gian sớm nhất.');
                                  setMyApplications((prev) => [...prev, newApp]);
                                  eventBus.emit('APPLICATION_SUBMITTED', { positionId: selectedPosition.id, application: newApp });
                                }}
                              />
                            )}

                            {/* Nội dung chi tiết 1: Mô tả công việc */}
                            <div className="mb-4">
                              <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-2">
                                <i className="bi bi-file-earmark-text-fill text-primary" />
                                Mô tả công việc thực tập
                              </h6>
                              <div className="text-secondary small ps-3 border-start border-2 border-primary-subtle" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                                {selectedPosition.description}
                              </div>
                            </div>

                            {/* Nội dung chi tiết 2: Yêu cầu ứng viên */}
                            {selectedPosition.requirements && (
                              <div className="mb-4">
                                <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-2">
                                  <i className="bi bi-check-circle-fill text-success" />
                                  Yêu cầu đối với ứng viên
                                </h6>
                                <div className="text-secondary small ps-3 border-start border-2 border-success-subtle" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                                  {selectedPosition.requirements}
                                </div>
                              </div>
                            )}

                            {/* Nội dung chi tiết 3: Quyền lợi & Phụ cấp */}
                            {selectedPosition.benefits && (
                              <div className="mb-4">
                                <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-2">
                                  <i className="bi bi-gift-fill text-warning" />
                                  Quyền lợi & Chế độ đãi ngộ
                                </h6>
                                <div className="text-secondary small ps-3 border-start border-2 border-warning-subtle" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                                  {selectedPosition.benefits}
                                </div>
                              </div>
                            )}

                            {/* Cam kết đào tạo của công ty */}
                            <div className="p-3 bg-light rounded-3 border text-secondary small">
                              <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                                <i className="bi bi-shield-check text-primary" />
                                Cam kết chương trình thực tập tại VYMI Tech
                              </h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
                                100% thực tập sinh được kèm cặp 1-1 bởi kỹ sư / Mentor có kinh nghiệm, tham gia dự án thực tế, hỗ trợ tài liệu làm đồ án tốt nghiệp và cơ hội tiếp nhận trở thành nhân viên chính thức.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
