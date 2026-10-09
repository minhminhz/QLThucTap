import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PositionCard from '../../components/PositionCard';
import Loading from '../../components/Loading';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cuộn ngang tự động cho hệ thống cơ sở
  const branchScrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!branches || branches.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      const el = branchScrollRef.current;
      if (!el) return;

      const cardWidth = 336; // 320px width + 16px gap
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 15) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3200);

    return () => clearInterval(timer);
  }, [branches, isPaused]);

  const scrollBranches = (direction) => {
    const el = branchScrollRef.current;
    if (!el) return;
    const cardWidth = 336;
    el.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth'
    });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedBranch) params.set('branch_id', selectedBranch);
    navigate(`/positions?${params.toString()}`);
  };

  useEffect(() => {
    api.get('/branches')
      .then((r) => setBranches(r.data.data || []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBranch) params.set('branch_id', selectedBranch);
    if (search) params.set('search', search);
    api.get(`/positions?${params}`)
      .then((r) => setPositions(r.data.data || []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, [selectedBranch, search]);

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
      MENTOR: 'Mentor',
      HR: 'Nhân sự (HR)',
      ADMIN: 'Quản trị viên',
    };
    return labels[user?.role] || user?.role;
  };

  return (
    <div className="container py-4 py-md-5">
      {/* ===== 1. HERO BANNER ===== */}
      <section className="bg-primary-subtle border border-primary-subtle rounded-4 p-4 p-sm-5 text-center mb-5 shadow-xs">
        <div className="d-inline-flex align-items-center gap-2 bg-white text-primary border border-primary-subtle px-3 py-1.5 rounded-pill small fw-bold mb-3 shadow-xs">
          {/* <i className="bi bi-patch-check-fill"></i> */}
          CỔNG TUYỂN DỤNG & QUẢN LÝ THỰC TẬP VYMI TECH
        </div>

        <h1 className="display-6 fw-bold text-dark mb-3">
          Khởi đầu sự nghiệp công nghệ <span className="text-primary">vững chắc</span>
        </h1>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: '600px' }}>
          Đào tạo thực chiến, tham gia dự án thật cùng các kỹ sư giàu kinh nghiệm tại các cơ sở trên toàn quốc.
        </p>

        {/* Thanh tìm kiếm */}
        <div className="row justify-content-center mb-4">
          <div className="col-12 col-lg-9">
            <form onSubmit={handleSearchSubmit} className="card shadow-sm border p-2">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-0 text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 shadow-none ps-0"
                      placeholder="Tìm vị trí (Node.js, React, AI, QA...)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        type="button"
                        className="btn btn-link text-muted p-0 me-2 text-decoration-none"
                        onClick={() => setSearch('')}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-4 border-start-md">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-0 text-muted">
                      <i className="bi bi-geo-alt"></i>
                    </span>
                    <select
                      className="form-select border-0 shadow-none ps-0"
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

                <div className="col-12 col-md-3">
                  <button type="submit" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-xs">
                    <i className="bi bi-search"></i>
                    <span>Tìm kiếm</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-2">
          {user ? (
            <Link to={getDashboardLink()} className="btn btn-primary px-4 py-2 fw-semibold">
              Bảng điều khiển của tôi ({getRoleLabel()}) →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary px-4 py-2 fw-semibold">
                <i className="bi bi-person-plus me-1"></i> Đăng ký ứng viên
              </Link>
              <Link to="/login" className="btn btn-outline-primary px-4 py-2 fw-semibold bg-white">
                <i className="bi bi-box-arrow-in-right me-1"></i> Đăng nhập hệ thống
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ===== 2. HỆ THỐNG CƠ SỞ (TỰ ĐỘNG CUỘN NGANG & ĐỒNG BỘ DỮ LIỆU) ===== */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              <i className="bi bi-buildings text-primary me-2"></i> Hệ thống cơ sở
            </h2>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-none d-sm-inline-block">
              {branches.length > 0 ? `${branches.length} Cơ sở` : 'Đang cập nhật'}
            </span>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                onClick={() => scrollBranches('left')}
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: '32px', height: '32px' }}
                title="Cuộn sang trái"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button
                type="button"
                onClick={() => scrollBranches('right')}
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: '32px', height: '32px' }}
                title="Cuộn sang phải"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={branchScrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="d-flex gap-3 overflow-x-auto pb-3 pt-1 hide-scrollbar"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {branches.length === 0 ? (
            <div className="text-muted small py-4 text-center w-100 bg-white rounded-3 border">
              <i className="bi bi-buildings fs-3 d-block mb-2 text-secondary"></i>
              Đang tải danh sách cơ sở...
            </div>
          ) : (
            branches.map((b) => (
              <div
                key={b.id}
                className="card border shadow-xs flex-shrink-0 branch-carousel-card"
                style={{
                  width: '330px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                        <div
                          className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '38px', height: '38px' }}
                        >
                          <i className="bi bi-building fs-5"></i>
                        </div>
                        <h6 className="fw-bold text-dark mb-0 text-truncate" title={b.name}>
                          {b.name}
                        </h6>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle flex-shrink-0">
                        {b.status === 'ACTIVE' || !b.status ? 'Hoạt động' : b.status}
                      </span>
                    </div>

                    <p
                      className="text-muted small mb-3"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '38px',
                        lineHeight: '1.4'
                      }}
                      title={b.address}
                    >
                      <i className="bi bi-geo-alt text-primary me-1"></i>
                      {b.address || 'Đang cập nhật địa chỉ'}
                    </p>
                  </div>

                  <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                    <span className="text-secondary small">
                      <i className="bi bi-briefcase text-primary me-1"></i>
                      {b.open_positions_count ? (
                        <strong className="text-dark">{b.open_positions_count} vị trí</strong>
                      ) : (
                        'Đang tuyển sinh'
                      )}
                    </span>
                    <Link
                      to={`/positions?branch_id=${b.id}`}
                      className="btn btn-sm btn-outline-primary py-1 px-3 rounded-pill fw-semibold hover-text-white"
                      style={{ fontSize: '0.82rem' }}
                    >
                      Chi tiết →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== 3. DANH SÁCH VỊ TRÍ THỰC TẬP ===== */}
      <section id="positions" className="mb-5">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              <i className="bi bi-briefcase text-primary me-2"></i> Vị trí tuyển dụng
            </h2>
          </div>

          {/* Action to dedicated positions page & Branch buttons */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              onClick={() => setSelectedBranch('')}
              className={`btn btn-sm ${selectedBranch === '' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
            >
              Tất cả ({positions.length})
            </button>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`btn btn-sm ${selectedBranch === b.id ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
              >
                {b.name}
              </button>
            ))}
            <Link to="/positions" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 shadow-xs fw-semibold ms-md-2">
              <i className="bi bi-sliders text-primary"></i>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-5">
            <Loading text="Đang tải danh sách vị trí..." />
          </div>
        ) : positions.length === 0 ? (
          <div className="card border-dashed p-5 text-center bg-light">
            <div className="text-muted mb-2 fs-2">
              <i className="bi bi-inbox"></i>
            </div>
            <h5 className="fw-bold text-dark mb-1">Chưa tìm thấy vị trí phù hợp</h5>
            <p className="text-muted small mb-3">
              Không có vị trí thực tập nào thỏa mãn từ khóa tìm kiếm hoặc cơ sở bạn chọn.
            </p>
            <div>
              <button
                onClick={() => {
                  setSelectedBranch('');
                  setSearch('');
                }}
                className="btn btn-sm btn-outline-primary"
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Xóa bộ lọc
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {positions.map((p) => (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <PositionCard position={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== 4. CTA BANNER ===== */}
      <section className="card bg-primary text-white border-0 rounded-4 p-4 p-md-5 text-center shadow-sm">
        <div className="card-body p-0">
          <h3 className="fw-bold mb-2">Sẵn sàng tham gia chương trình thực tập tại VYMI Tech?</h3>
          <p className="text-white-50 small mb-4 mx-auto" style={{ maxWidth: '520px' }}>
            Tạo tài khoản ứng viên chỉ trong 1 phút để nộp hồ sơ trực tuyến, theo dõi tiến độ xét duyệt và nhận lịch phỏng vấn nhanh chóng.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            {user ? (
              <Link to={getDashboardLink()} className="btn btn-light text-primary fw-bold px-4 py-2">
                Truy cập Bảng điều khiển của tôi →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-light text-primary fw-bold px-4 py-2">
                  Đăng ký tài khoản ngay
                </Link>
                <Link to="/login" className="btn btn-outline-light fw-bold px-4 py-2">
                  Đăng nhập hệ thống
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
