import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PositionCard({ position }) {
  const [isSaved, setIsSaved] = useState(false);
  const isExpired = new Date(position.deadline) < new Date();

  const getAllowanceText = () => {
    if (position.benefits && position.benefits.includes('3.000.000')) return '3 - 5 triệu';
    if (position.benefits && position.benefits.includes('phụ cấp')) return 'Có phụ cấp';
    return 'Hỗ trợ thực tập';
  };

  const getDeptIconClass = (name) => {
    if (!name) return 'bi-laptop';
    if (name.includes('AI') || name.includes('Data')) return 'bi-cpu';
    if (name.includes('QA') || name.includes('Kiểm thử')) return 'bi-check2-circle';
    if (name.includes('UI') || name.includes('Thiết kế')) return 'bi-palette';
    return 'bi-laptop';
  };

  return (
    <div className="card h-100 border shadow-sm">
      <div className="card-body d-flex flex-column justify-content-between p-4">
        <div>
          {/* Header Row: Branch badge & Save button */}
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">
                {position.branch_name}
              </span>
              <p className="text-muted small mb-0">{position.department_name}</p>
            </div>

            <button
              onClick={() => setIsSaved(!isSaved)}
              className="btn btn-sm btn-link text-decoration-none p-0"
              style={{ color: isSaved ? '#ef4444' : '#94a3b8' }}
              title={isSaved ? 'Bỏ lưu' : 'Lưu tin'}
            >
              <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'} fs-5`}></i>
            </button>
          </div>

          {/* Job Title */}
          <h5 className="card-title mb-2">
            <Link
              to={`/positions?id=${position.id}`}
              className="text-dark fw-bold text-decoration-none text-truncate d-block"
              title={position.title}
            >
              {position.title}
            </Link>
          </h5>

          {/* Short Description */}
          <p
            className="card-text text-muted small mb-3"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5rem',
            }}
          >
            {position.description}
          </p>

          {/* Tag Pills */}
          <div className="d-flex flex-wrap gap-2 pt-2 border-top">
            <span className="badge bg-light text-dark border">
              {getAllowanceText()}
            </span>
            <span className="badge bg-light text-dark border">
              {position.internship_duration}
            </span>
            <span className="badge bg-light text-dark border">
              Tuyển {position.quantity}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex align-items-center justify-content-between pt-3 mt-3 border-top small">
          <span className="text-muted">
            {isExpired ? (
              <span className="text-danger fw-semibold">
                Hết hạn
              </span>
            ) : (
              <span>
                Hạn: {new Date(position.deadline).toLocaleDateString('vi-VN')}
              </span>
            )}
          </span>

          <div className="d-flex gap-2">
            <Link to={`/positions?id=${position.id}`} className="btn btn-sm btn-outline-secondary">
              Chi tiết
            </Link>
            {position.status === 'OPEN' && !isExpired ? (
              <Link to={`/positions?id=${position.id}`} className="btn btn-sm btn-primary">
                Ứng tuyển
              </Link>
            ) : (
              <span className="btn btn-sm btn-light disabled text-muted border">Đóng</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
