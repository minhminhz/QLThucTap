import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';

export default function HRMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hr/mentors')
      .then((r) => setMentors(r.data.data || []))
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách Mentor..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Danh sách Mentor hướng dẫn"
        subtitle="Đội ngũ kỹ sư hướng dẫn chuyên môn và kèm cặp thực tập sinh tại cơ sở"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Nhân sự', link: '/hr' },
          { label: 'Danh sách Mentor' },
        ]}
      />

      {mentors.length === 0 ? (
        <EmptyState
          icon="bi-person-video3"
          title="Chưa có Mentor nào trong cơ sở"
          description="Hiện tại chưa có tài khoản Mentor nào thuộc cơ sở này. Vui lòng liên hệ Quản trị viên (Admin) để khởi tạo tài khoản."
        />
      ) : (
        <div className="row g-3">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="col-12 col-md-6 col-xl-4">
              <div className="card h-100 border shadow-xs">
                <div className="card-body p-4 d-flex align-items-center gap-3">
                  <div
                    className="bg-primary-subtle text-primary border border-primary-subtle rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
                  >
                    {mentor.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <strong className="text-dark d-block text-truncate">{mentor.full_name}</strong>
                    <span className="text-muted small d-block text-truncate">
                      <i className="bi bi-envelope me-1"></i>
                      {mentor.email}
                    </span>
                    {mentor.phone && (
                      <span className="text-muted small d-block">
                        <i className="bi bi-telephone me-1"></i>
                        {mentor.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={mentor.status || 'ACTIVE'} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
