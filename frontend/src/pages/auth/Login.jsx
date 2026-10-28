import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import PublicLayout from '../../layouts/PublicLayout';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

export default function Login() {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const passwordInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error as soon as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-validation
    const newFieldErrors = { email: '', password: '' };
    if (!form.email.trim()) {
      newFieldErrors.email = 'Vui lòng nhập địa chỉ Email.';
    }
    if (!form.password) {
      newFieldErrors.password = 'Vui lòng nhập Mật khẩu.';
    }

    if (newFieldErrors.email || newFieldErrors.password) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    setFieldErrors({ email: '', password: '' });

    try {
      const user = await login(form.email, form.password);
      const routes = {
        APPLICANT: '/dashboard',
        INTERN: '/intern',
        MENTOR: '/mentor',
        HR: '/hr',
        ADMIN: '/admin',
      };
      navigate(routes[user.role] || '/');
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.field) {
        setFieldErrors((prev) => ({ ...prev, [resp.field]: resp.message }));
      } else {
        setError(resp?.message || 'Email hoặc mật khẩu không chính xác.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    notify.info(
      'Tính năng đăng nhập nhanh bằng tài khoản Google đang được hoàn thiện và sẽ sớm khả dụng.',
      'Đang phát triển'
    );
  };

  const handlePasswordResetSuccess = (resetEmail) => {
    setForm((prev) => ({ ...prev, email: resetEmail, password: '' }));
    setFieldErrors({ email: '', password: '' });
    setError('');
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 200);
  };

  return (
    <PublicLayout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5">
            <div className="card shadow-sm border p-4 p-sm-5">
              {/* Brand Header */}
              <div className="text-center mb-4">
                <div
                  className="bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center fw-bold mb-3 shadow-sm"
                  style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}
                >
                  V
                </div>
                <h2 className="fw-bold text-dark mb-1">Đăng nhập</h2>
                <p className="text-muted small">Chào mừng trở lại hệ thống VYMI Tech</p>
              </div>

              {/* General Alert Error (for network/server issues) */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 mb-3">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {/* Email Field */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark" htmlFor="email">
                    Địa chỉ Email
                  </label>
                  <div className="input-group has-validation">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`form-control ${fieldErrors.email ? 'is-invalid border-danger' : ''}`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                      <span>{fieldErrors.email}</span>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold small text-dark mb-0" htmlFor="password">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="btn btn-link p-0 small text-decoration-none text-primary fw-semibold"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="input-group has-validation">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      ref={passwordInputRef}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`form-control ${fieldErrors.password ? 'is-invalid border-danger' : ''}`}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      style={{ borderColor: fieldErrors.password ? '#dc3545' : '#ced4da' }}
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                      <span>{fieldErrors.password}</span>
                    </div>
                  )}

                  {/* Prominent Quick Action to Reset Password when wrong password */}
                  {fieldErrors.password && (
                    <div className="mt-2 p-2 px-3 bg-danger-subtle rounded border border-danger-subtle d-flex align-items-center justify-content-between">
                      <span className="small text-danger fw-medium">
                        <i className="bi bi-key-fill me-1"></i> Bạn quên mật khẩu?
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="btn btn-sm btn-outline-danger fw-semibold py-0 px-2"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Lấy lại mật khẩu mới
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 fw-semibold mb-3 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="d-flex align-items-center my-3 text-muted">
                <hr className="flex-grow-1 my-0" />
                <span className="px-3 small text-uppercase" style={{ fontSize: '0.75rem' }}>
                  hoặc
                </span>
                <hr className="flex-grow-1 my-0" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="small fw-semibold text-dark">Đăng nhập với Google</span>
              </button>

              <div className="text-center text-muted small mt-2">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={form.email}
        onSuccess={handlePasswordResetSuccess}
      />
    </PublicLayout>
  );
}
