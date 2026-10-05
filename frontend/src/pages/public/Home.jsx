import { useState, useEffect } from 'react';
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
          <i className="bi bi-patch-check-fill"></i>
          CỔNG TUYỂN DỤNG & QUẢN LÝ THỰC TẬP VYMI TECH
        </div>

        <h1 className="display-6 fw-bold text-dark mb-3">
          Khởi đầu sự nghiệp công nghệ <span className="text-primary">vững chắc</span>
        </h1>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: '600px' }}>
          Môi trường đào tạo thực chiến, lộ trình kèm cặp 1-1 từ các kỹ sư giàu kinh nghiệm tại các cơ sở trên toàn quốc.
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

      {/* ===== 2. HỆ THỐNG CƠ SỞ ===== */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              <i className="bi bi-buildings text-primary me-2"></i> Hệ thống cơ sở thực tập
            </h2>
            <p className="text-muted small mb-0">
              Các văn phòng và trung tâm phát triển công nghệ hiện đại
            </p>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-none d-sm-inline-block">
            {branches.length > 0 ? `${branches.length} Cơ sở` : '3 Cơ sở'}
          </span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card h-100 border shadow-xs">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">Hà Nội (Trụ sở chính)</h6>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Hoạt động
                  </span>
                </div>
                <p className="text-muted small mb-3">Số 1 Đại Cồ Việt, Q. Hai Bà Trưng, Hà Nội</p>
                <Link to="/positions?branch_id=1" className="small fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1 hover-underline">
                  <i className="bi bi-briefcase me-1"></i> Vị trí mở tuyển tại Hà Nội →
                </Link>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100 border shadow-xs">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">Đà Nẵng (Miền Trung)</h6>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Hoạt động
                  </span>
                </div>
                <p className="text-muted small mb-3">Tòa nhà FPT Complex, KCN An Đồn, Đà Nẵng</p>
                <Link to="/positions?branch_id=2" className="small fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1 hover-underline">
                  <i className="bi bi-briefcase me-1"></i> Vị trí mở tuyển tại Đà Nẵng →
                </Link>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100 border shadow-xs">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">TP. Hồ Chí Minh (Miền Nam)</h6>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Hoạt động
                  </span>
                </div>
                <p className="text-muted small mb-3">Landmark 81, Vinhomes Central Park, Bình Thạnh</p>
                <Link to="/positions?branch_id=3" className="small fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1 hover-underline">
                  <i className="bi bi-briefcase me-1"></i> Vị trí mở tuyển tại TP.HCM →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. DANH SÁCH VỊ TRÍ THỰC TẬP ===== */}
      <section id="positions" className="mb-5">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">
              <i className="bi bi-briefcase text-primary me-2"></i> Vị trí thực tập đang mở tuyển
            </h2>
            <p className="text-muted small mb-0">
              Chọn vị trí mong muốn để xem chi tiết yêu cầu, chế độ đãi ngộ và nộp hồ sơ CV
            </p>
          </div>

          {/* Action to dedicated positions page & Branch buttons */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              onClick={() => setSelectedBranch('')}
              className={`btn btn-sm ${
                selectedBranch === '' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
            >
              Tất cả ({positions.length})
            </button>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`btn btn-sm ${
                  selectedBranch === b.id ? 'btn-primary' : 'btn-outline-secondary'
                }`}
              >
                {b.name}
              </button>
            ))}
            <Link to="/positions" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 shadow-xs fw-semibold ms-md-2">
              <i className="bi bi-sliders text-primary"></i>
              <span>Trang tuyển dụng riêng</span>
              <i className="bi bi-arrow-right"></i>
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
