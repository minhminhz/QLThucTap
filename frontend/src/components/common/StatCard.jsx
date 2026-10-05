import React from 'react';

export default function StatCard({ title, value, icon, variant = 'primary', description, trend }) {
  // Variant mapping to Bootstrap subtle colors
  const variantMap = {
    primary: { bg: 'bg-primary-subtle', text: 'text-primary', border: 'border-primary-subtle' },
    success: { bg: 'bg-success-subtle', text: 'text-success', border: 'border-success-subtle' },
    warning: { bg: 'bg-warning-subtle', text: 'text-warning-emphasis', border: 'border-warning-subtle' },
    danger: { bg: 'bg-danger-subtle', text: 'text-danger', border: 'border-danger-subtle' },
    info: { bg: 'bg-info-subtle', text: 'text-info-emphasis', border: 'border-info-subtle' },
    secondary: { bg: 'bg-secondary-subtle', text: 'text-secondary-emphasis', border: 'border-secondary-subtle' },
  };

  const style = variantMap[variant] || variantMap.primary;

  return (
    <div className="card h-100 border">
      <div className="card-body p-3 p-xl-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="text-muted fw-semibold small text-uppercase tracking-wider">{title}</span>
          <div
            className={`d-flex align-items-center justify-content-center rounded-3 ${style.bg} ${style.text} ${style.border}`}
            style={{ width: '42px', height: '42px', fontSize: '1.25rem' }}
          >
            {typeof icon === 'string' && icon.startsWith('bi-') ? (
              <i className={`bi ${icon}`}></i>
            ) : (
              icon
            )}
          </div>
        </div>
        <div className="d-flex align-items-baseline gap-2">
          <h2 className="display-6 fw-bold mb-0 text-dark">{value}</h2>
          {trend && (
            <span className={`badge ${trend > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} small`}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
        </div>
        {description && <p className="text-muted small mt-2 mb-0">{description}</p>}
      </div>
    </div>
  );
}
