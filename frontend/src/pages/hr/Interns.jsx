import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

export default function HRInterns() {
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/hr/interns'),
      api.get('/hr/mentors'),
    ])
      .then(([iRes, mRes]) => {
        setInterns(iRes.data.data || []);
        setMentors(mRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    await api.patch(`/hr/interns/${assignModal.id}/assign-mentor`, {
      mentor_id: selectedMentor,
      start_date: startDate,
      end_date: endDate,
    });
    const res = await api.get('/hr/interns');
    setInterns(res.data.data || []);
    setAssignModal(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách Thực tập sinh..." />
        </div>
      </DashboardLayout>
    );
  }

  const upcomingCount = interns.filter((i) => i.status === 'UPCOMING').length;
  const inProgressCount = interns.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = interns.filter((i) => i.status === 'COMPLETED').length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Quản lý Thực tập sinh"
        subtitle="Theo dõi tiến độ đào tạo, phân công Mentor hướng dẫn và cập nhật kết quả thực tập"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Nhân sự', link: '/hr' },
          { label: 'Thực tập sinh' },
        ]}
      />

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tổng số thực tập sinh"
            value={interns.length}
            icon="bi-mortarboard"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Sắp bắt đầu"
            value={upcomingCount}
            icon="bi-calendar-event"
            variant="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đang thực tập"
            value={inProgressCount}
            icon="bi-arrow-repeat"
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đã hoàn thành"
            value={completedCount}
            icon="bi-award"
            variant="success"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
          <h5 className="fw-bold text-dark mb-0">Danh sách Thực tập sinh doanh nghiệp</h5>
          <span className="badge bg-light text-muted border">{interns.length} bạn</span>
        </div>

        <div className="card-body p-0">
          {interns.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title="Chưa có thực tập sinh nào"
              description="Các ứng viên sau khi được duyệt hồ sơ sẽ chuyển sang danh sách thực tập sinh để phân công Mentor."
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Thực tập sinh</th>
                    <th scope="col">Vị trí & Cơ sở</th>
                    <th scope="col">Mentor phụ trách</th>
                    <th scope="col">Thời gian thực tập</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="text-end pe-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => (
                    <tr key={intern.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: '34px', height: '34px', fontSize: '0.9rem' }}
                          >
                            {intern.intern_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-dark d-block">{intern.intern_name}</strong>
                            <span className="text-muted small">{intern.intern_email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="text-dark small d-block">{intern.position_title}</strong>
                        {intern.branch_name && (
                          <span className="badge bg-light text-secondary border small">
                            {intern.branch_name}
                          </span>
                        )}
                      </td>
                      <td>
                        {intern.mentor_name ? (
                          <span className="text-dark fw-medium small">
                            <i className="bi bi-person-check text-success me-1"></i>
                            {intern.mentor_name}
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                            <i className="bi bi-exclamation-triangle me-1"></i> Chưa có Mentor
                          </span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {intern.start_date ? (
                          <span>
                            {new Date(intern.start_date).toLocaleDateString('vi-VN')} –{' '}
                            {new Date(intern.end_date).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="fst-italic">Chưa thiết lập</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={intern.status} />
                      </td>
                      <td className="text-end pe-4">
                        {!intern.mentor_id && intern.status !== 'CANCELLED' ? (
                          <button
                            onClick={() => {
                              setAssignModal(intern);
                              setSelectedMentor('');
                              setStartDate('');
                              setEndDate('');
                            }}
                            className="btn btn-sm btn-primary"
                          >
                            <i className="bi bi-person-plus me-1"></i> Phân công Mentor
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAssignModal(intern);
                              setSelectedMentor(intern.mentor_id || '');
                              setStartDate(intern.start_date ? intern.start_date.split('T')[0] : '');
                              setEndDate(intern.end_date ? intern.end_date.split('T')[0] : '');
                            }}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Điều chỉnh
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Mentor Modal */}
      {assignModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-person-gear text-primary me-2"></i>
                    Phân công Mentor & Kỳ thực tập
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAssignModal(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <form onSubmit={handleAssignMentor}>
                  <div className="modal-body">
                    <div className="bg-light p-3 rounded border mb-3 small">
                      <span className="text-muted d-block">Thực tập sinh:</span>
                      <strong className="text-dark fs-6">{assignModal.intern_name}</strong>
                      <span className="d-block text-secondary mt-1">
                        Vị trí: {assignModal.position_title}
                      </span>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="mentor_id">
                        Chọn Mentor hướng dẫn <span className="text-danger">*</span>
                      </label>
                      <select
                        id="mentor_id"
                        value={selectedMentor}
                        onChange={(e) => setSelectedMentor(e.target.value)}
                        required
                        className="form-select"
                      >
                        <option value="">-- Chọn Mentor --</option>
                        {mentors.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold" htmlFor="start_date">
                          Ngày bắt đầu <span className="text-danger">*</span>
                        </label>
                        <input
                          id="start_date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold" htmlFor="end_date">
                          Ngày kết thúc <span className="text-danger">*</span>
                        </label>
                        <input
                          id="end_date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setAssignModal(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4">
                      Lưu phân công
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
