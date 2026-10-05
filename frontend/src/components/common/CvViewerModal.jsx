import React, { useEffect, useState } from 'react';

export default function CvViewerModal({ isOpen, onClose, cv }) {
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    setIframeLoading(true);
  }, [cv]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cv) return null;

  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const cvId = cv.cv_id || cv.id;
  const fileName = cv.cv_original_name || cv.original_name || cv.file_name || 'Ho_so_CV.pdf';
  const fileExt = (fileName.split('.').pop() || '').toLowerCase();
  const isPdf = fileExt === 'pdf';
  const isWord = fileExt === 'doc' || fileExt === 'docx';

  // Build secure streaming URL or fallback to static path
  let viewUrl = '';
  let downloadUrl = '';

  if (cvId) {
    viewUrl = `/api/cvs/${cvId}/view?token=${encodeURIComponent(token || '')}`;
    downloadUrl = `/api/cvs/${cvId}/view?token=${encodeURIComponent(token || '')}&download=true`;
  } else if (cv.cv_file_path || cv.file_path || cv.cv_path) {
    const rawPath = cv.cv_file_path || cv.file_path || cv.cv_path;
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    viewUrl = cleanPath;
    downloadUrl = cleanPath;
  }

  const handleOpenNewTab = () => {
    if (viewUrl) {
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1060,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '92vw', height: '92vh', margin: '4vh auto' }}>
        <div className="modal-content h-100 border-0 shadow-lg rounded-4 overflow-hidden d-flex flex-column bg-white">
          {/* Modal Header */}
          <div className="modal-header bg-light border-bottom px-4 py-3 flex-shrink-0 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3 overflow-hidden">
              <div
                className={`rounded-3 p-2 d-flex align-items-center justify-content-center text-white ${
                  isPdf ? 'bg-danger' : isWord ? 'bg-primary' : 'bg-secondary'
                }`}
                style={{ width: '42px', height: '42px' }}
              >
                <i className={`bi ${isPdf ? 'bi-file-earmark-pdf-fill' : isWord ? 'bi-file-earmark-word-fill' : 'bi-file-earmark-text-fill'} fs-4`}></i>
              </div>
              <div className="text-truncate">
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0 fw-bold text-dark text-truncate" title={fileName}>
                    {fileName}
                  </h6>
                  <span className={`badge ${isPdf ? 'bg-danger-subtle text-danger' : isWord ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'} border small text-uppercase`}>
                    {fileExt || 'Tài liệu'}
                  </span>
                </div>
                {(cv.applicant_name || cv.position_title) && (
                  <p className="mb-0 text-muted small text-truncate">
                    {cv.applicant_name && <span className="fw-semibold text-secondary me-2"><i className="bi bi-person me-1"></i>{cv.applicant_name}</span>}
                    {cv.position_title && <span><i className="bi bi-briefcase me-1"></i>{cv.position_title}</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
                title="Mở toàn màn hình trong tab mới"
              >
                <i className="bi bi-box-arrow-up-right"></i>
                <span className="d-none d-sm-inline">Mở tab mới</span>
              </button>

              <a
                href={downloadUrl}
                download={fileName}
                className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
                title="Tải file về máy tính"
              >
                <i className="bi bi-download"></i>
                <span className="d-none d-sm-inline">Tải xuống</span>
              </a>

              <button
                type="button"
                className="btn-close ms-2"
                onClick={onClose}
                aria-label="Đóng"
              ></button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-0 flex-grow-1 position-relative bg-light d-flex flex-column overflow-hidden">
            {isPdf ? (
              <div className="w-100 h-100 position-relative">
                {iframeLoading && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light z-1">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Đang tải tài liệu...</span>
                    </div>
                    <span className="text-muted small">Đang chuẩn bị hiển thị hồ sơ CV...</span>
                  </div>
                )}
                <iframe
                  src={viewUrl}
                  title={`CV - ${fileName}`}
                  className="w-100 h-100 border-0"
                  onLoad={() => setIframeLoading(false)}
                />
              </div>
            ) : isWord ? (
              <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center my-auto">
                <div className="bg-primary-subtle text-primary rounded-circle p-4 mb-4 shadow-sm" style={{ width: '96px', height: '96px' }}>
                  <i className="bi bi-file-earmark-word-fill" style={{ fontSize: '48px' }}></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">{fileName}</h4>
                <p className="text-muted mb-4" style={{ maxWidth: '480px' }}>
                  Định dạng <strong>Microsoft Word (.docx / .doc)</strong> không hỗ trợ xem trực tiếp nguyên bản trong trình duyệt. Vui lòng tải file về máy tính hoặc mở trong ứng dụng Word để xem đầy đủ nội dung và định dạng.
                </p>
                <div className="d-flex gap-3">
                  <a
                    href={downloadUrl}
                    download={fileName}
                    className="btn btn-primary btn-lg px-4 shadow d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-cloud-arrow-down-fill fs-5"></i>
                    Tải xuống file Word
                  </a>
                  <button
                    type="button"
                    onClick={handleOpenNewTab}
                    className="btn btn-outline-secondary btn-lg px-3"
                  >
                    <i className="bi bi-arrow-up-right me-1"></i> Mở liên kết trực tiếp
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center my-auto">
                <i className="bi bi-file-earmark-arrow-down text-secondary mb-3" style={{ fontSize: '64px' }}></i>
                <h5 className="fw-bold text-dark">{fileName}</h5>
                <p className="text-muted mb-4">Nhấp vào nút bên dưới để tải và xem tài liệu này.</p>
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="btn btn-primary px-4 shadow"
                >
                  <i className="bi bi-download me-2"></i> Tải xuống tài liệu
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
