import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import CertificateModal from '../../components/common/CertificateModal';
import { useNotification } from '../../contexts/NotificationContext';

const CERT_STATUS_LABEL = {
  NONE: { label: 'Chưa yêu cầu', cls: 'bg-secondary' },
  REQUESTED: { label: 'Chờ duyệt', cls: 'bg-warning text-dark' },
  PENDING: { label: 'Chờ duyệt', cls: 'bg-warning text-dark' },
  APPROVED: { label: 'Đã cấp', cls: 'bg-success' },
  REJECTED: { label: 'Từ chối', cls: 'bg-danger' },
};

const HR_RESULT_LABEL = {
  PASSED: { label: 'Đạt', cls: 'bg-success' },
  FAILED: { label: 'Không đạt', cls: 'bg-danger' },
};

const HIRING_LABEL = {
  NONE: { label: 'Chưa quyết định', cls: 'bg-secondary' },
  OFFERED: { label: 'Mời tuyển dụng', cls: 'bg-success' },
  NOT_OFFERED: { label: 'Không tuyển', cls: 'bg-danger' },
  CONSIDERING: { label: 'Đang cân nhắc', cls: 'bg-info text-dark' },
  HIRED: { label: 'Đã tiếp nhận chính thức', cls: 'bg-primary' },
  DECLINED: { label: 'TTS từ chối Offer', cls: 'bg-dark' },
  REJECTED: { label: 'Không tuyển', cls: 'bg-danger' },
};

const DEAL_MEETING_STATUS_LABEL = {
  NONE: { label: 'Chưa đặt lịch', cls: 'bg-secondary' },
  PENDING_INTERN: { label: 'Chờ TTS xác nhận', cls: 'bg-warning text-dark' },
  PENDING_HR: { label: 'TTS đề xuất lịch mới', cls: 'bg-info text-dark' },
  CONFIRMED: { label: 'Đã chốt lịch', cls: 'bg-success' },
  COMPLETED: { label: 'Đã hoàn tất deal', cls: 'bg-primary' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-danger' },
};

export default function HRInterns() {
  const { notify } = useNotification();
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  // Assign Mentor Modal
  const [assignModal, setAssignModal] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Confirm Completion Modal
  const [confirmModal, setConfirmModal] = useState(null);
  const [hrResult, setHrResult] = useState('PASSED');
  const [hrReview, setHrReview] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Approve / Reject Certificate Modal
  const [certModal, setCertModal] = useState(null);
  const [certAction, setCertAction] = useState('APPROVE');
  const [certNote, setCertNote] = useState('');
  const [certLoading, setCertLoading] = useState(false);

  // Direct Issue Certificate Modal
  const [directCertModal, setDirectCertModal] = useState(null);
  const [directCertForm, setDirectCertForm] = useState({
    school_name: '',
    student_code: '',
    university_class: '',
    major_name: '',
    academic_year: ''
  });
  const [directCertLoading, setDirectCertLoading] = useState(false);

  // Hiring Decision Modal
  const [hiringModal, setHiringModal] = useState(null);
  const [hiringDecision, setHiringDecision] = useState('OFFERED');
  const [hiringNote, setHiringNote] = useState('');
  const [hiringLoading, setHiringLoading] = useState(false);

  // Deal Meeting Modal
  const [dealModal, setDealModal] = useState(null);
  const [dealForm, setDealForm] = useState({
    deal_meeting_time: '',
    deal_meeting_type: 'OFFLINE',
    deal_meeting_location: '',
    deal_meeting_note: ''
  });
  const [dealLoading, setDealLoading] = useState(false);

  // Reject Hiring After Interview / Deal Meeting Modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReasonType, setRejectReasonType] = useState('Chưa đáp ứng đủ yêu cầu chuyên môn / năng lực kỹ thuật của vị trí chính thức');
  const [rejectCustomNote, setRejectCustomNote] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Certificate Viewer Modal (Dual-document: Giấy xác nhận & Phiếu đánh giá)
  const [viewingCert, setViewingCert] = useState(null);

  const fetchData = async () => {
    try {
      const [iRes, mRes] = await Promise.all([
        api.get('/hr/interns'),
        api.get('/hr/mentors'),
      ]);
      setInterns(iRes.data.data || []);
      setMentors(mRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ---------- Assign Mentor ----------
  const handleAssignMentor = async (e) => {
    e.preventDefault();
    await api.patch(`/hr/interns/${assignModal.id}/assign-mentor`, {
      mentor_id: selectedMentor,
      start_date: startDate,
      end_date: endDate,
    });
    await fetchData();
    setAssignModal(null);
  };

  // ---------- Confirm Completion ----------
  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    setConfirmLoading(true);
    try {
      await api.post(`/hr/interns/${confirmModal.id}/confirm-completion`, {
        hr_result: hrResult,
        hr_review: hrReview,
      });
      await fetchData();
      setConfirmModal(null);
      setHrResult('PASSED');
      setHrReview('');
      notify.success('Đã xác nhận đánh giá và hoàn thành kỳ thực tập thành công!', 'Xác nhận thực tập');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận đánh giá hoàn thành.', 'Xác nhận thất bại');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ---------- Approve / Reject Certificate Request ----------
  const handleCertAction = async (e) => {
    e.preventDefault();
    setCertLoading(true);
    try {
      const endpoint = certAction === 'APPROVE'
        ? `/hr/interns/${certModal.id}/approve-certificate`
        : `/hr/interns/${certModal.id}/reject-certificate`;
      await api.post(endpoint, { note: certNote });
      await fetchData();
      setCertModal(null);
      setCertNote('');
      notify.success(
        certAction === 'APPROVE'
          ? 'Đã duyệt yêu cầu cấp chứng nhận thực tập thành công!'
          : 'Đã từ chối yêu cầu cấp chứng nhận thực tập.',
        'Xử lý yêu cầu chứng nhận'
      );
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu cấp chứng nhận.', 'Xử lý thất bại');
    } finally {
      setCertLoading(false);
    }
  };

  // ---------- Direct Issue Certificate & Evaluation ----------
  const handleDirectIssueCert = async (e) => {
    e.preventDefault();
    setDirectCertLoading(true);
    try {
      await api.post(`/hr/interns/${directCertModal.id}/issue-certificate`, directCertForm);
      await fetchData();
      setDirectCertModal(null);
      notify.success('Đã cấp Giấy xác nhận và Phiếu đánh giá thực tập thành công!', 'Cấp chứng nhận');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi cấp giấy xác nhận.', 'Cấp giấy thất bại');
    } finally {
      setDirectCertLoading(false);
    }
  };

  // ---------- Hiring Decision ----------
  const handleHiringDecision = async (e) => {
    e.preventDefault();
    setHiringLoading(true);
    try {
      await api.patch(`/hr/interns/${hiringModal.id}/hiring`, {
        hiring_decision: hiringDecision,
        hiring_note: hiringNote,
      });
      await fetchData();
      setHiringModal(null);
      setHiringNote('');
      notify.success('Đã cập nhật quyết định tuyển dụng thực tập sinh thành công!', 'Quyết định tuyển dụng');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật quyết định tuyển dụng.', 'Cập nhật thất bại');
    } finally {
      setHiringLoading(false);
    }
  };

  // ---------- Propose Deal Meeting ----------
  const handleProposeDealMeeting = async (e) => {
    e.preventDefault();
    setDealLoading(true);
    try {
      await api.post(`/hr/interns/${dealModal.id}/deal-meeting/propose`, dealForm);
      await fetchData();
      setDealModal(null);
      notify.success('Đã gửi đề xuất lịch hẹn Deal Job tới Thực tập sinh thành công!', 'Đề xuất lịch hẹn');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đề xuất lịch hẹn.', 'Gửi đề xuất thất bại');
    } finally {
      setDealLoading(false);
    }
  };

  // ---------- Confirm Intern's Proposed Deal Meeting ----------
  const handleConfirmDealMeeting = async () => {
    setDealLoading(true);
    try {
      await api.post(`/hr/interns/${dealModal.id}/deal-meeting/confirm`, { note: dealForm.deal_meeting_note });
      await fetchData();
      setDealModal(null);
      notify.success('Đã chốt và thống nhất lịch hẹn trao đổi Deal Job thành công!', 'Chốt lịch hẹn');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi chốt lịch hẹn.', 'Chốt lịch thất bại');
    } finally {
      setDealLoading(false);
    }
  };

  // ---------- Complete Deal Meeting ----------
  const handleCompleteDealMeeting = async () => {
    setDealLoading(true);
    try {
      await api.post(`/hr/interns/${dealModal.id}/deal-meeting/complete`, {
        note: dealForm.deal_meeting_note,
        final_hiring_decision: 'HIRED'
      });
      await fetchData();
      setDealModal(null);
      notify.success('Đã hoàn tất trao đổi Deal Job và chuyển trạng thái tuyển dụng thành nhân viên chính thức!', 'Tuyển dụng chính thức');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi hoàn tất tuyển dụng chính thức.', 'Thao tác thất bại');
    } finally {
      setDealLoading(false);
    }
  };

  // ---------- Open Reject Modal After Deal Meeting / Interview ----------
  const handleOpenRejectModal = (intern) => {
    setRejectModal(intern);
    setRejectReasonType('Chưa đáp ứng đủ yêu cầu chuyên môn / năng lực kỹ thuật của vị trí chính thức');
    setRejectCustomNote(intern.deal_meeting_note || '');
  };

  // ---------- Confirm Reject After Deal Meeting / Interview ----------
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModal) return;

    setRejectSubmitting(true);
    try {
      const finalNote = rejectReasonType === 'Khác (Tự nhập lý do)'
        ? rejectCustomNote.trim()
        : `${rejectReasonType}${rejectCustomNote.trim() ? ' - ' + rejectCustomNote.trim() : ''}`;

      await api.post(`/hr/interns/${rejectModal.id}/deal-meeting/complete`, {
        note: finalNote || 'Chưa phù hợp với yêu cầu tuyển dụng của vị trí chính thức sau buổi trao đổi.',
        final_hiring_decision: 'REJECTED'
      });
      await fetchData();
      setRejectModal(null);
      if (dealModal && dealModal.id === rejectModal.id) {
        setDealModal(null);
      }
      notify.info('Đã cập nhật kết quả: Từ chối tuyển dụng chính thức sau phỏng vấn và gửi thông báo tới Thực tập sinh.', 'Kết quả phỏng vấn');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật kết quả từ chối tuyển dụng.', 'Cập nhật thất bại');
    } finally {
      setRejectSubmitting(false);
    }
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
  const isEligibleForDealJob = (i) => {
    if (!i) return false;
    if (i.hr_result === 'FAILED' || i.status === 'FAILED' || ['NOT_OFFERED', 'REJECTED', 'DECLINED'].includes(i.hiring_decision)) {
      return false;
    }
    return (
      i.mentor_offer_recommendation === 1 ||
      ['OFFERED', 'CONSIDERING', 'HIRED'].includes(i.hiring_decision) ||
      (i.deal_meeting_status && i.deal_meeting_status !== 'NONE' && i.deal_meeting_status !== 'CANCELLED')
    );
  };

  const pendingCertCount = interns.filter((i) => ['REQUESTED', 'PENDING'].includes(i.certificate_status)).length;
  const pendingConfirmCount = interns.filter(
    (i) => i.mentor_evaluated_at && !i.hr_confirmed_at && i.status === 'COMPLETED'
  ).length;
  const dealJobCount = interns.filter(isEligibleForDealJob).length;

  const tabFilters = {
    all: interns,
    active: interns.filter((i) => ['UPCOMING', 'IN_PROGRESS'].includes(i.status)),
    completed: interns.filter((i) => i.status === 'COMPLETED'),
    pending_confirm: interns.filter(
      (i) => i.mentor_evaluated_at && !i.hr_confirmed_at && i.status === 'COMPLETED'
    ),
    pending_cert: interns.filter((i) => ['REQUESTED', 'PENDING'].includes(i.certificate_status)),
    deal_job: interns.filter(isEligibleForDealJob),
  };

  const displayList = tabFilters[tab] || interns;

  return (
    <DashboardLayout>
      <PageHeader
        title="Quản lý Thực tập sinh"
        subtitle="Theo dõi tiến độ đào tạo, xác nhận hoàn thành, cấp Giấy xác nhận & Phiếu đánh giá, và trao đổi Deal Job chính thức"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Nhân sự', link: '/hr' },
          { label: 'Thực tập sinh' },
        ]}
      />

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-4 col-xl-2">
          <StatCard title="Tổng số" value={interns.length} icon="bi-mortarboard" variant="primary" />
        </div>
        <div className="col-6 col-sm-4 col-xl-2">
          <StatCard title="Đang thực tập" value={inProgressCount} icon="bi-arrow-repeat" variant="warning" />
        </div>
        <div className="col-6 col-sm-4 col-xl-2">
          <StatCard title="Hoàn thành" value={completedCount} icon="bi-award" variant="success" />
        </div>
        <div className="col-6 col-sm-4 col-xl-2">
          <StatCard title="Chờ xác nhận" value={pendingConfirmCount} icon="bi-hourglass-split" variant="warning" />
        </div>
        <div className="col-6 col-sm-4 col-xl-2">
          <StatCard title="Chờ duyệt giấy" value={pendingCertCount} icon="bi-file-earmark-check" variant="danger" />
        </div>
        <div className="col-6 col-sm-4 col-xl-2">
          <StatCard title="Deal Job / Offer" value={dealJobCount} icon="bi-briefcase" variant="info" />
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            Tất cả <span className="badge bg-secondary ms-1">{interns.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            Đang thực tập
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
            Đã hoàn thành
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'pending_confirm' ? 'active' : ''}`} onClick={() => setTab('pending_confirm')}>
            Chờ xác nhận HR
            {pendingConfirmCount > 0 && <span className="badge bg-warning text-dark ms-1">{pendingConfirmCount}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'pending_cert' ? 'active' : ''}`} onClick={() => setTab('pending_cert')}>
            Yêu cầu Giấy XN
            {pendingCertCount > 0 && <span className="badge bg-danger ms-1">{pendingCertCount}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'deal_job' ? 'active' : ''}`} onClick={() => setTab('deal_job')}>
            <i className="bi bi-briefcase text-primary me-1" />
            Trao đổi Deal Job
            {dealJobCount > 0 && <span className="badge bg-primary ms-1">{dealJobCount}</span>}
          </button>
        </li>
      </ul>

      {/* Table */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
          <h5 className="fw-bold text-dark mb-0">Danh sách Thực tập sinh</h5>
          <span className="badge bg-light text-muted border">{displayList.length} bạn</span>
        </div>

        <div className="card-body p-0">
          {displayList.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title="Không có dữ liệu"
              description="Không có thực tập sinh nào trong mục này."
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Thực tập sinh</th>
                    <th scope="col">Vị trí & Cơ sở</th>
                    <th scope="col">Mentor & Điểm</th>
                    <th scope="col">Thời gian</th>
                    <th scope="col">Kết quả HR</th>
                    <th scope="col">Hồ sơ Giấy XN</th>
                    <th scope="col">Lịch Deal Job</th>
                    <th scope="col" className="text-end pe-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((intern) => (
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
                            {intern.mentor_offer_recommendation === 1 && (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-block mt-1" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-star-fill me-1" />Mentor đề xuất tuyển dụng
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="text-dark small d-block">{intern.position_title}</strong>
                        {intern.branch_name && (
                          <span className="badge bg-light text-secondary border small">{intern.branch_name}</span>
                        )}
                        {intern.school_name && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: '140px', fontSize: '0.75rem' }}>
                            {intern.school_name}
                          </div>
                        )}
                      </td>
                      <td>
                        {intern.mentor_name ? (
                          <div>
                            <span className="text-dark fw-medium small d-block">
                              <i className="bi bi-person-check text-success me-1" />
                              {intern.mentor_name}
                            </span>
                            {intern.mentor_evaluated_at && (
                              <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle" style={{ fontSize: '0.7rem' }}>
                                ⭐ {intern.rating}/10 điểm
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                            <i className="bi bi-exclamation-triangle me-1" /> Chưa có
                          </span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {intern.start_date ? (
                          <span>
                            {new Date(intern.start_date).toLocaleDateString('vi-VN')} &ndash;{' '}
                            {new Date(intern.end_date).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="fst-italic">Chưa thiết lập</span>
                        )}
                        <div>
                          <StatusBadge status={intern.status} />
                        </div>
                      </td>
                      <td>
                        {intern.hr_result && intern.hr_result !== 'NONE' ? (
                          <span className={`badge ${HR_RESULT_LABEL[intern.hr_result]?.cls || 'bg-secondary'}`}>
                            {HR_RESULT_LABEL[intern.hr_result]?.label || intern.hr_result}
                          </span>
                        ) : intern.mentor_evaluated_at && !intern.hr_confirmed_at ? (
                          <span className="badge bg-warning text-dark">Chờ HR xác nhận</span>
                        ) : (
                          <span className="text-muted small">&mdash;</span>
                        )}
                        {intern.hiring_decision && intern.hiring_decision !== 'NONE' && (
                          <div className="mt-1">
                            <span className={`badge ${HIRING_LABEL[intern.hiring_decision]?.cls || 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                              {HIRING_LABEL[intern.hiring_decision]?.label}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {intern.certificate_status && intern.certificate_status !== 'NONE' ? (
                          <span className={`badge ${CERT_STATUS_LABEL[intern.certificate_status]?.cls || 'bg-secondary'}`}>
                            {CERT_STATUS_LABEL[intern.certificate_status]?.label}
                          </span>
                        ) : (
                          <span className="text-muted small">Chưa cấp</span>
                        )}
                        {intern.certificate_code && (
                          <div className="font-monospace text-muted mt-0.5" style={{ fontSize: '0.7rem' }}>
                            {intern.certificate_code}
                          </div>
                        )}
                      </td>
                      <td>
                        {intern.hiring_decision === 'DECLINED' ? (
                          <span className="badge bg-dark-subtle text-dark border" style={{ fontSize: '0.7rem' }} title={intern.hiring_decline_reason ? `Lý do TTS từ chối: ${intern.hiring_decline_reason}` : 'TTS đã từ chối nhận việc'}>
                            <i className="bi bi-x-circle me-1" />TTS từ chối Offer
                          </span>
                        ) : intern.hiring_decision === 'REJECTED' ? (
                          <span className="badge bg-danger-subtle text-danger border" style={{ fontSize: '0.7rem' }} title={intern.hiring_note ? `Lý do từ chối: ${intern.hiring_note}` : 'Từ chối sau phỏng vấn'}>
                            <i className="bi bi-person-x me-1" />Từ chối sau PV
                          </span>
                        ) : intern.hiring_decision === 'HIRED' ? (
                          <span className="badge bg-success-subtle text-success border" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-award-fill me-1" />Nhân viên chính thức
                          </span>
                        ) : intern.hr_result === 'FAILED' || intern.hiring_decision === 'NOT_OFFERED' ? (
                          <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.7rem' }}>
                            Không tuyển dụng
                          </span>
                        ) : intern.deal_meeting_status && intern.deal_meeting_status !== 'NONE' ? (
                          <div>
                            <span className={`badge ${DEAL_MEETING_STATUS_LABEL[intern.deal_meeting_status]?.cls || 'bg-secondary'}`} style={{ fontSize: '0.75rem' }}>
                              {DEAL_MEETING_STATUS_LABEL[intern.deal_meeting_status]?.label}
                            </span>
                            {intern.deal_meeting_time && (
                              <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                <i className="bi bi-clock me-1" />
                                {new Date(intern.deal_meeting_time).toLocaleString('vi-VN')}
                              </div>
                            )}
                          </div>
                        ) : isEligibleForDealJob(intern) ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '0.7rem' }}>
                            Cần lên lịch Deal
                          </span>
                        ) : (
                          <span className="text-muted small">&mdash;</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-1 justify-content-end flex-wrap">
                          {/* Phân công / Điều chỉnh Mentor */}
                          {(!intern.mentor_id && intern.status !== 'CANCELLED') ? (
                            <button
                              onClick={() => {
                                setAssignModal(intern);
                                setSelectedMentor('');
                                setStartDate('');
                                setEndDate('');
                              }}
                              className="btn btn-sm btn-primary"
                            >
                              <i className="bi bi-person-plus me-1" /> Phân công
                            </button>
                          ) : intern.status !== 'CANCELLED' && intern.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => {
                                setAssignModal(intern);
                                setSelectedMentor(intern.mentor_id || '');
                                setStartDate(intern.start_date ? intern.start_date.split('T')[0] : '');
                                setEndDate(intern.end_date ? intern.end_date.split('T')[0] : '');
                              }}
                              className="btn btn-sm btn-outline-secondary"
                              title="Điều chỉnh Mentor"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          ) : null}

                          {/* Xác nhận hoàn thành - HR */}
                          {intern.mentor_evaluated_at && !intern.hr_confirmed_at && (
                            <button
                              onClick={() => {
                                setConfirmModal(intern);
                                setHrResult('PASSED');
                                setHrReview('');
                              }}
                              className="btn btn-sm btn-success"
                              title="Xác nhận hoàn thành kỳ thực tập"
                            >
                              <i className="bi bi-clipboard2-check me-1" /> Xác nhận HT
                            </button>
                          )}

                          {/* Duyệt yêu cầu giấy xác nhận từ TTS */}
                          {['REQUESTED', 'PENDING'].includes(intern.certificate_status) && (
                            <button
                              onClick={() => {
                                setCertModal(intern);
                                setCertAction('APPROVE');
                                setCertNote('');
                              }}
                              className="btn btn-sm btn-warning"
                              title="Duyệt yêu cầu Giấy xác nhận & Phiếu đánh giá"
                            >
                              <i className="bi bi-file-earmark-check me-1" /> Duyệt giấy
                            </button>
                          )}

                          {/* Cấp giấy trực tiếp (nếu HR đã duyệt đạt mà chưa cấp) */}
                          {intern.hr_result === 'PASSED' && (!intern.certificate_status || intern.certificate_status === 'NONE') && (
                            <button
                              onClick={() => {
                                setDirectCertModal(intern);
                                setDirectCertForm({
                                  school_name: intern.school_name || '',
                                  student_code: intern.student_code || '',
                                  university_class: intern.university_class || '',
                                  major_name: intern.major_name || '',
                                  academic_year: intern.academic_year || ''
                                });
                              }}
                              className="btn btn-sm btn-outline-success"
                              title="Cấp Giấy xác nhận & Phiếu đánh giá ngay"
                            >
                              <i className="bi bi-file-earmark-plus me-1" /> Cấp giấy
                            </button>
                          )}

                          {/* Xem & In Giấy xác nhận & Phiếu đánh giá đã cấp */}
                          {intern.certificate_status === 'APPROVED' && (
                            <button
                              onClick={() => setViewingCert(intern)}
                              className="btn btn-sm btn-success"
                              title="Xem & In Giấy xác nhận & Phiếu đánh giá thực tập"
                            >
                              <i className="bi bi-file-earmark-pdf me-1" /> In Giấy & ĐG
                            </button>
                          )}

                          {/* Lịch hẹn Deal Job (Chỉ khi đủ điều kiện và không bị từ chối / không đạt) */}
                          {isEligibleForDealJob(intern) && (
                            <button
                              onClick={() => {
                                setDealModal(intern);
                                setDealForm({
                                  deal_meeting_time: intern.deal_meeting_time ? new Date(intern.deal_meeting_time).toISOString().slice(0, 16) : '',
                                  deal_meeting_type: intern.deal_meeting_type || 'OFFLINE',
                                  deal_meeting_location: intern.deal_meeting_location || 'Văn phòng Công ty - Tầng 4, Phòng Họp 2',
                                  deal_meeting_note: intern.deal_meeting_note || ''
                                });
                              }}
                              className={`btn btn-sm ${intern.deal_meeting_status === 'PENDING_HR' ? 'btn-danger animate-pulse' : intern.deal_meeting_status === 'CONFIRMED' ? 'btn-primary' : 'btn-outline-primary'}`}
                              title="Thống nhất thời gian & địa điểm Deal Job"
                            >
                              <i className="bi bi-calendar2-check me-1" />
                              {intern.deal_meeting_status === 'PENDING_HR' ? 'TTS đề xuất lịch' : intern.deal_meeting_status === 'CONFIRMED' ? 'Lịch Deal Job' : 'Đặt lịch Deal Job'}
                            </button>
                          )}

                          {/* Từ chối tuyển sau phỏng vấn (Khi đã có trao đổi deal job nhưng chưa chốt nhận việc) */}
                          {intern.deal_meeting_status && ['CONFIRMED', 'PENDING_HR', 'PENDING_INTERN'].includes(intern.deal_meeting_status) && !['HIRED', 'REJECTED', 'DECLINED'].includes(intern.hiring_decision) && (
                            <button
                              onClick={() => handleOpenRejectModal(intern)}
                              className="btn btn-sm btn-outline-danger"
                              title="Từ chối tuyển dụng chính thức sau phỏng vấn / trao đổi"
                            >
                              <i className="bi bi-person-x me-1" />
                              <span className="d-none d-xl-inline">Từ chối tuyển</span>
                            </button>
                          )}

                          {/* Quyết định tuyển dụng */}
                          {intern.hr_result === 'PASSED' && (
                            <button
                              onClick={() => {
                                setHiringModal(intern);
                                setHiringDecision(intern.hiring_decision && intern.hiring_decision !== 'NONE' ? intern.hiring_decision : 'OFFERED');
                                setHiringNote(intern.hiring_note || '');
                              }}
                              className={`btn btn-sm ${intern.hiring_decision && intern.hiring_decision !== 'NONE' ? 'btn-outline-dark' : 'btn-outline-secondary'}`}
                              title="Cập nhật quyết định tuyển dụng"
                            >
                              <i className="bi bi-briefcase" />
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

      {/* ====== MODAL: Phân công Mentor ====== */}
      {assignModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-person-gear text-primary me-2" />
                    Phân công Mentor & Kỳ thực tập
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setAssignModal(null)} aria-label="Close" />
                </div>
                <form onSubmit={handleAssignMentor}>
                  <div className="modal-body">
                    <div className="bg-light p-3 rounded border mb-3 small">
                      <span className="text-muted d-block">Thực tập sinh:</span>
                      <strong className="text-dark fs-6">{assignModal.intern_name}</strong>
                      <span className="d-block text-secondary mt-1">Vị trí: {assignModal.position_title}</span>
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
                          <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                        ))}
                      </select>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold" htmlFor="start_date">
                          Ngày bắt đầu <span className="text-danger">*</span>
                        </label>
                        <input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="form-control" />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold" htmlFor="end_date">
                          Ngày kết thúc <span className="text-danger">*</span>
                        </label>
                        <input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setAssignModal(null)} className="btn btn-sm btn-outline-secondary">Hủy</button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4">Lưu phân công</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Xác nhận Hoàn thành ====== */}
      {confirmModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-clipboard2-check-fill text-success me-2" />
                    HR Xác nhận Hoàn thành Kỳ thực tập
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setConfirmModal(null)} />
                </div>
                <form onSubmit={handleConfirmCompletion}>
                  <div className="modal-body p-4">
                    <div className="bg-light rounded border p-3 mb-4">
                      <div className="row g-2 small">
                        <div className="col-sm-6">
                          <span className="text-muted">Thực tập sinh:</span>
                          <strong className="text-dark d-block">{confirmModal.intern_name}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Vị trí:</span>
                          <strong className="text-dark d-block">{confirmModal.position_title}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Mentor:</span>
                          <strong className="text-dark d-block">{confirmModal.mentor_name || '—'}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Điểm đánh giá từ Mentor:</span>
                          <strong className="text-primary d-block fs-6">{confirmModal.rating ? `${confirmModal.rating}/10 điểm` : '—'}</strong>
                        </div>
                      </div>
                      {confirmModal.final_review && (
                        <div className="mt-3 pt-2 border-top">
                          <span className="text-muted small d-block mb-1">Nhận xét của Mentor:</span>
                          <p className="mb-0 small text-dark fst-italic">&ldquo;{confirmModal.final_review}&rdquo;</p>
                        </div>
                      )}
                      {confirmModal.mentor_recommendation && (
                        <div className="mt-2">
                          <span className="text-muted small">Đề xuất Mentor: </span>
                          <span className={`badge ms-1 ${confirmModal.mentor_recommendation === 'PASS' ? 'bg-success' : 'bg-danger'}`}>
                            {confirmModal.mentor_recommendation === 'PASS' ? 'Đạt yêu cầu' : 'Không đạt'}
                          </span>
                          {confirmModal.mentor_offer_recommendation === 1 && (
                            <span className="badge bg-warning text-dark ms-2">
                              <i className="bi bi-star-fill me-1" />Đề xuất tuyển dụng chính thức
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Kết quả xác nhận của HR <span className="text-danger">*</span></label>
                      <div className="d-flex gap-4">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" id="hr_pass" name="hr_result" value="PASSED"
                            checked={hrResult === 'PASSED'} onChange={(e) => setHrResult(e.target.value)} />
                          <label className="form-check-label text-success fw-semibold" htmlFor="hr_pass">
                            <i className="bi bi-check-circle-fill me-1" />Đạt yêu cầu
                          </label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" id="hr_fail" name="hr_result" value="FAILED"
                            checked={hrResult === 'FAILED'} onChange={(e) => setHrResult(e.target.value)} />
                          <label className="form-check-label text-danger fw-semibold" htmlFor="hr_fail">
                            <i className="bi bi-x-circle-fill me-1" />Không đạt (Từ chối)
                          </label>
                        </div>
                      </div>
                      {hrResult === 'FAILED' && (
                        <div className="alert alert-warning py-2 px-3 small mt-2 mb-0">
                          <i className="bi bi-exclamation-triangle-fill me-1" />
                          <strong>Lưu ý:</strong> Thực tập sinh không đạt sẽ không đủ điều kiện tuyển dụng chính thức. Hệ thống sẽ tự động đóng và ẩn nút <strong>Đặt lịch Deal Job</strong> đối với thực tập sinh này.
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="hr_review">
                        Nhận xét tổng hợp của HR (không bắt buộc)
                      </label>
                      <textarea
                        id="hr_review"
                        rows={3}
                        value={hrReview}
                        onChange={(e) => setHrReview(e.target.value)}
                        placeholder="Nhận xét của HR về quá trình thực tập, kết quả đào tạo..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setConfirmModal(null)} className="btn btn-sm btn-outline-secondary">Hủy bỏ</button>
                    <button type="submit" className="btn btn-sm btn-success fw-semibold px-4" disabled={confirmLoading}>
                      {confirmLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-clipboard2-check me-1" />}
                      Xác nhận hoàn thành
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Duyệt / Từ chối Giấy Xác nhận (Khi TTS gửi yêu cầu) ====== */}
      {certModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-file-earmark-check-fill text-warning me-2" />
                    Phê duyệt yêu cầu Cấp Giấy xác nhận & Phiếu đánh giá
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setCertModal(null)} />
                </div>
                <form onSubmit={handleCertAction}>
                  <div className="modal-body p-4">
                    <div className="bg-light rounded border p-3 mb-4">
                      <div className="row g-2 small">
                        <div className="col-sm-6">
                          <span className="text-muted">Thực tập sinh:</span>
                          <strong className="text-dark d-block">{certModal.intern_name}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Vị trí:</span>
                          <strong className="text-dark d-block">{certModal.position_title}</strong>
                        </div>
                        {certModal.school_name && (
                          <div className="col-sm-6">
                            <span className="text-muted">Trường Đại học:</span>
                            <strong className="text-dark d-block">{certModal.school_name}</strong>
                          </div>
                        )}
                        {certModal.student_code && (
                          <div className="col-sm-6">
                            <span className="text-muted">Mã sinh viên:</span>
                            <strong className="text-dark d-block">{certModal.student_code}</strong>
                          </div>
                        )}
                      </div>
                      {certModal.certificate_request_note && (
                        <div className="mt-3 pt-2 border-top">
                          <span className="text-muted small d-block mb-1">Ghi chú của thực tập sinh:</span>
                          <p className="mb-0 small">{certModal.certificate_request_note}</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Quyết định</label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" id="cert_approve" name="cert_action" value="APPROVE"
                            checked={certAction === 'APPROVE'} onChange={(e) => setCertAction(e.target.value)} />
                          <label className="form-check-label text-success fw-semibold" htmlFor="cert_approve">
                            <i className="bi bi-check-circle-fill me-1" />Phê duyệt & Cấp cả 2 văn bản (Giấy XN + Phiếu ĐG)
                          </label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" id="cert_reject" name="cert_action" value="REJECT"
                            checked={certAction === 'REJECT'} onChange={(e) => setCertAction(e.target.value)} />
                          <label className="form-check-label text-danger fw-semibold" htmlFor="cert_reject">
                            <i className="bi bi-x-circle-fill me-1" />Từ chối
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mb-0">
                      <label className="form-label small fw-semibold" htmlFor="cert_note">
                        {certAction === 'APPROVE' ? 'Ghi chú thêm (không bắt buộc)' : 'Lý do từ chối *'}
                      </label>
                      <textarea
                        id="cert_note"
                        rows={3}
                        value={certNote}
                        onChange={(e) => setCertNote(e.target.value)}
                        required={certAction === 'REJECT'}
                        placeholder={certAction === 'APPROVE' ? 'Ghi chú cho TTS (ví dụ: Bản đóng dấu đỏ có thể lấy tại văn phòng HR)...' : 'Nhập lý do từ chối để thông báo cho thực tập sinh...'}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setCertModal(null)} className="btn btn-sm btn-outline-secondary">Hủy bỏ</button>
                    <button
                      type="submit"
                      disabled={certLoading}
                      className={`btn btn-sm fw-semibold px-4 ${certAction === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                    >
                      {certLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                      {certAction === 'APPROVE' ? 'Phê duyệt & Cấp hồ sơ' : 'Từ chối yêu cầu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Cấp giấy trực tiếp từ HR ====== */}
      {directCertModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-success text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-file-earmark-plus-fill me-2" />
                    Cấp Giấy xác nhận & Phiếu đánh giá thực tập
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setDirectCertModal(null)} />
                </div>
                <form onSubmit={handleDirectIssueCert}>
                  <div className="modal-body p-4">
                    <p className="text-muted small mb-3">
                      Hệ thống sẽ tạo <strong>Giấy xác nhận thực tập</strong> và <strong>Phiếu nhận xét đánh giá kết quả thực tập (Bảng điểm tiêu chí)</strong> chính thức theo chuẩn Bộ GD&ĐT cho thực tập sinh <strong>{directCertModal.intern_name}</strong>.
                    </p>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="dir_school">
                          Trường Đại học / Học viện <span className="text-danger">*</span>
                        </label>
                        <input
                          id="dir_school"
                          type="text"
                          required
                          value={directCertForm.school_name}
                          onChange={(e) => setDirectCertForm({ ...directCertForm, school_name: e.target.value })}
                          placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                          className="form-control"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="dir_code">
                          Mã số sinh viên (MSSV) <span className="text-danger">*</span>
                        </label>
                        <input
                          id="dir_code"
                          type="text"
                          required
                          value={directCertForm.student_code}
                          onChange={(e) => setDirectCertForm({ ...directCertForm, student_code: e.target.value })}
                          placeholder="Ví dụ: 20210567"
                          className="form-control"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="dir_class">
                          Lớp sinh viên
                        </label>
                        <input
                          id="dir_class"
                          type="text"
                          value={directCertForm.university_class}
                          onChange={(e) => setDirectCertForm({ ...directCertForm, university_class: e.target.value })}
                          placeholder="Ví dụ: CNTT 02-K65"
                          className="form-control"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="dir_major">
                          Chuyên ngành đào tạo
                        </label>
                        <input
                          id="dir_major"
                          type="text"
                          value={directCertForm.major_name}
                          onChange={(e) => setDirectCertForm({ ...directCertForm, major_name: e.target.value })}
                          placeholder="Ví dụ: Kỹ thuật Phần mềm"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="alert alert-info py-2 px-3 small mb-0">
                      <i className="bi bi-info-circle me-1" />
                      Sau khi cấp, thực tập sinh sẽ nhận thông báo trên bảng điều khiển để xem và in/xuất PDF trực tiếp.
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setDirectCertModal(null)} className="btn btn-sm btn-outline-secondary">Hủy bỏ</button>
                    <button type="submit" className="btn btn-sm btn-success fw-semibold px-4" disabled={directCertLoading}>
                      {directCertLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-patch-check-fill me-1" />}
                      Xác nhận & Cấp hồ sơ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Thống nhất Lịch hẹn Deal Job giữa HR và TTS ====== */}
      {dealModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-primary text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-calendar2-heart-fill me-2" />
                    Thống nhất Thời gian & Địa điểm Trao đổi Deal Job
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setDealModal(null)} />
                </div>
                <form onSubmit={handleProposeDealMeeting}>
                  <div className="modal-body p-4">
                    {/* TTS status info */}
                    <div className="bg-light rounded border p-3 mb-4">
                      <div className="row g-2 small">
                        <div className="col-sm-6">
                          <span className="text-muted">Ứng viên:</span>
                          <strong className="text-dark d-block fs-6">{dealModal.intern_name}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Vị trí thực tập:</span>
                          <strong className="text-dark d-block">{dealModal.position_title}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Trạng thái Deal Job hiện tại:</span>
                          <div>
                            <span className={`badge ${DEAL_MEETING_STATUS_LABEL[dealModal.deal_meeting_status]?.cls || 'bg-secondary'}`}>
                              {DEAL_MEETING_STATUS_LABEL[dealModal.deal_meeting_status]?.label}
                            </span>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted">Điểm đánh giá thực tập:</span>
                          <strong className="text-success d-block">{dealModal.rating ? `${dealModal.rating}/10 điểm` : '—'}</strong>
                        </div>
                      </div>

                      {dealModal.deal_meeting_status === 'PENDING_HR' && (
                        <div className="alert alert-warning py-2 px-3 small mt-3 mb-0">
                          <i className="bi bi-exclamation-triangle-fill text-warning me-1" />
                          <strong>Thực tập sinh đã đề xuất thời gian hẹn mới: </strong>
                          <span className="text-primary fw-bold">
                            {dealModal.deal_meeting_time ? new Date(dealModal.deal_meeting_time).toLocaleString('vi-VN') : '—'}
                          </span>
                          {dealModal.deal_meeting_location && <div>Địa điểm/Hình thức: {dealModal.deal_meeting_location}</div>}
                          {dealModal.deal_meeting_note && <div>Nguyện vọng của TTS: &ldquo;{dealModal.deal_meeting_note}&rdquo;</div>}
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={handleConfirmDealMeeting}
                              className="btn btn-sm btn-success fw-semibold me-2"
                              disabled={dealLoading}
                            >
                              <i className="bi bi-check-circle-fill me-1" />
                              Đồng ý & Chốt lịch này của TTS
                            </button>
                            <span className="text-muted small">Hoặc điều chỉnh lại thông tin bên dưới để đề xuất lại.</span>
                          </div>
                        </div>
                      )}

                      {dealModal.deal_meeting_status === 'CONFIRMED' && (
                        <div className="alert alert-success py-2 px-3 small mt-3 mb-0">
                          <i className="bi bi-check-circle-fill text-success me-1" />
                          <strong>Hai bên đã thống nhất lịch trao đổi: </strong>
                          <span className="text-dark fw-bold">
                            {dealModal.deal_meeting_time ? new Date(dealModal.deal_meeting_time).toLocaleString('vi-VN') : '—'}
                          </span>
                          <div>Địa điểm / Link họp: {dealModal.deal_meeting_location}</div>
                        </div>
                      )}
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="deal_time">
                          Thời gian hẹn trao đổi (Ngày & Giờ) <span className="text-danger">*</span>
                        </label>
                        <input
                          id="deal_time"
                          type="datetime-local"
                          required
                          value={dealForm.deal_meeting_time}
                          onChange={(e) => setDealForm({ ...dealForm, deal_meeting_time: e.target.value })}
                          className="form-control"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="deal_type">
                          Hình thức trao đổi <span className="text-danger">*</span>
                        </label>
                        <select
                          id="deal_type"
                          value={dealForm.deal_meeting_type}
                          onChange={(e) => setDealForm({
                            ...dealForm,
                            deal_meeting_type: e.target.value,
                            deal_meeting_location: e.target.value === 'ONLINE' ? 'Google Meet (Link sẽ gửi qua email)' : 'Văn phòng Công ty - Tầng 4, Phòng Họp 2'
                          })}
                          className="form-select"
                        >
                          <option value="OFFLINE">🏢 Trực tiếp tại văn phòng</option>
                          <option value="ONLINE">💻 Trực tuyến (Google Meet / Zoom)</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold" htmlFor="deal_location">
                          Địa điểm cụ thể hoặc Link họp trực tuyến <span className="text-danger">*</span>
                        </label>
                        <input
                          id="deal_location"
                          type="text"
                          required
                          value={dealForm.deal_meeting_location}
                          onChange={(e) => setDealForm({ ...dealForm, deal_meeting_location: e.target.value })}
                          placeholder="Ví dụ: Phòng Họp 2 - Tầng 4, Trụ sở chính hoặc https://meet.google.com/xyz"
                          className="form-control"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold" htmlFor="deal_note">
                          Ghi chú / Nội dung trao đổi gửi cho Thực tập sinh
                        </label>
                        <textarea
                          id="deal_note"
                          rows={3}
                          value={dealForm.deal_meeting_note}
                          onChange={(e) => setDealForm({ ...dealForm, deal_meeting_note: e.target.value })}
                          placeholder="Ví dụ: Trao đổi chi tiết về chế độ đãi ngộ, mức lương khởi điểm cho vị trí Junior Developer và thời gian bắt đầu tiếp nhận..."
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2 d-flex justify-content-between flex-wrap gap-2">
                    <div className="d-flex gap-2 flex-wrap">
                      {['CONFIRMED', 'PENDING_HR', 'PENDING_INTERN'].includes(dealModal.deal_meeting_status) && (
                        <>
                          <button
                            type="button"
                            onClick={handleCompleteDealMeeting}
                            className="btn btn-sm btn-success fw-semibold"
                            disabled={dealLoading}
                            title="Xác nhận tuyển dụng và tiếp nhận chính thức"
                          >
                            <i className="bi bi-award-fill me-1" />
                            Tiếp nhận chính thức
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(dealModal)}
                            className="btn btn-sm btn-outline-danger fw-semibold"
                            disabled={dealLoading}
                            title="Từ chối tuyển dụng chính thức sau buổi trao đổi/phỏng vấn"
                          >
                            <i className="bi bi-person-x me-1" />
                            Từ chối tuyển sau phỏng vấn
                          </button>
                        </>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" onClick={() => setDealModal(null)} className="btn btn-sm btn-outline-secondary">Hủy bỏ</button>
                      <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4" disabled={dealLoading}>
                        {dealLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-send-fill me-1" />}
                        Gửi đề xuất lịch tới TTS
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Quyết định Tuyển dụng ====== */}
      {hiringModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-briefcase-fill text-primary me-2" />
                    Cân nhắc Tuyển dụng chính thức
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setHiringModal(null)} />
                </div>
                <form onSubmit={handleHiringDecision}>
                  <div className="modal-body p-4">
                    <div className="bg-light rounded border p-3 mb-4 small">
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted">Thực tập sinh:</span>
                          <strong className="text-dark d-block">{hiringModal.intern_name}</strong>
                        </div>
                        <div className="col-6">
                          <span className="text-muted">Vị trí thực tập:</span>
                          <strong className="text-dark d-block">{hiringModal.position_title}</strong>
                        </div>
                        {hiringModal.rating && (
                          <div className="col-6">
                            <span className="text-muted">Điểm đánh giá:</span>
                            <strong className="text-dark d-block">{hiringModal.rating}/10</strong>
                          </div>
                        )}
                        <div className="col-6">
                          <span className="text-muted">Mentor đề xuất tuyển dụng:</span>
                          <span className={`badge ms-1 ${hiringModal.mentor_offer_recommendation === 1 ? 'bg-success' : 'bg-secondary'}`}>
                            {hiringModal.mentor_offer_recommendation === 1 ? 'Có đề xuất' : 'Không'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Quyết định tuyển dụng <span className="text-danger">*</span></label>
                      <select className="form-select" value={hiringDecision} onChange={(e) => setHiringDecision(e.target.value)}>
                        <option value="OFFERED">🎉 Mời tuyển dụng chính thức (Bắt đầu Deal Job)</option>
                        <option value="HIRED">✅ Đã hoàn tất tiếp nhận chính thức</option>
                        <option value="CONSIDERING">🔍 Đang cân nhắc xem xét</option>
                        <option value="REJECTED">🚫 Từ chối tuyển sau phỏng vấn / Deal Job</option>
                        <option value="DECLINED">🛑 Thực tập sinh từ chối nhận việc (Declined)</option>
                        <option value="NOT_OFFERED">❌ Không tuyển dụng</option>
                      </select>
                    </div>

                    <div className="mb-0">
                      <label className="form-label small fw-semibold" htmlFor="hiring_note">Ghi chú đãi ngộ / Lộ trình (không bắt buộc)</label>
                      <textarea
                        id="hiring_note"
                        rows={3}
                        value={hiringNote}
                        onChange={(e) => setHiringNote(e.target.value)}
                        placeholder="Ví dụ: Vị trí Junior Fullstack, mức lương khởi điểm từ 12-15tr, thử việc 1 tháng..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setHiringModal(null)} className="btn btn-sm btn-outline-secondary">Hủy bỏ</button>
                    <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4" disabled={hiringLoading}>
                      {hiringLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                      Lưu quyết định
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Từ chối Tuyển dụng Chính thức sau Phỏng vấn / Deal Job ====== */}
      {rejectModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-danger text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-person-x-fill me-2" />
                    Từ chối Tuyển dụng Chính thức sau Phỏng vấn
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setRejectModal(null)} />
                </div>
                <form onSubmit={handleConfirmReject}>
                  <div className="modal-body p-4">
                    <div className="bg-light rounded border p-3 mb-3 small">
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted">Thực tập sinh:</span>
                          <strong className="text-dark d-block fs-6">{rejectModal.intern_name}</strong>
                        </div>
                        <div className="col-6">
                          <span className="text-muted">Vị trí thực tập:</span>
                          <strong className="text-dark d-block">{rejectModal.position_title}</strong>
                        </div>
                        {rejectModal.deal_meeting_time && (
                          <div className="col-12 mt-1">
                            <span className="text-muted">Thời gian phỏng vấn / trao đổi:</span>
                            <span className="text-primary fw-semibold ms-1">
                              {new Date(rejectModal.deal_meeting_time).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-danger">
                        Lý do từ chối chính <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={rejectReasonType}
                        onChange={(e) => setRejectReasonType(e.target.value)}
                        required
                      >
                        <option value="Chưa đáp ứng đủ yêu cầu chuyên môn / năng lực kỹ thuật của vị trí chính thức">
                          Chưa đáp ứng đủ yêu cầu chuyên môn / năng lực kỹ thuật
                        </option>
                        <option value="Kỹ năng mềm, giao tiếp hoặc khả năng làm việc nhóm chưa phù hợp">
                          Kỹ năng mềm, giao tiếp hoặc làm việc nhóm chưa phù hợp
                        </option>
                        <option value="Không thống nhất được thỏa thuận đãi ngộ / mức lương đề xuất">
                          Không thống nhất được mức lương / thỏa thuận đãi ngộ
                        </option>
                        <option value="Định hướng phát triển của ứng viên chưa phù hợp với công ty">
                          Định hướng phát triển của ứng viên chưa phù hợp
                        </option>
                        <option value="Khác (Tự nhập lý do)">
                          Khác (Tự nhập lý do chi tiết)
                        </option>
                      </select>
                    </div>

                    <div className="mb-0">
                      <label className="form-label small fw-semibold" htmlFor="reject_custom_note">
                        Nhận xét / Lời nhắn gửi đến Thực tập sinh (Hệ thống sẽ gửi thông báo này)
                      </label>
                      <textarea
                        id="reject_custom_note"
                        rows={3}
                        value={rejectCustomNote}
                        onChange={(e) => setRejectCustomNote(e.target.value)}
                        placeholder="Ví dụ: Rất cảm ơn bạn đã tham gia buổi trao đổi với HR. Sau khi đánh giá kỹ lưỡng, phòng ban nhận thấy kinh nghiệm hiện tại chưa phù hợp với vị trí..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setRejectModal(null)}
                      className="btn btn-sm btn-outline-secondary"
                      disabled={rejectSubmitting}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-danger fw-semibold px-4"
                      disabled={rejectSubmitting}
                    >
                      {rejectSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-x-circle me-1" />
                          Xác nhận từ chối tuyển
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* ====== MODAL: Xem Giấy xác nhận & Phiếu đánh giá thực tập ====== */}
      {viewingCert && (
        <CertificateModal
          internship={viewingCert}
          onClose={() => setViewingCert(null)}
        />
      )}
    </DashboardLayout>
  );
}
