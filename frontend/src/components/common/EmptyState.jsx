import React from 'react';

export default function EmptyState({
  icon = 'bi-inbox',
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có mục nào để hiển thị trong danh sách này.',
  actionText,
  onAction,
  actionLink,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-light text-muted rounded-circle mb-3"
        style={{ width: '64px', height: '64px', fontSize: '2rem' }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '420px' }}>
        {description}
      </p>
      {actionLink && (
        <a href={actionLink} className="btn btn-sm btn-primary px-3">
          {actionText}
        </a>
      )}
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-sm btn-primary px-3">
          {actionText}
        </button>
      )}
    </div>
  );
}
