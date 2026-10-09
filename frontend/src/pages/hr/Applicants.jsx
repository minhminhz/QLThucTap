import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

const APP_STATUS_META = {
  PENDING:   { label: 'Chờ xét duyệt', color: 'warning',   icon: 'bi-hourglass-split' },
  REVIEWING: { label: 'Đang xem xét',  color: 'info',      icon: 'bi-eye-fill' },
  APPROVED:  { label: 'Đã chấp nhận',  color: 'success',   icon: 'bi-check-circle-fill' },
  REJECTED:  { label: 'Từ chối',       color: 'danger',    icon: 'bi-x-circle-fill' },
};

const AppStatusBadge = ({ status }) => {
  const s = APP_STATUS_META[status] || { label: status, color: 'secondary', icon: 'bi-circle' };
  return (
    <span className={`badge bg-${s.color}-subtle text-${s.color} border border-${s.color}-subtle`}>
      <i className={`bi ${s.icon} me-1`} />{s.label}
    </span>
  );
};

// Status action buttons config
const STATUS_ACTIONS = [
  { status: 'REVIEWING', label: 'Đang xem xét', btnClass: 'btn-outline-info',    icon: 'bi-eye' },
  { status: 'APPROVED',  label: 'Chấp nhận',    btnClass: 'btn-success',         icon: 'bi-check-lg' },
  { status: 'REJECTED',  label: 'Từ chối',      btnClass: 'btn-outline-danger',  icon: 'bi-x-lg' },
  { status: 'PENDING',   label: 'Về chờ duyệt', btnClass: 'btn-outline-secondary',icon: 'bi-arrow-counterclockwise' },
];

export default function HRApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Detail + review modal
  const [detailModal, setDetailModal] = useState(null);
  // { applicant, details, loadingDetails }

  // Review modal (shown over detail modal)
  const [reviewModal, setReviewModal] = useState(null);
  // { application, targetStatus, note, submitting, error }

  const loadApplicants = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/hr/applicants', { params });
      setApplicants(res.data.data || []);
    } catch {
      setApplicants([]);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    loadApplicants().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(loadApplicants, 350);
    return () => clearTimeout(t);
  }, [search]);

  const openDetail = async (applicant) => {
    setDetailModal({ applicant, details: null, loadingDetails: true });
    try {
      const res = await api.get(`/hr/applicants/${applicant.id}`);
      setDetailModal({ applicant, details: res.data.data, loadingDetails: false });
    } catch {
      setDetailModal({ applicant, details: null, loadingDetails: false });
    }
  };

  // Reload detail panel after status change
  const reloadDetail = async (applicantId) => {
    try {
      const res = await api.get(`/hr/applicants/${applicantId}`);
      setDetailModal((prev) => prev ? { ...prev, details: res.data.data } : null);
    } catch { /* ignore */ }
    await loadApplicants();
  };

  // Open review confirm modal
  const openReview = (application, targetStatus) => {
    setReviewModal({ application, targetStatus, note: '', submitting: false, error: '' });
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setReviewModal((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      await api.patch(`/hr/applications/${reviewModal.application.id}/status`, {
        status: reviewModal.targetStatus,
        hr_note: reviewModal.note.trim() || undefined,
      });
      setReviewModal(null);
      await reloadDetail(detailModal.applicant.id);
    } catch (err) {
      setReviewModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.',
      }));
    }
  };

  const pendingCount = applicants.filter((a) => a.latest_status === 'PENDING').length;
  const acceptedCount = applicants.filter((a) => a.latest_status === 'APPROVED').length;
  const totalApplications = applicants.reduce((sum, a) => sum + (Number(a.total_applications) || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách ứng viên..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Danh sách Ứng viên"
        subtitle="Tổng hợp ứng viên đã nộp hồ sơ vào cơ sở — xem và xét duyệt trực tiếp tại đây"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Nhân sự', link: '/hr' },
          { label: 'Ứng viên' },
        ]}
      />

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <StatCard icon="bi-people-fill" title="Tổng ứng viên" value={applicants.length} variant="primary" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard icon="bi-hourglass-split" title="Đang chờ xét duyệt" value={pendingCount} variant="warning" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard icon="bi-file-earmark-text" title="Tổng hồ sơ ứng tuyển" value={totalApplications} variant="info" />
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-xs mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Tìm theo tên, email, điện thoại ứng viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
            </div>
            <div className="col-12 col-md-4 text-end">
              <span className="text-muted small">{applicants.length} ứng viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {applicants.length === 0 ? (
        <EmptyState
          icon="bi-person-badge"
          title="Không có ứng viên nào"
          description={search ? 'Không tìm thấy ứng viên phù hợp.' : 'Chưa có ứng viên nào nộp hồ sơ vào cơ sở này.'}
        />
      ) : (
        <div className="card border-0 shadow-xs">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Ứng viên</th>
                  <th>Hồ sơ gần nhất</th>
                  <th className="text-center">Số hồ sơ</th>
                  <th>Trạng thái</th>
                  <th>Ngày nộp</th>
                  <th className="text-center pe-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                          style={{ width: '38px', height: '38px' }}
                        >
                          {a.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-medium text-dark">{a.full_name}</div>
                          <div className="text-muted small">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-dark">{a.latest_position_title || '—'}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">{a.total_applications}</span>
                    </td>
                    <td>
                      {a.latest_status ? <AppStatusBadge status={a.latest_status} /> : '—'}
                    </td>
                    <td>
                      <span className="text-muted small">
                        {a.latest_application_date
                          ? new Date(a.latest_application_date).toLocaleDateString('vi-VN')
                          : '—'}
                      </span>
                    </td>
                    <td className="text-center pe-4">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openDetail(a)}
                        title="Xem & xét duyệt hồ sơ"
                      >
                        <i className="bi bi-eye me-1" />Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL + REVIEW MODAL ── */}
      {detailModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title mb-0">
                    <i className="bi bi-person-lines-fill me-2 text-primary" />
                    Hồ sơ ứng viên: <strong>{detailModal.applicant.full_name}</strong>
                  </h5>
                  <span className="text-muted small">{detailModal.applicant.email}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setDetailModal(null)} />
              </div>
              <div className="modal-body">
                {detailModal.loadingDetails ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2 text-muted">Đang tải...</p>
                  </div>
                ) : detailModal.details ? (
                  <>
                    {/* Applicant info */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-5">
                        <div className="card border bg-light h-100">
                          <div className="card-body p-3">
                            <h6 className="card-title text-muted small text-uppercase fw-bold mb-3">
                              <i className="bi bi-person-circle me-1" />Thông tin cá nhân
                            </h6>
                            <dl className="row mb-0 small">
                              <dt className="col-5">Họ tên</dt>
                              <dd className="col-7 fw-medium">{detailModal.details.full_name}</dd>
                              <dt className="col-5">Email</dt>
                              <dd className="col-7 text-truncate">{detailModal.details.email}</dd>
                              {detailModal.details.phone && (
                                <>
                                  <dt className="col-5">Điện thoại</dt>
                                  <dd className="col-7">{detailModal.details.phone}</dd>
                                </>
                              )}
                              <dt className="col-5">Ngày đăng ký</dt>
                              <dd className="col-7">
                                {new Date(detailModal.details.created_at).toLocaleDateString('vi-VN')}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-7">
                        <div className="card border bg-light h-100">
                          <div className="card-body p-3">
                            <h6 className="card-title text-muted small text-uppercase fw-bold mb-3">
                              <i className="bi bi-bar-chart-fill me-1" />Tổng quan hồ sơ
                            </h6>
                            <div className="row g-2">
                              {[
                                { label: 'Tổng hồ sơ', value: detailModal.details.applications?.length || 0, color: 'primary' },
                                { label: 'Đã chấp nhận', value: detailModal.details.applications?.filter((a) => a.status === 'APPROVED').length || 0, color: 'success' },
                                { label: 'Đang xét duyệt', value: detailModal.details.applications?.filter((a) => ['PENDING','REVIEWING'].includes(a.status)).length || 0, color: 'warning' },
                                { label: 'Từ chối', value: detailModal.details.applications?.filter((a) => a.status === 'REJECTED').length || 0, color: 'danger' },
                              ].map((s) => (
                                <div key={s.label} className="col-6">
                                  <div className={`bg-${s.color}-subtle border border-${s.color}-subtle rounded-2 p-2 text-center`}>
                                    <div className={`fw-bold fs-5 text-${s.color}`}>{s.value}</div>
                                    <div className="text-muted small">{s.label}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Application history with review actions */}
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-clock-history me-2 text-primary" />
                      Lịch sử hồ sơ ứng tuyển ({detailModal.details.applications?.length || 0})
                    </h6>
                    {detailModal.details.applications?.length === 0 ? (
                      <p className="text-muted text-center py-3">Không có hồ sơ nào tại cơ sở này.</p>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {detailModal.details.applications.map((app) => (
                          <div
                            key={app.id}
                            className={`card border-start border-4 border-${(APP_STATUS_META[app.status] || {}).color || 'secondary'} shadow-xs`}
                          >
                            <div className="card-body p-3">
                              {/* Header row */}
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <div>
                                  <div className="fw-semibold text-dark">{app.position_title}</div>
                                  <div className="text-muted small">
                                    <i className="bi bi-building me-1" />{app.branch_name}
                                    {app.department_name && <span> · {app.department_name}</span>}
                                    <span className="ms-2">
                                      <i className="bi bi-calendar3 me-1" />
                                      {new Date(app.created_at).toLocaleDateString('vi-VN', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <AppStatusBadge status={app.status} />
                              </div>

                              {/* CV link */}
                              {app.cv_original_name && (
                                <div className="small mb-2">
                                  <i className="bi bi-file-earmark-pdf text-danger me-1" />
                                  <a
                                    href={`${import.meta.env.VITE_API_URL || ''}/uploads/${app.cv_file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-decoration-none"
                                  >
                                    {app.cv_original_name}
                                  </a>
                                </div>
                              )}

                              {/* Cover letter */}
                              {app.cover_letter && (
                                <details className="mb-2">
                                  <summary className="text-primary small" style={{ cursor: 'pointer' }}>
                                    <i className="bi bi-envelope-open me-1" />Xem thư xin việc
                                  </summary>
                                  <p className="text-muted small mt-2 mb-0 border-start border-3 border-primary ps-3">
                                    {app.cover_letter}
                                  </p>
                                </details>
                              )}

                              {/* HR note */}
                              {app.hr_note && (
                                <div className="alert alert-light border py-2 px-3 small mb-2">
                                  <i className="bi bi-chat-left-text me-1 text-muted" />
                                  <strong>Ghi chú HR: </strong>{app.hr_note}
                                </div>
                              )}

                              {/* Review action buttons */}
                              {app.status !== 'APPROVED' && (
                                <div className="d-flex flex-wrap gap-2 mt-2 pt-2 border-top">
                                  <span className="text-muted small align-self-center me-1">Xét duyệt:</span>
                                  {STATUS_ACTIONS.filter((a) => a.status !== app.status).map((action) => (
                                    <button
                                      key={action.status}
                                      className={`btn btn-sm ${action.btnClass}`}
                                      onClick={() => openReview(app, action.status)}
                                    >
                                      <i className={`bi ${action.icon} me-1`} />
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {app.status === 'APPROVED' && (
                                <div className="small text-success mt-2 pt-2 border-top">
                                  <i className="bi bi-check-circle-fill me-1" />
                                  Hồ sơ đã được chấp nhận — ứng viên đã trở thành Thực tập sinh.
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="alert alert-warning">Không thể tải thông tin ứng viên này.</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW CONFIRM MODAL ── */}
      {reviewModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <div className={`modal-header border-${(APP_STATUS_META[reviewModal.targetStatus] || {}).color || 'secondary'}`}>
                <h5 className="modal-title">
                  <i className={`bi ${(APP_STATUS_META[reviewModal.targetStatus] || {}).icon} me-2 text-${(APP_STATUS_META[reviewModal.targetStatus] || {}).color}`} />
                  Xác nhận: {(APP_STATUS_META[reviewModal.targetStatus] || {}).label}
                </h5>
                <button type="button" className="btn-close" onClick={() => setReviewModal(null)} />
              </div>
              <div className="modal-body">
                {reviewModal.error && (
                  <div className="alert alert-danger py-2">
                    <i className="bi bi-exclamation-triangle me-2" />{reviewModal.error}
                  </div>
                )}
                <p className="mb-3">
                  Xét duyệt hồ sơ vị trí <strong>"{reviewModal.application.position_title}"</strong> sang trạng thái{' '}
                  <AppStatusBadge status={reviewModal.targetStatus} />
                </p>

                {/* Warning for APPROVED */}
                {reviewModal.targetStatus === 'APPROVED' && (
                  <div className="alert alert-success py-2 small">
                    <i className="bi bi-info-circle me-1" />
                    Ứng viên sẽ được chuyển sang vai trò <strong>Thực tập sinh</strong> và hệ thống sẽ tự động tạo hồ sơ thực tập.
                    Gửi thông báo chúc mừng tới ứng viên.
                  </div>
                )}
                {reviewModal.targetStatus === 'REJECTED' && (
                  <div className="alert alert-warning py-2 small">
                    <i className="bi bi-info-circle me-1" />
                    Ứng viên sẽ nhận thông báo từ chối. Vui lòng thêm ghi chú phản hồi nếu cần.
                  </div>
                )}

                <div className="mb-1">
                  <label className="form-label fw-medium small">
                    Ghi chú gửi ứng viên <span className="text-muted fw-normal">(tùy chọn)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="VD: Hồ sơ của bạn phù hợp, mời bạn tham gia buổi phỏng vấn vào..."
                    value={reviewModal.note}
                    onChange={(e) => setReviewModal((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setReviewModal(null)}
                  disabled={reviewModal.submitting}
                >
                  Hủy
                </button>
                <button
                  className={`btn btn-${(APP_STATUS_META[reviewModal.targetStatus] || {}).color || 'primary'}`}
                  onClick={submitReview}
                  disabled={reviewModal.submitting}
                >
                  {reviewModal.submitting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Đang lưu...</>
                    : <><i className={`bi ${(APP_STATUS_META[reviewModal.targetStatus] || {}).icon} me-1`} />Xác nhận</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
