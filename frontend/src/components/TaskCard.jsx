import StatusBadge from './StatusBadge';

export default function TaskCard({ task, role, onStatusChange, onSubmit, onReview }) {
  const isExpired = task.deadline && new Date(task.deadline) < new Date();

  return (
    <div className="card h-100 border shadow-sm">
      <div className="card-body d-flex flex-column justify-content-between p-3 p-md-4">
        <div>
          {/* Header */}
          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
            <h6 className="card-title fw-bold text-dark mb-0">{task.title}</h6>
            <StatusBadge status={task.status} />
          </div>

          {/* Description */}
          <p
            className="card-text text-muted small mb-3"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {task.description}
          </p>

          {/* Meta Info */}
          <div className="d-flex flex-wrap align-items-center gap-3 small text-muted mb-3">
            <span className={isExpired && task.status !== 'COMPLETED' ? 'text-danger fw-semibold' : ''}>
              <i className="bi bi-calendar3 me-1"></i>
              Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}
            </span>
            {role === 'MENTOR' && (
              <span>
                <i className="bi bi-person me-1"></i>
                {task.intern_name}
              </span>
            )}
            {role === 'INTERN' && (
              <span>
                <i className="bi bi-person-badge me-1"></i>
                {task.mentor_name}
              </span>
            )}
          </div>
        </div>

        {/* Action & Feedback Area */}
        <div className="pt-2 border-top">
          {/* Intern actions */}
          {role === 'INTERN' && task.status === 'TODO' && (
            <button
              onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
              className="btn btn-sm btn-info text-white w-100"
            >
              <i className="bi bi-play-circle me-1"></i> Bắt đầu làm
            </button>
          )}

          {role === 'INTERN' && task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onSubmit(task)}
              className="btn btn-sm btn-primary w-100"
            >
              <i className="bi bi-upload me-1"></i> Nộp kết quả
            </button>
          )}

          {role === 'INTERN' && task.status === 'REJECTED' && (
            <div className="alert alert-danger p-2 mb-2 small">
              <div className="fw-semibold mb-1">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Nhận xét của Mentor:
              </div>
              <div>{task.feedback}</div>
              <button
                onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                className="btn btn-sm btn-warning text-dark w-100 mt-2"
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Làm lại
              </button>
            </div>
          )}

          {task.status === 'COMPLETED' && task.feedback && (
            <div className="alert alert-success p-2 mb-0 small">
              <div className="fw-semibold mb-1">
                <i className="bi bi-check-circle-fill me-1"></i>
                Đánh giá của Mentor:
              </div>
              <div>{task.feedback}</div>
            </div>
          )}

          {/* Mentor review action */}
          {role === 'MENTOR' && task.status === 'SUBMITTED' && (
            <div className="d-flex gap-2">
              <button
                onClick={() => onReview(task, 'COMPLETED')}
                className="btn btn-sm btn-success flex-fill"
              >
                <i className="bi bi-check-lg me-1"></i> Duyệt
              </button>
              <button
                onClick={() => onReview(task, 'REJECTED')}
                className="btn btn-sm btn-outline-danger flex-fill"
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Yêu cầu sửa
              </button>
            </div>
          )}

          {/* Submission content preview */}
          {task.submission_content && (
            <div className="bg-light p-2 rounded border mt-2 small">
              <div className="text-muted fw-semibold mb-1">Kết quả đã nộp:</div>
              <div className="text-dark text-break">{task.submission_content}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
