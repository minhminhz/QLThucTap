import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-white pt-5 pb-4 mt-auto border-top">
      <div className="container px-3 px-sm-4 px-lg-5">
        <div className="row gy-4 justify-content-between align-items-start mb-4">
          {/* Brand Info */}
          <div className="col-12 col-lg-4 col-xl-4 pe-lg-3">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-white text-decoration-none mb-3">
              <div
                className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{ width: '38px', height: '38px', fontSize: '1.25rem' }}
              >
                V
              </div>
              <span className="fs-5 fw-bold tracking-tight">
                VYMI <span className="text-info">Tech</span>
              </span>
            </Link>
            <p className="text-secondary small mb-3 leading-relaxed" style={{ maxWidth: '360px' }}>
              Hệ thống Quản lý Tuyển dụng & Đào tạo Thực tập sinh Doanh nghiệp đa cơ sở. Nâng tầm kỹ năng thực chiến cho sinh viên CNTT.
            </p>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle small px-2.5 py-1.5">
              <i className="bi bi-broadcast me-1.5"></i>
              Tiếp nhận hồ sơ tuyển dụng các đợt trong năm
            </span>
          </div>

          {/* Locations */}
          <div className="col-12 col-sm-6 col-lg-3 col-xl-3 d-flex flex-column justify-content-start align-items-lg-center">
            <div style={{ maxWidth: '280px', width: '100%' }}>
              <h6 className="text-uppercase fw-bold text-light small mb-3 tracking-wider d-flex align-items-center">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i> Hệ thống cơ sở chính
              </h6>
              <ul className="list-unstyled text-secondary small mb-0 d-flex flex-column gap-2.5">
                <li>
                  <strong className="text-light">Hà Nội:</strong> Số 1 Đại Cồ Việt, Q. Hai Bà Trưng
                </li>
                <li>
                  <strong className="text-light">Đà Nẵng:</strong> Tòa nhà FPT Complex, KCN An Đồn
                </li>
                <li>
                  <strong className="text-light">TP. HCM:</strong> Landmark 81, Vinhomes Central Park
                </li>
              </ul>
            </div>
          </div>

          {/* Support & Contact */}
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3 d-flex flex-column justify-content-start align-items-lg-end">
            <div style={{ maxWidth: '300px', width: '100%' }}>
              <h6 className="text-uppercase fw-bold text-light small mb-3 tracking-wider d-flex align-items-center">
                <i className="bi bi-headset text-primary me-2"></i> Hỗ trợ & Liên hệ
              </h6>
              <ul className="list-unstyled text-secondary small mb-0 d-flex flex-column gap-2.5">
                <li className="d-flex align-items-center">
                  <i className="bi bi-envelope me-2 text-primary flex-shrink-0"></i>
                  <span>Email: <span className="text-light">contact@vymitech.vn</span></span>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bi bi-telephone me-2 text-primary flex-shrink-0"></i>
                  <span>Hotline: <strong className="text-light">(024) 6688 9999</strong></span>
                </li>
                <li className="text-secondary small d-flex align-items-start">
                  <i className="bi bi-clock me-2 text-primary flex-shrink-0 mt-0.5"></i>
                  <span>Giờ làm việc: Thứ 2 - Thứ 6 (8:30 - 17:30)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-3 border-top border-secondary border-opacity-25 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 text-secondary small">
          <p className="mb-0">
            © {new Date().getFullYear()} VYMI Tech Internship Management System.
          </p>
          <div className="d-flex gap-3">
            <span className="text-secondary text-decoration-none">Bảo mật hồ sơ</span>
            <span>•</span>
            <span className="text-secondary text-decoration-none">Quy chế thực tập</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
