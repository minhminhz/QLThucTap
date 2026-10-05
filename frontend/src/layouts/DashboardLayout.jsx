import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Navigation config per role ────────────────────────────────────────────────
const NAV_ITEMS = {
  APPLICANT: [
    { to: '/dashboard',  label: 'Tổng quan',       icon: 'bi-grid-1x2-fill' },
    { to: '/positions',  label: 'Vị trí thực tập', icon: 'bi-briefcase-fill' },
    { to: '/profile',    label: 'Hồ sơ cá nhân',   icon: 'bi-person-badge-fill' },
  ],
  INTERN: [
    { to: '/intern',       label: 'Tổng quan',     icon: 'bi-grid-1x2-fill' },
    { to: '/intern/tasks', label: 'Công việc',     icon: 'bi-check2-square' },
    { to: '/profile',      label: 'Hồ sơ cá nhân',icon: 'bi-person-badge-fill' },
  ],
  MENTOR: [
    { to: '/mentor',        label: 'Tổng quan',       icon: 'bi-grid-1x2-fill' },
    { to: '/mentor/interns',label: 'Thực tập sinh',   icon: 'bi-people-fill' },
    { to: '/mentor/tasks',  label: 'Giao việc',       icon: 'bi-list-task' },
    { to: '/profile',       label: 'Hồ sơ cá nhân',  icon: 'bi-person-badge-fill' },
  ],
  HR: [
    { to: '/hr',              label: 'Tổng quan',       icon: 'bi-grid-1x2-fill' },
    { to: '/hr/positions',    label: 'Vị trí tuyển dụng',icon: 'bi-briefcase-fill' },
    { to: '/hr/applications', label: 'Hồ sơ ứng tuyển',icon: 'bi-file-earmark-person-fill' },
    { to: '/hr/interns',      label: 'Thực tập sinh',   icon: 'bi-mortarboard-fill' },
    { to: '/hr/mentors',      label: 'Mentor',          icon: 'bi-person-video3' },
    { to: '/profile',         label: 'Hồ sơ cá nhân',  icon: 'bi-person-badge-fill' },
  ],
  ADMIN: [
    { to: '/admin',          label: 'Tổng quan',        icon: 'bi-speedometer2' },
    { to: '/admin/branches', label: 'Quản lý cơ sở',   icon: 'bi-buildings-fill' },
    { to: '/admin/users',    label: 'Quản lý người dùng',icon: 'bi-people-fill' },
    { to: '/profile',        label: 'Hồ sơ cá nhân',   icon: 'bi-person-badge-fill' },
  ],
};

const ROLE_LABELS = {
  APPLICANT: 'Ứng viên',
  INTERN:    'Thực tập sinh',
  MENTOR:    'Mentor hướng dẫn',
  HR:        'Nhân sự (HR)',
  ADMIN:     'Quản trị viên',
};

const ROLE_COLORS = {
  APPLICANT: '#6366f1',
  INTERN:    '#0ea5e9',
  MENTOR:    '#10b981',
  HR:        '#f59e0b',
  ADMIN:     '#ef4444',
};

// ─── Sidebar width constants ───────────────────────────────────────────────────
const SIDEBAR_FULL   = 260;
const SIDEBAR_MINI   = 68;

// ─── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 32, fontSize = '0.85rem', color }) {
  return (
    <div
      style={{
        width: size, height: size, fontSize,
        borderRadius: '50%',
        background: color || 'var(--vymi-primary)',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, flexShrink: 0,
        letterSpacing: '0.01em',
      }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  // collapsed: icon-only mode on desktop
  const [collapsed, setCollapsed]       = useState(false);
  // mobileOpen: drawer mode on mobile
  const [mobileOpen, setMobileOpen]     = useState(false);
  // isMobile: track viewport
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 992);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = NAV_ITEMS[user?.role] || [];
  const roleColor = ROLE_COLORS[user?.role] || 'var(--vymi-primary)';

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (item) => {
    const exact = ['/dashboard', '/intern', '/mentor', '/hr', '/admin'];
    if (exact.includes(item.to)) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  // Effective sidebar width for desktop layout
  const sidebarW = isMobile ? 0 : (collapsed ? SIDEBAR_MINI : SIDEBAR_FULL);

  return (
    <>
      {/* ─── Injected CSS ───────────────────────────────────────────── */}
      <style>{`
        /* Layout shell */
        .dl-shell {
          display: flex;
          min-height: 100vh;
          background: var(--vymi-bg, #f8fafc);
        }

        /* ── Sidebar ── */
        .dl-sidebar {
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          background: #0f172a;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          z-index: 1050;
          overflow: hidden;
          transition: width 0.25s cubic-bezier(.4,0,.2,1),
                      transform 0.25s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.25s ease;
        }
        /* Desktop: push layout */
        @media (min-width: 992px) {
          .dl-sidebar {
            position: sticky;
            top: 0;
            height: 100vh;
            flex-shrink: 0;
            transform: none !important;
          }
          .dl-sidebar.full  { width: ${SIDEBAR_FULL}px; }
          .dl-sidebar.mini  { width: ${SIDEBAR_MINI}px; }
        }
        /* Mobile: off-canvas drawer */
        @media (max-width: 991.98px) {
          .dl-sidebar       { width: ${SIDEBAR_FULL}px; transform: translateX(-100%); box-shadow: none; }
          .dl-sidebar.open  { transform: translateX(0); box-shadow: 4px 0 30px rgba(0,0,0,.35); }
        }

        /* Backdrop (mobile only) */
        .dl-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,.55);
          z-index: 1049;
          opacity: 0;
          transition: opacity .25s;
        }
        .dl-backdrop.show { display: block; opacity: 1; }

        /* ── Sidebar brand ── */
        .dl-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          height: 60px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          flex-shrink: 0;
          overflow: hidden;
          white-space: nowrap;
          text-decoration: none;
          color: inherit;
        }
        .dl-brand-logo {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--vymi-primary, #0284c7);
          color: #fff;
          font-size: 1.1rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dl-brand-text { overflow: hidden; }
        .dl-brand-text strong { display: block; font-size: .95rem; font-weight: 700; color: #f1f5f9; line-height: 1.2; }
        .dl-brand-text span   { display: block; font-size: .68rem; color: #64748b; margin-top: 1px; }

        /* ── User info strip ── */
        .dl-user-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          background: rgba(0,0,0,.2);
          overflow: hidden;
          flex-shrink: 0;
        }
        .dl-user-info { overflow: hidden; flex: 1; min-width: 0; }
        .dl-user-info strong { display: block; font-size: .82rem; color: #f1f5f9; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Nav section label ── */
        .dl-nav-label {
          font-size: .62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #475569;
          padding: 16px 16px 6px;
          white-space: nowrap;
          overflow: hidden;
        }

        /* ── Nav items ── */
        .dl-nav { list-style: none; margin: 0; padding: 0 8px; flex: 1; overflow-y: auto; overflow-x: hidden; }
        .dl-nav::-webkit-scrollbar { width: 4px; }
        .dl-nav::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }

        .dl-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-size: .875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          transition: background .15s, color .15s;
          margin-bottom: 2px;
        }
        .dl-nav-link:hover  { background: rgba(255,255,255,.07); color: #e2e8f0; }
        .dl-nav-link.active { background: var(--vymi-primary, #0284c7); color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(2,132,199,.35); }
        .dl-nav-link i      { font-size: 1.1rem; flex-shrink: 0; width: 20px; text-align: center; }
        .dl-nav-link span   { overflow: hidden; text-overflow: ellipsis; }

        /* tooltip for mini mode */
        .dl-sidebar.mini .dl-nav-link { justify-content: center; gap: 0; padding: 10px 0; border-radius: 10px; }
        .dl-sidebar.mini .dl-nav-link span,
        .dl-sidebar.mini .dl-brand-text,
        .dl-sidebar.mini .dl-user-info,
        .dl-sidebar.mini .dl-nav-label { display: none; }
        .dl-sidebar.mini .dl-user-strip { justify-content: center; padding: 12px 6px; }
        .dl-sidebar.mini .dl-brand      { justify-content: center; padding: 0; }
        .dl-sidebar.mini .dl-nav        { padding: 0 6px; }
        .dl-sidebar.mini .dl-nav-link i { font-size: 1.2rem; width: auto; }

        /* ── Sidebar footer ── */
        .dl-sidebar-footer {
          padding: 10px 8px;
          border-top: 1px solid rgba(255,255,255,.07);
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }
        .dl-sidebar.mini .dl-sidebar-footer { padding: 10px 6px; }
        .dl-sidebar-footer .dl-foot-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: .85rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          transition: background .15s, color .15s;
          width: 100%;
          text-align: left;
        }
        .dl-sidebar-footer .dl-foot-btn:hover { background: rgba(255,255,255,.07); color: #e2e8f0; }
        .dl-sidebar-footer .dl-foot-btn.danger:hover { background: rgba(239,68,68,.15); color: #f87171; }
        .dl-sidebar-footer .dl-foot-btn i { font-size: 1.1rem; width: 20px; text-align: center; flex-shrink: 0; }
        .dl-sidebar.mini .dl-sidebar-footer .dl-foot-btn { justify-content: center; padding: 9px 0; }
        .dl-sidebar.mini .dl-sidebar-footer .dl-foot-btn span { display: none; }

        /* ── Main wrapper ── */
        .dl-main-wrap {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ── Top navbar ── */
        .dl-topbar {
          position: sticky;
          top: 0;
          z-index: 1040;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          flex-shrink: 0;
        }
        .dl-topbar-left  { display: flex; align-items: center; gap: 10px; }
        .dl-topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }

        .dl-toggle-btn {
          width: 36px; height: 36px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          font-size: 1.1rem;
          transition: background .15s, color .15s, border-color .15s;
          flex-shrink: 0;
        }
        .dl-toggle-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }

        /* breadcrumb / page title strip */
        .dl-topbar-title { font-size: .9rem; font-weight: 600; color: #1e293b; }
        .dl-topbar-sub   { font-size: .78rem; color: #94a3b8; margin-left: 6px; }

        /* icon action buttons in topbar */
        .dl-icon-btn {
          width: 36px; height: 36px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          font-size: 1rem;
          transition: background .15s, color .15s;
          text-decoration: none;
          position: relative;
        }
        .dl-icon-btn:hover  { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .dl-icon-btn .badge-dot {
          position: absolute; top: 4px; right: 4px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #fff;
        }

        /* topbar user pill */
        .dl-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 99px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          transition: background .15s, border-color .15s;
          text-decoration: none;
          color: inherit;
        }
        .dl-user-pill:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .dl-user-pill-name { font-size: .82rem; font-weight: 600; color: #1e293b; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dl-user-pill-role { font-size: .7rem; color: #94a3b8; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ── Content area ── */
        .dl-content {
          flex: 1;
          padding: 24px;
          overflow-x: hidden;
        }
        @media (max-width: 575.98px) { .dl-content { padding: 16px; } }
      `}</style>

      <div className="dl-shell">
        {/* ═══════════════ BACKDROP (mobile) ═══════════════ */}
        <div
          className={`dl-backdrop${mobileOpen ? ' show' : ''}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* ═══════════════ SIDEBAR ═══════════════ */}
        <aside className={`dl-sidebar${isMobile ? (mobileOpen ? ' open' : '') : (collapsed ? ' mini' : ' full')}`}>

          {/* Brand */}
          <Link to="/" className="dl-brand">
            <div className="dl-brand-logo">V</div>
            <div className="dl-brand-text">
              <strong>VYMI <span style={{ color: '#38bdf8' }}>Tech</span></strong>
              <span>Quản lý Thực tập</span>
            </div>
          </Link>

          {/* User strip */}
          <div className="dl-user-strip">
            <Avatar name={user?.full_name} size={34} color={roleColor} />
            <div className="dl-user-info">
              <strong>{user?.full_name}</strong>
              <span
                className="badge mt-1"
                style={{
                  background: roleColor + '22',
                  color: roleColor,
                  border: `1px solid ${roleColor}44`,
                  fontSize: '.65rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 99,
                }}
              >
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
          </div>

          {/* Nav label */}
          <div className="dl-nav-label">Menu điều hướng</div>

          {/* Nav items */}
          <ul className="dl-nav">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`dl-nav-link${active ? ' active' : ''}`}
                    title={item.label}
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sidebar footer actions */}
          <div className="dl-sidebar-footer">
            {/* Desktop collapse toggle */}
            {!isMobile && (
              <button
                className="dl-foot-btn"
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              >
                <i className={`bi ${collapsed ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar'}`} />
                <span>{collapsed ? 'Mở rộng' : 'Thu gọn menu'}</span>
              </button>
            )}
            <Link to="/" className="dl-foot-btn" title="Về trang chủ">
              <i className="bi bi-globe2" />
              <span>Về trang chủ</span>
            </Link>
            <button className="dl-foot-btn danger" onClick={handleLogout} title="Đăng xuất">
              <i className="bi bi-box-arrow-left" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* ═══════════════ MAIN WRAPPER ═══════════════ */}
        <div className="dl-main-wrap">

          {/* ─── TOP NAVBAR ────────────────────────────────── */}
          <header className="dl-topbar">
            {/* Left: toggle + breadcrumb */}
            <div className="dl-topbar-left">
              {/* Hamburger / collapse toggle */}
              <button
                className="dl-toggle-btn"
                onClick={() => isMobile ? setMobileOpen((o) => !o) : setCollapsed((c) => !c)}
                aria-label="Toggle Sidebar"
              >
                <i className={`bi ${isMobile ? 'bi-list' : (collapsed ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar')}`} />
              </button>

              {/* Breadcrumb / title */}
              <div className="d-none d-sm-block">
                <span className="dl-topbar-title">
                  {ROLE_LABELS[user?.role]}
                </span>
                {user?.branch_name && (
                  <span className="dl-topbar-sub">
                    <i className="bi bi-geo-alt-fill text-primary me-1" style={{ fontSize: '.75rem' }} />
                    {user.branch_name}
                  </span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="dl-topbar-right">
              {/* Branch badge (md+) */}
              {user?.branch_name && (
                <span
                  className="badge d-none d-md-inline-flex align-items-center gap-1"
                  style={{
                    background: '#f0f9ff',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    fontSize: '.72rem',
                    padding: '5px 10px',
                    borderRadius: 99,
                    fontWeight: 600,
                  }}
                >
                  <i className="bi bi-building" />
                  {user.branch_name}
                </span>
              )}

              {/* Home link */}
              <Link to="/" className="dl-icon-btn" title="Trang chủ">
                <i className="bi bi-house-fill" />
              </Link>

              {/* Notifications (placeholder) */}
              <button className="dl-icon-btn" title="Thông báo" style={{ border: 'none' }}>
                <i className="bi bi-bell-fill" />
                <span className="badge-dot" />
              </button>

              {/* User dropdown */}
              <div className="dropdown">
                <div
                  className="dl-user-pill"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
                >
                  <Avatar name={user?.full_name} size={28} fontSize=".75rem" color={roleColor} />
                  <div className="d-none d-sm-block">
                    <div className="dl-user-pill-name">{user?.full_name}</div>
                    <div className="dl-user-pill-role">{ROLE_LABELS[user?.role]}</div>
                  </div>
                  <i className="bi bi-chevron-down d-none d-sm-block" style={{ fontSize: '.7rem', color: '#94a3b8', marginLeft: 2 }} />
                </div>

                <ul className="dropdown-menu dropdown-menu-end shadow border mt-2" style={{ minWidth: 220, borderRadius: 12, padding: '6px' }}>
                  {/* Header */}
                  <li className="px-3 py-2 mb-1" style={{ background: '#f8fafc', borderRadius: 8 }}>
                    <div className="d-flex align-items-center gap-2">
                      <Avatar name={user?.full_name} size={36} color={roleColor} />
                      <div>
                        <div className="fw-bold small text-dark" style={{ lineHeight: 1.2 }}>{user?.full_name}</div>
                        <div className="text-muted" style={{ fontSize: '.72rem' }}>{user?.email}</div>
                        <span
                          className="badge mt-1"
                          style={{
                            background: roleColor + '20',
                            color: roleColor,
                            fontSize: '.62rem',
                            padding: '2px 7px',
                            borderRadius: 99,
                            fontWeight: 700,
                          }}
                        >
                          {ROLE_LABELS[user?.role]}
                        </span>
                      </div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <Link to="/profile" className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle text-primary" />
                      <span className="small">Hồ sơ cá nhân</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2">
                      <i className="bi bi-house text-muted" />
                      <span className="small">Về trang chủ</span>
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 text-danger"
                    >
                      <i className="bi bi-box-arrow-right" />
                      <span className="small">Đăng xuất</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </header>

          {/* ─── PAGE CONTENT ───────────────────────────────── */}
          <main className="dl-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
