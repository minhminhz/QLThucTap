import React from 'react';

// Status badge mapping for all enums in the VYMI Tech system
const STATUS_MAP = {
  // Application
  PENDING:    { label: 'Chờ duyệt',      bg: 'bg-warning-subtle',   text: 'text-warning-emphasis', border: 'border-warning-subtle', icon: 'bi-clock-history' },
  REVIEWING:  { label: 'Đang xem xét',   bg: 'bg-info-subtle',      text: 'text-info-emphasis',    border: 'border-info-subtle',    icon: 'bi-search' },
  APPROVED:   { label: 'Được chấp nhận', bg: 'bg-success-subtle',   text: 'text-success',          border: 'border-success-subtle', icon: 'bi-check-circle-fill' },
  REJECTED:   { label: 'Bị từ chối',     bg: 'bg-danger-subtle',    text: 'text-danger',           border: 'border-danger-subtle',  icon: 'bi-x-circle-fill' },

  // Internship
  UPCOMING:   { label: 'Sắp bắt đầu',   bg: 'bg-primary-subtle',   text: 'text-primary',          border: 'border-primary-subtle', icon: 'bi-calendar-event' },
  IN_PROGRESS:{ label: 'Đang thực tập', bg: 'bg-info-subtle',      text: 'text-info-emphasis',    border: 'border-info-subtle',    icon: 'bi-arrow-repeat' },
  COMPLETED:  { label: 'Hoàn thành',    bg: 'bg-success-subtle',   text: 'text-success',          border: 'border-success-subtle', icon: 'bi-award-fill' },
  CANCELLED:  { label: 'Đã hủy',        bg: 'bg-secondary-subtle', text: 'text-secondary-emphasis',border: 'border-secondary-subtle', icon: 'bi-slash-circle' },

  // Task
  TODO:       { label: 'Chưa làm',       bg: 'bg-secondary-subtle', text: 'text-secondary-emphasis',border: 'border-secondary-subtle', icon: 'bi-circle' },
  SUBMITTED:  { label: 'Đã nộp bài',     bg: 'bg-primary-subtle',   text: 'text-primary',          border: 'border-primary-subtle', icon: 'bi-file-earmark-check' },

  // Position / Branch / User
  OPEN:       { label: 'Đang tuyển',     bg: 'bg-success-subtle',   text: 'text-success',          border: 'border-success-subtle', icon: 'bi-record-circle' },
  CLOSED:     { label: 'Đã đóng',        bg: 'bg-danger-subtle',    text: 'text-danger',           border: 'border-danger-subtle',  icon: 'bi-dash-circle' },
  ACTIVE:     { label: 'Hoạt động',      bg: 'bg-success-subtle',   text: 'text-success',          border: 'border-success-subtle', icon: 'bi-check-circle' },
  INACTIVE:   { label: 'Ngừng hoạt động',bg: 'bg-secondary-subtle', text: 'text-secondary-emphasis',border: 'border-secondary-subtle', icon: 'bi-pause-circle' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || {
    label: status || 'Không rõ',
    bg: 'bg-light',
    text: 'text-muted',
    border: 'border-secondary-subtle',
    icon: 'bi-question-circle',
  };

  return (
    <span
      className={`badge ${config.bg} ${config.text} border ${config.border} d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill fw-medium`}
      style={{ fontSize: '0.75rem' }}
    >
      <i className={`bi ${config.icon}`} style={{ fontSize: '0.75rem' }}></i>
      {config.label}
    </span>
  );
}
