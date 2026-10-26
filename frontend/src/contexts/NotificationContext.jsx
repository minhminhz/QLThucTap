import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolveRef = useRef(null);

  // ── Toast Notifications ──
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    
    // Auto title defaults if not provided
    let defaultTitle = 'Thông báo';
    if (type === 'success') defaultTitle = 'Thành công';
    if (type === 'error') defaultTitle = 'Lỗi thực hiện';
    if (type === 'warning') defaultTitle = 'Lưu ý';
    if (type === 'info') defaultTitle = 'Thông tin hệ thống';

    const newToast = {
      id,
      type,
      title: title || defaultTitle,
      message,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const notify = {
    success: (message, title) => addToast({ type: 'success', title, message }),
    error: (message, title) => addToast({ type: 'error', title, message }),
    warning: (message, title) => addToast({ type: 'warning', title, message }),
    info: (message, title) => addToast({ type: 'info', title, message }),
  };

  // ── Confirmation Dialog (replaces window.confirm) ──
  const confirm = useCallback(({
    title = 'Xác nhận thao tác',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    variant = 'primary', // 'danger' | 'warning' | 'primary' | 'success'
  } = {}) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        variant,
      });
    });
  }, []);

  const handleConfirmClose = (result) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmDialog(null);
  };

  // Global override for window.alert to prevent ugly "localhost:5173" popup
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      notify.info(msg, 'Thông báo hệ thống');
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}

      {/* Floating Toast Container */}
      <div
        className="toast-container position-fixed"
        style={{
          top: '20px',
          right: '24px',
          zIndex: 1095,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '420px',
          width: 'calc(100vw - 32px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Custom Confirm Modal */}
      {confirmDialog && (
        <ConfirmModalDialog dialog={confirmDialog} onClose={handleConfirmClose} />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// ── Toast Item Component ──
function ToastItem({ toast, onClose }) {
  const { type, title, message } = toast;

  const config = {
    success: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      icon: 'bi-check-circle-fill text-success',
      titleColor: '#166534',
      badgeBg: '#dcfce7',
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      icon: 'bi-x-circle-fill text-danger',
      titleColor: '#991b1b',
      badgeBg: '#fee2e2',
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      icon: 'bi-exclamation-triangle-fill text-warning',
      titleColor: '#92400e',
      badgeBg: '#fef3c7',
    },
    info: {
      bg: '#f0f9ff',
      border: '#bae6fd',
      icon: 'bi-info-circle-fill text-primary',
      titleColor: '#075985',
      badgeBg: '#e0f2fe',
    },
  }[type] || {
    bg: '#ffffff',
    border: '#e2e8f0',
    icon: 'bi-bell-fill text-secondary',
    titleColor: '#1e293b',
    badgeBg: '#f1f5f9',
  };

  return (
    <div
      className="shadow-lg p-3 rounded-3"
      style={{
        pointerEvents: 'auto',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        animation: 'slideInRight 0.25s ease-out forwards',
        transition: 'all 0.2s ease',
      }}
    >
      <div className="d-flex align-items-start gap-2">
        <div className="fs-5 lh-1 pt-1">
          <i className={`bi ${config.icon}`} />
        </div>
        <div className="flex-grow-1 pe-2">
          <div
            className="fw-bold mb-1"
            style={{ color: config.titleColor, fontSize: '0.925rem' }}
          >
            {title}
          </div>
          <div
            className="text-dark small"
            style={{
              lineHeight: '1.45',
              wordBreak: 'break-word',
              opacity: 0.9,
            }}
          >
            {message}
          </div>
        </div>
        <button
          type="button"
          className="btn-close ms-auto pt-1"
          style={{ fontSize: '0.75rem' }}
          onClick={onClose}
          aria-label="Đóng"
        />
      </div>
    </div>
  );
}

// ── Confirm Modal Dialog Component ──
function ConfirmModalDialog({ dialog, onClose }) {
  const { title, message, confirmText, cancelText, variant } = dialog;

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const variantStyles = {
    danger: {
      btnClass: 'btn btn-danger',
      iconClass: 'bi-trash3-fill text-danger',
      iconBg: '#fee2e2',
      borderAccent: '#ef4444',
    },
    warning: {
      btnClass: 'btn btn-warning text-dark',
      iconClass: 'bi-exclamation-triangle-fill text-warning',
      iconBg: '#fef3c7',
      borderAccent: '#f59e0b',
    },
    success: {
      btnClass: 'btn btn-success',
      iconClass: 'bi-check-circle-fill text-success',
      iconBg: '#dcfce7',
      borderAccent: '#10b981',
    },
    primary: {
      btnClass: 'btn btn-primary',
      iconClass: 'bi-question-circle-fill text-primary',
      iconBg: '#e0f2fe',
      borderAccent: '#0284c7',
    },
  }[variant] || {
    btnClass: 'btn btn-primary',
    iconClass: 'bi-question-circle-fill text-primary',
    iconBg: '#e0f2fe',
    borderAccent: '#0284c7',
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div
          className="modal-content border-0 shadow-lg"
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div className="modal-body p-4 text-center">
            {/* Action Icon Avatar */}
            <div
              className="d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: variantStyles.iconBg,
              }}
            >
              <i className={`bi ${variantStyles.iconClass} fs-2`} />
            </div>

            {/* Title */}
            <h5 className="modal-title fw-bold text-dark mb-2" style={{ fontSize: '1.2rem' }}>
              {title}
            </h5>

            {/* Description/Message */}
            <p className="text-muted small mb-4 px-2" style={{ lineHeight: '1.55' }}>
              {message}
            </p>

            {/* Action Buttons */}
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-light border px-4 py-2 fw-semibold text-secondary"
                style={{ borderRadius: '10px', minWidth: '110px' }}
                onClick={() => onClose(false)}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`${variantStyles.btnClass} px-4 py-2 fw-semibold shadow-sm`}
                style={{ borderRadius: '10px', minWidth: '120px' }}
                onClick={() => onClose(true)}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
