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

// ====================================================================
// DỮ LIỆU MẪU MẶC ĐỊNH (CHUẨN DOANH NGHIỆP VYMI TECH)
// ====================================================================
const MOCK_BRANCHES = [
  { id: 1, name: 'Cơ sở 1 - Hà Nội (Trụ sở chính)', address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', status: 'ACTIVE' },
  { id: 2, name: 'Cơ sở 2 - TP. Hồ Chí Minh', address: 'Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM', status: 'ACTIVE' },
  { id: 3, name: 'Cơ sở 3 - Đà Nẵng', address: 'Tòa nhà FPT Complex, KCN An Đồn, Đà Nẵng', status: 'ACTIVE' },
  { id: 4, name: 'Cơ sở 4 - Cần Thơ', address: 'Đại lộ Hòa Bình, Quận Ninh Kiều, Cần Thơ', status: 'ACTIVE' },
  { id: 5, name: 'Cơ sở 5 - Hải Phòng', address: 'Số 12 Lạch Tray, Quận Ngô Quyền, Hải Phòng', status: 'ACTIVE' },
  { id: 6, name: 'Cơ sở 6 - Bình Dương', address: 'Tòa nhà Becamex Tower, TP. Thủ Dầu Một, Bình Dương', status: 'INACTIVE' },
];

const MOCK_USERS = [
  { id: 101, full_name: 'Trần Thu Hà', email: 'ha.tran@vymitech.vn', phone: '0982 123 456', role: 'HR', branch_id: 1, branch_name: 'Cơ sở 1 - Hà Nội (Trụ sở chính)', status: 'ACTIVE', assigned_interns: 18, assigned_apps: 24, title: 'Trưởng ban Tuyển dụng & Đào tạo' },
  { id: 102, full_name: 'Phạm Thanh Thảo', email: 'thao.pham@vymitech.vn', phone: '0903 789 012', role: 'HR', branch_id: 2, branch_name: 'Cơ sở 2 - TP. Hồ Chí Minh', status: 'ACTIVE', assigned_interns: 25, assigned_apps: 32, title: 'Chuyên viên Nhân sự cấp cao' },
  { id: 103, full_name: 'Nguyễn Thị Mai', email: 'mai.nguyen@vymitech.vn', phone: '0914 567 890', role: 'HR', branch_id: 3, branch_name: 'Cơ sở 3 - Đà Nẵng', status: 'ACTIVE', assigned_interns: 14, assigned_apps: 19, title: 'Chuyên viên Nhân sự & Tiếp nhận' },
  { id: 104, full_name: 'Nguyễn Hữu Tài', email: 'tai.nguyen@vymitech.vn', phone: '0935 234 567', role: 'HR', branch_id: 4, branch_name: 'Cơ sở 4 - Cần Thơ', status: 'ACTIVE', assigned_interns: 10, assigned_apps: 15, title: 'Điều phối viên Thực tập sinh' },
  { id: 105, full_name: 'Đặng Quang Minh', email: 'minh.dang@vymitech.vn', phone: '0976 345 678', role: 'HR', branch_id: 5, branch_name: 'Cơ sở 5 - Hải Phòng', status: 'ACTIVE', assigned_interns: 8, assigned_apps: 12, title: 'Chuyên viên Quản lý Thực tập' },
  { id: 106, full_name: 'Vũ Kim Anh', email: 'anh.vu@vymitech.vn', phone: '0968 889 999', role: 'HR', branch_id: 1, branch_name: 'Cơ sở 1 - Hà Nội (Trụ sở chính)', status: 'ACTIVE', assigned_interns: 16, assigned_apps: 21, title: 'Chuyên viên Tuyển dụng Doanh nghiệp' },
  { id: 107, full_name: 'Lê Bảo Ngọc', email: 'ngoc.le@vymitech.vn', phone: '0942 334 455', role: 'HR', branch_id: 2, branch_name: 'Cơ sở 2 - TP. Hồ Chí Minh', status: 'ACTIVE', assigned_interns: 20, assigned_apps: 28, title: 'Chuyên viên Nhân sự & Đối ngoại' },
  { id: 108, full_name: 'Lý Quốc Dũng', email: 'dung.ly@vymitech.vn', phone: '0918 999 111', role: 'HR', branch_id: 6, branch_name: 'Cơ sở 6 - Bình Dương', status: 'INACTIVE', assigned_interns: 0, assigned_apps: 0, title: 'Phụ trách Chi nhánh mới' },

  { id: 201, full_name: 'Nguyễn Minh Tuấn', email: 'tuan.nguyen@vymitech.vn', phone: '0901 223 344', role: 'MENTOR', branch_id: 1, branch_name: 'Cơ sở 1 - Hà Nội (Trụ sở chính)', status: 'ACTIVE' },
  { id: 202, full_name: 'Hoàng Văn Bách', email: 'bach.hoang@vymitech.vn', phone: '0902 334 455', role: 'MENTOR', branch_id: 1, branch_name: 'Cơ sở 1 - Hà Nội (Trụ sở chính)', status: 'ACTIVE' },
  { id: 203, full_name: 'Lê Hoàng Nam', email: 'nam.le@vymitech.vn', phone: '0903 445 566', role: 'INTERN', branch_id: 1, branch_name: 'Cơ sở 1 - Hà Nội (Trụ sở chính)', status: 'ACTIVE' },
  { id: 204, full_name: 'Đỗ Quốc Bảo', email: 'bao.do@vymitech.vn', phone: '0904 556 677', role: 'MENTOR', branch_id: 2, branch_name: 'Cơ sở 2 - TP. Hồ Chí Minh', status: 'ACTIVE' },
  { id: 205, full_name: 'Vũ Đức Trọng', email: 'trong.vu@vymitech.vn', phone: '0905 667 788', role: 'INTERN', branch_id: 2, branch_name: 'Cơ sở 2 - TP. Hồ Chí Minh', status: 'ACTIVE' },
  { id: 206, full_name: 'Trần Văn Hưng', email: 'hung.tran@vymitech.vn', phone: '0906 778 899', role: 'MENTOR', branch_id: 3, branch_name: 'Cơ sở 3 - Đà Nẵng', status: 'ACTIVE' },
  { id: 207, full_name: 'Hoàng Yến Nhi', email: 'nhi.hoang@vymitech.vn', phone: '0907 889 900', role: 'INTERN', branch_id: 3, branch_name: 'Cơ sở 3 - Đà Nẵng', status: 'ACTIVE' },
  { id: 208, full_name: 'Lâm Gia Huy', email: 'huy.lam@vymitech.vn', phone: '0908 990 011', role: 'MENTOR', branch_id: 4, branch_name: 'Cơ sở 4 - Cần Thơ', status: 'ACTIVE' },
  { id: 209, full_name: 'Bùi Anh Tuấn', email: 'tuan.bui@vymitech.vn', phone: '0909 001 122', role: 'INTERN', branch_id: 4, branch_name: 'Cơ sở 4 - Cần Thơ', status: 'ACTIVE' },
  { id: 210, full_name: 'Trịnh Kim Ngân', email: 'ngan.trinh@vymitech.vn', phone: '0910 112 233', role: 'MENTOR', branch_id: 5, branch_name: 'Cơ sở 5 - Hải Phòng', status: 'ACTIVE' },
  { id: 211, full_name: 'Cao Bá Đạt', email: 'dat.cao@vymitech.vn', phone: '0911 223 344', role: 'INTERN', branch_id: 5, branch_name: 'Cơ sở 5 - Hải Phòng', status: 'ACTIVE' },
];

const MOCK_APPLICATIONS = [
  { id: 1, applicant_name: 'Nguyễn Văn An', applicant_email: 'an.nguyen@gmail.com', applicant_phone: '0912 345 678', position_title: 'Frontend React.js Developer Intern', branch_name: 'Cơ sở 1 - Hà Nội', status: 'PENDING', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), cv_file_path: '/uploads/cv_nguyen_van_an.pdf', cover_letter: 'Em đã xây dựng nhiều dự án với React và muốn học hỏi quy trình Agile thực tế.' },
  { id: 2, applicant_name: 'Trần Thị Mai Phương', applicant_email: 'phuong.tran@gmail.com', applicant_phone: '0987 654 321', position_title: 'Backend Node.js / Express Intern', branch_name: 'Cơ sở 2 - TP. Hồ Chí Minh', status: 'REVIEWING', created_at: new Date(Date.now() - 86400000).toISOString(), cv_file_path: '/uploads/cv_tran_mai_phuong.pdf', cover_letter: 'Em đã có kinh nghiệm thiết kế RESTful API với MySQL và JWT authentication.' },
  { id: 3, applicant_name: 'Lê Quốc Huy', applicant_email: 'huy.le@outlook.com', applicant_phone: '0903 112 233', position_title: 'AI & Machine Learning Intern', branch_name: 'Cơ sở 2 - TP. Hồ Chí Minh', status: 'APPROVED', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), cv_file_path: '/uploads/cv_le_quoc_huy.pdf', cover_letter: 'Điểm GPA 3.8/4.0 chuyên ngành AI, có bài báo hội nghị sinh viên về NLP.' },
  { id: 4, applicant_name: 'Phạm Minh Trang', applicant_email: 'trang.pm@gmail.com', applicant_phone: '0934 567 890', position_title: 'UI/UX Product Designer Intern', branch_name: 'Cơ sở 3 - Đà Nẵng', status: 'PENDING', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), cv_file_path: '/uploads/cv_pham_minh_trang.pdf', cover_letter: 'Thành thạo Figma, Design System, Wireframing và nghiên cứu hành vi người dùng.' },
  { id: 5, applicant_name: 'Vũ Đức Long', applicant_email: 'long.vu@hotmail.com', applicant_phone: '0978 999 888', position_title: 'DevOps & Cloud Engineer Intern', branch_name: 'Cơ sở 1 - Hà Nội', status: 'REVIEWING', created_at: new Date(Date.now() - 86400000 * 4).toISOString(), cv_file_path: '/uploads/cv_vu_duc_long.pdf', cover_letter: 'Nắm vững kiến thức Docker, CI/CD GitHub Actions, Linux Server.' },
  { id: 6, applicant_name: 'Đỗ Hoàng Yến', applicant_email: 'yen.do@gmail.com', applicant_phone: '0911 223 344', position_title: 'Business Analyst (BA) Intern', branch_name: 'Cơ sở 4 - Cần Thơ', status: 'APPROVED', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), cv_file_path: '/uploads/cv_do_hoang_yen.pdf', cover_letter: 'Kỹ năng phân tích nghiệp vụ, viết User Story, vẽ UML Sequence Diagram.' },
  { id: 7, applicant_name: 'Ngô Hải Đăng', applicant_email: 'dang.ngo@gmail.com', applicant_phone: '0944 556 677', position_title: 'Mobile App Developer (Flutter) Intern', branch_name: 'Cơ sở 3 - Đà Nẵng', status: 'REJECTED', created_at: new Date(Date.now() - 86400000 * 6).toISOString(), cv_file_path: '/uploads/cv_ngo_hai_dang.pdf', cover_letter: 'Có đồ án môn học viết ứng dụng thương mại điện tử bằng Flutter/Dart.' },
  { id: 8, applicant_name: 'Cao Khánh Linh', applicant_email: 'linh.cao@gmail.com', applicant_phone: '0922 334 455', position_title: 'QA / QC Software Tester Intern', branch_name: 'Cơ sở 5 - Hải Phòng', status: 'PENDING', created_at: new Date(Date.now() - 86400000 * 7).toISOString(), cv_file_path: '/uploads/cv_cao_khanh_linh.pdf', cover_letter: 'Nắm chắc kiến thức viết Test Case, Test Plan, tìm lỗi Functional Testing.' }
];

export default function AdminDashboard() {
  const location = useLocation();

  // Dữ liệu
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [users, setUsers] = useState(MOCK_USERS);
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [loading, setLoading] = useState(false);

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

      if (apiBranches.length > 0) {
        const merged = [...apiBranches];
        MOCK_BRANCHES.forEach((m) => {
          if (!merged.some((b) => b.id === m.id || b.name.toLowerCase() === m.name.toLowerCase())) {
            merged.push(m);
          }
        });
        setBranches(merged);
      }

      if (apiUsers.length > 0) {
        const merged = [...apiUsers];
        MOCK_USERS.forEach((m) => {
          if (!merged.some((u) => u.email === m.email || u.id === m.id)) {
            merged.push(m);
          }
        });
        setUsers(merged);
      }

      if (apiApps.length > 0) {
        setApplications(apiApps);
      }
    } catch (err) {
      console.log('Đang dùng dữ liệu mô phỏng:', err.message);
    } finally {
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
      await api.post('/admin/branches', branchForm);
      syncWithBackend();
    } catch {
      const newB = {
        id: Date.now(),
        name: branchForm.name,
        address: branchForm.address,
        status: 'ACTIVE'
      };
      setBranches((prev) => [newB, ...prev]);
    }
    setBranchForm({ name: '', address: '' });
    setShowBranchForm(false);
  };

  const handleToggleBranch = async (branch) => {
    const newStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/branches/${branch.id}/status`, { status: newStatus });
    } catch {}
    setBranches((prev) =>
      prev.map((b) => (b.id === branch.id ? { ...b, status: newStatus } : b))
    );
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', userForm);
      syncWithBackend();
    } catch {
      const selectedB = branches.find((b) => String(b.id) === String(userForm.branch_id));
      const newU = {
        id: Date.now(),
        full_name: userForm.full_name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        branch_id: userForm.branch_id,
        branch_name: selectedB ? selectedB.name : 'Toàn hệ thống',
        status: 'ACTIVE'
      };
      setUsers((prev) => [newU, ...prev]);
    }
    setUserForm({ full_name: '', email: '', password: '', phone: '', role: 'HR', branch_id: '' });
    setShowUserForm(false);
  };

  const handleToggleUser = async (user) => {
    const newStatus = (user.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
    } catch {}
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
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

  // Lọc người dùng
  const filteredUsers = users.filter((u) => {
    if (!userRoleFilter) return true;
    return u.role === userRoleFilter;
  });

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
                <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
              </button>
              <Link to="/admin/branches" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-sm">
                <i className="bi bi-buildings"></i> Quản lý cơ sở
              </Link>
              <Link to="/admin/users" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
                <i className="bi bi-people-fill"></i> Quản lý người dùng
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
                  Thống kê nhân sự từng cơ sở
                </h5>
                <span className="text-muted small">
                  Hiển thị hệ thống {branches.length} chi nhánh trên toàn quốc
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
                      style={{ width: '310px' }}
                    >
                      <div className="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                            <h6 className="fw-bold text-dark mb-0 text-truncate" title={b.name}>
                              {b.name}
                            </h6>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-muted small text-truncate mb-3" title={b.address}>
                            <i className="bi bi-geo-alt me-1 text-primary"></i>
                            {b.address}
                          </p>

                          <div className="bg-light p-2.5 rounded border small mb-3 d-flex flex-column gap-1.5">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Nhân sự HR:</span>
                              <strong className="text-dark">{branchHRs.length} người</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Mentor hướng dẫn:</span>
                              <strong className="text-dark">{branchMentors.length} người</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Thực tập sinh:</span>
                              <strong className="text-dark">{branchInterns.length} người</strong>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                          <span className="text-muted">Tổng nhân lực:</span>
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
                  Danh sách phụ trách và thông tin liên hệ ({hrUsers.length} nhân sự)
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
                          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                            <div className="d-flex align-items-center gap-2.5">
                              <div
                                className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold"
                                style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}
                              >
                                {hr.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-dark d-block">{hr.full_name}</strong>
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
                                  {hr.title || 'Chuyên viên Nhân sự'}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={hr.status || 'ACTIVE'} />
                          </div>

                          <div className="bg-white p-2.5 rounded border small mb-2 d-flex flex-column gap-1">
                            <div>
                              <span className="text-muted me-1">Email:</span>
                              <strong className="text-dark">{hr.email}</strong>
                            </div>
                            <div>
                              <span className="text-muted me-1">Điện thoại:</span>
                              <strong className="text-dark">{hr.phone || '0987 654 321'}</strong>
                            </div>
                            <div className="text-truncate">
                              <span className="text-muted me-1">Cơ sở:</span>
                              <span className="text-primary fw-medium">{hr.branch_name || 'Toàn hệ thống'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between pt-2 border-top small text-muted">
                          <span>Phụ trách: <strong className="text-dark">{hr.assigned_interns || 12} TTS</strong></span>
                          <span>Đã nhận: <strong className="text-dark">{hr.assigned_apps || 18} hồ sơ</strong></span>
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
                  Hiển thị {filteredApps.length} đơn ứng tuyển phù hợp
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
            subtitle="Danh sách các chi nhánh tiếp nhận sinh viên thực tập của doanh nghiệp VYMI Tech"
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
              <span>{showBranchForm ? 'Đóng biểu mẫu' : 'Thêm cơ sở mới'}</span>
            </button>
          </PageHeader>

          {/* Form thêm cơ sở */}
          {showBranchForm && (
            <div className="card shadow-sm border border-primary border-opacity-25 mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-building-add text-primary me-2"></i>
                  Thêm cơ sở đào tạo mới
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
                      Tạo cơ sở
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
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-primary-subtle text-primary border border-primary-subtle rounded-3 d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px' }}
                            >
                              <i className="bi bi-buildings"></i>
                            </div>
                            <strong className="text-dark">{branch.name}</strong>
                          </div>
                        </td>
                        <td className="text-secondary small">
                          <i className="bi bi-geo-alt text-primary me-1"></i>
                          {branch.address}
                        </td>
                        <td>
                          <StatusBadge status={branch.status} />
                        </td>
                        <td className="text-end pe-4">
                          <button
                            onClick={() => handleToggleBranch(branch)}
                            className={`btn btn-sm ${
                              branch.status === 'ACTIVE'
                                ? 'btn-outline-danger'
                                : 'btn-outline-success'
                            }`}
                          >
                            {branch.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          </button>
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

          {/* Bộ lọc vai trò & Bảng người dùng */}
          <div className="card shadow-sm border">
            <div className="card-header bg-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 py-3">
              <h5 className="fw-bold text-dark mb-0">Danh sách tài khoản hệ thống</h5>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted text-nowrap">Lọc vai trò:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="form-select form-select-sm"
                  style={{ width: '180px' }}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="HR">HR (Nhân sự)</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="INTERN">Thực tập sinh</option>
                  <option value="ADMIN">Admin</option>
                </select>
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
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                            >
                              {u.full_name?.[0]?.toUpperCase()}
                            </div>
                            <strong className="text-dark">{u.full_name}</strong>
                          </div>
                        </td>
                        <td className="small">
                          <div className="text-dark">{u.email}</div>
                          <div className="text-muted">{u.phone || '—'}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {u.branch_name ? (
                            <span>
                              <i className="bi bi-geo-alt me-1 text-primary"></i>
                              {u.branch_name}
                            </span>
                          ) : (
                            <span className="text-secondary">Toàn hệ thống</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={u.status || 'ACTIVE'} />
                        </td>
                        <td className="text-end pe-4">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleUser(u)}
                              className={`btn btn-sm ${
                                (u.status || 'ACTIVE') === 'ACTIVE'
                                  ? 'btn-outline-danger'
                                  : 'btn-outline-success'
                              }`}
                            >
                              {(u.status || 'ACTIVE') === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                            </button>
                          )}
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

      {/* Modal xem hồ sơ CV */}
      <CvViewerModal
        isOpen={!!viewingCv}
        onClose={() => setViewingCv(null)}
        cv={viewingCv}
      />
    </DashboardLayout>
  );
}
