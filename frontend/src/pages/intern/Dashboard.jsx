import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import TaskCard from '../../components/TaskCard';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';

export default function InternDashboard() {
  const [internship, setInternship] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/intern/tasks/${submitModal.id}/status`, {
        status: 'SUBMITTED',
        submission_content: submitContent,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === submitModal.id
            ? { ...t, status: 'SUBMITTED', submission_content: submitContent }
            : t
        )
      );
      setSubmitModal(null);
      setSubmitContent('');
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
                  onSubmit={(task) => setSubmitModal(task)}
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
                  onSubmit={(task) => setSubmitModal(task)}
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
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">Nộp kết quả công việc</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSubmitModal(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <p className="text-muted small mb-3">
                      Nhiệm vụ: <strong className="text-dark">{submitModal.title}</strong>
                    </p>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="submit_content">
                        Mô tả kết quả thực hiện <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="submit_content"
                        rows={5}
                        value={submitContent}
                        onChange={(e) => setSubmitContent(e.target.value)}
                        required
                        placeholder="Mô tả chi tiết những gì bạn đã hoàn thành, đính kèm link GitHub, Google Drive hoặc tài liệu liên quan..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
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
                          Đang gửi...
                        </>
                      ) : (
                        'Xác nhận nộp bài'
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
