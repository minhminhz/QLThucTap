import React from 'react';

export default function PageHeader({ title, subtitle, children, action, breadcrumbs = [] }) {
  const rightContent = action || children;

  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small text-muted">
              {breadcrumbs.map((b, idx) => (
                <li
                  key={idx}
                  className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active text-primary fw-medium' : ''}`}
                >
                  {b.link ? <a href={b.link} className="text-decoration-none text-muted">{b.label}</a> : b.label}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="h3 mb-1 text-dark fw-bold">{title}</h1>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
      {rightContent && (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {rightContent}
        </div>
      )}
    </div>
  );
}
