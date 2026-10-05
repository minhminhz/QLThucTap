import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import CvViewerModal from '../../components/common/CvViewerModal';
import eventBus from '../../services/eventBus';

export default function ApplicantDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingCv, setViewingCv] = useState(null);

  const fetchApplications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const r = await api.get('/applications/my');
      setApplications(r.data.data || []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Listen for cross-tab updates (e.g. submitted new CV, or HR reviewed status)
    const unsubSubmitted = eventBus.on('APPLICATION_SUBMITTED', () => {
      fetchApplications();
    });
    const unsubUpdated = eventBus.on('APPLICATION_UPDATED', () => {
      fetchApplications();
    });

    // Auto-poll every 15s
    const timer = setInterval(() => fetchApplications(), 15000);

    return () => {
      unsubSubmitted();
      unsubUpdated();
      clearInterval(timer);
    };
  }, []);

  const pendingCount = applications.filter((a) => ['PENDING', 'REVIEWING'].includes(a.status)).length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Bảng điều khiển Ứng viên"
        subtitle="Theo dõi tình trạng và phản hồi của tất cả hồ sơ ứng tuyển bạn đã nộp"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Dashboard Ứng viên' },
        ]}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => fetchApplications(true)}
            disabled={refreshing}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 shadow-sm"
            title="Làm mới trạng thái hồ sơ"
          >
            <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i>
            <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <Link to="/positions" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
            <i className="bi bi-search me-1"></i> Xem vị trí đang tuyển
          </Link>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tổng hồ sơ đã nộp"
            value={applications.length}
            icon="bi-file-earmark-text"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đang xét duyệt"
            value={pendingCount}
            icon="bi-hourglass-split"
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Được chấp nhận"
            value={approvedCount}
            icon="bi-check-circle"
            variant="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Bị từ chối"
            value={rejectedCount}
            icon="bi-x-circle"
            variant="danger"
          />
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
          <h5 className="card-title fw-bold text-dark mb-0">
            <i className="bi bi-folder2-open text-primary me-2"></i>
            Danh sách đơn ứng tuyển của tôi
          </h5>
          <span className="badge bg-light text-muted border">
            {applications.length} hồ sơ
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="py-5 text-center">
              <Loading text="Đang nạp danh sách hồ sơ..." />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon="bi-inbox"
              title="Bạn chưa ứng tuyển vị trí nào"
              description="Hãy tham khảo danh sách các vị trí thực tập hấp dẫn tại VYMI Tech và nộp hồ sơ ngay hôm nay."
              actionText="Khám phá vị trí tuyển dụng"
              actionLink="/positions"
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Vị trí thực tập</th>
                    <th scope="col">Cơ sở</th>
                    <th scope="col">Ngày nộp</th>
                    <th scope="col">Hồ sơ CV</th>
                    <th scope="col">Ghi chú từ HR</th>
                    <th scope="col" className="text-end pe-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="ps-4">
                        <strong className="text-dark d-block">{app.position_title}</strong>
                        {app.position_id && (
                          <Link
                            to={`/positions/${app.position_id}`}
                            className="text-primary small text-decoration-none"
                          >
                            Xem chi tiết vị trí →
                          </Link>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-geo-alt me-1 text-primary"></i>
                          {app.branch_name}
                        </span>
                      </td>
                      <td className="small text-muted">
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(app.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        {(app.cv_id || app.cv_file_path) ? (
                          <button
                            type="button"
                            onClick={() => setViewingCv({
                              cv_id: app.cv_id,
                              cv_original_name: app.cv_original_name || 'Hồ sơ CV',
                              cv_file_path: app.cv_file_path,
                              applicant_name: 'Tôi',
                              position_title: app.position_title
                            })}
                            className="btn btn-sm btn-outline-primary py-0.5 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                            title="Xem lại CV đã nộp"
                          >
                            <i className="bi bi-file-earmark-pdf"></i> Xem CV
                          </button>
                        ) : (
                          <span className="text-muted small fst-italic">--</span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {(app.hr_note || app.note) ? (
                          <span className="text-dark">
                            <i className="bi bi-chat-left-dots text-primary me-1"></i>
                            {app.hr_note || app.note}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Chưa có phản hồi</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal xem hồ sơ CV */}
      <CvViewerModal
        isOpen={!!viewingCv}
        onClose={() => setViewingCv(null)}
        cv={viewingCv}
      />
    </DashboardLayout>
  );
}
