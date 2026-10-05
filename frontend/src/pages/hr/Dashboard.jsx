import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import CvViewerModal from '../../components/common/CvViewerModal';
import eventBus from '../../services/eventBus';

export default function HRDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [stats, setStats] = useState({ applications: 0, open_positions: 0, interns: 0, mentors: 0 });
  const [applications, setApplications] = useState([]);
  const [positions, setPositions] = useState([]);
  const [branches, setBranches] = useState([]);
  // 'all' or branch ID string
  const [selectedBranch, setSelectedBranch] = useState(user?.branch_id ? String(user.branch_id) : 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('/positions') ? 'positions' : 'applications'
  );
  const [viewingCv, setViewingCv] = useState(null);

  // Position form without department
  const [showPosForm, setShowPosForm] = useState(false);
  const [posForm, setPosForm] = useState({
    title: '',
    branch_id: user?.branch_id ? String(user.branch_id) : '1',
    description: '',
    requirements: '',
    quantity: 1,
    deadline: '',
    internship_duration: '3 tháng',
  });

  // Keep active tab in sync with route URL
  useEffect(() => {
    if (location.pathname.includes('/positions')) {
      setActiveTab('positions');
    } else if (location.pathname.includes('/applications')) {
      setActiveTab('applications');
    }
  }, [location.pathname]);

  // Load branches
  useEffect(() => {
    api.get('/branches')
      .then((res) => {
        const branchList = res.data.data || [];
        setBranches(branchList);
        if (!posForm.branch_id && branchList.length > 0) {
          setPosForm((p) => ({ ...p, branch_id: String(user?.branch_id || branchList[0].id) }));
        }
      })
      .catch((err) => console.error('Error fetching branches:', err));
  }, [user]);

  const fetchDashboardData = async (isManual = false, branchIdOverride = selectedBranch) => {
    if (isManual) setRefreshing(true);
    try {
      const branchParam = branchIdOverride === 'all' ? 'all' : branchIdOverride;
      const [sRes, aRes, pRes] = await Promise.all([
        api.get(`/hr/stats?branch_id=${branchParam}`),
        api.get(`/hr/applications?branch_id=${branchParam}`),
        api.get(`/hr/positions?branch_id=${branchParam}`),
      ]);
      setStats(sRes.data.data || {});
      setApplications(aRes.data.data || []);
      setPositions(pRes.data.data || []);
    } catch (err) {
      console.error('Error fetching HR dashboard data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false, selectedBranch);

    // Listen to real-time events across browser tabs
    const unsubSubmitted = eventBus.on('APPLICATION_SUBMITTED', () => {
      fetchDashboardData(false, selectedBranch);
    });
    const unsubUpdated = eventBus.on('APPLICATION_UPDATED', () => {
      fetchDashboardData(false, selectedBranch);
    });

    // Auto-poll every 10 seconds to ensure synchronisation across tabs
    const timer = setInterval(() => {
      fetchDashboardData(false, selectedBranch);
    }, 10000);

    return () => {
      unsubSubmitted();
      unsubUpdated();
      clearInterval(timer);
    };
  }, [selectedBranch]);

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    fetchDashboardData(false, branchId);
  };

  const handleUpdateStatus = async (id, status) => {
    await api.patch(`/hr/applications/${id}/status`, { status, hr_note: note, note });
    await fetchDashboardData(false, selectedBranch);
    setSelectedApp(null);
    setNote('');
    // Broadcast status change across tabs
    eventBus.emit('APPLICATION_UPDATED', { applicationId: id, status });
  };

  const handleCreatePosition = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/positions', {
        ...posForm,
        branch_id: posForm.branch_id || user?.branch_id || 1,
      });
      await fetchDashboardData(false, selectedBranch);
      setShowPosForm(false);
      setPosForm({
        title: '',
        branch_id: user?.branch_id ? String(user.branch_id) : (branches[0]?.id ? String(branches[0].id) : '1'),
        description: '',
        requirements: '',
        quantity: 1,
        deadline: '',
        internship_duration: '3 tháng',
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo vị trí tuyển dụng.');
    }
  };

  const handleTogglePosition = async (pos) => {
    const newStatus = pos.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await api.patch(`/hr/positions/${pos.id}/status`, { status: newStatus });
    await fetchDashboardData(false, selectedBranch);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải dữ liệu Nhân sự..." />
        </div>
      </DashboardLayout>
    );
  }

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.applicant_name?.toLowerCase().includes(q) ||
      app.applicant_email?.toLowerCase().includes(q) ||
      app.applicant_phone?.includes(q) ||
      app.position_title?.toLowerCase().includes(q) ||
      app.branch_name?.toLowerCase().includes(q)
    );
  });

  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const openPositions = positions.filter((p) => p.status === 'OPEN');

  const selectedBranchObj = branches.find((b) => String(b.id) === String(selectedBranch));

  return (
    <DashboardLayout>
      <PageHeader
        title="Bảng điều khiển Nhân sự (HR)"
        subtitle={
          <span>
            Quản lý tuyển dụng và tiếp nhận hồ sơ ứng viên
            {user?.branch_name && (
              <span className="ms-2 badge bg-primary-subtle text-primary border border-primary-subtle">
                <i className="bi bi-geo-alt-fill me-1" />
                Cơ sở mặc định: {user.branch_name}
              </span>
            )}
          </span>
        }
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Nhân sự (HR)' },
        ]}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fetchDashboardData(true, selectedBranch)}
            disabled={refreshing}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 shadow-sm"
            title="Làm mới dữ liệu ứng viên và vị trí"
          >
            <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i>
            <span>{refreshing ? 'Đang cập nhật...' : 'Đồng bộ lại'}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('positions');
              setShowPosForm(true);
            }}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 shadow-sm"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Thêm vị trí tuyển dụng</span>
          </button>
        </div>
      </PageHeader>

      {/* Facility / Branch Selector Filter */}
      <div className="card shadow-xs border mb-4 bg-white">
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary-subtle text-primary p-2 rounded-2 d-flex align-items-center justify-content-center">
                <i className="bi bi-buildings-fill fs-5" />
              </div>
              <div>
                <strong className="d-block text-dark small">Xem dữ liệu theo Cơ sở Công ty:</strong>
                <span className="text-muted small">
                  {selectedBranch === 'all'
                    ? 'Hiển thị dữ liệu toàn bộ tất cả cơ sở'
                    : `Đang lọc theo: Cơ sở ${selectedBranchObj?.name || selectedBranch}`}
                </span>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleBranchChange('all')}
                className={`btn btn-sm ${
                  selectedBranch === 'all' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                }`}
              >
                <i className="bi bi-globe2 me-1" />
                Tất cả cơ sở
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBranchChange(String(b.id))}
                  className={`btn btn-sm ${
                    String(selectedBranch) === String(b.id)
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline-secondary'
                  }`}
                >
                  <i className="bi bi-geo-alt-fill me-1" />
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tổng hồ sơ ứng tuyển"
            value={stats.applications || applications.length}
            icon="bi-file-earmark-person"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đơn chờ xét duyệt"
            value={pendingApps.length}
            icon="bi-hourglass-split"
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Thực tập sinh"
            value={stats.interns || 0}
            icon="bi-mortarboard"
            variant="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Vị trí đang mở tuyển"
            value={openPositions.length}
            icon="bi-briefcase"
            variant="success"
          />
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-3 border shadow-xs">
        <li className="nav-item">
          <button
            className={`nav-link small fw-semibold d-flex align-items-center gap-2 ${
              activeTab === 'applications' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('applications')}
          >
            <i className="bi bi-file-earmark-text"></i>
            <span>Hồ sơ ứng tuyển ({applications.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link small fw-semibold d-flex align-items-center gap-2 ${
              activeTab === 'positions' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('positions')}
          >
            <i className="bi bi-briefcase"></i>
            <span>Vị trí tuyển dụng ({positions.length})</span>
          </button>
        </li>
      </ul>

      {/* Tab: Applications */}
      {activeTab === 'applications' && (
        <div className="card shadow-sm border">
          <div className="card-header bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-3">
            <div>
              <h5 className="fw-bold text-dark mb-0">Danh sách đơn ứng tuyển tiếp nhận</h5>
              <span className="text-muted small">
                {selectedBranch === 'all'
                  ? 'Tổng hợp hồ sơ ứng viên tại tất cả các cơ sở'
                  : `Hồ sơ ứng viên nộp tại cơ sở ${selectedBranchObj?.name || ''}`}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="input-group input-group-sm" style={{ width: '260px' }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0 shadow-none"
                  placeholder="Tìm ứng viên, email, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
              <span className="badge bg-light text-muted border px-2.5 py-1.5">
                {filteredApplications.length} đơn
              </span>
            </div>
          </div>

          <div className="card-body p-0">
            {filteredApplications.length === 0 ? (
              <EmptyState
                icon="bi-inbox"
                title={searchQuery ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có hồ sơ ứng tuyển nào'}
                description={
                  searchQuery
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn cơ sở khác.'
                    : 'Khi ứng viên nộp hồ sơ, danh sách sẽ tự động đồng bộ tại đây để bạn xét duyệt.'
                }
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="ps-4">Ứng viên</th>
                      <th scope="col">Vị trí & Cơ sở</th>
                      <th scope="col">Ngày nộp</th>
                      <th scope="col">CV & Giới thiệu</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="ps-4">
                          <strong className="text-dark d-block">{app.applicant_name}</strong>
                          <span className="text-muted small">{app.applicant_email}</span>
                          {app.applicant_phone && (
                            <span className="text-muted small d-block">
                              <i className="bi bi-telephone me-1"></i>
                              {app.applicant_phone}
                            </span>
                          )}
                        </td>
                        <td>
                          <strong className="text-dark d-block small">{app.position_title}</strong>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle small mt-1">
                            <i className="bi bi-geo-alt-fill me-1" />
                            {app.branch_name || 'Hà Nội'}
                          </span>
                        </td>
                        <td className="small text-muted">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(app.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {app.cv_original_name ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingCv({
                                    cv_id: app.cv_id,
                                    cv_original_name: app.cv_original_name || 'Hồ sơ CV',
                                    cv_file_path: app.cv_file_path,
                                    applicant_name: app.applicant_name,
                                    position_title: app.position_title,
                                  })
                                }
                                className="btn btn-sm btn-link p-0 text-start text-decoration-none d-flex align-items-center gap-1 text-primary"
                                title="Bấm để xem CV trực tiếp trên web"
                              >
                                <i
                                  className={`bi ${
                                    app.cv_file_type && app.cv_file_type.includes('pdf')
                                      ? 'bi-file-earmark-pdf-fill text-danger'
                                      : 'bi-file-earmark-word-fill text-primary'
                                  }`}
                                />
                                <span className="text-truncate fw-medium" style={{ maxWidth: '170px' }}>
                                  {app.cv_original_name}
                                </span>
                              </button>
                            ) : (
                              <span className="text-muted small fst-italic">Không có CV</span>
                            )}
                            {app.cover_letter && (
                              <span
                                className="badge bg-light text-muted border text-truncate d-block"
                                style={{ maxWidth: '170px' }}
                                title={app.cover_letter}
                              >
                                <i className="bi bi-chat-quote me-1" />
                                {app.cover_letter}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex gap-2 justify-content-end flex-wrap">
                            {(app.cv_id || app.cv_file_path) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingCv({
                                    cv_id: app.cv_id,
                                    cv_original_name: app.cv_original_name || 'Hồ sơ CV',
                                    cv_file_path: app.cv_file_path,
                                    applicant_name: app.applicant_name,
                                    position_title: app.position_title,
                                  })
                                }
                                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                title="Mở và xem CV ứng viên"
                              >
                                <i className="bi bi-file-earmark-pdf-fill" />
                                Xem CV
                              </button>
                            )}
                            {app.status === 'PENDING' && (
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setNote('');
                                }}
                                className="btn btn-sm btn-primary"
                              >
                                Xét duyệt
                              </button>
                            )}
                            {app.status === 'REVIEWING' && (
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setNote(app.hr_note || '');
                                }}
                                className="btn btn-sm btn-outline-info"
                              >
                                Cập nhật
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Positions */}
      {activeTab === 'positions' && (
        <div>
          {/* New Position Form (No Department) */}
          {showPosForm && (
            <div className="card shadow-sm border border-primary border-opacity-25 mb-4">
              <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-plus-circle text-primary me-2"></i>
                  Tạo vị trí tuyển dụng thực tập mới
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPosForm(false)}
                />
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleCreatePosition}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-7">
                      <label className="form-label small fw-semibold" htmlFor="pos_title">
                        Tiêu đề vị trí tuyển dụng <span className="text-danger">*</span>
                      </label>
                      <input
                        id="pos_title"
                        type="text"
                        value={posForm.title}
                        onChange={(e) => setPosForm((p) => ({ ...p, title: e.target.value }))}
                        required
                        placeholder="Ví dụ: Backend Node.js / Express Intern"
                        className="form-control"
                      />
                    </div>

                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-semibold" htmlFor="pos_branch">
                        Cơ sở tiếp nhận tuyển dụng <span className="text-danger">*</span>
                      </label>
                      <select
                        id="pos_branch"
                        className="form-select"
                        value={posForm.branch_id}
                        onChange={(e) => setPosForm((p) => ({ ...p, branch_id: e.target.value }))}
                        required
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.address})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold" htmlFor="pos_quantity">
                        Số lượng chỉ tiêu tuyển
                      </label>
                      <input
                        id="pos_quantity"
                        type="number"
                        min={1}
                        value={posForm.quantity}
                        onChange={(e) => setPosForm((p) => ({ ...p, quantity: e.target.value }))}
                        className="form-control"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold" htmlFor="pos_deadline">
                        Hạn nộp hồ sơ <span className="text-danger">*</span>
                      </label>
                      <input
                        id="pos_deadline"
                        type="date"
                        value={posForm.deadline}
                        onChange={(e) => setPosForm((p) => ({ ...p, deadline: e.target.value }))}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold" htmlFor="pos_duration">
                        Thời lượng kỳ thực tập
                      </label>
                      <input
                        id="pos_duration"
                        type="text"
                        value={posForm.internship_duration}
                        onChange={(e) =>
                          setPosForm((p) => ({ ...p, internship_duration: e.target.value }))
                        }
                        placeholder="3 tháng"
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="pos_desc">
                      Mô tả công việc thực tập
                    </label>
                    <textarea
                      id="pos_desc"
                      rows={3}
                      value={posForm.description}
                      onChange={(e) => setPosForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Mô tả các dự án, công việc và mục tiêu đào tạo thực tập sinh..."
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="pos_req">
                      Yêu cầu ứng viên (Tùy chọn)
                    </label>
                    <textarea
                      id="pos_req"
                      rows={2}
                      value={posForm.requirements}
                      onChange={(e) => setPosForm((p) => ({ ...p, requirements: e.target.value }))}
                      placeholder="Yêu cầu về kiến thức chuyên môn, tinh thần học hỏi..."
                      className="form-control"
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-sm btn-primary px-4 fw-semibold">
                      Tạo vị trí
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPosForm(false)}
                      className="btn btn-sm btn-outline-secondary px-3"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Positions Table (Cơ sở column instead of department) */}
          <div className="card shadow-sm border">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">Danh sách vị trí tuyển dụng</h5>
                <span className="text-muted small">
                  {selectedBranch === 'all'
                    ? 'Hiển thị vị trí tuyển dụng trên toàn bộ cơ sở'
                    : `Vị trí tuyển dụng thuộc cơ sở ${selectedBranchObj?.name || ''}`}
                </span>
              </div>
              <button
                onClick={() => setShowPosForm(!showPosForm)}
                className="btn btn-sm btn-outline-primary"
              >
                <i className="bi bi-plus-lg me-1"></i> {showPosForm ? 'Đóng form' : 'Thêm mới'}
              </button>
            </div>

            <div className="card-body p-0">
              {positions.length === 0 ? (
                <EmptyState
                  icon="bi-briefcase"
                  title="Chưa có vị trí tuyển dụng nào"
                  description="Hãy tạo vị trí đầu tiên để tiếp nhận đơn ứng tuyển từ sinh viên."
                  actionText="Tạo vị trí mới"
                  onAction={() => setShowPosForm(true)}
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="ps-4">Vị trí</th>
                        <th scope="col">Cơ sở công ty</th>
                        <th scope="col">Hồ sơ đã nhận</th>
                        <th scope="col">Chỉ tiêu</th>
                        <th scope="col">Hạn nộp hồ sơ</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col" className="text-end pe-4">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => (
                        <tr key={pos.id}>
                          <td className="ps-4">
                            <strong className="text-dark d-block">{pos.title}</strong>
                            <span className="text-muted small">
                              Thời lượng: {pos.internship_duration}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              <i className="bi bi-geo-alt-fill me-1" />
                              {pos.branch_name || 'Toàn công ty'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-file-earmark-person me-1 text-primary" />
                              {pos.applications_count || 0} hồ sơ
                            </span>
                          </td>
                          <td className="small text-muted">{pos.quantity} chỉ tiêu</td>
                          <td className="small text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(pos.deadline).toLocaleDateString('vi-VN')}
                          </td>
                          <td>
                            <StatusBadge status={pos.status} />
                          </td>
                          <td className="text-end pe-4">
                            <button
                              onClick={() => handleTogglePosition(pos)}
                              className={`btn btn-sm ${
                                pos.status === 'OPEN' ? 'btn-outline-danger' : 'btn-outline-success'
                              }`}
                            >
                              {pos.status === 'OPEN' ? 'Đóng tuyển' : 'Mở lại'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-clipboard-check text-primary me-2"></i>
                    Xét duyệt hồ sơ ứng tuyển
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedApp(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded border mb-3 small">
                    <div className="fw-bold text-dark fs-6">{selectedApp.applicant_name}</div>
                    <div className="text-muted mb-1">{selectedApp.applicant_email}</div>
                    <div className="text-primary fw-semibold">{selectedApp.position_title}</div>
                    {selectedApp.branch_name && (
                      <div className="mt-1">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          <i className="bi bi-geo-alt-fill me-1" />
                          Cơ sở: {selectedApp.branch_name}
                        </span>
                      </div>
                    )}
                    {(selectedApp.cv_id || selectedApp.cv_file_path) && (
                      <div className="mt-2 pt-2 border-top">
                        <button
                          type="button"
                          onClick={() => {
                            const cvData = {
                              cv_id: selectedApp.cv_id,
                              cv_original_name: selectedApp.cv_original_name || 'Hồ sơ CV',
                              cv_file_path: selectedApp.cv_file_path,
                              applicant_name: selectedApp.applicant_name,
                              position_title: selectedApp.position_title,
                            };
                            setSelectedApp(null);
                            setTimeout(() => setViewingCv(cvData), 150);
                          }}
                          className="btn btn-sm btn-danger d-inline-flex align-items-center gap-2 shadow-sm"
                        >
                          <i className="bi bi-file-earmark-pdf-fill" /> Xem CV ứng viên
                        </button>
                      </div>
                    )}
                    {selectedApp.cover_letter && (
                      <div className="mt-2 pt-2 border-top text-secondary fst-italic">
                        "{selectedApp.cover_letter}"
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="app_note">
                      Ghi chú phản hồi cho ứng viên
                    </label>
                    <textarea
                      id="app_note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ví dụ: Bạn đã vượt qua vòng sơ loại hồ sơ. Bộ phận HR sẽ liên hệ đặt lịch phỏng vấn..."
                      className="form-control"
                    />
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'REVIEWING')}
                      className="btn btn-sm btn-info text-white flex-fill fw-semibold"
                    >
                      <i className="bi bi-search me-1"></i> Đang xem xét
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'APPROVED')}
                      className="btn btn-sm btn-success flex-fill fw-semibold"
                    >
                      <i className="bi bi-check-lg me-1"></i> Chấp nhận
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'REJECTED')}
                      className="btn btn-sm btn-outline-danger flex-fill fw-semibold"
                    >
                      <i className="bi bi-x-lg me-1"></i> Từ chối
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* CV Viewer Modal */}
      <CvViewerModal
        isOpen={!!viewingCv}
        onClose={() => setViewingCv(null)}
        cv={viewingCv}
      />
    </DashboardLayout>
  );
}
