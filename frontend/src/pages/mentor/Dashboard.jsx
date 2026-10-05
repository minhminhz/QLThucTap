import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import CvViewerModal from '../../components/common/CvViewerModal';

// ─── Helper: tính % tiến trình thời gian ────────────────────────────────────
function calcProgress(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const total = Math.max(1, end - start);
  const passed = Math.max(0, now - start);
  const percent = Math.min(100, Math.max(0, Math.round((passed / total) * 100)));
  const daysLeft = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.round(total / (1000 * 60 * 60 * 24));
  return { percent, daysLeft, totalDays };
}

function progressColor(percent, daysLeft) {
  if (daysLeft === 0) return 'bg-secondary';
  if (daysLeft <= 14) return 'bg-danger';
  if (percent >= 80) return 'bg-warning';
  return 'bg-primary';
}

// ─── BatchCard: Thẻ một đợt/vị trí thực tập ────────────────────────────────
function BatchCard({ batch, tasks, onViewCv, onAssignTask, onEvaluate }) {
  const [expanded, setExpanded] = useState(true);

  const hasDate = batch.start_date && batch.end_date;
  const { percent, daysLeft, totalDays } = hasDate
    ? calcProgress(batch.start_date, batch.end_date)
    : { percent: 0, daysLeft: null, totalDays: null };
  const barColor = hasDate ? progressColor(percent, daysLeft) : 'bg-secondary';

  const startFmt = hasDate ? new Date(batch.start_date).toLocaleDateString('vi-VN') : '—';
  const endFmt = hasDate ? new Date(batch.end_date).toLocaleDateString('vi-VN') : '—';

  const pendingCount = tasks.filter(
    (t) => t.status === 'SUBMITTED' && batch.interns.some((i) => i.id === t.intern_id)
  ).length;

  return (
    <div className="card shadow-sm border border-primary border-opacity-25 mb-4 overflow-hidden">
      {/* Header */}
      <div
        className="card-header bg-primary bg-gradient text-white px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-circle flex-shrink-0"
            style={{ width: 42, height: 42 }}
          >
            <i className="bi bi-briefcase-fill fs-5 text-white" />
          </div>
          <div>
            <h5 className="fw-bold mb-0 text-white lh-sm">{batch.position_title}</h5>
            <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
              {batch.branch_name && (
                <span className="badge bg-white bg-opacity-25 text-white border border-white border-opacity-25 small fw-normal">
                  <i className="bi bi-geo-alt me-1" />
                  {batch.branch_name}
                </span>
              )}
              {batch.internship_duration && (
                <span className="badge bg-white bg-opacity-25 text-white border border-white border-opacity-25 small fw-normal">
                  <i className="bi bi-clock me-1" />
                  {batch.internship_duration}
                </span>
              )}
              <span className="badge bg-white text-primary fw-semibold small">
                <i className="bi bi-people me-1" />
                {batch.interns.length} thực tập sinh
              </span>
              {pendingCount > 0 && (
                <span className="badge bg-warning text-dark fw-semibold small">
                  <i className="bi bi-exclamation-circle me-1" />
                  {pendingCount} bài chờ chấm
                </span>
              )}
            </div>
          </div>
        </div>
        <i className={`bi bi-chevron-${expanded ? 'up' : 'down'} text-white fs-5`} />
      </div>

      {expanded && (
        <div className="card-body p-0">
          {/* Thanh tiến trình thời gian */}
          <div className="px-4 pt-3 pb-2 bg-light border-bottom">
            <div className="d-flex align-items-center justify-content-between mb-1 small">
              <span className="text-muted fw-semibold">
                <i className="bi bi-calendar-range me-1 text-primary" />
                Thời gian kỳ thực tập:
              </span>
              <span className="text-dark fw-bold">
                {startFmt}
                {hasDate && <span className="text-muted mx-1">→</span>}
                {endFmt}
              </span>
            </div>
            <div className="progress mb-1" style={{ height: '10px', borderRadius: 6 }}>
              <div
                className={`progress-bar ${barColor} progress-bar-striped progress-bar-animated`}
                role="progressbar"
                style={{ width: `${percent}%`, transition: 'width 0.6s ease' }}
                aria-valuenow={percent}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <div className="d-flex align-items-center justify-content-between small text-muted">
              <span>
                Đã qua: <strong className="text-dark">{percent}%</strong>
                {totalDays ? ` (${Math.round((percent / 100) * totalDays)} / ${totalDays} ngày)` : ''}
              </span>
              {hasDate ? (
                daysLeft > 0 ? (
                  <span className={daysLeft <= 14 ? 'text-danger fw-bold' : ''}>
                    <i className="bi bi-hourglass-bottom me-1" />
                    Còn lại <strong>{daysLeft} ngày</strong>
                  </span>
                ) : (
                  <span className="text-secondary fw-semibold">
                    <i className="bi bi-check2-all me-1" />
                    Đã kết thúc kỳ thực tập
                  </span>
                )
              ) : (
                <span className="fst-italic">Chưa xác định thời gian</span>
              )}
            </div>
          </div>

          {/* Danh sách TTS */}
          {batch.interns.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="bi-person-x"
                title="Chưa có thực tập sinh"
                description="Vị trí này chưa có thực tập sinh nào được phân công."
              />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4" style={{ minWidth: 180 }}>Thực tập sinh</th>
                    <th scope="col" style={{ minWidth: 120 }}>Trạng thái</th>
                    <th scope="col" style={{ minWidth: 160 }}>Tiến độ nhiệm vụ</th>
                    <th scope="col" style={{ minWidth: 100 }}>Đánh giá</th>
                    <th scope="col" className="text-end pe-4" style={{ minWidth: 220 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.interns.map((intern) => {
                    const done = intern.completed_tasks || 0;
                    const total = intern.total_tasks || 0;
                    const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const internPending = tasks.filter(
                      (t) => t.intern_id === intern.id && t.status === 'SUBMITTED'
                    ).length;
                    return (
                      <tr key={intern.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                              style={{
                                width: 38, height: 38, fontSize: '0.9rem',
                                background: `hsl(${(intern.id * 47) % 360}, 65%, 52%)`,
                              }}
                            >
                              {intern.intern_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-dark d-block lh-sm">
                                {intern.intern_name}
                                {internPending > 0 && (
                                  <span className="badge bg-warning text-dark ms-1 small fw-semibold">
                                    {internPending} bài
                                  </span>
                                )}
                              </strong>
                              <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                {intern.intern_email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td><StatusBadge status={intern.status} /></td>
                        <td>
                          <div className="small text-muted mb-1">
                            Hoàn thành: <strong className="text-dark">{done}/{total}</strong> task
                          </div>
                          <div className="progress" style={{ height: 6, borderRadius: 4 }}>
                            <div
                              className={`progress-bar ${taskPct === 100 ? 'bg-success' : 'bg-info'}`}
                              style={{ width: `${taskPct}%` }}
                            />
                          </div>
                        </td>
                        <td>
                          {intern.rating ? (
                            <span className="badge bg-warning text-dark border fw-bold">
                              ⭐ {intern.rating}/10
                            </span>
                          ) : (
                            <span className="text-muted fst-italic" style={{ fontSize: '0.8rem' }}>
                              Chưa đánh giá
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                            {(intern.cv_id || intern.cv_file_path) && (
                              <button
                                type="button"
                                onClick={() => onViewCv(intern)}
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                title="Xem CV"
                              >
                                <i className="bi bi-file-earmark-pdf-fill" /> CV
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onAssignTask(intern)}
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            >
                              <i className="bi bi-list-task" /> Tasks
                            </button>
                            <button
                              type="button"
                              onClick={() => onEvaluate(intern)}
                              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                            >
                              <i className="bi bi-award" /> Đánh giá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MentorDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    active_interns: 0,
    pending_reviews: 0,
    active_tasks: 0,
    completed_tasks: 0,
    batches: [],
  });
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ intern_id: '', title: '', description: '', deadline: '' });
  const [reviewModal, setReviewModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [viewingCv, setViewingCv] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [sRes, iRes, tRes] = await Promise.all([
        api.get('/mentor/dashboard'),
        api.get('/mentor/interns'),
        api.get('/mentor/tasks'),
      ]);
      setStats(sRes.data.data || {});
      setInterns(iRes.data.data || []);
      setTasks(tRes.data.data || []);
    } catch (err) {
      console.error('Error fetching mentor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mentor/tasks', newTaskForm);
      await fetchDashboardData();
      setNewTaskForm({ intern_id: '', title: '', description: '', deadline: '' });
      setShowTaskForm(false);
      alert('Đã giao công việc mới thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo công việc.');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    try {
      await api.patch(`/mentor/tasks/${reviewModal.task.id}/review`, {
        status: reviewModal.verdict,
        feedback,
      });
      await fetchDashboardData();
      setReviewModal(null);
      setFeedback('');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi đánh giá bài tập.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải dữ liệu Tổng quan Mentor..." />
        </div>
      </DashboardLayout>
    );
  }

  const pendingReview = tasks.filter((t) => t.status === 'SUBMITTED');

  // ── Nhóm TTS theo position_id (hỗ trợ nhiều đợt/vị trí) ──────────────────
  const batchesMap = {};
  interns.forEach((intern) => {
    const key = intern.position_id || intern.position_title || 'other';
    if (!batchesMap[key]) {
      batchesMap[key] = {
        position_id: intern.position_id,
        position_title: intern.position_title || 'Vị trí thực tập',
        branch_name: intern.branch_name || '',
        internship_duration: intern.internship_duration || '',
        start_date: intern.start_date || null,
        end_date: intern.end_date || null,
        interns: [],
      };
    }
    // Lấy ngày sớm nhất / muộn nhất trong đợt
    if (intern.start_date) {
      if (!batchesMap[key].start_date || new Date(intern.start_date) < new Date(batchesMap[key].start_date)) {
        batchesMap[key].start_date = intern.start_date;
      }
    }
    if (intern.end_date) {
      if (!batchesMap[key].end_date || new Date(intern.end_date) > new Date(batchesMap[key].end_date)) {
        batchesMap[key].end_date = intern.end_date;
      }
    }
    batchesMap[key].interns.push(intern);
  });

  // Bổ sung thông tin từ API batches nếu có (start_date/end_date/duration từ backend)
  const apiBatches = stats.batches || [];
  apiBatches.forEach((b) => {
    const key = b.position_id;
    if (batchesMap[key]) {
      if (!batchesMap[key].start_date && b.start_date) batchesMap[key].start_date = b.start_date;
      if (!batchesMap[key].end_date && b.end_date) batchesMap[key].end_date = b.end_date;
      if (!batchesMap[key].internship_duration && b.internship_duration)
        batchesMap[key].internship_duration = b.internship_duration;
    }
  });

  const batches = Object.values(batchesMap);

  return (
    <DashboardLayout>
      <PageHeader
        title="Bảng điều khiển Mentor"
        subtitle="Tổng quan kỳ thực tập, nhiệm vụ hướng dẫn và theo dõi tiến độ thực tập sinh"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Mentor' },
        ]}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => navigate('/mentor/tasks')}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          >
            <i className="bi bi-kanban" />
            <span>Bảng giao việc</span>
          </button>
          <button
            onClick={() => {
              setNewTaskForm({
                intern_id: interns[0]?.id ? String(interns[0].id) : '',
                title: '',
                description: '',
                deadline: '',
              });
              setShowTaskForm(true);
            }}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="bi bi-plus-lg" />
            <span>Giao việc mới</span>
          </button>
        </div>
      </PageHeader>

      {/* ── Stats Cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Thực tập sinh phụ trách" value={interns.length} icon="bi-people" variant="primary" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Bài nộp chờ chấm" value={pendingReview.length} icon="bi-hourglass-split" variant="warning" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Công việc đang làm" value={stats.active_tasks || 0} icon="bi-arrow-repeat" variant="info" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard title="Nhiệm vụ đã hoàn thành" value={stats.completed_tasks || 0} icon="bi-check-circle" variant="success" />
        </div>
      </div>

      {/* ── Cảnh báo bài chờ chấm ── */}
      {pendingReview.length > 0 && (
        <div className="alert alert-warning d-flex align-items-center gap-3 mb-4 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill fs-4 text-warning flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Có {pendingReview.length} bài tập đang chờ bạn chấm duyệt!</strong>
            <span className="text-muted ms-2 small">Hãy xem xét và phản hồi để thực tập sinh tiếp tục.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mentor/tasks')}
            className="btn btn-sm btn-warning fw-semibold text-dark flex-shrink-0"
          >
            <i className="bi bi-clipboard-check me-1" />
            Chấm ngay →
          </button>
        </div>
      )}

      {/* ═══════ ĐỢT THỰC TẬP THEO VỊ TRÍ TUYỂN DỤNG ═══════ */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-collection-fill text-primary fs-5" />
        <h5 className="fw-bold text-dark mb-0">
          Đợt thực tập đang phụ trách
          {batches.length > 1 && (
            <span className="badge bg-primary ms-2 fw-semibold" style={{ fontSize: '0.75rem' }}>
              {batches.length} đợt
            </span>
          )}
        </h5>
        <Link to="/mentor/interns" className="ms-auto btn btn-sm btn-outline-primary">
          <i className="bi bi-people me-1" />Quản lý TTS chi tiết →
        </Link>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          icon="bi-calendar2-x"
          title="Chưa có đợt thực tập nào"
          description="Hiện tại bạn chưa được phân công phụ trách thực tập sinh nào. HR sẽ thông báo khi có đợt mới."
        />
      ) : (
        batches.map((batch) => (
          <BatchCard
            key={batch.position_id || batch.position_title}
            batch={batch}
            tasks={tasks}
            onViewCv={(intern) =>
              setViewingCv({
                cv_id: intern.cv_id,
                cv_original_name: intern.cv_original_name || `CV_${intern.intern_name}.pdf`,
                cv_file_path: intern.cv_file_path,
                applicant_name: intern.intern_name,
                position_title: intern.position_title,
              })
            }
            onAssignTask={(intern) => navigate(`/mentor/tasks?intern_id=${intern.id}`)}
            onEvaluate={() => navigate('/mentor/interns')}
          />
        ))
      )}

      {/* ═══════ MODAL GIAO VIỆC MỚI ═══════ */}
      {showTaskForm && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-plus-circle text-primary me-2" />
                    Giao công việc mới cho Thực tập sinh
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowTaskForm(false)} aria-label="Close" />
                </div>
                <form onSubmit={handleCreateTask}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="dash_intern">
                        Chọn Thực tập sinh <span className="text-danger">*</span>
                      </label>
                      <select
                        id="dash_intern"
                        value={newTaskForm.intern_id}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, intern_id: e.target.value }))}
                        required
                        className="form-select"
                      >
                        <option value="">-- Chọn thực tập sinh --</option>
                        {batches.map((b) => (
                          <optgroup key={b.position_id} label={b.position_title}>
                            {b.interns.map((i) => (
                              <option key={i.id} value={i.id}>{i.intern_name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="dash_task_title">
                        Tiêu đề công việc <span className="text-danger">*</span>
                      </label>
                      <input
                        id="dash_task_title"
                        type="text"
                        value={newTaskForm.title}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, title: e.target.value }))}
                        required
                        placeholder="Ví dụ: Thiết kế API và viết Unit Test cho module Auth"
                        className="form-control"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="dash_deadline">
                        Hạn chót (Deadline) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="dash_deadline"
                        type="date"
                        value={newTaskForm.deadline}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, deadline: e.target.value }))}
                        required
                        className="form-control"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="dash_task_desc">
                        Mô tả chi tiết và yêu cầu
                      </label>
                      <textarea
                        id="dash_task_desc"
                        rows={4}
                        value={newTaskForm.description}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Mô tả tiêu chuẩn mã nguồn, tài liệu tham khảo..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setShowTaskForm(false)} className="btn btn-sm btn-outline-secondary">
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4">
                      Tạo &amp; Giao việc
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ═══════ MODAL CHẤM DUYỆT BÀI NỘP ═══════ */}
      {reviewModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-clipboard-check text-primary me-2" />
                    Chấm duyệt: {reviewModal.task.title}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setReviewModal(null)} aria-label="Close" />
                </div>
                <form onSubmit={handleReview}>
                  <div className="modal-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3 bg-light p-3 rounded border small">
                      <div>
                        <span className="text-muted d-block">Thực tập sinh:</span>
                        <strong className="text-dark">{reviewModal.task.intern_name}</strong>
                      </div>
                      <div className="text-end">
                        <span className="text-muted d-block">Hạn chót:</span>
                        <strong>{new Date(reviewModal.task.deadline).toLocaleDateString('vi-VN')}</strong>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-primary">Kết quả nộp bài:</label>
                      <div className="p-3 bg-light rounded border small text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                        {reviewModal.task.submission_content || '(Không có nội dung mô tả kèm theo)'}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="dash_feedback">
                        Nhận xét &amp; Góp ý <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="dash_feedback"
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        placeholder={reviewModal.verdict === 'COMPLETED' ? 'Khen ngợi điểm tốt, các lưu ý tiếp theo...' : 'Chỉ rõ các điểm cần sửa đổi...'}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setReviewModal(null)} className="btn btn-sm btn-outline-secondary">
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-sm fw-semibold px-4 ${reviewModal.verdict === 'COMPLETED' ? 'btn-success' : 'btn-danger'}`}
                    >
                      Xác nhận kết quả
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* Modal xem CV */}
      <CvViewerModal isOpen={!!viewingCv} onClose={() => setViewingCv(null)} cv={viewingCv} />
    </DashboardLayout>
  );
}
