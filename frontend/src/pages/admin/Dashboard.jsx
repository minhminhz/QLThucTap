import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import CvViewerModal from '../../components/common/CvViewerModal';
import eventBus from '../../services/eventBus';
import { useNotification } from '../../contexts/NotificationContext';

export default function AdminDashboard() {
  const location = useLocation();
  const { notify, confirm } = useNotification();

  // Dữ liệu thật từ hệ thống
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cuộn ngang cơ sở
  const branchScrollRef = useRef(null);

  // Phân trang danh sách HR & danh sách CV
  const [hrPage, setHrPage] = useState(1);
  const HR_PAGE_SIZE = 4;

  const [cvPage, setCvPage] = useState(1);
  const CV_PAGE_SIZE = 5;

  // Bộ lọc đơn nộp CV
  const [cvSearch, setCvSearch] = useState('');
  const [cvStatusFilter, setCvStatusFilter] = useState('');
  const [viewingCv, setViewingCv] = useState(null);

  // Form thêm cơ sở
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '' });

  // Form & Lọc người dùng
  const [showUserForm, setShowUserForm] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userBranchFilter, setUserBranchFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const USER_PAGE_SIZE = 8;
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'HR',
    branch_id: ''
  });

  const isBranchesPage = location.pathname.startsWith('/admin/branches');
  const isUsersPage = location.pathname.startsWith('/admin/users');
  const isOverviewPage = !isBranchesPage && !isUsersPage;

  const [refreshing, setRefreshing] = useState(false);

  // Đồng bộ dữ liệu API thật vào danh sách
  const syncWithBackend = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [bRes, uRes, appRes] = await Promise.all([
        api.get('/admin/branches').catch(() => null),
        api.get('/admin/users').catch(() => null),
        api.get('/hr/applications').catch(() => null),
      ]);

      const apiBranches = bRes?.data?.data || [];
      const apiUsers = uRes?.data?.data || [];
      const apiApps = appRes?.data?.data || [];

      if (bRes?.data?.success) {
        setBranches(apiBranches);
      }
      if (uRes?.data?.success) {
        setUsers(apiUsers);
      }
      if (appRes?.data?.success) {
        setApplications(apiApps);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu quản trị:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    syncWithBackend();

    // Listen to real-time events across tabs
    const unsubSubmitted = eventBus.on('APPLICATION_SUBMITTED', () => {
      syncWithBackend();
    });
    const unsubUpdated = eventBus.on('APPLICATION_UPDATED', () => {
      syncWithBackend();
    });
    const timer = setInterval(() => syncWithBackend(), 15000);

    return () => {
      unsubSubmitted();
      unsubUpdated();
      clearInterval(timer);
    };
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/branches', branchForm);
      notify.success(res.data?.message || 'Thêm cơ sở mới thành công!');
      syncWithBackend();
      setBranchForm({ name: '', address: '' });
      setShowBranchForm(false);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Không thể tạo cơ sở mới.');
    }
  };

  const handleToggleBranch = async (branch) => {
    const newStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/branches/${branch.id}/status`, { status: newStatus });
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, status: newStatus } : b))
      );
      notify.success(
        `Đã chuyển trạng thái cơ sở "${branch.name}" sang ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}!`,
        'Cập nhật cơ sở'
      );
    } catch (err) {
      notify.error(
        err.response?.data?.message || 'Không thể thay đổi trạng thái cơ sở.',
        'Lỗi cập nhật'
      );
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', userForm);
      notify.success(res.data?.message || 'Tạo tài khoản người dùng thành công!');
      syncWithBackend();
      setUserForm({ full_name: '', email: '', password: '', phone: '', role: 'HR', branch_id: '' });
      setShowUserForm(false);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Không thể tạo tài khoản người dùng.');
    }
  };

  const handleToggleUser = async (user) => {
    const newStatus = (user.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      notify.success(
        `Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản "${user.full_name}" thành công!`,
        'Cập nhật tài khoản'
      );
    } catch (err) {
      notify.error(
        err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản.',
        'Lỗi cập nhật'
      );
    }
  };

  const handleDeleteBranch = async (branch) => {
    const confirmed = await confirm({
      title: 'Xóa cơ sở',
      message: `Bạn có chắc chắn muốn xóa cơ sở "${branch.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa cơ sở',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/admin/branches/${branch.id}`);
      setBranches((prev) => prev.filter((b) => b.id !== branch.id));
      notify.success(
        res.data?.message || `Đã xóa cơ sở "${branch.name}" thành công!`,
        'Xóa cơ sở thành công'
      );
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể xóa cơ sở này. Vui lòng thử lại.';
      notify.error(errMsg, 'Không thể xóa cơ sở');
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = await confirm({
      title: 'Xóa tài khoản người dùng',
      message: `Bạn có chắc chắn muốn xóa tài khoản "${user.full_name}" (${user.email})? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.`,
      confirmText: 'Xóa tài khoản',
      cancelText: 'Hủy bỏ',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      notify.success(
        res.data?.message || `Đã xóa tài khoản "${user.full_name}" thành công!`,
        'Xóa tài khoản thành công'
      );
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể xóa tài khoản này. Vui lòng thử lại.';
      notify.error(errMsg, 'Không thể xóa tài khoản');
    }
  };

  const scrollBranches = (direction) => {
    if (branchScrollRef.current) {
      const scrollAmount = 350;
      branchScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleViewCv = (app) => {
    setViewingCv({
      cv_id: app.cv_id || (typeof app.id === 'number' && app.id > 100 ? app.id : null),
      cv_original_name: app.cv_original_name || app.original_name || (app.applicant_name ? `CV_${app.applicant_name.replace(/\s+/g, '_')}.pdf` : 'Ho_so_CV.pdf'),
      cv_file_path: app.cv_file_path || app.cv_path,
      applicant_name: app.applicant_name,
      position_title: app.position_title
    });
  };

  const ROLE_LABELS = {
    ADMIN: 'Quản trị viên',
    HR: 'Nhân sự (HR)',
    MENTOR: 'Mentor hướng dẫn',
    INTERN: 'Thực tập sinh',
    APPLICANT: 'Ứng viên'
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang nạp dữ liệu quản trị..." />
        </div>
      </DashboardLayout>
    );
  }

  // Danh sách HR
  const hrUsers = users.filter((u) => u.role === 'HR');
  const totalHrPages = Math.ceil(hrUsers.length / HR_PAGE_SIZE) || 1;
  const paginatedHRs = hrUsers.slice((hrPage - 1) * HR_PAGE_SIZE, hrPage * HR_PAGE_SIZE);

  // Lọc và phân trang đơn ứng tuyển
  const filteredApps = applications.filter((app) => {
    const matchSearch =
      !cvSearch ||
      app.applicant_name?.toLowerCase().includes(cvSearch.toLowerCase()) ||
      app.position_title?.toLowerCase().includes(cvSearch.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(cvSearch.toLowerCase());
    const matchStatus = !cvStatusFilter || app.status === cvStatusFilter;
    return matchSearch && matchStatus;
  });
  const totalCvPages = Math.ceil(filteredApps.length / CV_PAGE_SIZE) || 1;
  const paginatedApps = filteredApps.slice((cvPage - 1) * CV_PAGE_SIZE, cvPage * CV_PAGE_SIZE);

  // Lọc và phân trang người dùng
  const filteredUsers = users.filter((u) => {
    const matchRole = !userRoleFilter || u.role === userRoleFilter;
    const matchBranch = !userBranchFilter || String(u.branch_id) === String(userBranchFilter);
    const searchLower = userSearch.trim().toLowerCase();
    const matchSearch =
      !searchLower ||
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.phone?.toLowerCase().includes(searchLower) ||
      u.branch_name?.toLowerCase().includes(searchLower) ||
      (ROLE_LABELS[u.role] || u.role)?.toLowerCase().includes(searchLower);
    return matchRole && matchBranch && matchSearch;
  });
  const totalUserPages = Math.ceil(filteredUsers.length / USER_PAGE_SIZE) || 1;
  const safeUserPage = Math.min(userPage, totalUserPages) || 1;
  const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * USER_PAGE_SIZE, safeUserPage * USER_PAGE_SIZE);

  return (
    <DashboardLayout>
      {/* ======================================================== */}
      {/* 1. TRANG TỔNG QUAN (OVERVIEW) — /admin                   */}
      {/* ======================================================== */}
      {isOverviewPage && (
        <div>
          <PageHeader
            title="Bảng điều khiển Quản trị viên"
            subtitle="Tổng quan hoạt động đào tạo, cơ sở chi nhánh và số liệu nhân sự toàn hệ thống VYMI Tech"
            breadcrumbs={[
              { label: 'Trang chủ', link: '/' },
              { label: 'Admin', link: '/admin' },
              { label: 'Tổng quan' },
            ]}
          >
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => syncWithBackend(true)}
                disabled={refreshing}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 shadow-sm"
                title="Làm mới dữ liệu hệ thống"
              >
                <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i>
                <span>{refreshing ? 'Đang tải...' : ''}</span>
              </button>
              <Link to="/admin/branches" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 shadow-sm">
                <i className="bi bi-buildings"></i>
                <span>Quản lý cơ sở</span>
              </Link>
              <Link to="/admin/users" className="btn btn-sm btn-primary d-flex align-items-center gap-2 shadow-sm">
                <i className="bi bi-people-fill"></i>
                <span>Quản lý người dùng</span>
              </Link>
            </div>
          </PageHeader>

          {/* 4 STATS CARDS */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Cơ sở hoạt động"
                value={`${branches.filter((b) => b.status === 'ACTIVE').length}/${branches.length}`}
                icon="bi-buildings"
                variant="primary"
                description="Đang tiếp nhận đào tạo"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Chuyên viên HR"
                value={users.filter((u) => u.role === 'HR').length}
                icon="bi-person-badge"
                variant="info"
                description="Tuyển dụng & điều phối"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Mentor hướng dẫn"
                value={users.filter((u) => u.role === 'MENTOR').length}
                icon="bi-person-video3"
                variant="success"
                description="Kèm cặp 1-1 chuyên môn"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Hồ sơ ứng tuyển"
                value={applications.length}
                icon="bi-file-earmark-person"
                variant="warning"
                description={`${applications.filter((a) => a.status === 'PENDING').length} đơn đang chờ duyệt`}
              />
            </div>
          </div>

          {/* THỐNG KÊ TỪNG CƠ SỞ (CAROUSEL / SCROLL) */}
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-diagram-3-fill text-primary me-2"></i>
                  Cơ sở
                </h5>
                <span className="text-muted small">
                  {branches.length} chi nhánh
                </span>
              </div>
              <div className="d-flex gap-1">
                <button
                  onClick={() => scrollBranches('left')}
                  className="btn btn-sm btn-outline-secondary px-2.5 py-1"
                  title="Cuộn sang trái"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  onClick={() => scrollBranches('right')}
                  className="btn btn-sm btn-outline-secondary px-2.5 py-1"
                  title="Cuộn sang phải"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="card-body p-3">
              <div
                ref={branchScrollRef}
                className="d-flex gap-3 overflow-x-auto pb-2 pt-1"
                style={{ scrollbarWidth: 'thin' }}
              >
                {branches.map((b) => {
                  const branchHRs = users.filter((u) => Number(u.branch_id) === Number(b.id) && u.role === 'HR');
                  const branchMentors = users.filter((u) => Number(u.branch_id) === Number(b.id) && u.role === 'MENTOR');
                  const branchInterns = users.filter((u) => Number(u.branch_id) === Number(b.id) && u.role === 'INTERN');
                  const totalPersonnel = branchHRs.length + branchMentors.length + branchInterns.length;

                  return (
                    <div
                      key={b.id}
                      className="card border shadow-xs flex-shrink-0"
                      style={{ width: '320px' }}
                    >
                      <div className="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                            <h6 className="fw-bold text-dark mb-0 text-truncate" title={b.name}>
                              {b.name}
                            </h6>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-muted small text-truncate mb-3 d-flex align-items-center gap-2" title={b.address}>
                            <i className="bi bi-geo-alt text-primary flex-shrink-0"></i>
                            <span className="text-truncate">{b.address}</span>
                          </p>

                          <div className="bg-light p-3 rounded border small mb-3 d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted d-flex align-items-center gap-2">
                                <i className="bi bi-person-badge text-primary"></i>
                                <span>Nhân sự HR:</span>
                              </span>
                              <strong className="text-dark">{branchHRs.length} người</strong>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted d-flex align-items-center gap-2">
                                <i className="bi bi-person-video3 text-success"></i>
                                <span>Mentor hướng dẫn:</span>
                              </span>
                              <strong className="text-dark">{branchMentors.length} người</strong>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted d-flex align-items-center gap-2">
                                <i className="bi bi-mortarboard text-info"></i>
                                <span>Thực tập sinh:</span>
                              </span>
                              <strong className="text-dark">{branchInterns.length} người</strong>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                          <span className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-people text-secondary"></i>
                            <span>Tổng nhân lực:</span>
                          </span>
                          <strong className="text-primary fs-6">{totalPersonnel} người</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ĐỘI NGŨ CHUYÊN VIÊN HR */}
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 py-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-person-workspace text-primary me-2"></i>
                  Đội ngũ chuyên viên Nhân sự (HR)
                </h5>
                <span className="text-muted small">
                  {hrUsers.length} nhân sự
                </span>
              </div>
              <Pagination
                currentPage={hrPage}
                totalPages={totalHrPages}
                onPageChange={(p) => setHrPage(p)}
              />
            </div>

            <div className="card-body p-3">
              <div className="row g-3">
                {paginatedHRs.map((hr) => (
                  <div key={hr.id} className="col-12 col-md-6">
                    <div className="card h-100 border shadow-xs bg-light">
                      <div className="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
                              >
                                {hr.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div className="d-flex flex-column gap-1">
                                <strong className="text-dark fs-6 lh-sm mb-0">{hr.full_name}</strong>
                                <div>
                                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                                    {hr.title || 'Chuyên viên Nhân sự'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <StatusBadge status={hr.status || 'ACTIVE'} />
                          </div>

                          <div className="bg-white p-3 rounded border small mb-3 d-flex flex-column gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-envelope text-muted flex-shrink-0"></i>
                              <span className="text-muted">Email:</span>
                              <strong className="text-dark text-truncate ms-1">{hr.email}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-telephone text-muted flex-shrink-0"></i>
                              <span className="text-muted">Điện thoại:</span>
                              <strong className="text-dark ms-1">{hr.phone || '0987 654 321'}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-2 text-truncate">
                              <i className="bi bi-geo-alt text-primary flex-shrink-0"></i>
                              <span className="text-muted">Cơ sở:</span>
                              <span className="text-primary fw-medium text-truncate ms-1">{hr.branch_name || 'Toàn hệ thống'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center pt-2 border-top small text-muted">
                          <span className="d-flex align-items-center gap-2">
                            <i className="bi bi-people text-primary"></i>
                            <span>Phụ trách: <strong className="text-dark">{hr.assigned_interns || 12} TTS</strong></span>
                          </span>
                          <span className="d-flex align-items-center gap-2">
                            <i className="bi bi-file-earmark-text text-info"></i>
                            <span>Đã nhận: <strong className="text-dark">{hr.assigned_apps || 18} hồ sơ</strong></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DANH SÁCH ĐƠN NỘP CV */}
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-file-earmark-text-fill text-primary me-2"></i>
                  Danh sách hồ sơ nộp CV gần đây
                </h5>
                <span className="text-muted small">
                  {filteredApps.length} đơn ứng tuyển
                </span>
              </div>

              {/* Bộ lọc */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div className="input-group input-group-sm" style={{ width: '220px' }}>
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm tên, vị trí..."
                    value={cvSearch}
                    onChange={(e) => {
                      setCvSearch(e.target.value);
                      setCvPage(1);
                    }}
                    className="form-control"
                  />
                </div>

                <select
                  value={cvStatusFilter}
                  onChange={(e) => {
                    setCvStatusFilter(e.target.value);
                    setCvPage(1);
                  }}
                  className="form-select form-select-sm"
                  style={{ width: '160px' }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xét duyệt</option>
                  <option value="REVIEWING">Đang xem xét</option>
                  <option value="APPROVED">Đã trúng tuyển</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              {paginatedApps.length === 0 ? (
                <EmptyState
                  icon="bi-inbox"
                  title="Không tìm thấy hồ sơ nào"
                  description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái."
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="ps-4">Ứng viên</th>
                        <th scope="col">Vị trí & Cơ sở</th>
                        <th scope="col">Ngày nộp</th>
                        <th scope="col">Thư giới thiệu</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col" className="text-end pe-4">Hồ sơ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedApps.map((app) => (
                        <tr key={app.id}>
                          <td className="ps-4">
                            <strong className="text-dark d-block">{app.applicant_name}</strong>
                            <span className="text-muted small">{app.applicant_email}</span>
                          </td>
                          <td>
                            <strong className="text-dark small d-block">{app.position_title}</strong>
                            <span className="badge bg-light text-secondary border small">
                              {app.branch_name}
                            </span>
                          </td>
                          <td className="small text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(app.created_at || app.applied_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td>
                            {app.cover_letter ? (
                              <span
                                className="small text-muted text-truncate d-inline-block"
                                style={{ maxWidth: '200px' }}
                                title={app.cover_letter}
                              >
                                "{app.cover_letter}"
                              </span>
                            ) : (
                              <span className="text-muted small fst-italic">Không có</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="text-end pe-4">
                            <button
                              onClick={() => handleViewCv(app)}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-paperclip me-1"></i> Xem CV
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {totalCvPages > 1 && (
              <div className="card-footer bg-white py-2 px-4 border-top">
                <Pagination
                  currentPage={cvPage}
                  totalPages={totalCvPages}
                  onPageChange={(p) => setCvPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TRANG QUẢN LÝ CƠ SỞ — /admin/branches                 */}
      {/* ======================================================== */}
      {isBranchesPage && (
        <div>
          <PageHeader
            title="Quản lý cơ sở thực tập"
            subtitle="Danh sách các chi nhánh"
            breadcrumbs={[
              { label: 'Trang chủ', link: '/' },
              { label: 'Admin', link: '/admin' },
              { label: 'Quản lý cơ sở' },
            ]}
          >
            <button
              onClick={() => setShowBranchForm(!showBranchForm)}
              className="btn btn-sm btn-primary d-flex align-items-center gap-1.5"
            >
              <i className={`bi ${showBranchForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
              <span>{showBranchForm ? 'Đóng' : 'Thêm mới'}</span>
            </button>
          </PageHeader>

          {/* Form thêm cơ sở */}
          {showBranchForm && (
            <div className="card shadow-sm border border-primary border-opacity-25 mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-building-add text-primary me-2"></i>
                  Thêm cơ sở mới
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleCreateBranch}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="branch_name">
                        Tên cơ sở / Chi nhánh <span className="text-danger">*</span>
                      </label>
                      <input
                        id="branch_name"
                        type="text"
                        value={branchForm.name}
                        onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))}
                        required
                        placeholder="Ví dụ: Cơ sở 7 - Nha Trang"
                        className="form-control"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="branch_address">
                        Địa chỉ chi nhánh <span className="text-danger">*</span>
                      </label>
                      <input
                        id="branch_address"
                        type="text"
                        value={branchForm.address}
                        onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
                        required
                        placeholder="Số nhà, tên đường, quận/huyện, thành phố"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-sm btn-primary px-4 fw-semibold">
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBranchForm(false)}
                      className="btn btn-sm btn-outline-secondary px-3"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Danh sách cơ sở */}
          <div className="card shadow-sm border">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
              <h5 className="fw-bold text-dark mb-0">Hệ thống cơ sở toàn quốc</h5>
              <span className="badge bg-light text-muted border">{branches.length} chi nhánh</span>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="ps-4">Tên cơ sở</th>
                      <th scope="col">Địa chỉ</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch) => (
                      <tr key={branch.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="bg-primary-subtle text-primary border border-primary-subtle rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}
                            >
                              <i className="bi bi-buildings"></i>
                            </div>
                            <strong className="text-dark">{branch.name}</strong>
                          </div>
                        </td>
                        <td className="text-secondary small">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-geo-alt text-primary flex-shrink-0"></i>
                            <span>{branch.address}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={branch.status} />
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button
                              onClick={() => handleToggleBranch(branch)}
                              className={`btn btn-sm d-inline-flex align-items-center gap-2 ${branch.status === 'ACTIVE'
                                ? 'btn-outline-danger'
                                : 'btn-outline-success'
                                }`}
                            >
                              <i className={`bi ${branch.status === 'ACTIVE' ? 'bi-dash-circle' : 'bi-check-circle'}`}></i>
                              <span>{branch.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch)}
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2"
                              title={`Xóa cơ sở ${branch.name}`}
                            >
                              <i className="bi bi-trash3"></i>
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TRANG QUẢN LÝ NGƯỜI DÙNG — /admin/users               */}
      {/* ======================================================== */}
      {isUsersPage && (
        <div>
          <PageHeader
            title="Quản lý người dùng hệ thống"
            subtitle="Phân quyền tài khoản, gán cơ sở và kiểm soát trạng thái truy cập của nhân sự"
            breadcrumbs={[
              { label: 'Trang chủ', link: '/' },
              { label: 'Admin', link: '/admin' },
              { label: 'Quản lý người dùng' },
            ]}
          >
            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="btn btn-sm btn-primary d-flex align-items-center gap-1.5"
            >
              <i className={`bi ${showUserForm ? 'bi-x-lg' : 'bi-person-plus'}`}></i>
              <span>{showUserForm ? 'Đóng biểu mẫu' : 'Thêm người dùng mới'}</span>
            </button>
          </PageHeader>

          {/* Form thêm tài khoản */}
          {showUserForm && (
            <div className="card shadow-sm border border-primary border-opacity-25 mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-person-plus-fill text-primary me-2"></i>
                  Khởi tạo tài khoản nhân sự mới
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleCreateUser}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="user_name">
                        Họ và tên <span className="text-danger">*</span>
                      </label>
                      <input
                        id="user_name"
                        type="text"
                        value={userForm.full_name}
                        onChange={(e) => setUserForm((p) => ({ ...p, full_name: e.target.value }))}
                        required
                        placeholder="Nguyễn Văn A"
                        className="form-control"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="user_email">
                        Email đăng nhập <span className="text-danger">*</span>
                      </label>
                      <input
                        id="user_email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                        required
                        placeholder="user@vymitech.vn"
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold" htmlFor="user_pw">
                        Mật khẩu khởi tạo <span className="text-danger">*</span>
                      </label>
                      <input
                        id="user_pw"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                        required
                        minLength={6}
                        placeholder="Ít nhất 6 ký tự"
                        className="form-control"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold" htmlFor="user_phone">
                        Số điện thoại
                      </label>
                      <input
                        id="user_phone"
                        type="tel"
                        value={userForm.phone}
                        onChange={(e) => setUserForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="0987654321"
                        className="form-control"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold" htmlFor="user_role">
                        Vai trò phân quyền <span className="text-danger">*</span>
                      </label>
                      <select
                        id="user_role"
                        value={userForm.role}
                        onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                        required
                        className="form-select"
                      >
                        <option value="HR">HR (Quản lý nhân sự)</option>
                        <option value="MENTOR">Mentor (Người hướng dẫn)</option>
                        <option value="ADMIN">Admin (Quản trị hệ thống)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="user_branch">
                      Trực thuộc cơ sở
                    </label>
                    <select
                      id="user_branch"
                      value={userForm.branch_id}
                      onChange={(e) => setUserForm((p) => ({ ...p, branch_id: e.target.value }))}
                      className="form-select"
                    >
                      <option value="">-- Toàn hệ thống (Admin) --</option>
                      {branches
                        .filter((b) => b.status === 'ACTIVE')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-sm btn-primary px-4 fw-semibold">
                      Tạo tài khoản
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUserForm(false)}
                      className="btn btn-sm btn-outline-secondary px-3"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bộ lọc vai trò, cơ sở, tìm kiếm & Bảng người dùng */}
          <div className="card shadow-sm border">
            <div className="card-header bg-white py-3">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold text-dark mb-0">Danh sách tài khoản hệ thống</h5>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                    {filteredUsers.length} tài khoản
                  </span>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  {/* Ô tìm kiếm người dùng */}
                  <div className="input-group input-group-sm" style={{ minWidth: '240px', maxWidth: '320px' }}>
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Tìm họ tên, email, SĐT, cơ sở..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                    />
                    {userSearch && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-start-0 bg-white text-muted"
                        onClick={() => {
                          setUserSearch('');
                          setUserPage(1);
                        }}
                        title="Xóa tìm kiếm"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>

                  {/* Lọc vai trò */}
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="HR">HR (Nhân sự)</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="INTERN">Thực tập sinh</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  {/* Lọc cơ sở */}
                  <select
                    value={userBranchFilter}
                    onChange={(e) => {
                      setUserBranchFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="form-select form-select-sm"
                    style={{ width: '160px' }}
                  >
                    <option value="">Tất cả cơ sở</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  {/* Nút đặt lại bộ lọc */}
                  {(userSearch || userRoleFilter || userBranchFilter) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      onClick={() => {
                        setUserSearch('');
                        setUserRoleFilter('');
                        setUserBranchFilter('');
                        setUserPage(1);
                      }}
                      title="Đặt lại bộ lọc"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="ps-4">Họ và tên</th>
                      <th scope="col">Email & Số điện thoại</th>
                      <th scope="col">Vai trò</th>
                      <th scope="col">Cơ sở trực thuộc</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-5 text-center text-muted">
                          <div className="py-3">
                            <i className="bi bi-person-x display-6 text-secondary d-block mb-2"></i>
                            <h6 className="fw-bold text-dark mb-1">Không tìm thấy người dùng phù hợp</h6>
                            <p className="small text-muted mb-3">
                              {userSearch || userRoleFilter || userBranchFilter
                                ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.'
                                : 'Chưa có tài khoản người dùng nào trong hệ thống.'}
                            </p>
                            {(userSearch || userRoleFilter || userBranchFilter) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setUserSearch('');
                                  setUserRoleFilter('');
                                  setUserBranchFilter('');
                                  setUserPage(1);
                                }}
                              >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}
                              >
                                {u.full_name?.[0]?.toUpperCase()}
                              </div>
                              <strong className="text-dark">{u.full_name}</strong>
                            </div>
                          </td>
                          <td className="small">
                            <div className="text-dark d-flex align-items-center gap-2 mb-1">
                              <i className="bi bi-envelope text-muted flex-shrink-0"></i>
                              <span>{u.email}</span>
                            </div>
                            <div className="text-muted d-flex align-items-center gap-2">
                              <i className="bi bi-telephone text-muted flex-shrink-0"></i>
                              <span>{u.phone || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border px-2 py-1">
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td className="small text-muted">
                            {u.branch_name ? (
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-geo-alt text-primary flex-shrink-0"></i>
                                <span>{u.branch_name}</span>
                              </div>
                            ) : (
                              <span className="text-secondary">Toàn hệ thống</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={u.status || 'ACTIVE'} />
                          </td>
                          <td className="text-end pe-4">
                            {u.role !== 'ADMIN' && (
                              <div className="d-flex align-items-center justify-content-end gap-2">
                                <button
                                  onClick={() => handleToggleUser(u)}
                                  className={`btn btn-sm d-inline-flex align-items-center gap-2 ${(u.status || 'ACTIVE') === 'ACTIVE'
                                    ? 'btn-outline-danger'
                                    : 'btn-outline-success'
                                    }`}
                                >
                                  <i className={`bi ${(u.status || 'ACTIVE') === 'ACTIVE' ? 'bi-lock' : 'bi-unlock'}`}></i>
                                  <span>{(u.status || 'ACTIVE') === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2"
                                  title={`Xóa tài khoản ${u.full_name}`}
                                >
                                  <i className="bi bi-trash3"></i>
                                  <span>Xóa</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phân trang danh sách người dùng */}
            {totalUserPages > 1 && (
              <div className="card-footer bg-white d-flex flex-column flex-sm-row justify-content-between align-items-center py-2 px-4 border-top gap-2">
                <span className="small text-muted">
                  Hiển thị {((safeUserPage - 1) * USER_PAGE_SIZE) + 1} - {Math.min(safeUserPage * USER_PAGE_SIZE, filteredUsers.length)} trên tổng số {filteredUsers.length} tài khoản
                </span>
                <Pagination
                  currentPage={safeUserPage}
                  totalPages={totalUserPages}
                  onPageChange={(p) => setUserPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal xem hồ sơ CV */}
      <CvViewerModal
        isOpen={!!viewingCv}
        onClose={() => setViewingCv(null)}
        cv={viewingCv}
      />
    </DashboardLayout>
  );
}
