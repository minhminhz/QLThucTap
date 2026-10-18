import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import TaskCard from '../../components/TaskCard';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import { TaskFileBadge, formatFileSize } from '../../components/TaskFileViewer';

export default function InternDashboard() {
  const [internship, setInternship] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/intern/internship'),
      api.get('/intern/tasks'),
    ])
      .then(([iRes, tRes]) => {
        setInternship(iRes.data.data);
        setTasks(tRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    await api.patch(`/intern/tasks/${taskId}/status`, { status });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const handleOpenSubmit = (task) => {
    setSubmitModal(task);
    setSubmitContent(task.submission_content || '');
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitContent.trim() && !selectedFile && !submitModal?.submission_file_url) {
      alert('Vui lòng nhập mô tả kết quả hoặc đính kèm tệp kết quả (PDF, Word, Ảnh, Zip)!');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'SUBMITTED');
      if (submitContent) {
        formData.append('submission_content', submitContent.trim());
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await api.patch(`/intern/tasks/${submitModal.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedTask = res.data.data;
      setTasks((prev) =>
        prev.map((t) => (t.id === submitModal.id ? updatedTask : t))
      );
      setSubmitModal(null);
      setSubmitContent('');
      setSelectedFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải dữ liệu thực tập..." />
        </div>
      </DashboardLayout>
    );
  }

  const todoTasks = tasks.filter((t) => ['TODO', 'IN_PROGRESS'].includes(t.status));
  const doneTasks = tasks.filter((t) => ['SUBMITTED', 'COMPLETED', 'REJECTED'].includes(t.status));

  return (
    <DashboardLayout>
      <PageHeader
        title="Bảng điều khiển Thực tập sinh"
        subtitle="Theo dõi lộ trình kỳ thực tập, công việc được giao và phản hồi từ Mentor hướng dẫn"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Thực tập sinh' },
        ]}
      />

      {/* Internship info card */}
      {internship ? (
        <div className="card shadow-sm border mb-4">
          <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
            <h5 className="card-title fw-bold text-dark mb-0">
              <i className="bi bi-info-circle text-primary me-2"></i>
              Thông tin kỳ thực tập
            </h5>
            <StatusBadge status={internship.status} />
          </div>

          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Vị trí thực tập</span>
                <strong className="text-dark small">{internship.position_title}</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Cơ sở trực thuộc</span>
                <strong className="text-dark small">
                  <i className="bi bi-geo-alt text-primary me-1"></i>
                  {internship.branch_name}
                </strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Mentor hướng dẫn</span>
                <strong className="text-dark small">
                  <i className="bi bi-person-badge text-primary me-1"></i>
                  {internship.mentor_name || 'Đang cập nhật'}
                </strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Thời gian thực tập</span>
                <strong className="text-dark small">
                  {new Date(internship.start_date).toLocaleDateString('vi-VN')} –{' '}
                  {new Date(internship.end_date).toLocaleDateString('vi-VN')}
                </strong>
              </div>
            </div>

            {internship.final_review && (
              <div className="alert alert-info mt-3 mb-0 small">
                <div className="fw-bold mb-1">
                  <i className="bi bi-award-fill me-1"></i>
                  Đánh giá tổng kết từ Mentor:
                </div>
                <div>{internship.final_review}</div>
                {internship.rating && (
                  <div className="fw-bold mt-1 text-primary">
                    ⭐ Điểm đánh giá: {internship.rating}/10
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>Bạn chưa có thông tin kỳ thực tập. Vui lòng liên hệ phòng Nhân sự (HR) để được phân bổ.</div>
        </div>
      )}

      {/* Todo Tasks */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-list-task text-primary me-2"></i>
            Nhiệm vụ cần thực hiện ({todoTasks.length})
          </h5>
        </div>

        {todoTasks.length === 0 ? (
          <div className="card border bg-light p-4 text-center">
            <div className="text-success fs-3 mb-2">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h6 className="fw-bold text-dark mb-1">Tuyệt vời! Bạn đã hoàn thành tất cả công việc</h6>
            <p className="text-muted small mb-0">Hiện tại không có nhiệm vụ mới nào cần xử lý.</p>
          </div>
        ) : (
          <div className="row g-3">
            {todoTasks.map((t) => (
              <div key={t.id} className="col-12 col-md-6">
                <TaskCard
                  task={t}
                  role="INTERN"
                  onStatusChange={handleStatusChange}
                  onSubmit={(task) => handleOpenSubmit(task)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed / Submitted tasks */}
      {doneTasks.length > 0 && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-check2-all text-success me-2"></i>
              Đã nộp & Lịch sử nhiệm vụ ({doneTasks.length})
            </h5>
          </div>

          <div className="row g-3">
            {doneTasks.map((t) => (
              <div key={t.id} className="col-12 col-md-6">
                <TaskCard
                  task={t}
                  role="INTERN"
                  onStatusChange={handleStatusChange}
                  onSubmit={(task) => handleOpenSubmit(task)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Task Modal */}
      {submitModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-primary text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                    Nộp kết quả thực hiện công việc
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSubmitModal(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    {/* Task Info Summary */}
                    <div className="bg-light p-3 rounded border mb-3">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark mb-0">{submitModal.title}</h6>
                        <span className="badge bg-secondary">
                          Hạn chót: {new Date(submitModal.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                        {submitModal.description}
                      </p>
                      {submitModal.attachment_file_url && (
                        <div className="mt-2 pt-2 border-top">
                          <TaskFileBadge
                            fileUrl={submitModal.attachment_file_url}
                            fileName={submitModal.attachment_file_name}
                            label="Đề bài / Tài liệu hướng dẫn đính kèm từ Mentor:"
                            variant="attachment"
                          />
                        </div>
                      )}
                    </div>

                    {/* Previously submitted file if re-submitting */}
                    {submitModal.submission_file_url && !selectedFile && (
                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-1">
                          Tệp bạn đã nộp trước đó (nếu không chọn tệp mới sẽ giữ nguyên):
                        </div>
                        <TaskFileBadge
                          fileUrl={submitModal.submission_file_url}
                          fileName={submitModal.submission_file_name}
                          fileSize={submitModal.submission_file_size}
                          label="Tệp đã tải lên trước đó:"
                          variant="submission"
                        />
                      </div>
                    )}

                    {/* Upload File Input */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                        <span>
                          <i className="bi bi-paperclip text-primary me-1"></i>
                          Tải lên tệp bài nộp trực tiếp (PDF, DOC, ZIP, PNG, v.v.):
                        </span>
                        <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                          Tối đa 50MB
                        </span>
                      </label>

                      <div
                        className="border border-2 border-dashed rounded p-3 text-center bg-white"
                        style={{ borderColor: selectedFile ? '#0d6efd' : '#dee2e6' }}
                      >
                        {selectedFile ? (
                          <div className="d-flex align-items-center justify-content-between bg-light p-2.5 rounded border">
                            <div className="d-flex align-items-center gap-2 text-truncate pe-2">
                              <i className="bi bi-file-earmark-check-fill text-success fs-3"></i>
                              <div className="text-start text-truncate">
                                <div className="fw-semibold text-dark text-truncate small">
                                  {selectedFile.name}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {formatFileSize(selectedFile.size)}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="btn btn-sm btn-outline-danger py-1 px-2"
                              title="Hủy chọn tệp này"
                            >
                              <i className="bi bi-trash3 me-1"></i> Đổi tệp
                            </button>
                          </div>
                        ) : (
                          <div>
                            <i className="bi bi-cloud-arrow-up display-6 text-primary mb-2 d-block"></i>
                            <div className="fw-semibold text-dark small mb-1">
                              Kéo thả tệp vào đây hoặc nhấn để chọn tệp từ máy tính
                            </div>
                            <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                              Hỗ trợ: Báo cáo PDF, tài liệu Word (.docx), hình ảnh phân tích (.png, .jpg), tệp nén mã nguồn (.zip, .rar), bảng tính Excel.
                            </p>
                            <label className="btn btn-sm btn-outline-primary px-3 cursor-pointer">
                              <i className="bi bi-folder2-open me-1"></i> Chọn tệp tải lên
                              <input
                                type="file"
                                className="d-none"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.zip,.rar,.7z,.tar,.gz,.txt,.csv,.json,.md"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setSelectedFile(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description & Link Textarea */}
                    <div className="mb-2">
                      <label className="form-label small fw-semibold" htmlFor="submit_content">
                        Nội dung mô tả / Link mã nguồn (Git, Google Drive, Swagger...):
                      </label>
                      <textarea
                        id="submit_content"
                        rows={4}
                        value={submitContent}
                        onChange={(e) => setSubmitContent(e.target.value)}
                        placeholder="Mô tả tóm tắt giải pháp, ghi chú hướng dẫn chạy dự án, đính kèm link GitHub repo hoặc tài liệu liên quan..."
                        className="form-control"
                      />
                      <div className="form-text small">
                        * Bạn có thể nộp bằng cách đính kèm tệp, hoặc điền mô tả/link Git, hoặc kết hợp cả hai.
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer bg-light py-2 px-3">
                    <button
                      type="button"
                      onClick={() => setSubmitModal(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-sm btn-primary fw-semibold px-4"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Đang tải lên & nộp bài...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill me-1"></i> Xác nhận nộp bài
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}
    </DashboardLayout>
  );
}
