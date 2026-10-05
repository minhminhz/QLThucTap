import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [updating, setUpdating] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || '', phone: user.phone || '' });
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setUpdating(true);
    try {
      await api.put('/auth/profile', form);
      updateUser({ ...user, ...form });
      setMsg('Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      setErr(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwErr('Mật khẩu xác nhận không khớp.');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwMsg('Đổi mật khẩu thành công!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (error) {
      setPwErr(error.response?.data?.message || 'Mật khẩu hiện tại không chính xác.');
    } finally {
      setChangingPw(false);
    }
  };

  const ROLE_LABELS = {
    APPLICANT: 'Ứng viên',
    INTERN: 'Thực tập sinh',
    MENTOR: 'Mentor hướng dẫn',
    HR: 'Nhân sự (HR)',
    ADMIN: 'Quản trị viên',
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Quản lý và cập nhật thông tin cá nhân và thiết lập bảo mật tài khoản"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Hồ sơ cá nhân' },
        ]}
      />

      <div className="row g-4">
        {/* Left Col: Avatar Card */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border text-center p-4">
            <div className="card-body p-0">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3 shadow-xs"
                style={{ width: '80px', height: '80px', fontSize: '2.25rem' }}
              >
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <h5 className="fw-bold text-dark mb-1">{user?.full_name}</h5>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-3">
                {ROLE_LABELS[user?.role]}
              </span>

              <div className="text-muted small border-top pt-3 text-start d-flex flex-column gap-2">
                <div>
                  <span className="text-secondary d-block">Địa chỉ Email:</span>
                  <strong className="text-dark">{user?.email}</strong>
                </div>
                {user?.phone && (
                  <div>
                    <span className="text-secondary d-block">Số điện thoại:</span>
                    <strong className="text-dark">{user.phone}</strong>
                  </div>
                )}
                {user?.branch_name && (
                  <div>
                    <span className="text-secondary d-block">Cơ sở trực thuộc:</span>
                    <strong className="text-dark">
                      <i className="bi bi-geo-alt text-primary me-1"></i>
                      {user.branch_name}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Edit Forms */}
        <div className="col-12 col-lg-8">
          {/* Profile Form */}
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-person-lines-fill text-primary me-2"></i>
                Cập nhật thông tin cơ bản
              </h5>
            </div>
            <div className="card-body p-4">
              {msg && (
                <div className="alert alert-success d-flex align-items-center gap-2 small py-2 px-3 mb-3">
                  <i className="bi bi-check-circle-fill"></i>
                  <div>{msg}</div>
                </div>
              )}
              {err && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{err}</div>
                </div>
              )}

              <form onSubmit={handleUpdateProfile}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="prof_name">
                    Họ và tên <span className="text-danger">*</span>
                  </label>
                  <input
                    id="prof_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    required
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="prof_email">
                    Địa chỉ Email (Không thể thay đổi)
                  </label>
                  <input
                    id="prof_email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-control bg-light text-muted"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="prof_phone">
                    Số điện thoại liên lạc
                  </label>
                  <input
                    id="prof_phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0901234567"
                    className="form-control"
                  />
                </div>

                <button type="submit" disabled={updating} className="btn btn-sm btn-primary px-4 fw-semibold">
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thông tin'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="card shadow-sm border">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-shield-lock text-primary me-2"></i>
                Đổi mật khẩu tài khoản
              </h5>
            </div>
            <div className="card-body p-4">
              {pwMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2 small py-2 px-3 mb-3">
                  <i className="bi bi-check-circle-fill"></i>
                  <div>{pwMsg}</div>
                </div>
              )}
              {pwErr && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{pwErr}</div>
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="current_pw">
                    Mật khẩu hiện tại <span className="text-danger">*</span>
                  </label>
                  <input
                    id="current_pw"
                    type="password"
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
                    required
                    className="form-control"
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="new_pw">
                      Mật khẩu mới <span className="text-danger">*</span>
                    </label>
                    <input
                      id="new_pw"
                      type="password"
                      value={pwForm.new_password}
                      onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                      required
                      minLength={6}
                      placeholder="Ít nhất 6 ký tự"
                      className="form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" htmlFor="confirm_pw">
                      Xác nhận mật khẩu mới <span className="text-danger">*</span>
                    </label>
                    <input
                      id="confirm_pw"
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      className="form-control"
                    />
                  </div>
                </div>

                <button type="submit" disabled={changingPw} className="btn btn-sm btn-outline-secondary px-4 fw-semibold">
                  {changingPw ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Cập nhật mật khẩu'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
