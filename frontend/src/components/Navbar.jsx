import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const links = {
      APPLICANT: '/dashboard',
      INTERN: '/intern',
      MENTOR: '/mentor',
      HR: '/hr',
      ADMIN: '/admin',
    };
    return links[user.role] || '/';
  };

  const getRoleLabel = () => {
    const labels = {
      APPLICANT: 'Ứng viên',
      INTERN: 'Thực tập sinh',
      MENTOR: 'Mentor hướng dẫn',
      HR: 'Nhân sự (HR)',
      ADMIN: 'Quản trị viên',
    };
    return labels[user?.role] || user?.role;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm py-2" style={{ backgroundColor: '#0284c7' }}>
      <div className="container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <div
            className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm"
            style={{ width: '38px', height: '38px', fontSize: '1.25rem' }}
          >
            V
          </div>
          <div className="d-flex flex-column leading-tight">
            <span className="fs-5 fw-bold tracking-tight text-white mb-0">
              VYMI <span className="text-info-emphasis text-white-50">Tech</span>
            </span>
            <span className="small text-white-50" style={{ fontSize: '0.75rem' }}>
              Cổng Thực Tập Sinh Doanh Nghiệp
            </span>
          </div>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarPublic"
          aria-controls="navbarPublic"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="navbarPublic">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li className="nav-item">
              <Link to="/positions" className="nav-link text-white fw-medium">
                <i className="bi bi-briefcase me-1"></i> Vị trí tuyển dụng
              </Link>
            </li>
          </ul>

          {/* Right Actions */}
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={getDashboardLink()}
                  className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 px-3 py-1.5"
                >
                  <div
                    className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
                  >
                    {user.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-start d-none d-sm-block">
                    <span className="d-block fw-semibold lh-1" style={{ fontSize: '0.85rem' }}>
                      {user.full_name}
                    </span>
                    <span className="text-white-50 lh-1" style={{ fontSize: '0.7rem' }}>
                      {getRoleLabel()}
                    </span>
                  </div>
                </Link>

                <Link to={getDashboardLink()} className="btn btn-sm btn-light fw-bold text-primary px-3">
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-link text-white-50 text-decoration-none hover-text-white"
                  title="Đăng xuất"
                >
                  <i className="bi bi-box-arrow-right fs-5"></i>
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/register" className="btn btn-sm btn-outline-light px-3 py-1.5 fw-semibold">
                  Đăng ký
                </Link>
                <Link to="/login" className="btn btn-sm btn-light text-primary px-3 py-1.5 fw-bold shadow-sm">
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
