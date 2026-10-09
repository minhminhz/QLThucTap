import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

const EMPTY_FORM = { full_name: '', email: '', password: '', phone: '', department_id: '' };

export default function HRMentors() {
  const [mentors, setMentors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);           // { mentor }
  const [statusModal, setStatusModal] = useState(null);       // { mentor, newStatus, affectedInterns }
  const [resetPwModal, setResetPwModal] = useState(null);     // { mentor }

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadMentors = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/hr/mentors', { params });
      setMentors(res.data.data || []);
    } catch {
      setMentors([]);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    const t = setTimeout(loadMentors, 300);
    return () => clearTimeout(t);
  }, [loadMentors]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/hr/mentors'),
      api.get('/hr/departments'),
    ])
      .then(([mRes, dRes]) => {
        setMentors(mRes.data.data || []);
        setDepartments(dRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = mentors.filter((m) => m.status === 'ACTIVE').length;
  const inactiveCount = mentors.filter((m) => m.status === 'INACTIVE').length;
  const totalInternsManaged = mentors.reduce((sum, m) => sum + (Number(m.active_interns_count) || 0), 0);

  // ── Create Mentor ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/hr/mentors', form);
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      await loadMentors();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update Mentor ──
  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.put(`/hr/mentors/${editModal.mentor.id}`, {
        full_name: form.full_name,
        phone: form.phone,
        department_id: form.department_id,
      });
      setEditModal(null);
      setForm(EMPTY_FORM);
      await loadMentors();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle Status ──
  const initiateStatusChange = async (mentor, newStatus) => {
    // Optimistically call API to get warning info
    setStatusModal({ mentor, newStatus, loading: true, affectedInterns: [], warning: '' });
    if (newStatus === 'INACTIVE') {
      try {
        const res = await api.patch(`/hr/mentors/${mentor.id}/status`, { status: 'INACTIVE' });
        if (res.data.warning) {
          // API has already changed the status, update local list and show warning summary
          setStatusModal(null);
          await loadMentors();
          alert(`✅ Đã chuyển trạng thái. ⚠️ ${res.data.warning}`);
        } else {
          setStatusModal(null);
          await loadMentors();
        }
      } catch (err) {
        setStatusModal(null);
        alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
      }
    } else {
      // Activating - show simple confirm
      setStatusModal({ mentor, newStatus, loading: false, affectedInterns: [], warning: '' });
    }
  };

  const confirmStatusChange = async () => {
    if (!statusModal) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/hr/mentors/${statusModal.mentor.id}/status`, {
        status: statusModal.newStatus,
      });
      if (res.data.warning) {
        alert(`✅ Đã chuyển trạng thái. ⚠️ ${res.data.warning}`);
      }
      setStatusModal(null);
      await loadMentors();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset Password ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    if (newPassword.length < 8) {
      setFormError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/hr/mentors/${resetPwModal.mentor.id}/reset-password`, {
        new_password: newPassword,
      });
      alert(`✅ Đặt lại mật khẩu cho "${resetPwModal.mentor.full_name}" thành công!`);
      setResetPwModal(null);
      setNewPassword('');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách Mentor..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Quản lý Mentor"
        subtitle="Tạo, theo dõi và quản lý tài khoản Mentor trong cơ sở của bạn"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Nhân sự', link: '/hr' },
          { label: 'Quản lý Mentor' },
        ]}
        action={
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAddModal(true); }}>
            <i className="bi bi-person-plus-fill me-2" />
            Thêm Mentor
          </button>
        }
      />

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <StatCard icon="bi-people-fill" title="Tổng Mentor" value={mentors.length} variant="primary" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard icon="bi-check-circle-fill" title="Đang hoạt động" value={activeCount} variant="success" />
        </div>
        <div className="col-6 col-md-4">
          <StatCard icon="bi-person-check-fill" title="Intern đang quản lý" value={totalInternsManaged} variant="info" />
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-xs mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Tìm theo tên, email, điện thoại..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-end">
              <span className="text-muted small">
                {mentors.length} kết quả
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor list */}
      {mentors.length === 0 ? (
        <EmptyState
          icon="bi-person-video3"
          title="Không tìm thấy Mentor nào"
          description="Thử thay đổi bộ lọc hoặc thêm Mentor mới vào cơ sở."
        />
      ) : (
        <div className="row g-3">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="col-12 col-md-6 col-xl-4">
              <div className={`card h-100 border shadow-xs ${mentor.status === 'INACTIVE' ? 'opacity-75' : ''}`}>
                <div className="card-body p-4">
                  {/* Avatar + name row */}
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0 ${mentor.status === 'ACTIVE' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'}`}
                      style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
                    >
                      {mentor.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <strong className="text-dark d-block text-truncate">{mentor.full_name}</strong>
                      <span className="text-muted small d-block text-truncate">
                        <i className="bi bi-envelope me-1" />{mentor.email}
                      </span>
                      {mentor.phone && (
                        <span className="text-muted small d-block">
                          <i className="bi bi-telephone me-1" />{mentor.phone}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={mentor.status || 'ACTIVE'} />
                  </div>

                  {/* Meta info */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {mentor.department_name && (
                      <span className="badge bg-light text-secondary border">
                        <i className="bi bi-building me-1" />{mentor.department_name}
                      </span>
                    )}
                    <span className={`badge ${Number(mentor.active_interns_count) > 0 ? 'bg-info-subtle text-info border border-info-subtle' : 'bg-light text-secondary border'}`}>
                      <i className="bi bi-people me-1" />
                      {mentor.active_interns_count || 0} intern đang hướng dẫn
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2 flex-wrap">
                    {/* Edit */}
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Chỉnh sửa thông tin"
                      onClick={() => {
                        setForm({ full_name: mentor.full_name, phone: mentor.phone || '', department_id: mentor.department_id || '', email: '', password: '' });
                        setFormError('');
                        setEditModal({ mentor });
                      }}
                    >
                      <i className="bi bi-pencil-square" />
                    </button>

                    {/* Toggle status */}
                    {mentor.status === 'ACTIVE' ? (
                      <button
                        className="btn btn-sm btn-outline-warning"
                        title="Chuyển sang Ngưng hoạt động"
                        onClick={() => initiateStatusChange(mentor, 'INACTIVE')}
                      >
                        <i className="bi bi-pause-circle" />
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-success"
                        title="Kích hoạt lại"
                        onClick={() => initiateStatusChange(mentor, 'ACTIVE')}
                      >
                        <i className="bi bi-play-circle" />
                      </button>
                    )}

                    {/* Reset password */}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Đặt lại mật khẩu"
                      onClick={() => { setNewPassword(''); setFormError(''); setResetPwModal({ mentor }); }}
                    >
                      <i className="bi bi-key" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD MENTOR MODAL ── */}
      {showAddModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreate}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-person-plus-fill me-2 text-primary" />
                    Thêm Mentor mới
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
                </div>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger py-2">
                      <i className="bi bi-exclamation-triangle me-2" />{formError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Họ và tên <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="mentor@company.com"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Mật khẩu khởi tạo <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Ít nhất 8 ký tự"
                      required
                      minLength={8}
                    />
                    <div className="form-text text-muted">Mentor sẽ tự đổi mật khẩu trong trang Hồ sơ sau khi đăng nhập.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0901234567"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Phòng ban</label>
                    <select
                      className="form-select"
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    >
                      <option value="">— Chọn phòng ban —</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Đang tạo...</> : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MENTOR MODAL ── */}
      {editModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleUpdate}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-pencil-square me-2 text-warning" />
                    Cập nhật thông tin Mentor
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setEditModal(null)} />
                </div>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger py-2">
                      <i className="bi bi-exclamation-triangle me-2" />{formError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Email</label>
                    <input className="form-control bg-light" value={editModal.mentor.email} disabled />
                    <div className="form-text text-muted">Email không thể thay đổi.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Họ và tên <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Phòng ban</label>
                    <select
                      className="form-select"
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    >
                      <option value="">— Chọn phòng ban —</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditModal(null)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Đang lưu...</> : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── STATUS CONFIRM MODAL (for ACTIVATE only; INACTIVE handled by API response) ── */}
      {statusModal && !statusModal.loading && statusModal.newStatus === 'ACTIVE' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">
                  <i className="bi bi-play-circle-fill me-2 text-success" />
                  Kích hoạt Mentor
                </h5>
                <button type="button" className="btn-close" onClick={() => setStatusModal(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Kích hoạt tài khoản Mentor <strong>{statusModal.mentor.full_name}</strong> trở lại?
                  Họ sẽ có thể hướng dẫn thực tập sinh.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(null)}>Hủy</button>
                <button className="btn btn-success btn-sm" onClick={confirmStatusChange} disabled={submitting}>
                  {submitting ? <span className="spinner-border spinner-border-sm" /> : 'Kích hoạt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetPwModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleResetPassword}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-key-fill me-2 text-danger" />
                    Đặt lại mật khẩu
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setResetPwModal(null)} />
                </div>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger py-2">
                      <i className="bi bi-exclamation-triangle me-2" />{formError}
                    </div>
                  )}
                  <p className="text-muted small mb-3">
                    Đặt lại mật khẩu mới cho Mentor <strong>{resetPwModal.mentor.full_name}</strong>.
                    Một thông báo sẽ được gửi tới Mentor.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Mật khẩu mới <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setResetPwModal(null)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Đang lưu...</> : 'Đặt lại mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
