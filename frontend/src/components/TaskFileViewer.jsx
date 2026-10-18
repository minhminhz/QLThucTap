import { useState } from 'react';

/**
 * Format bytes to readable string (KB, MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Helper to inspect file type from URL or file name
 */
export function getFileInfo(url, fileName) {
  const target = (fileName || url || '').toLowerCase();
  const extMatch = target.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
  const ext = extMatch ? `.${extMatch[1]}` : '';

  const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'].includes(ext);
  const isPdf = ext === '.pdf';
  const isWord = ['.doc', '.docx'].includes(ext);
  const isExcel = ['.xls', '.xlsx', '.csv'].includes(ext);
  const isPpt = ['.ppt', '.pptx'].includes(ext);
  const isArchive = ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext);
  const isText = ['.txt', '.json', '.md', '.log'].includes(ext);

  let icon = 'bi-file-earmark';
  let color = 'text-secondary';
  let badgeText = ext.toUpperCase().replace('.', '') || 'FILE';
  let badgeBg = 'bg-secondary';
  let canDirectPreview = isPdf || isImage || isText;

  if (isPdf) {
    icon = 'bi-file-earmark-pdf-fill';
    color = 'text-danger';
    badgeText = 'PDF';
    badgeBg = 'bg-danger';
  } else if (isImage) {
    icon = 'bi-file-earmark-image-fill';
    color = 'text-info';
    badgeText = ext.toUpperCase().replace('.', '') || 'ẢNH';
    badgeBg = 'bg-info';
  } else if (isWord) {
    icon = 'bi-file-earmark-word-fill';
    color = 'text-primary';
    badgeText = 'WORD';
    badgeBg = 'bg-primary';
  } else if (isExcel) {
    icon = 'bi-file-earmark-excel-fill';
    color = 'text-success';
    badgeText = 'EXCEL';
    badgeBg = 'bg-success';
  } else if (isPpt) {
    icon = 'bi-file-earmark-ppt-fill';
    color = 'text-warning';
    badgeText = 'POWERPOINT';
    badgeBg = 'bg-warning text-dark';
  } else if (isArchive) {
    icon = 'bi-file-earmark-zip-fill';
    color = 'text-warning text-dark';
    badgeText = 'NÉN ZIP/RAR';
    badgeBg = 'bg-dark';
  } else if (isText) {
    icon = 'bi-file-earmark-text-fill';
    color = 'text-secondary';
    badgeText = 'TEXT';
    badgeBg = 'bg-secondary';
  }

  // Display friendly name if not provided
  let displayName = fileName;
  if (!displayName && url) {
    const parts = url.split('/');
    displayName = decodeURIComponent(parts[parts.length - 1] || 'Tệp đính kèm');
  }

  return {
    ext,
    isImage,
    isPdf,
    isWord,
    isExcel,
    isPpt,
    isArchive,
    isText,
    canDirectPreview,
    icon,
    color,
    badgeText,
    badgeBg,
    displayName,
  };
}

/**
 * Modal to preview files (PDF, images, text, and fallback for others)
 */
export function FilePreviewModal({ url, fileName, fileSize, onClose }) {
  const [zoom, setZoom] = useState(1);
  if (!url) return null;

  const info = getFileInfo(url, fileName);
  const fullUrl = url.startsWith('http') ? url : url;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1060 }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered"
          role="document"
          style={{ maxWidth: '92vw', margin: '1.75rem auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
            {/* Modal Header */}
            <div className="modal-header bg-dark text-white py-2 px-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 text-truncate pe-3">
                <i className={`bi ${info.icon} fs-4 ${info.color}`}></i>
                <div className="text-truncate">
                  <div className="fw-semibold text-truncate small" title={info.displayName}>
                    {info.displayName}
                  </div>
                  <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                    <span className={`badge ${info.badgeBg}`}>{info.badgeText}</span>
                    {fileSize && (
                      <span className="text-light opacity-75">{formatFileSize(fileSize)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex align-items-center gap-2">
                {info.isImage && (
                  <div className="btn-group btn-group-sm me-2">
                    <button
                      type="button"
                      className="btn btn-outline-light py-1 px-2"
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                      title="Thu nhỏ"
                    >
                      <i className="bi bi-zoom-out"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-light py-1 px-2"
                      onClick={() => setZoom(1)}
                      title="Kích thước gốc"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-light py-1 px-2"
                      onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                      title="Phóng to"
                    >
                      <i className="bi bi-zoom-in"></i>
                    </button>
                  </div>
                )}

                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-light py-1 px-2.5"
                  title="Mở tab mới"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  <span className="d-none d-sm-inline">Mở tab mới</span>
                </a>

                <a
                  href={fullUrl}
                  download={info.displayName}
                  className="btn btn-sm btn-primary py-1 px-2.5"
                  title="Tải tệp về máy"
                >
                  <i className="bi bi-download me-1"></i>
                  <span className="d-none d-sm-inline">Tải về</span>
                </a>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-white border-0 py-1 px-2"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg fs-5"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body p-0 d-flex align-items-center justify-content-center bg-dark"
              style={{ minHeight: '65vh', maxHeight: '80vh', overflow: 'auto' }}
            >
              {/* PDF Preview */}
              {info.isPdf && (
                <iframe
                  src={`${fullUrl}#toolbar=1&navpanes=1`}
                  className="w-100 h-100"
                  style={{ minHeight: '75vh', border: 'none' }}
                  title={info.displayName}
                />
              )}

              {/* Image Preview */}
              {info.isImage && (
                <div
                  className="p-3 w-100 h-100 d-flex align-items-center justify-content-center overflow-auto"
                  style={{ minHeight: '65vh' }}
                >
                  <img
                    src={fullUrl}
                    alt={info.displayName}
                    style={{
                      transform: `scale(${zoom})`,
                      transition: 'transform 0.2s ease',
                      maxWidth: '100%',
                      maxHeight: '74vh',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    }}
                  />
                </div>
              )}

              {/* Plain text / code preview */}
              {info.isText && (
                <iframe
                  src={fullUrl}
                  className="w-100 h-100 bg-white"
                  style={{ minHeight: '75vh', border: 'none', padding: '16px' }}
                  title={info.displayName}
                />
              )}

              {/* Non-direct preview fallback (Word, Excel, ZIP, etc.) */}
              {!info.canDirectPreview && (
                <div className="text-center p-5 text-white bg-dark">
                  <div className="mb-3">
                    <i className={`bi ${info.icon} display-1 ${info.color}`}></i>
                  </div>
                  <h5 className="fw-bold mb-2">{info.displayName}</h5>
                  <p className="text-light opacity-75 small mb-4" style={{ maxWidth: '520px', margin: '0 auto' }}>
                    {info.isArchive
                      ? 'Đây là tệp nén (ZIP/RAR) chứa dữ liệu/mã nguồn dự án. Trình duyệt không hỗ trợ xem trực tiếp, vui lòng tải tệp về máy tính để giải nén.'
                      : info.isWord || info.isExcel || info.isPpt
                      ? 'Đây là tài liệu văn phòng định dạng Office. Bạn có thể tải trực tiếp về máy để mở bằng Word/Excel hoặc mở qua trình đọc ngoài.'
                      : 'Định dạng tệp này không hỗ trợ xem trước trực tiếp trên trình duyệt. Vui lòng tải về máy để xem.'}
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <a
                      href={fullUrl}
                      download={info.displayName}
                      className="btn btn-primary fw-semibold px-4 py-2"
                    >
                      <i className="bi bi-download me-2"></i> Tải file về máy tính
                    </a>
                    {(info.isWord || info.isExcel || info.isPpt) && (
                      <a
                        href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                          window.location.origin + fullUrl
                        )}&embedded=true`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-light px-3 py-2"
                      >
                        <i className="bi bi-google me-1"></i> Xem qua Google Docs
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1055 }}></div>
    </>
  );
}

/**
 * Compact file badge with click-to-preview or download
 */
export function TaskFileBadge({
  fileUrl,
  fileName,
  fileSize,
  label = 'Tệp đính kèm:',
  variant = 'submission', // 'submission' | 'attachment'
}) {
  const [showModal, setShowModal] = useState(false);

  if (!fileUrl) return null;

  const info = getFileInfo(fileUrl, fileName);
  const isAttachment = variant === 'attachment';

  return (
    <>
      <div
        className={`p-2.5 rounded border d-flex align-items-center justify-content-between gap-2 ${
          isAttachment ? 'bg-light-subtle border-primary-subtle' : 'bg-light border'
        }`}
      >
        <div className="d-flex align-items-center gap-2.5 text-truncate" style={{ minWidth: 0 }}>
          <div
            className="d-flex align-items-center justify-content-center rounded"
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: '#f1f5f9',
              flexShrink: 0,
            }}
          >
            <i className={`bi ${info.icon} fs-4 ${info.color}`}></i>
          </div>
          <div className="text-truncate">
            {label && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</div>}
            <div
              className="fw-semibold text-dark text-truncate small"
              title={info.displayName}
              style={{ lineHeight: 1.25 }}
            >
              {info.displayName}
            </div>
            <div className="d-flex align-items-center gap-2 mt-0.5" style={{ fontSize: '0.7rem' }}>
              <span className={`badge ${info.badgeBg}`} style={{ fontSize: '0.65rem' }}>
                {info.badgeText}
              </span>
              {fileSize && (
                <span className="text-muted">{formatFileSize(fileSize)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
          {info.canDirectPreview ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn btn-sm btn-outline-primary py-1 px-2.5 d-flex align-items-center gap-1"
              title="Xem trước tài liệu"
            >
              <i className="bi bi-eye"></i>
              <span className="small d-none d-md-inline">Xem trước</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1"
              title="Thông tin tệp"
            >
              <i className="bi bi-info-circle"></i>
            </button>
          )}

          <a
            href={fileUrl}
            download={info.displayName}
            className="btn btn-sm btn-light border py-1 px-2.5 text-secondary d-flex align-items-center gap-1 hover-shadow"
            title="Tải tệp về máy"
          >
            <i className="bi bi-download"></i>
            <span className="small d-none d-sm-inline">Tải về</span>
          </a>
        </div>
      </div>

      {showModal && (
        <FilePreviewModal
          url={fileUrl}
          fileName={info.displayName}
          fileSize={fileSize}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

/**
 * Inline embedded preview component: ideal for Review Modal
 * Directly renders PDF or Image inside the review screen so mentors don't have to download!
 */
export function TaskFileInlineEmbed({ fileUrl, fileName, fileSize, maxHeight = '360px' }) {
  const [fullscreenModal, setFullscreenModal] = useState(false);

  if (!fileUrl) return null;
  const info = getFileInfo(fileUrl, fileName);

  return (
    <div className="border rounded overflow-hidden bg-white mt-2">
      {/* Mini top bar */}
      <div className="bg-light px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2 text-truncate pe-2">
          <i className={`bi ${info.icon} fs-5 ${info.color}`}></i>
          <span className="fw-semibold text-dark small text-truncate" title={info.displayName}>
            {info.displayName}
          </span>
          <span className={`badge ${info.badgeBg}`} style={{ fontSize: '0.65rem' }}>
            {info.badgeText}
          </span>
          {fileSize && (
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
              ({formatFileSize(fileSize)})
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-1.5">
          {info.canDirectPreview && (
            <button
              type="button"
              onClick={() => setFullscreenModal(true)}
              className="btn btn-sm btn-outline-primary py-0.5 px-2"
              title="Xem toàn màn hình"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-arrows-fullscreen me-1"></i> Phóng to
            </button>
          )}
          <a
            href={fileUrl}
            download={info.displayName}
            className="btn btn-sm btn-primary py-0.5 px-2"
            title="Tải tệp về máy"
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-download me-1"></i> Tải về
          </a>
        </div>
      </div>

      {/* Content preview */}
      <div
        className="d-flex align-items-center justify-content-center bg-dark-subtle"
        style={{ minHeight: '180px', maxHeight, overflow: 'auto' }}
      >
        {info.isPdf ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-100"
            style={{ height: maxHeight, border: 'none' }}
            title={info.displayName}
          />
        ) : info.isImage ? (
          <div className="p-2 text-center w-100">
            <img
              src={fileUrl}
              alt={info.displayName}
              style={{
                maxHeight: `calc(${maxHeight} - 20px)`,
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setFullscreenModal(true)}
              title="Bấm để phóng to xem chi tiết"
            />
          </div>
        ) : (
          <div className="p-4 text-center text-secondary bg-light w-100">
            <i className={`bi ${info.icon} display-4 ${info.color} d-block mb-2`}></i>
            <h6 className="fw-bold text-dark mb-1">{info.displayName}</h6>
            <p className="small text-muted mb-3">
              {info.isArchive
                ? 'Tệp nén dữ liệu (.ZIP/.RAR). Vui lòng bấm Tải về để giải nén xem kết quả.'
                : 'Tài liệu Office / File đính kèm. Bấm Tải về để mở trong phần mềm chuyên dụng.'}
            </p>
            <a
              href={fileUrl}
              download={info.displayName}
              className="btn btn-sm btn-primary px-3 fw-semibold"
            >
              <i className="bi bi-download me-1"></i> Tải tệp xuống ngay
            </a>
          </div>
        )}
      </div>

      {fullscreenModal && (
        <FilePreviewModal
          url={fileUrl}
          fileName={info.displayName}
          fileSize={fileSize}
          onClose={() => setFullscreenModal(false)}
        />
      )}
    </div>
  );
}
