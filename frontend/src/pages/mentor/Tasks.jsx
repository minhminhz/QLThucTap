import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

export default function MentorTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialInternId = searchParams.get('intern_id') || 'all';

  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [selectedIntern, setSelectedIntern] = useState(initialInternId);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ intern_id: '', title: '', description: '', deadline: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [taskDetailModal, setTaskDetailModal] = useState(null);

  const fetchTasksAndInterns = async () => {
    try {
      const [tRes, iRes] = await Promise.all([
        api.get('/mentor/tasks'),
        api.get('/mentor/interns'),
      ]);
      setTasks(tRes.data.data || []);
      setInterns(iRes.data.data || []);
    } catch (err) {
      console.error('Error fetching mentor tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndInterns();
  }, []);

  useEffect(() => {
    if (searchParams.get('intern_id')) {
      setSelectedIntern(searchParams.get('intern_id'));
    }
  }, [searchParams]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mentor/tasks', newTaskForm);
      await fetchTasksAndInterns();
      setShowCreateModal(false);
      setNewTaskForm({ intern_id: '', title: '', description: '', deadline: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo công việc.');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await api.put(`/mentor/tasks/${editingTask.id}`, {
        title: editingTask.title,
        description: editingTask.description,
        deadline: editingTask.deadline,
        status: editingTask.status,
      });
      await fetchTasksAndInterns();
      setEditingTask(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật công việc.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) return;
    try {
      await api.delete(`/mentor/tasks/${taskId}`);
      await fetchTasksAndInterns();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa công việc.');
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
      await fetchTasksAndInterns();
      setReviewModal(null);
      setFeedback('');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi đánh giá bài tập.');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (selectedIntern !== 'all' && String(task.intern_id) !== String(selectedIntern)) return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchIntern = task.intern_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchIntern) return false;
    }
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REJECTED');
  const submittedTasks = filteredTasks.filter((t) => t.status === 'SUBMITTED');
  const completedTasks = filteredTasks.filter((t) => t.status === 'COMPLETED');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách công việc giao cho thực tập sinh..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Quản lý Công việc & Giao việc (Task Management)"
        subtitle="Theo dõi tiến độ, phân công nhiệm vụ và chấm duyệt bài nộp của Thực tập sinh"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Mentor', link: '/mentor' },
          { label: 'Quản lý công việc' },
        ]}
      >
        <button
          onClick={() => {
            setNewTaskForm({
              intern_id: selectedIntern !== 'all' ? selectedIntern : (interns[0]?.id ? String(interns[0].id) : ''),
              title: '',
              description: '',
              deadline: '',
            });
            setShowCreateModal(true);
          }}
          className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 shadow-sm px-3"
        >
          <i className="bi bi-plus-lg"></i>
          <span>Giao việc mới</span>
        </button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tổng công việc"
            value={tasks.length}
            icon="bi-list-check"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đang thực hiện"
            value={tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length}
            icon="bi-arrow-repeat"
            variant="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Bài chờ chấm duyệt"
            value={tasks.filter((t) => t.status === 'SUBMITTED').length}
            icon="bi-hourglass-split"
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đã duyệt hoàn thành"
            value={tasks.filter((t) => t.status === 'COMPLETED').length}
            icon="bi-check-circle"
            variant="success"
          />
        </div>
      </div>

      {/* Control bar: Filters, Search, View switch */}
      <div className="card shadow-xs border mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center justify-content-between">
            {/* Filter by Intern */}
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1 fw-semibold">
                <i className="bi bi-person me-1" />
                Lọc theo Thực tập sinh
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedIntern}
                onChange={(e) => {
                  setSelectedIntern(e.target.value);
                  if (e.target.value === 'all') {
                    searchParams.delete('intern_id');
                    setSearchParams(searchParams);
                  } else {
                    setSearchParams({ intern_id: e.target.value });
                  }
                }}
              >
                <option value="all">-- Tất cả thực tập sinh ({interns.length}) --</option>
                {interns.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.intern_name} ({i.position_title || 'TTS'})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1 fw-semibold">
                <i className="bi bi-flag me-1" />
                Trạng thái công việc
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="TODO">Chưa bắt đầu (TODO)</option>
                <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                <option value="SUBMITTED">Đã nộp bài chờ chấm (SUBMITTED)</option>
                <option value="COMPLETED">Đã duyệt hoàn thành (COMPLETED)</option>
                <option value="REJECTED">Yêu cầu sửa lại (REJECTED)</option>
              </select>
            </div>

            {/* Search query */}
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1 fw-semibold">
                <i className="bi bi-search me-1" />
                Tìm kiếm công việc
              </label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tiêu đề, từ khóa, tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="col-12 col-md-3 d-flex justify-content-md-end align-items-end pt-md-3">
              <div className="btn-group btn-group-sm w-100 w-md-auto" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  title="Xem dạng bảng Kanban"
                >
                  <i className="bi bi-kanban me-1" /> Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  title="Xem dạng danh sách bảng"
                >
                  <i className="bi bi-table me-1" /> Danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="bi-clipboard-x"
          title="Không tìm thấy công việc nào"
          description={
            searchQuery || selectedIntern !== 'all' || statusFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các công việc khác.'
              : 'Bạn chưa giao công việc nào cho thực tập sinh. Hãy bắt đầu giao nhiệm vụ đầu tiên!'
          }
          actionText="Giao việc mới"
          onAction={() => setShowCreateModal(true)}
        />
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="row g-3">
          {/* Cột 1: TODO */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 bg-light border shadow-xs">
              <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-circle p-1">
                    <i className="bi bi-circle" />
                  </span>
                  <span className="fw-bold text-dark small">Chưa làm (TODO)</span>
                </div>
                <span className="badge bg-light text-muted border">{todoTasks.length}</span>
              </div>
              <div className="card-body p-2.5 d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '70vh' }}>
                {todoTasks.length === 0 ? (
                  <div className="text-center py-4 text-muted small fst-italic">Không có việc nào</div>
                ) : (
                  todoTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onViewDetail={() => setTaskDetailModal(task)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cột 2: IN_PROGRESS */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 bg-light border shadow-xs">
              <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-info-subtle text-info-emphasis rounded-circle p-1">
                    <i className="bi bi-arrow-repeat" />
                  </span>
                  <span className="fw-bold text-dark small">Đang làm (IN PROGRESS)</span>
                </div>
                <span className="badge bg-info text-white border">{inProgressTasks.length}</span>
              </div>
              <div className="card-body p-2.5 d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '70vh' }}>
                {inProgressTasks.length === 0 ? (
                  <div className="text-center py-4 text-muted small fst-italic">Không có việc nào</div>
                ) : (
                  inProgressTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onViewDetail={() => setTaskDetailModal(task)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cột 3: SUBMITTED (Chờ chấm bài) */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 bg-light border border-warning border-opacity-50 shadow-xs">
              <div className="card-header bg-warning-subtle py-2.5 px-3 border-bottom border-warning-subtle d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark rounded-circle p-1">
                    <i className="bi bi-hourglass-split" />
                  </span>
                  <span className="fw-bold text-dark small">Chờ chấm duyệt (SUBMITTED)</span>
                </div>
                <span className="badge bg-warning text-dark fw-bold">{submittedTasks.length}</span>
              </div>
              <div className="card-body p-2.5 d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '70vh' }}>
                {submittedTasks.length === 0 ? (
                  <div className="text-center py-4 text-muted small fst-italic">Không có bài chờ chấm</div>
                ) : (
                  submittedTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      isSubmitted={true}
                      onReview={(verdict) => {
                        setReviewModal({ task, verdict });
                        setFeedback('');
                      }}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onViewDetail={() => setTaskDetailModal(task)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cột 4: COMPLETED */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card h-100 bg-light border shadow-xs">
              <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success rounded-circle p-1">
                    <i className="bi bi-check-circle-fill" />
                  </span>
                  <span className="fw-bold text-dark small">Hoàn thành (COMPLETED)</span>
                </div>
                <span className="badge bg-success text-white border">{completedTasks.length}</span>
              </div>
              <div className="card-body p-2.5 d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '70vh' }}>
                {completedTasks.length === 0 ? (
                  <div className="text-center py-4 text-muted small fst-italic">Chưa có việc hoàn thành</div>
                ) : (
                  completedTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onViewDetail={() => setTaskDetailModal(task)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="card shadow-sm border">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-4" style={{ minWidth: '220px' }}>
                    Công việc
                  </th>
                  <th scope="col">Thực tập sinh</th>
                  <th scope="col">Hạn chót</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" style={{ minWidth: '180px' }}>
                    Kết quả nộp / Nhận xét
                  </th>
                  <th scope="col" className="text-end pe-4" style={{ minWidth: '150px' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isExpired = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED';
                  return (
                    <tr key={task.id}>
                      <td className="ps-4">
                        <strong
                          role="button"
                          onClick={() => setTaskDetailModal(task)}
                          className="text-dark d-block hover-primary text-decoration-underline-hover"
                          title="Bấm để xem chi tiết"
                        >
                          {task.title}
                        </strong>
                        <span
                          className="text-muted small text-truncate d-block"
                          style={{ maxWidth: '280px' }}
                        >
                          {task.description}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-person me-1 text-primary" />
                          {task.intern_name}
                        </span>
                      </td>
                      <td className="small">
                        <span className={isExpired ? 'text-danger fw-bold' : 'text-muted'}>
                          <i className="bi bi-calendar3 me-1" />
                          {new Date(task.deadline).toLocaleDateString('vi-VN')}
                          {isExpired && <span className="ms-1 badge bg-danger-subtle text-danger">Quá hạn</span>}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="small">
                        {task.submission_content ? (
                          <div>
                            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle mb-1">
                              <i className="bi bi-file-earmark-check me-1" /> Đã nộp bài
                            </span>
                            <div
                              className="text-muted text-truncate"
                              style={{ maxWidth: '200px' }}
                              title={task.submission_content}
                            >
                              "{task.submission_content}"
                            </div>
                          </div>
                        ) : task.feedback ? (
                          <div
                            className="text-muted text-truncate"
                            style={{ maxWidth: '200px' }}
                            title={task.feedback}
                          >
                            <i className="bi bi-chat-left-text me-1 text-primary" />
                            {task.feedback}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">Chưa có kết quả</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          {task.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModal({ task, verdict: 'COMPLETED' });
                                setFeedback('');
                              }}
                              className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 shadow-sm px-2.5"
                              title="Chấm duyệt bài nộp"
                            >
                              <i className="bi bi-clipboard-check" /> Chấm bài
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingTask(task)}
                            className="btn btn-sm btn-outline-secondary"
                            title="Chỉnh sửa công việc"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Xóa công việc"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL GIAO VIỆC MỚI ================= */}
      {showCreateModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-plus-circle text-primary me-2"></i>
                    Giao công việc mới cho Thực tập sinh
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleCreateTask}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="new_intern">
                        Chọn Thực tập sinh nhận việc <span className="text-danger">*</span>
                      </label>
                      <select
                        id="new_intern"
                        value={newTaskForm.intern_id}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, intern_id: e.target.value }))}
                        required
                        className="form-select"
                      >
                        <option value="">-- Chọn thực tập sinh --</option>
                        {interns.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.intern_name} — {i.position_title} ({i.branch_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="new_title">
                        Tiêu đề công việc <span className="text-danger">*</span>
                      </label>
                      <input
                        id="new_title"
                        type="text"
                        value={newTaskForm.title}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, title: e.target.value }))}
                        required
                        placeholder="Ví dụ: Thiết kế Database & Xây dựng API Đăng nhập"
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="new_deadline">
                        Hạn chót hoàn thành (Deadline) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="new_deadline"
                        type="date"
                        value={newTaskForm.deadline}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, deadline: e.target.value }))}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="new_desc">
                        Mô tả chi tiết và yêu cầu tiêu chuẩn
                      </label>
                      <textarea
                        id="new_desc"
                        rows={4}
                        value={newTaskForm.description}
                        onChange={(e) => setNewTaskForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Mô tả các yêu cầu kỹ thuật, tài liệu tham khảo, các tiêu chí đánh giá (Acceptance Criteria)..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
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

      {/* ================= MODAL SỬA CÔNG VIỆC ================= */}
      {editingTask && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-pencil-square text-primary me-2"></i>
                    Chỉnh sửa công việc
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingTask(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleUpdateTask}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small text-muted">Thực tập sinh</label>
                      <input
                        type="text"
                        disabled
                        value={editingTask.intern_name || 'TTS'}
                        className="form-control bg-light"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="edit_title">
                        Tiêu đề công việc <span className="text-danger">*</span>
                      </label>
                      <input
                        id="edit_title"
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold" htmlFor="edit_deadline">
                          Hạn chót <span className="text-danger">*</span>
                        </label>
                        <input
                          id="edit_deadline"
                          type="date"
                          value={editingTask.deadline ? editingTask.deadline.split('T')[0] : ''}
                          onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold" htmlFor="edit_status">
                          Trạng thái
                        </label>
                        <select
                          id="edit_status"
                          value={editingTask.status}
                          onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                          className="form-select"
                        >
                          <option value="TODO">TODO (Chưa làm)</option>
                          <option value="IN_PROGRESS">IN_PROGRESS (Đang làm)</option>
                          <option value="SUBMITTED">SUBMITTED (Đã nộp)</option>
                          <option value="COMPLETED">COMPLETED (Hoàn thành)</option>
                          <option value="REJECTED">REJECTED (Làm lại)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="edit_desc">
                        Mô tả chi tiết
                      </label>
                      <textarea
                        id="edit_desc"
                        rows={3}
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* ================= MODAL CHẤM DUYỆT BÀI NỘP ================= */}
      {reviewModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-clipboard-check text-primary me-2"></i>
                    Chấm duyệt bài nộp: {reviewModal.task.title}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setReviewModal(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleReview}>
                  <div className="modal-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3 bg-light p-2.5 rounded border">
                      <div>
                        <span className="text-muted small d-block">Thực tập sinh:</span>
                        <strong className="text-dark">{reviewModal.task.intern_name}</strong>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small d-block">Hạn chót:</span>
                        <strong>{new Date(reviewModal.task.deadline).toLocaleDateString('vi-VN')}</strong>
                      </div>
                    </div>

                    {/* Submission content */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-primary">
                        <i className="bi bi-file-earmark-text me-1" />
                        Kết quả nộp bài của Thực tập sinh:
                      </label>
                      <div
                        className="p-3 bg-light rounded border small text-dark"
                        style={{ whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}
                      >
                        {reviewModal.task.submission_content || '(Không có nội dung mô tả kèm theo)'}
                      </div>
                    </div>

                    {/* Verdict options */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Quyết định đánh giá:
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewModal({ ...reviewModal, verdict: 'COMPLETED' })}
                          className={`btn btn-sm flex-fill fw-semibold ${
                            reviewModal.verdict === 'COMPLETED' ? 'btn-success shadow-sm' : 'btn-outline-success'
                          }`}
                        >
                          <i className="bi bi-check-circle me-1" /> Đạt (Duyệt hoàn thành)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewModal({ ...reviewModal, verdict: 'REJECTED' })}
                          className={`btn btn-sm flex-fill fw-semibold ${
                            reviewModal.verdict === 'REJECTED' ? 'btn-danger shadow-sm' : 'btn-outline-danger'
                          }`}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1" /> Cần sửa (Yêu cầu làm lại)
                        </button>
                      </div>
                    </div>

                    {/* Feedback textarea */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="mentor_feedback">
                        Nhận xét & Góp ý của Mentor <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="mentor_feedback"
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        placeholder={
                          reviewModal.verdict === 'COMPLETED'
                            ? 'Khen ngợi điểm tốt, lưu ý các tiêu chuẩn chất lượng tiếp theo...'
                            : 'Chỉ rõ các điểm cần khắc phục, tài liệu hoặc cách sửa đổi...'
                        }
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setReviewModal(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-sm fw-semibold px-4 ${
                        reviewModal.verdict === 'COMPLETED' ? 'btn-success' : 'btn-danger'
                      }`}
                    >
                      Xác nhận kết quả
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* ================= MODAL XEM CHI TIẾT CÔNG VIỆC ================= */}
      {taskDetailModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-info-circle text-primary me-2"></i>
                    Chi tiết công việc
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setTaskDetailModal(null)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <h5 className="fw-bold text-dark mb-0">{taskDetailModal.title}</h5>
                    <StatusBadge status={taskDetailModal.status} />
                  </div>

                  <div className="bg-light p-3 rounded border mb-3 small">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted d-block">Thực tập sinh:</span>
                        <strong className="text-dark">{taskDetailModal.intern_name}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Hạn chót:</span>
                        <strong className="text-dark">
                          {new Date(taskDetailModal.deadline).toLocaleDateString('vi-VN')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-semibold text-dark small mb-1">Mô tả công việc:</h6>
                    <p className="text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>
                      {taskDetailModal.description || '(Không có mô tả chi tiết)'}
                    </p>
                  </div>

                  {taskDetailModal.submission_content && (
                    <div className="mb-3">
                      <h6 className="fw-semibold text-primary small mb-1">Kết quả bài nộp của Thực tập sinh:</h6>
                      <div className="p-3 bg-light rounded border small text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                        {taskDetailModal.submission_content}
                      </div>
                    </div>
                  )}

                  {taskDetailModal.feedback && (
                    <div className="mb-3">
                      <h6 className="fw-semibold text-success small mb-1">Nhận xét của Mentor:</h6>
                      <div className="p-3 bg-success-subtle border border-success-subtle rounded small text-dark">
                        {taskDetailModal.feedback}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light py-2">
                  <button
                    type="button"
                    onClick={() => setTaskDetailModal(null)}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Đóng
                  </button>
                  {taskDetailModal.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      onClick={() => {
                        const t = taskDetailModal;
                        setTaskDetailModal(null);
                        setReviewModal({ task: t, verdict: 'COMPLETED' });
                        setFeedback('');
                      }}
                      className="btn btn-sm btn-success fw-semibold"
                    >
                      <i className="bi bi-clipboard-check me-1" /> Chấm duyệt ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}
    </DashboardLayout>
  );
}

function KanbanCard({ task, isSubmitted, onReview, onEdit, onDelete, onViewDetail }) {
  const isExpired = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED';

  return (
    <div className="card border shadow-xs bg-white">
      <div className="card-body p-3">
        <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
          <strong
            role="button"
            onClick={onViewDetail}
            className="text-dark small d-block hover-primary"
            style={{ lineHeight: 1.3 }}
            title="Bấm để xem chi tiết"
          >
            {task.title}
          </strong>
        </div>

        <p
          className="text-muted small mb-2 text-truncate"
          style={{ maxHeight: '2.4em', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
        >
          {task.description}
        </p>

        <div className="d-flex align-items-center justify-content-between pt-2 border-top small">
          <span className="badge bg-light text-dark border text-truncate" style={{ maxWidth: '130px' }}>
            <i className="bi bi-person me-1 text-primary" />
            {task.intern_name}
          </span>
          <span className={isExpired ? 'text-danger fw-bold' : 'text-muted'}>
            <i className="bi bi-calendar3 me-1" />
            {new Date(task.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
          </span>
        </div>

        {/* Action buttons on card */}
        <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top gap-1">
          <div className="d-flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-xs btn-outline-secondary p-1"
              title="Chỉnh sửa"
            >
              <i className="bi bi-pencil" style={{ fontSize: '0.75rem' }} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-xs btn-outline-danger p-1"
              title="Xóa task"
            >
              <i className="bi bi-trash" style={{ fontSize: '0.75rem' }} />
            </button>
          </div>

          {isSubmitted ? (
            <button
              type="button"
              onClick={() => onReview('COMPLETED')}
              className="btn btn-xs btn-success fw-semibold px-2 py-1 d-inline-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem' }}
            >
              <i className="bi bi-check2-circle" /> Chấm bài
            </button>
          ) : (
            <button
              type="button"
              onClick={onViewDetail}
              className="btn btn-xs btn-link text-decoration-none text-muted p-0"
              style={{ fontSize: '0.75rem' }}
            >
              Chi tiết →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
