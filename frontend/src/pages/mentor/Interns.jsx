import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import CvViewerModal from '../../components/common/CvViewerModal';

export default function MentorInterns() {
  const navigate = useNavigate();

  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [viewingCv, setViewingCv] = useState(null);
  const [evaluatingIntern, setEvaluatingIntern] = useState(null);
  const [evalData, setEvalData] = useState({ final_review: '', rating: '9' });
  const [quickTaskIntern, setQuickTaskIntern] = useState(null);
  const [quickTaskForm, setQuickTaskForm] = useState({ title: '', description: '', deadline: '' });

  const fetchData = async () => {
    try {
      const [iRes, tRes] = await Promise.all([
        api.get('/mentor/interns'),
        api.get('/mentor/tasks'),
      ]);
      setInterns(iRes.data.data || []);
      setTasks(tRes.data.data || []);
    } catch (err) {
      console.error('Error fetching mentor interns data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!evaluatingIntern) return;
    try {
      await api.patch(`/mentor/interns/${evaluatingIntern.id}/final-review`, evalData);
      await fetchData();
      setEvaluatingIntern(null);
      setEvalData({ final_review: '', rating: '9' });
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đánh giá.');
    }
  };

  const handleQuickCreateTask = async (e) => {
    e.preventDefault();
    if (!quickTaskIntern) return;
    try {
      await api.post('/mentor/tasks', {
        intern_id: quickTaskIntern.id,
        title: quickTaskForm.title,
        description: quickTaskForm.description,
        deadline: quickTaskForm.deadline,
      });
      await fetchData();
      setQuickTaskIntern(null);
      setQuickTaskForm({ title: '', description: '', deadline: '' });
      alert(`Đã giao việc thành công cho ${quickTaskIntern.intern_name}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi giao việc.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách Thực tập sinh phụ trách..." />
        </div>
      </DashboardLayout>
    );
  }

  const evaluatedCount = interns.filter((i) => i.final_review || i.rating).length;
  const inProgressCount = interns.filter((i) => i.status === 'IN_PROGRESS').length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Quản lý & Đánh giá Thực tập sinh (Interns Evaluation)"
        subtitle="Theo dõi chi tiết năng lực, tiến độ công việc và đánh giá kết quả thực tập của từng học viên"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Mentor', link: '/mentor' },
          { label: 'Thực tập sinh phụ trách' },
        ]}
      >
        <button
          onClick={() => navigate('/mentor/tasks')}
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 shadow-sm"
        >
          <i className="bi bi-list-task"></i>
          <span>Xem tất cả công việc</span>
        </button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Thực tập sinh phụ trách"
            value={interns.length}
            icon="bi-people-fill"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đang trong kỳ thực tập"
            value={inProgressCount}
            icon="bi-person-check-fill"
            variant="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đã đánh giá tổng kết"
            value={`${evaluatedCount} / ${interns.length}`}
            icon="bi-award-fill"
            variant="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tổng nhiệm vụ đã giao"
            value={tasks.length}
            icon="bi-clipboard-data"
            variant="warning"
          />
        </div>
      </div>

      {/* Interns Showcase Grid: Spacious, Full-Width Cards */}
      {interns.length === 0 ? (
        <EmptyState
          icon="bi-person-x"
          title="Chưa có thực tập sinh nào được phân công"
          description="Hiện tại bộ phận Nhân sự (HR) chưa chỉ định thực tập sinh nào cho bạn phụ trách."
        />
      ) : (
        <div className="row g-4">
          {interns.map((intern) => {
            // Calculate task stats for this intern
            const internTasks = tasks.filter((t) => t.intern_id === intern.id);
            const totalTasks = internTasks.length;
            const completed = internTasks.filter((t) => t.status === 'COMPLETED').length;
            const submitted = internTasks.filter((t) => t.status === 'SUBMITTED').length;
            const inProgress = internTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
            const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

            // Internship duration progress
            const startDate = intern.start_date ? new Date(intern.start_date) : null;
            const endDate = intern.end_date ? new Date(intern.end_date) : null;
            const now = new Date();
            let daysRemaining = null;
            let timeProgress = 0;

            if (startDate && endDate) {
              const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
              const passedDays = Math.max(0, Math.round((now - startDate) / (1000 * 60 * 60 * 24)));
              daysRemaining = Math.max(0, Math.round((endDate - now) / (1000 * 60 * 60 * 24)));
              timeProgress = Math.min(100, Math.max(0, Math.round((passedDays / totalDays) * 100)));
            }

            return (
              <div key={intern.id} className="col-12 col-xl-6">
                <div className="card border shadow-sm h-100 bg-white hover-shadow transition-all">
                  {/* Card Header with identification info */}
                  <div className="card-header bg-white py-3 px-4 border-bottom">
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                          style={{ width: '52px', height: '52px', fontSize: '1.35rem' }}
                        >
                          {intern.intern_name?.[0]?.toUpperCase() || 'I'}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h5 className="fw-bold text-dark mb-0">{intern.intern_name}</h5>
                            <StatusBadge status={intern.status} />
                          </div>
                          <div className="text-primary fw-medium small mt-0.5">
                            {intern.position_title}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {intern.branch_name && (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5">
                            <i className="bi bi-geo-alt-fill me-1" />
                            {intern.branch_name}
                          </span>
                        )}
                        {(intern.cv_id || intern.cv_file_path) && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingCv({
                                cv_id: intern.cv_id,
                                cv_original_name: intern.cv_original_name || `CV_${intern.intern_name}.pdf`,
                                cv_file_path: intern.cv_file_path,
                                applicant_name: intern.intern_name,
                                position_title: intern.position_title,
                              })
                            }
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 shadow-xs"
                            title="Xem hồ sơ CV"
                          >
                            <i className="bi bi-file-earmark-pdf-fill" /> Xem CV
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      {/* Contact Info Pills */}
                      <div className="row g-2 mb-3 small">
                        <div className="col-12 col-sm-6">
                          <div className="bg-light p-2.5 rounded border d-flex align-items-center gap-2">
                            <i className="bi bi-envelope-fill text-muted" />
                            <a
                              href={`mailto:${intern.intern_email}`}
                              className="text-dark text-truncate text-decoration-none"
                            >
                              {intern.intern_email}
                            </a>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6">
                          <div className="bg-light p-2.5 rounded border d-flex align-items-center gap-2">
                            <i className="bi bi-telephone-fill text-muted" />
                            <a
                              href={`tel:${intern.intern_phone}`}
                              className="text-dark text-truncate text-decoration-none"
                            >
                              {intern.intern_phone || 'Chưa cập nhật SĐT'}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Internship Duration & Progress */}
                      {startDate && endDate && (
                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="d-flex align-items-center justify-content-between small mb-1">
                            <span className="text-muted fw-semibold">
                              <i className="bi bi-calendar-range text-primary me-1" />
                              Thời gian thực tập:
                            </span>
                            <span className="text-dark fw-bold">
                              {startDate.toLocaleDateString('vi-VN')} → {endDate.toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="progress mt-2 mb-1" style={{ height: '6px' }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: `${timeProgress}%` }}
                              aria-valuenow={timeProgress}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                          <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                            <span>Tiến độ kỳ: {timeProgress}%</span>
                            <span className={daysRemaining <= 14 ? 'text-danger fw-bold' : ''}>
                              {daysRemaining > 0 ? `Còn lại ${daysRemaining} ngày` : 'Đã đến hạn kết thúc'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Task Stats & Progress Bar */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="small fw-semibold text-dark">
                            <i className="bi bi-list-task text-primary me-1" />
                            Tiến độ hoàn thành công việc:
                          </span>
                          <span className="badge bg-success-subtle text-success fw-bold">
                            {completionRate}% hoàn thành
                          </span>
                        </div>
                        <div className="progress mb-2" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${completionRate}%` }}
                            aria-valuenow={completionRate}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>

                        {/* Metric Tiles */}
                        <div className="row g-2 text-center small">
                          <div className="col-3">
                            <div className="bg-light p-2 rounded border">
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Tổng task</div>
                              <strong className="fs-6 text-dark">{totalTasks}</strong>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="bg-success-subtle p-2 rounded border border-success-subtle text-success">
                              <div style={{ fontSize: '0.7rem' }}>Đã xong</div>
                              <strong className="fs-6">{completed}</strong>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="bg-warning-subtle p-2 rounded border border-warning-subtle text-warning-emphasis">
                              <div style={{ fontSize: '0.7rem' }}>Chờ duyệt</div>
                              <strong className="fs-6">{submitted}</strong>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="bg-info-subtle p-2 rounded border border-info-subtle text-info-emphasis">
                              <div style={{ fontSize: '0.7rem' }}>Đang làm</div>
                              <strong className="fs-6">{inProgress}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Evaluation Section */}
                      <div className="p-3 bg-white rounded-3 border mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-1.5">
                            <i className="bi bi-award-fill text-warning fs-5" />
                            <strong className="small text-dark">Đánh giá của Mentor:</strong>
                          </div>
                          {intern.rating ? (
                            <span className="badge bg-warning text-dark fw-bold px-2.5 py-1">
                              ⭐ {intern.rating} / 10 điểm
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border small">
                              Chưa có điểm đánh giá
                            </span>
                          )}
                        </div>

                        {intern.final_review ? (
                          <div className="p-2.5 bg-light rounded text-secondary small border" style={{ whiteSpace: 'pre-wrap' }}>
                            "{intern.final_review}"
                          </div>
                        ) : (
                          <p className="text-muted small mb-0 fst-italic">
                            Chưa có nhận xét tổng kết. Bạn có thể bấm nút "Đánh giá" bên dưới để ghi nhận xét năng lực cho thực tập sinh.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Bar */}
                    <div className="pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEvaluatingIntern(intern);
                            setEvalData({
                              final_review: intern.final_review || '',
                              rating: intern.rating ? String(intern.rating) : '9',
                            });
                          }}
                          className={`btn btn-sm d-inline-flex align-items-center gap-1.5 ${
                            intern.final_review ? 'btn-outline-primary' : 'btn-primary'
                          } shadow-xs`}
                        >
                          <i className="bi bi-award" />
                          <span>{intern.final_review ? 'Sửa đánh giá' : 'Đánh giá tổng kết'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setQuickTaskIntern(intern);
                            setQuickTaskForm({ title: '', description: '', deadline: '' });
                          }}
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 shadow-xs"
                        >
                          <i className="bi bi-plus-circle" />
                          <span>Giao việc mới</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/mentor/tasks?intern_id=${intern.id}`)}
                        className="btn btn-sm btn-link text-decoration-none text-primary fw-semibold p-0"
                      >
                        Quản lý tasks ({totalTasks}) →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL ĐÁNH GIÁ TỔNG KẾT ================= */}
      {evaluatingIntern && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-award-fill text-warning me-2"></i>
                    Đánh giá Thực tập sinh: {evaluatingIntern.intern_name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEvaluatingIntern(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleSaveEvaluation}>
                  <div className="modal-body p-4">
                    <div className="bg-light p-3 rounded border mb-3 small">
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted d-block">Vị trí:</span>
                          <strong className="text-dark">{evaluatingIntern.position_title}</strong>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Cơ sở:</span>
                          <strong className="text-dark">{evaluatingIntern.branch_name || 'Hà Nội'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="eval_rating">
                        Điểm số đánh giá tổng kết (Thang điểm 1 - 10) <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center gap-3">
                        <input
                          id="eval_rating"
                          type="number"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalData.rating}
                          onChange={(e) => setEvalData({ ...evalData, rating: e.target.value })}
                          required
                          className="form-control"
                          style={{ maxWidth: '120px' }}
                        />
                        <span className="small text-muted">
                          (Ví dụ: 8.5: Khá tốt | 9.0: Xuất sắc | 10: Vượt kỳ vọng)
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="eval_review">
                        Nhận xét quá trình thực tập & năng lực chuyên môn <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="eval_review"
                        rows={5}
                        value={evalData.final_review}
                        onChange={(e) => setEvalData({ ...evalData, final_review: e.target.value })}
                        required
                        placeholder="Đánh giá chi tiết về:&#10;1. Thái độ học hỏi, tinh thần kỷ luật và tuân thủ quy trình.&#10;2. Khả năng tiếp thu kiến thức và tư duy giải quyết vấn đề.&#10;3. Chất lượng mã nguồn/sản phẩm đầu ra và sự chủ động trong dự án.&#10;4. Đề xuất giữ lại làm nhân viên chính thức hoặc hướng phát triển tiếp theo..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setEvaluatingIntern(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4">
                      Lưu kết quả đánh giá
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* ================= MODAL GIAO VIỆC NHANH CHO 1 INTERN ================= */}
      {quickTaskIntern && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-plus-circle text-primary me-2"></i>
                    Giao việc cho: {quickTaskIntern.intern_name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setQuickTaskIntern(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleQuickCreateTask}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="quick_title">
                        Tiêu đề công việc <span className="text-danger">*</span>
                      </label>
                      <input
                        id="quick_title"
                        type="text"
                        value={quickTaskForm.title}
                        onChange={(e) => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                        required
                        placeholder="Ví dụ: Triển khai kiểm thử Unit Test cho API Auth"
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="quick_deadline">
                        Hạn chót hoàn thành (Deadline) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="quick_deadline"
                        type="date"
                        value={quickTaskForm.deadline}
                        onChange={(e) => setQuickTaskForm({ ...quickTaskForm, deadline: e.target.value })}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="quick_desc">
                        Mô tả chi tiết và hướng dẫn
                      </label>
                      <textarea
                        id="quick_desc"
                        rows={4}
                        value={quickTaskForm.description}
                        onChange={(e) => setQuickTaskForm({ ...quickTaskForm, description: e.target.value })}
                        placeholder="Mô tả các yêu cầu kỹ thuật và kết quả cần đạt..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setQuickTaskIntern(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4">
                      Tạo & Giao việc
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Modal xem CV */}
      <CvViewerModal
        isOpen={!!viewingCv}
        onClose={() => setViewingCv(null)}
        cv={viewingCv}
      />
    </DashboardLayout>
  );
}
