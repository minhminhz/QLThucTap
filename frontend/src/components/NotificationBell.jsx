import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import eventBus from '../services/eventBus';

export default function NotificationBell({ variant = 'dashboard' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications and unread count
  const fetchNotifications = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/notifications?limit=40');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // Ignore unauthorized or network errors silently during polling
      if (err.response?.status !== 401) {
        console.error('Failed to fetch notifications:', err);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-poll every 15 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    // Refresh when user returns to tab
    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener('focus', handleFocus);

    // Listen to real-time events from EventBus
    const unsubAppSubmitted = eventBus.on('APPLICATION_SUBMITTED', () => fetchNotifications());
    const unsubAppUpdated = eventBus.on('APPLICATION_UPDATED', () => fetchNotifications());
    const unsubTask = eventBus.on('TASK_UPDATED', () => fetchNotifications());
    const unsubNotif = eventBus.on('NOTIFICATION_RECEIVED', () => fetchNotifications());

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      unsubAppSubmitted();
      unsubAppUpdated();
      unsubTask();
      unsubNotif();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications(notifications.length === 0);
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (res.data.unread_count !== undefined) {
          setUnreadCount(res.data.unread_count);
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Format relative time helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);

      if (diffSec < 45) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay === 1) return 'Hôm qua';
      if (diffDay < 7) return `${diffDay} ngày trước`;

      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Type styling helper
  const getTypeConfig = (type) => {
    switch (type) {
      case 'APPLICATION':
        return {
          icon: 'bi-file-earmark-person-fill',
          bg: '#e0f2fe',
          color: '#0284c7',
          label: 'Tuyển dụng'
        };
      case 'TASK':
        return {
          icon: 'bi-check2-circle',
          bg: '#f3e8ff',
          color: '#7c3aed',
          label: 'Nhiệm vụ'
        };
      case 'INTERNSHIP':
        return {
          icon: 'bi-mortarboard-fill',
          bg: '#dcfce7',
          color: '#16a34a',
          label: 'Thực tập'
        };
      case 'HR':
        return {
          icon: 'bi-building-fill',
          bg: '#cffafe',
          color: '#0891b2',
          label: 'Nhân sự'
        };
      default:
        return {
          icon: 'bi-bell-fill',
          bg: '#f1f5f9',
          color: '#64748b',
          label: 'Hệ thống'
        };
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  const isPublicNavbar = variant === 'navbar';

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={
          isPublicNavbar
            ? 'btn btn-sm btn-outline-light position-relative d-flex align-items-center justify-content-center p-2'
            : 'dl-icon-btn position-relative'
        }
        title="Thông báo"
        style={{
          border: isPublicNavbar ? '1px solid rgba(255,255,255,0.3)' : 'none',
          borderRadius: 10,
          width: 38,
          height: 38,
          transition: 'all 0.2s',
          backgroundColor: isOpen
            ? isPublicNavbar
              ? 'rgba(255,255,255,0.2)'
              : '#f1f5f9'
            : 'transparent'
        }}
      >
        <i
          className="bi bi-bell-fill"
          style={{
            fontSize: '1.05rem',
            color: isPublicNavbar ? '#ffffff' : '#475569'
          }}
        />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span
            className="position-absolute translate-middle badge rounded-pill bg-danger border border-light"
            style={{
              top: 6,
              right: -2,
              fontSize: '0.62rem',
              padding: '0.22em 0.45em',
              fontWeight: 700,
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="shadow-lg border bg-white position-absolute"
          style={{
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(380px, calc(100vw - 24px))',
            borderRadius: 16,
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeInUp 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-2.5 d-flex align-items-center justify-content-between border-bottom"
            style={{ backgroundColor: '#f8fafc' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark fs-6">Thông báo</span>
              {unreadCount > 0 && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="btn btn-sm btn-link text-primary text-decoration-none p-0"
                style={{ fontSize: '0.78rem', fontWeight: 600 }}
                title="Đánh dấu tất cả là đã đọc"
              >
                <i className="bi bi-check2-all me-1" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            className="d-flex border-bottom px-3 pt-2 gap-3"
            style={{ fontSize: '0.82rem', backgroundColor: '#ffffff' }}
          >
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`btn btn-sm p-0 pb-2 border-0 fw-semibold position-relative ${
                filter === 'ALL' ? 'text-primary' : 'text-muted'
              }`}
              style={{ background: 'none' }}
            >
              Tất cả ({notifications.length})
              {filter === 'ALL' && (
                <div
                  className="position-absolute bottom-0 start-0 w-100"
                  style={{ height: 2, backgroundColor: 'var(--vymi-primary)' }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`btn btn-sm p-0 pb-2 border-0 fw-semibold position-relative ${
                filter === 'UNREAD' ? 'text-primary' : 'text-muted'
              }`}
              style={{ background: 'none' }}
            >
              Chưa đọc ({unreadCount})
              {filter === 'UNREAD' && (
                <div
                  className="position-absolute bottom-0 start-0 w-100"
                  style={{ height: 2, backgroundColor: 'var(--vymi-primary)' }}
                />
              )}
            </button>
          </div>

          {/* Notification List Body */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: 380,
              scrollbarWidth: 'thin'
            }}
          >
            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                <span style={{ fontSize: '0.82rem' }}>Đang tải thông báo...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div
                  className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-2"
                  style={{ width: 48, height: 48 }}
                >
                  <i className="bi bi-bell-slash text-muted fs-4" />
                </div>
                <div className="fw-semibold text-dark small">Không có thông báo nào</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {filter === 'UNREAD'
                    ? 'Bạn đã đọc toàn bộ các thông báo rồi!'
                    : 'Các thông báo tương tác hệ thống sẽ hiển thị ở đây.'}
                </div>
              </div>
            ) : (
              filteredList.map((notif) => {
                const typeCfg = getTypeConfig(notif.type);
                const isUnread = !notif.is_read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className="p-3 border-bottom d-flex align-items-start gap-2.5 position-relative notif-item"
                    style={{
                      backgroundColor: isUnread ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isUnread) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#f0f9ff' : '#ffffff';
                    }}
                  >
                    {/* Icon Badge */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: typeCfg.bg,
                        color: typeCfg.color,
                        fontSize: '1rem'
                      }}
                    >
                      <i className={`bi ${typeCfg.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: typeCfg.bg,
                            color: typeCfg.color,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px'
                          }}
                        >
                          {typeCfg.label}
                        </span>

                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {formatTime(notif.created_at)}
                        </span>
                      </div>

                      <div
                        className="fw-bold text-dark small text-truncate"
                        style={{
                          fontWeight: isUnread ? 700 : 600,
                          lineHeight: 1.3
                        }}
                      >
                        {notif.title}
                      </div>

                      <div
                        className="text-secondary mt-1"
                        style={{
                          fontSize: '0.78rem',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {notif.message}
                      </div>

                      {/* Sender info if present */}
                      {notif.sender_name && (
                        <div
                          className="text-muted mt-1.5 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.7rem' }}
                        >
                          <i className="bi bi-person text-primary" />
                          <span>Từ: {notif.sender_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick action buttons & Unread Dot */}
                    <div className="d-flex flex-column align-items-center gap-1 flex-shrink-0 ms-1">
                      {isUnread && (
                        <span
                          className="rounded-circle bg-primary"
                          style={{
                            width: 8,
                            height: 8,
                            display: 'inline-block'
                          }}
                          title="Chưa đọc"
                        />
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="btn btn-sm btn-link text-muted p-0 opacity-50 hover-opacity-100"
                        title="Xóa thông báo"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-3 py-2 border-top bg-light d-flex align-items-center justify-content-between"
              style={{ fontSize: '0.75rem' }}
            >
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
              >
                <i className="bi bi-arrow-clockwise me-1" />
                Làm mới
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.delete('/notifications');
                    setNotifications([]);
                    setUnreadCount(0);
                  } catch (err) {
                    console.error('Failed to clear notifications:', err);
                  }
                }}
                className="btn btn-link btn-sm text-danger text-decoration-none p-0"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
