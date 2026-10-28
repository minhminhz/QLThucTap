import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onSuccess }) {
  const { notify } = useNotification();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer for resend OTP (60s)
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setStep(1);
      setCountdown(0);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  // Mask email for real-world privacy & security (e.g., admin@vymi.tech -> ad***n@vymi.tech)
  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str;
    const [name, domain] = str.split('@');
    if (name.length <= 2) {
      return name[0] + '***@' + domain;
    }
    return name.slice(0, 2) + '***' + name.slice(-1) + '@' + domain;
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        notify.success('Mã xác thực OTP đã được gửi đến email của bạn!', 'Đã gửi');
        setStep(2);
        setCountdown(60); // 60s cooldown
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo mã xác thực. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setError('');
    setResending(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        notify.info('Mã OTP mới đã được gửi lại vào email của bạn.', 'Đã gửi lại');
        setCountdown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP xác thực (6 chữ số).');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Mã OTP xác thực phải gồm đúng 6 chữ số.');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      if (res.data.success) {
        notify.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.', 'Thành công');
        if (onSuccess) {
          onSuccess(email.trim());
        }
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom px-4 py-3 bg-light">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-shield-lock-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">Quên mật khẩu</h5>
                <span className="text-muted small">
                  {step === 1 ? 'Bước 1: Xác thực email' : 'Bước 2: Nhập OTP & Đặt mật khẩu mới'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={loading || resending}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Error Message */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-3">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                <div>{error}</div>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestOtp}>
                <p className="text-muted small mb-3">
                  Vui lòng nhập địa chỉ Email tài khoản của bạn. Hệ thống sẽ gửi một mã xác thực OTP gồm 6 chữ số tới hộp thư này để xác minh quyền sở hữu tài khoản.
                </p>

                <div className="mb-4">
                  <label className="form-label fw-semibold small text-dark" htmlFor="forgot-email">
                    Địa chỉ Email tài khoản <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      className="form-control"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 py-2 fw-semibold"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Đang gửi mã...
                      </>
                    ) : (
                      <>
                        Gửi mã OTP <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="alert alert-success py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-start gap-2">
                  <i className="bi bi-envelope-check-fill text-success fs-5 flex-shrink-0 mt-0.5"></i>
                  <div>
                    Mã xác thực OTP gồm 6 chữ số đã được gửi đến email{' '}
                    <strong>{maskEmail(email)}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/spam) của bạn để lấy mã.
                  </div>
                </div>

                {/* OTP Input */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold small text-dark mb-0" htmlFor="otp-input">
                      Mã xác thực OTP (6 chữ số) <span className="text-danger">*</span>
                    </label>
                    {countdown > 0 ? (
                      <span className="small text-muted" style={{ fontSize: '0.8rem' }}>
                        Gửi lại mã sau (<strong>{countdown}s</strong>)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="btn btn-link p-0 small text-decoration-none text-primary fw-semibold"
                        style={{ fontSize: '0.8rem' }}
                      >
                        {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                      </button>
                    )}
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-shield-check"></i>
                    </span>
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      className="form-control text-center fw-bold letter-spacing-1"
                      placeholder="• • • • • •"
                      style={{ letterSpacing: '4px', fontSize: '1.1rem' }}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ''));
                        setError('');
                      }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark" htmlFor="new-password">
                    Mật khẩu mới <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Ít nhất 6 ký tự"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-dark" htmlFor="confirm-password">
                    Xác nhận mật khẩu mới <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-lock-fill"></i>
                    </span>
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${
                        confirmPassword && confirmPassword !== newPassword ? 'is-invalid' : ''
                      }`}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      required
                    />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <div className="text-danger small mt-1">Mật khẩu xác nhận không trùng khớp.</div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-decoration-none text-muted fw-semibold"
                    onClick={() => {
                      setStep(1);
                      setError('');
                      setOtp('');
                    }}
                    disabled={loading || resending}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Quay lại
                  </button>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3 py-2 fw-semibold"
                      onClick={onClose}
                      disabled={loading || resending}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                      disabled={loading || resending}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2"></i> Đổi mật khẩu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
