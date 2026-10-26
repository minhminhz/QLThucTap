import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import TaskCard from '../../components/TaskCard';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import { TaskFileBadge, formatFileSize } from '../../components/TaskFileViewer';
import CertificateModal from '../../components/common/CertificateModal';

const DEAL_MEETING_STATUS_LABEL = {
  NONE: { label: 'Chưa đặt lịch', cls: 'bg-secondary' },
  PENDING_INTERN: { label: 'HR đã đề xuất lịch hẹn', cls: 'bg-warning text-dark' },
  PENDING_HR: { label: 'Đã gửi đề xuất lịch cho HR', cls: 'bg-info text-dark' },
  CONFIRMED: { label: 'Đã thống nhất lịch hẹn', cls: 'bg-success' },
  COMPLETED: { label: 'Đã hoàn tất trao đổi Deal Job', cls: 'bg-primary' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-danger' },
};

export default function InternDashboard() {
  const [internship, setInternship] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit task modal
  const [submitModal, setSubmitModal] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Certificate request & viewing
  const [certModal, setCertModal] = useState(false);
  const [viewCertModal, setViewCertModal] = useState(false);
  const [certForm, setCertForm] = useState({
    custom_intern_name: '',
    student_dob: '',
    student_gender: 'Nam',
    student_phone: '',
    student_address: '',
    school_name: '',
    faculty_name: '',
    student_code: '',
    university_class: '',
    major_name: '',
    academic_year: '',
    certificate_request_note: ''
  });
  const [certSubmitting, setCertSubmitting] = useState(false);

  // Deal Meeting Negotiation
  const [dealModal, setDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({
    deal_meeting_time: '',
    deal_meeting_type: 'OFFLINE',
    deal_meeting_location: '',
    deal_meeting_note: ''
  });
  const [dealSubmitting, setDealSubmitting] = useState(false);

  // Decline Offer Modal
  const [declineModal, setDeclineModal] = useState(false);
  const [declineReasonType, setDeclineReasonType] = useState('Tiếp tục học tập / hoàn thành đồ án tốt nghiệp');
  const [declineCustomReason, setDeclineCustomReason] = useState('');
  const [declineSubmitting, setDeclineSubmitting] = useState(false);

  // Banner Visibility Control (mặc định false để không bị nhấp nháy banner)
  const [showOfferBanner, setShowOfferBanner] = useState(false);
  const [bannerSecondsLeft, setBannerSecondsLeft] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [iRes, tRes] = await Promise.all([
        api.get('/intern/internship'),
        api.get('/intern/tasks'),
      ]);
      const data = iRes.data.data;
      setInternship(data);
      setTasks(tRes.data.data || []);

      if (data) {
        // Kiểm tra hiển thị banner thông báo tuyển dụng
        if (data.hiring_decision === 'HIRED') {
          const seenKey = `seen_hired_banner_${data.id}`;
          const hasSeen = localStorage.getItem(seenKey) || sessionStorage.getItem(seenKey);
          if (hasSeen === 'true') {
            // Đã xem rồi: TỰ ĐỘNG ẨN HOÀN TOÀN
            setShowOfferBanner(false);
          } else {
            // Lần đầu tiên login sau khi trúng tuyển: Hiện banner nổi bật và tự động ẩn sau 7s
            setShowOfferBanner(true);
            localStorage.setItem(seenKey, 'true');
            sessionStorage.setItem(seenKey, 'true');
            setBannerSecondsLeft(7);
          }
        } else if (data.hiring_decision === 'OFFERED' || (data.deal_meeting_status && !['NONE', 'CANCELLED'].includes(data.deal_meeting_status))) {
          // CHỈ hiển thị khi HR chính thức đưa ra Offer hoặc HR đã lên lịch Deal Job:
          const dismissedKey = `dismiss_offer_banner_${data.id}`;
          const isDismissed = localStorage.getItem(dismissedKey);
          setShowOfferBanner(isDismissed !== 'true');
        } else {
          setShowOfferBanner(false);
        }

        setCertForm((prev) => ({
          ...prev,
          custom_intern_name: data.custom_intern_name || data.intern_name || '',
          student_dob: data.student_dob || '',
          student_gender: data.student_gender || 'Nam',
          student_phone: data.student_phone || data.intern_phone || '',
          student_address: data.student_address || '',
          school_name: data.school_name || '',
          faculty_name: data.faculty_name || '',
          student_code: data.student_code || '',
          university_class: data.university_class || '',
          major_name: data.major_name || '',
          academic_year: data.academic_year || ''
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Countdown timer tự động ẩn banner nổi bật
  useEffect(() => {
    if (bannerSecondsLeft === null) return;
    if (bannerSecondsLeft <= 0) {
      setShowOfferBanner(false);
      setBannerSecondsLeft(null);
      return;
    }
    const timer = setInterval(() => {
      setBannerSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          setShowOfferBanner(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [bannerSecondsLeft]);

  const handleStatusChange = async (taskId, status) => {
    await api.patch(`/intern/tasks/${taskId}/status`, { status });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const handleOpenSubmit = (task) => {
    setSubmitModal(task);
    setSubmitContent(task.submission_content || '');
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitContent.trim() && !selectedFile && !submitModal?.submission_file_url) {
      alert('Vui lòng nhập mô tả kết quả hoặc đính kèm tệp kết quả (PDF, Word, Ảnh, Zip)!');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'SUBMITTED');
      if (submitContent) {
        formData.append('submission_content', submitContent.trim());
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await api.patch(`/intern/tasks/${submitModal.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedTask = res.data.data;
      setTasks((prev) =>
        prev.map((t) => (t.id === submitModal.id ? updatedTask : t))
      );
      setSubmitModal(null);
      setSubmitContent('');
      setSelectedFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  // Request Certificate
  const handleRequestCertificate = async (e) => {
    e.preventDefault();
    setCertSubmitting(true);
    try {
      const res = await api.post('/intern/internship/request-certificate', certForm);
      setInternship(res.data.data);
      setCertModal(false);
      alert('Gửi yêu cầu thành công! HR sẽ kiểm tra thông tin và cấp Giấy xác nhận & Phiếu đánh giá sớm cho bạn.');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setCertSubmitting(false);
    }
  };

  // Propose Deal Meeting from Intern
  const handleProposeDealMeeting = async (e) => {
    e.preventDefault();
    setDealSubmitting(true);
    try {
      const res = await api.post('/intern/internship/deal-meeting/propose', dealForm);
      setInternship(res.data.data);
      setDealModal(false);
      alert('Đã gửi đề xuất lịch hẹn trao đổi Deal Job tới phòng Nhân sự!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setDealSubmitting(false);
    }
  };

  // Confirm HR's proposed Deal Meeting
  const handleConfirmDealMeeting = async () => {
    setDealSubmitting(true);
    try {
      const res = await api.post('/intern/internship/deal-meeting/confirm', {
        note: 'Thực tập sinh đã xác nhận đồng ý lịch hẹn.'
      });
      setInternship(res.data.data);
      alert('Bạn đã xác nhận đồng ý lịch hẹn trao đổi Deal Job! Hãy chuẩn bị và tham gia đúng giờ nhé.');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setDealSubmitting(false);
    }
  };

  // Toggle Offer Banner Visibility
  const handleToggleOfferBanner = (visible) => {
    setShowOfferBanner(visible);
    setBannerSecondsLeft(null);
    if (!internship) return;
    if (internship.hiring_decision === 'HIRED') {
      localStorage.setItem(`seen_hired_banner_${internship.id}`, 'true');
      sessionStorage.setItem(`seen_hired_banner_${internship.id}`, 'true');
    } else {
      localStorage.setItem(`dismiss_offer_banner_${internship.id}`, (!visible).toString());
    }
  };

  // Decline Hiring Offer
  const handleDeclineOffer = async (e) => {
    e.preventDefault();
    setDeclineSubmitting(true);
    try {
      const finalReason = declineReasonType === 'Khác'
        ? declineCustomReason
        : `${declineReasonType}${declineCustomReason ? ' - ' + declineCustomReason : ''}`;
      const res = await api.post('/intern/internship/decline-offer', { reason: finalReason });
      setInternship(res.data.data);
      setDeclineModal(false);
      alert('Đã gửi phản hồi từ chối đề xuất tuyển dụng chính thức tới phòng Nhân sự.');
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi.');
    } finally {
      setDeclineSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải dữ liệu thực tập..." />
        </div>
      </DashboardLayout>
    );
  }

  const isRecommendedForOffer = internship &&
    internship.hr_result !== 'FAILED' &&
    internship.status !== 'FAILED' &&
    !['NOT_OFFERED', 'REJECTED', 'DECLINED'].includes(internship.hiring_decision) &&
    (
      ['OFFERED', 'HIRED'].includes(internship.hiring_decision) ||
      (internship.deal_meeting_status && !['NONE', 'CANCELLED'].includes(internship.deal_meeting_status))
    );

  const todoTasks = tasks.filter((t) => ['TODO', 'IN_PROGRESS'].includes(t.status));
  const doneTasks = tasks.filter((t) => ['SUBMITTED', 'COMPLETED', 'REJECTED'].includes(t.status));

  return (
    <DashboardLayout>
      <PageHeader
        title="Bảng điều khiển Thực tập sinh"
        subtitle="Theo dõi lộ trình kỳ thực tập, công việc được giao và phản hồi từ Mentor hướng dẫn"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Thực tập sinh' },
        ]}
      />

      {/* ================= THỰC TẬP SINH ĐÃ TỪ CHỐI TUYỂN CHÍNH THỨC ================= */}
      {internship && internship.hiring_decision === 'DECLINED' && (
        <div className="alert alert-secondary d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 mb-4 rounded border">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-info-circle-fill text-secondary fs-5" />
            <div>
              <strong className="text-dark">Bạn đã từ chối lời mời làm việc chính thức tại VYMI Tech.</strong>
              {internship.hiring_decline_reason && (
                <div className="text-muted small mt-0.5">
                  Lý do ghi nhận: <em>&ldquo;{internship.hiring_decline_reason}&rdquo;</em>
                </div>
              )}
            </div>
          </div>
          <span className="badge bg-secondary">Đã đóng trao đổi tuyển dụng</span>
        </div>
      )}

      {/* ================= THÔNG BÁO TỪ CHỐI TUYỂN DỤNG SAU PHỎNG VẤN ================= */}
      {internship && internship.hiring_decision === 'REJECTED' && (
        <div className="alert alert-light border-danger border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 mb-4 rounded shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-x-circle-fill text-danger fs-5" />
            <div>
              <strong className="text-danger">Thông báo kết quả sau buổi trao đổi tuyển dụng chính thức</strong>
              <div className="text-muted small mt-0.5">
                {internship.hiring_note || 'Cảm ơn bạn đã tham gia kỳ thực tập và buổi phỏng vấn. Rất tiếc hiện tại công ty chưa thể tiếp nhận bạn vào vị trí nhân viên chính thức. Chúc bạn luôn thành công trên con đường sắp tới!'}
              </div>
            </div>
          </div>
          <span className="badge bg-danger-subtle text-danger border">Không tiếp nhận chính thức</span>
        </div>
      )}

      {/* ================= THANH THÔNG BÁO THU GỌN: CHỈ DÀNH CHO CÁC TRẠNG THÁI OFFER / ĐANG DEAL ================= */}
      {isRecommendedForOffer && !showOfferBanner && internship.hiring_decision !== 'HIRED' && (
        <div className="alert alert-primary d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 mb-4 shadow-sm border-0" style={{ background: '#eff6ff', borderRadius: '10px' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-stars text-primary fs-5" />
            <div>
              <strong className="text-primary">
                🎉 Bạn nhận được đề xuất tuyển dụng chính thức (Offer) từ công ty!
              </strong>
              <span className="text-muted small ms-2 d-none d-md-inline">
                {internship.deal_meeting_status === 'CONFIRMED' ? 'Lịch trao đổi Deal Job đã được thống nhất.' : 'Bạn có thể xem chi tiết hoặc phản hồi đề xuất.'}
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleOfferBanner(true)}
              className="btn btn-sm btn-outline-primary fw-semibold"
            >
              <i className="bi bi-bell-fill me-1" /> Bật xem thông báo chi tiết
            </button>
            <button
              type="button"
              onClick={() => setDeclineModal(true)}
              className="btn btn-sm btn-outline-danger fw-semibold"
              title="Từ chối lời mời tuyển dụng chính thức"
            >
              <i className="bi bi-x-circle me-1" /> Từ chối đề xuất
            </button>
          </div>
        </div>
      )}

      {isRecommendedForOffer && showOfferBanner && (
        <div className="card shadow border-0 mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
          <div className="card-body p-4 text-white">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span className="badge bg-warning text-dark px-3 py-1.5 fw-bold fs-6">
                    <i className="bi bi-stars me-1" />
                    {internship.hiring_decision === 'HIRED'
                      ? 'TIẾP NHẬN CHÍNH THỨC'
                      : 'CƠ HỘI TUYỂN DỤNG CHÍNH THỨC (OFFER)'}
                  </span>
                  {internship.hiring_decision === 'HIRED' && bannerSecondsLeft !== null && (
                    <span className="badge bg-white bg-opacity-25 text-white border border-white border-opacity-50 px-2 py-1 small">
                      <i className="bi bi-clock-history me-1" />
                      Tự động ẩn sau {bannerSecondsLeft}s
                    </span>
                  )}
                </div>
                <h4 className="fw-bold mb-1">
                  🎉 {internship.hiring_decision === 'HIRED'
                    ? 'Chúc mừng bạn đã chính thức trở thành Nhân viên tại VYMI Tech!'
                    : 'Chúc mừng bạn đã được Đề xuất trở thành Nhân viên chính thức tại VYMI Tech!'}
                </h4>
                <p className="text-light mb-0 small opacity-90" style={{ maxWidth: '750px' }}>
                  {internship.hiring_decision === 'HIRED'
                    ? 'Chào mừng bạn chính thức gia nhập đội ngũ VYMI Tech. Chúc bạn luôn tràn đầy nhiệt huyết và gặt hái nhiều thành công rực rỡ cùng công ty!'
                    : 'Dựa trên năng lực chuyên môn, thái độ làm việc xuất sắc và điểm đánh giá thực tập cao từ Mentor & HR, công ty trân trọng đề xuất tiếp nhận bạn vào đội ngũ nhân sự chính thức.'}
                </p>
              </div>

              <div className="d-flex align-items-center flex-wrap gap-2">
                {internship.deal_meeting_status === 'CONFIRMED' ? (
                  <span className="badge bg-success px-3 py-2 fs-6">
                    <i className="bi bi-check-circle-fill me-1" /> Đã chốt lịch trao đổi
                  </span>
                ) : internship.hiring_decision !== 'HIRED' && (
                  <button
                    onClick={() => {
                      setDealModal(true);
                      setDealForm({
                        deal_meeting_time: internship.deal_meeting_time ? new Date(internship.deal_meeting_time).toISOString().slice(0, 16) : '',
                        deal_meeting_type: internship.deal_meeting_type || 'OFFLINE',
                        deal_meeting_location: internship.deal_meeting_location || 'Văn phòng Công ty - Tầng 4, Phòng Họp 2',
                        deal_meeting_note: ''
                      });
                    }}
                    className="btn btn-warning fw-bold text-dark px-3 shadow-sm"
                  >
                    <i className="bi bi-calendar2-check-fill me-1" />
                    {internship.deal_meeting_status === 'PENDING_INTERN' ? 'Xem & Phản hồi lịch hẹn' : 'Đề xuất lịch Deal Job'}
                  </button>
                )}

                {/* Nút từ chối đề xuất (chỉ khi chưa hoàn tất tiếp nhận) */}
                {internship.hiring_decision !== 'HIRED' && (
                  <button
                    type="button"
                    onClick={() => setDeclineModal(true)}
                    className="btn btn-sm btn-outline-danger text-white border-white bg-transparent"
                    title="Từ chối lời mời tuyển dụng chính thức"
                  >
                    <i className="bi bi-x-circle me-1" /> Từ chối đề xuất
                  </button>
                )}

                {/* Nút giữ lại thông báo nếu đang đếm ngược */}
                {internship.hiring_decision === 'HIRED' && bannerSecondsLeft !== null && (
                  <button
                    type="button"
                    onClick={() => setBannerSecondsLeft(null)}
                    className="btn btn-sm btn-outline-light"
                    title="Giữ lại thông báo nổi bật"
                  >
                    Giữ lại
                  </button>
                )}

                {/* Nút bật/tắt (ẩn) thông báo nổi bật */}
                <button
                  type="button"
                  onClick={() => handleToggleOfferBanner(false)}
                  className="btn btn-sm btn-light fw-semibold text-primary"
                  title="Đóng thông báo nổi bật này"
                >
                  <i className="bi bi-x-lg me-1" />
                  {internship.hiring_decision === 'HIRED' ? 'Đóng ngay' : 'Ẩn thông báo'}
                </button>
              </div>
            </div>

            {/* Chi tiết thống nhất thời gian & địa điểm Deal Job */}
            <div className="mt-4 p-3 rounded bg-white bg-opacity-10 border border-white border-opacity-25">
              <h6 className="fw-bold text-warning mb-2">
                <i className="bi bi-calendar-event me-2" />
                Thống nhất Thời gian & Địa điểm Trao đổi Deal Job:
              </h6>

              {/* TH 1: HR đã đề xuất lịch hẹn - Chờ TTS xác nhận */}
              {internship.deal_meeting_status === 'PENDING_INTERN' && (
                <div className="bg-white rounded p-3 text-dark">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <span className="badge bg-warning text-dark">HR đã đề xuất lịch hẹn</span>
                    <span className="text-muted small">Vui lòng phản hồi sớm để HR sắp xếp phòng họp</span>
                  </div>
                  <div className="row g-2 small mb-3">
                    <div className="col-12 col-md-6">
                      <i className="bi bi-clock-fill text-primary me-2" />
                      <strong>Thời gian: </strong>
                      <span className="text-primary fw-bold fs-6">
                        {internship.deal_meeting_time ? new Date(internship.deal_meeting_time).toLocaleString('vi-VN') : 'Đang cập nhật'}
                      </span>
                    </div>
                    <div className="col-12 col-md-6">
                      <i className="bi bi-geo-alt-fill text-danger me-2" />
                      <strong>Địa điểm / Hình thức: </strong>
                      <span className="fw-semibold">
                        {internship.deal_meeting_location || (internship.deal_meeting_type === 'ONLINE' ? 'Trực tuyến Google Meet' : 'Văn phòng công ty')}
                      </span>
                    </div>
                    {internship.deal_meeting_note && (
                      <div className="col-12 mt-1">
                        <i className="bi bi-chat-quote-fill text-muted me-2" />
                        <strong>Nội dung từ HR: </strong>
                        <span className="fst-italic">{internship.deal_meeting_note}</span>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDealMeeting}
                      disabled={dealSubmitting}
                      className="btn btn-success fw-semibold px-3 btn-sm"
                    >
                      <i className="bi bi-check-circle-fill me-1" />
                      Đồng ý & Xác nhận lịch hẹn này
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDealModal(true);
                        setDealForm({
                          deal_meeting_time: internship.deal_meeting_time ? new Date(internship.deal_meeting_time).toISOString().slice(0, 16) : '',
                          deal_meeting_type: internship.deal_meeting_type || 'OFFLINE',
                          deal_meeting_location: internship.deal_meeting_location || 'Văn phòng công ty',
                          deal_meeting_note: 'Em bận vào khung giờ trên, xin phép đề xuất lại giờ này ạ...'
                        });
                      }}
                      className="btn btn-outline-secondary fw-semibold btn-sm"
                    >
                      <i className="bi bi-arrow-repeat me-1" />
                      Đề xuất thời gian / địa điểm khác
                    </button>
                  </div>
                </div>
              )}

              {/* TH 2: Hai bên đã thống nhất lịch */}
              {internship.deal_meeting_status === 'CONFIRMED' && (
                <div className="bg-white rounded p-3 text-dark">
                  <div className="d-flex align-items-center gap-2 text-success fw-bold mb-2">
                    <i className="bi bi-check-circle-fill fs-5" />
                    <span>Hai bên đã thống nhất lịch hẹn trao đổi Deal Job!</span>
                  </div>
                  <div className="row g-2 small">
                    <div className="col-12 col-md-6">
                      <strong>Thời gian: </strong>
                      <span className="text-primary fw-bold">
                        {internship.deal_meeting_time ? new Date(internship.deal_meeting_time).toLocaleString('vi-VN') : '—'}
                      </span>
                    </div>
                    <div className="col-12 col-md-6">
                      <strong>Địa điểm / Link họp: </strong>
                      <span className="fw-semibold">{internship.deal_meeting_location}</span>
                    </div>
                    {internship.deal_meeting_note && (
                      <div className="col-12">
                        <strong>Ghi chú: </strong>
                        <span className="fst-italic">{internship.deal_meeting_note}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span className="text-muted small">
                      * Bạn hãy chuẩn bị các câu hỏi về kỳ vọng lương, lộ trình phát triển và tham gia đúng giờ nhé!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDealModal(true);
                        setDealForm({
                          deal_meeting_time: internship.deal_meeting_time ? new Date(internship.deal_meeting_time).toISOString().slice(0, 16) : '',
                          deal_meeting_type: internship.deal_meeting_type || 'OFFLINE',
                          deal_meeting_location: internship.deal_meeting_location || 'Văn phòng công ty',
                          deal_meeting_note: ''
                        });
                      }}
                      className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                    >
                      Đề xuất đổi lịch nếu có việc đột xuất
                    </button>
                  </div>
                </div>
              )}

              {/* TH 3: TTS đã gửi đề xuất - Chờ HR phản hồi */}
              {internship.deal_meeting_status === 'PENDING_HR' && (
                <div className="bg-white rounded p-3 text-dark">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-1">
                    <i className="bi bi-hourglass-split" />
                    <span>Bạn đã gửi đề xuất lịch hẹn tới phòng Nhân sự:</span>
                  </div>
                  <div className="small">
                    Thời gian mong muốn: <strong>{internship.deal_meeting_time ? new Date(internship.deal_meeting_time).toLocaleString('vi-VN') : '—'}</strong> ({internship.deal_meeting_type === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp tại: ' + (internship.deal_meeting_location || 'Văn phòng')})
                  </div>
                  <div className="text-muted small mt-1">HR sẽ kiểm tra lịch phòng họp và phản hồi cho bạn trong thời gian sớm nhất.</div>
                </div>
              )}

              {/* TH 4: Chưa đặt lịch */}
              {(!internship.deal_meeting_status || internship.deal_meeting_status === 'NONE') && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span className="small text-light">
                    Hai bên chưa chốt lịch trao đổi. Bạn có thể chủ động đề xuất thời gian và hình thức (Trực tiếp hoặc Online) phù hợp nhất với bạn.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDealModal(true);
                      setDealForm({
                        deal_meeting_time: '',
                        deal_meeting_type: 'OFFLINE',
                        deal_meeting_location: 'Văn phòng Công ty - Tầng 4, Phòng Họp 2',
                        deal_meeting_note: 'Em mong muốn được trao đổi về mức lương khởi điểm và lộ trình dự án sắp tới...'
                      });
                    }}
                    className="btn btn-light btn-sm fw-semibold text-primary"
                  >
                    <i className="bi bi-calendar-plus me-1" />
                    Đề xuất lịch hẹn với HR ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Internship info card */}
      {internship ? (
        <div className="card shadow-sm border mb-4">
          <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
            <h5 className="card-title fw-bold text-dark mb-0">
              <i className="bi bi-info-circle text-primary me-2" />
              Thông tin kỳ thực tập
            </h5>
            <div className="d-flex align-items-center gap-2">
              {internship.hiring_decision === 'HIRED' && (
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary px-2.5 py-1.5" title="Đã được tiếp nhận làm Nhân viên chính thức">
                    <i className="bi bi-award-fill me-1" /> Nhân viên chính thức
                  </span>
                  {!showOfferBanner && (
                    <button
                      type="button"
                      onClick={() => setShowOfferBanner(true)}
                      className="btn btn-link btn-sm text-decoration-none p-0 text-primary small fw-semibold"
                      title="Xem lại thư chúc mừng tuyển dụng chính thức"
                    >
                      <i className="bi bi-stars me-1" />Xem thư chúc mừng
                    </button>
                  )}
                </div>
              )}
              {internship.hiring_decision === 'DECLINED' && (
                <span className="badge bg-secondary px-2.5 py-1.5" title={internship.hiring_decline_reason || ''}>
                  <i className="bi bi-x-circle me-1" /> Đã từ chối Offer
                </span>
              )}
              <StatusBadge status={internship.status} />
            </div>
          </div>

          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Vị trí thực tập</span>
                <strong className="text-dark small">{internship.position_title}</strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Cơ sở trực thuộc</span>
                <strong className="text-dark small">
                  <i className="bi bi-geo-alt text-primary me-1" />
                  {internship.branch_name}
                </strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Mentor hướng dẫn</span>
                <strong className="text-dark small">
                  <i className="bi bi-person-badge text-primary me-1" />
                  {internship.mentor_name || 'Đang cập nhật'}
                </strong>
              </div>
              <div className="col-6 col-md-3">
                <span className="text-muted small d-block">Thời gian thực tập</span>
                <strong className="text-dark small">
                  {new Date(internship.start_date).toLocaleDateString('vi-VN')} &ndash;{' '}
                  {new Date(internship.end_date).toLocaleDateString('vi-VN')}
                </strong>
              </div>
            </div>

            {internship.final_review && (
              <div className="alert alert-info mt-3 mb-0 small">
                <div className="fw-bold mb-1">
                  <i className="bi bi-award-fill me-1" />
                  Đánh giá tổng kết từ Mentor:
                </div>
                <div>{internship.final_review}</div>
                {internship.rating && (
                  <div className="fw-bold mt-1 text-primary">
                    ⭐ Điểm đánh giá: {internship.rating}/10
                  </div>
                )}
                {internship.mentor_recommendation && (
                  <div className="mt-1">
                    Đề xuất của Mentor:{' '}
                    <span className={`badge ms-1 ${internship.mentor_recommendation === 'PASS' ? 'bg-success' : 'bg-danger'}`}>
                      {internship.mentor_recommendation === 'PASS' ? 'Đạt yêu cầu' : 'Không đạt'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <div>Bạn chưa có thông tin kỳ thực tập. Vui lòng liên hệ phòng Nhân sự (HR) để được phân bổ.</div>
        </div>
      )}

      {/* ===== KẾT QUẢ ĐÁNH GIÁ CUỐI KỲ & HỒ SƠ GIẤY XÁC NHẬN ===== */}
      {internship && (internship.mentor_evaluated_at || internship.hr_confirmed_at || internship.status === 'COMPLETED' || ['REQUESTED', 'PENDING', 'APPROVED'].includes(internship.certificate_status)) && (
        <div className="card shadow-sm border mb-4">
          <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
            <h5 className="card-title fw-bold text-dark mb-0">
              <i className="bi bi-patch-check-fill text-primary me-2" />
              Kết quả Kỳ thực tập & Giấy xác nhận
            </h5>
            {internship.hr_result && internship.hr_result !== 'NONE' ? (
              <span className={`badge ${internship.hr_result === 'PASSED' ? 'bg-success' : 'bg-danger'} fs-6`}>
                {internship.hr_result === 'PASSED' ? 'HR: Đạt yêu cầu' : 'HR: Không đạt'}
              </span>
            ) : (
              <span className="badge bg-warning text-dark">Chờ HR tổng hợp & xác nhận</span>
            )}
          </div>
          <div className="card-body p-4">
            {/* Step flow visual */}
            <div className="row g-2 text-center mb-4">
              <div className="col">
                <div className={`p-2 rounded border ${internship.mentor_evaluated_at ? 'bg-success-subtle border-success text-success' : 'bg-light text-muted'}`}>
                  <div className="small fw-bold">1. Đánh giá cuối kỳ</div>
                  <div style={{ fontSize: '0.75rem' }}>
                    {internship.mentor_evaluated_at ? 'Mentor đã đánh giá' : 'Chờ Mentor'}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className={`p-2 rounded border ${internship.hr_confirmed_at ? 'bg-success-subtle border-success text-success' : internship.mentor_evaluated_at ? 'bg-warning-subtle border-warning text-dark' : 'bg-light text-muted'}`}>
                  <div className="small fw-bold">2. HR xác nhận</div>
                  <div style={{ fontSize: '0.75rem' }}>
                    {internship.hr_confirmed_at ? (internship.hr_result === 'PASSED' ? 'Đã đạt' : 'Không đạt') : 'Chờ HR xác nhận'}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className={`p-2 rounded border ${internship.certificate_status === 'APPROVED' ? 'bg-success-subtle border-success text-success' : ['REQUESTED', 'PENDING'].includes(internship.certificate_status) ? 'bg-warning-subtle border-warning text-dark' : 'bg-light text-muted'}`}>
                  <div className="small fw-bold">3. Cấp Giấy & Phiếu ĐG</div>
                  <div style={{ fontSize: '0.75rem' }}>
                    {internship.certificate_status === 'APPROVED' ? 'Đã cấp' : ['REQUESTED', 'PENDING'].includes(internship.certificate_status) ? 'Đang duyệt' : 'Theo yêu cầu'}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className={`p-2 rounded border ${internship.hiring_decision === 'HIRED' ? 'bg-primary-subtle border-primary text-primary' : isRecommendedForOffer ? 'bg-info-subtle border-info text-dark' : internship.hiring_decision === 'DECLINED' ? 'bg-secondary-subtle border-secondary text-secondary' : (internship.hr_result === 'FAILED' || ['NOT_OFFERED', 'REJECTED'].includes(internship.hiring_decision)) ? 'bg-light text-muted opacity-75' : 'bg-light text-muted'}`}>
                  <div className="small fw-bold">4. Trao đổi Deal Job</div>
                  <div style={{ fontSize: '0.75rem' }}>
                    {internship.hiring_decision === 'HIRED'
                      ? 'Đã tiếp nhận chính thức'
                      : internship.hiring_decision === 'DECLINED'
                      ? 'Đã từ chối Offer'
                      : internship.hr_result === 'FAILED' || ['NOT_OFFERED', 'REJECTED'].includes(internship.hiring_decision)
                      ? 'Không áp dụng'
                      : internship.deal_meeting_status === 'CONFIRMED'
                      ? 'Đã chốt lịch'
                      : isRecommendedForOffer
                      ? 'Có lời mời offer'
                      : 'Xem xét'}
                  </div>
                </div>
              </div>
            </div>

            {/* HR Review & Confirmation */}
            {internship.hr_confirmed_at && (
              <div className={`alert ${internship.hr_result === 'PASSED' ? 'alert-success' : 'alert-danger'} small mb-3`}>
                <div className="fw-bold mb-1">
                  <i className="bi bi-shield-check me-1" />
                  Kết luận từ Phòng Nhân sự (HR):
                </div>
                <div>{internship.hr_review || (internship.hr_result === 'PASSED' ? 'Chúc mừng bạn đã hoàn thành xuất sắc kỳ thực tập và đạt yêu cầu của công ty!' : 'Kỳ thực tập chưa đạt chỉ tiêu theo yêu cầu.')}</div>
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  Xác nhận ngày: {new Date(internship.hr_confirmed_at).toLocaleDateString('vi-VN')}
                </div>
              </div>
            )}

            {/* Certificate Section */}
            {(internship.hr_result === 'PASSED' || internship.mentor_evaluated_at || internship.status === 'COMPLETED' || ['REQUESTED', 'PENDING', 'APPROVED'].includes(internship.certificate_status)) && (
              <div className="p-3 rounded border bg-light">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-1">
                      <i className="bi bi-file-earmark-check-fill text-primary me-2" />
                      Hồ sơ Giấy xác nhận & Phiếu đánh giá thực tập
                    </h6>
                    <p className="text-muted small mb-0">
                      Bao gồm <strong>Giấy xác nhận thực tập tốt nghiệp</strong> và <strong>Phiếu nhận xét đánh giá (Bảng điểm tiêu chí)</strong> chuẩn Bộ GD&ĐT để nộp Khoa/Trường.
                    </p>
                  </div>

                  <div>
                    {(!internship.certificate_status || internship.certificate_status === 'NONE') && (
                      <button
                        onClick={() => setCertModal(true)}
                        className="btn btn-sm btn-primary fw-semibold"
                      >
                        <i className="bi bi-send-check me-1" /> Yêu cầu cấp Giấy & Phiếu đánh giá
                      </button>
                    )}

                    {['REQUESTED', 'PENDING'].includes(internship.certificate_status) && (
                      <span className="badge bg-warning text-dark p-2">
                        <i className="bi bi-hourglass-split me-1" /> Đã gửi yêu cầu – HR đang kiểm tra thông tin để cấp
                      </span>
                    )}

                    {internship.certificate_status === 'APPROVED' && (
                      <button
                        onClick={() => setViewCertModal(true)}
                        className="btn btn-sm btn-success fw-semibold"
                      >
                        <i className="bi bi-file-earmark-pdf-fill me-1" /> Xem & In Giấy XN & Phiếu Đánh Giá
                      </button>
                    )}

                    {internship.certificate_status === 'REJECTED' && (
                      <button
                        onClick={() => setCertModal(true)}
                        className="btn btn-sm btn-outline-danger fw-semibold"
                      >
                        <i className="bi bi-arrow-repeat me-1" /> Gửi lại yêu cầu cấp giấy
                      </button>
                    )}
                  </div>
                </div>

                {internship.certificate_status === 'APPROVED' && (
                  <div className="mt-3 p-3 bg-white rounded border border-success">
                    <div className="row g-2 small">
                      <div className="col-12 col-sm-6">
                        <span className="text-muted d-block">Mã chứng nhận tra cứu:</span>
                        <strong className="text-success fs-6 font-monospace">{internship.certificate_code}</strong>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted d-block">Ngày phê duyệt cấp:</span>
                        <strong className="text-dark">
                          {internship.certificate_approved_at ? new Date(internship.certificate_approved_at).toLocaleDateString('vi-VN') : '—'}
                        </strong>
                      </div>
                      {internship.school_name && (
                        <div className="col-12 col-sm-6">
                          <span className="text-muted d-block">Trường Đại học:</span>
                          <strong className="text-dark">{internship.school_name}</strong>
                        </div>
                      )}
                      {internship.student_code && (
                        <div className="col-12 col-sm-6">
                          <span className="text-muted d-block">Mã số sinh viên:</span>
                          <strong className="text-dark">{internship.student_code}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {internship.certificate_status === 'REJECTED' && internship.certificate_rejection_reason && (
                  <div className="mt-2 text-danger small">
                    <i className="bi bi-exclamation-circle me-1" />
                    Lý do chưa được duyệt: {internship.certificate_rejection_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Todo Tasks */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-list-task text-primary me-2" />
            Nhiệm vụ cần thực hiện ({todoTasks.length})
          </h5>
        </div>

        {todoTasks.length === 0 ? (
          <div className="card border bg-light p-4 text-center">
            <div className="text-success fs-3 mb-2">
              <i className="bi bi-check-circle-fill" />
            </div>
            <h6 className="fw-bold text-dark mb-1">Tuyệt vời! Bạn đã hoàn thành tất cả công việc</h6>
            <p className="text-muted small mb-0">Hiện tại không có nhiệm vụ mới nào cần xử lý.</p>
          </div>
        ) : (
          <div className="row g-3">
            {todoTasks.map((t) => (
              <div key={t.id} className="col-12 col-md-6">
                <TaskCard
                  task={t}
                  role="INTERN"
                  onStatusChange={handleStatusChange}
                  onSubmit={(task) => handleOpenSubmit(task)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed / Submitted tasks */}
      {doneTasks.length > 0 && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-check2-all text-success me-2" />
              Đã nộp & Lịch sử nhiệm vụ ({doneTasks.length})
            </h5>
          </div>

          <div className="row g-3">
            {doneTasks.map((t) => (
              <div key={t.id} className="col-12 col-md-6">
                <TaskCard
                  task={t}
                  role="INTERN"
                  onStatusChange={handleStatusChange}
                  onSubmit={(task) => handleOpenSubmit(task)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Task Modal */}
      {submitModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-primary text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-cloud-arrow-up-fill me-2" />
                    Nộp kết quả thực hiện công việc
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSubmitModal(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="bg-light p-3 rounded border mb-3">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark mb-0">{submitModal.title}</h6>
                        <span className="badge bg-secondary">
                          Hạn chót: {new Date(submitModal.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                        {submitModal.description}
                      </p>
                      {submitModal.attachment_file_url && (
                        <div className="mt-2 pt-2 border-top">
                          <TaskFileBadge
                            fileUrl={submitModal.attachment_file_url}
                            fileName={submitModal.attachment_file_name}
                            label="Đề bài / Tài liệu hướng dẫn đính kèm từ Mentor:"
                            variant="attachment"
                          />
                        </div>
                      )}
                    </div>

                    {submitModal.submission_file_url && !selectedFile && (
                      <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-1">
                          Tệp bạn đã nộp trước đó:
                        </div>
                        <TaskFileBadge
                          fileUrl={submitModal.submission_file_url}
                          fileName={submitModal.submission_file_name}
                          fileSize={submitModal.submission_file_size}
                          label="Tệp đã tải lên trước đó:"
                          variant="submission"
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                        <span>
                          <i className="bi bi-paperclip text-primary me-1" />
                          Tải lên tệp bài nộp trực tiếp (PDF, DOC, ZIP, PNG, v.v.):
                        </span>
                        <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                          Tối đa 50MB
                        </span>
                      </label>

                      <div
                        className="border border-2 border-dashed rounded p-3 text-center bg-white"
                        style={{ borderColor: selectedFile ? '#0d6efd' : '#dee2e6' }}
                      >
                        {selectedFile ? (
                          <div className="d-flex align-items-center justify-content-between bg-light p-2.5 rounded border">
                            <div className="d-flex align-items-center gap-2 text-truncate pe-2">
                              <i className="bi bi-file-earmark-check-fill text-success fs-3" />
                              <div className="text-start text-truncate">
                                <div className="fw-semibold text-dark text-truncate small">
                                  {selectedFile.name}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {formatFileSize(selectedFile.size)}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="btn btn-sm btn-outline-danger py-1 px-2"
                              title="Hủy chọn tệp này"
                            >
                              <i className="bi bi-trash3 me-1" /> Đổi tệp
                            </button>
                          </div>
                        ) : (
                          <div>
                            <i className="bi bi-cloud-arrow-up display-6 text-primary mb-2 d-block" />
                            <div className="fw-semibold text-dark small mb-1">
                              Kéo thả tệp vào đây hoặc nhấn để chọn tệp từ máy tính
                            </div>
                            <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                              Hỗ trợ: Báo cáo PDF, tài liệu Word (.docx), hình ảnh phân tích, file nén (.zip, .rar).
                            </p>
                            <label className="btn btn-sm btn-outline-primary px-3 cursor-pointer">
                              <i className="bi bi-folder2-open me-1" /> Chọn tệp tải lên
                              <input
                                type="file"
                                className="d-none"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.zip,.rar,.7z,.tar,.gz,.txt,.csv,.json,.md"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setSelectedFile(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold" htmlFor="submit_content">
                        Nội dung mô tả / Link mã nguồn (Git, Drive...):
                      </label>
                      <textarea
                        id="submit_content"
                        rows={4}
                        value={submitContent}
                        onChange={(e) => setSubmitContent(e.target.value)}
                        placeholder="Mô tả tóm tắt giải pháp, link GitHub repo hoặc tài liệu liên quan..."
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="modal-footer bg-light py-2 px-3">
                    <button
                      type="button"
                      onClick={() => setSubmitModal(null)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-sm btn-primary fw-semibold px-4"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang tải lên & nộp bài...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill me-1" /> Xác nhận nộp bài
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

      {/* Modal Yêu cầu cấp Giấy xác nhận & Phiếu đánh giá thực tập */}
      {certModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-file-earmark-plus text-primary me-2" />
                    Yêu cầu cấp Giấy xác nhận & Phiếu đánh giá thực tập
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setCertModal(false)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleRequestCertificate}>
                  <div className="modal-body p-4 overflow-auto" style={{ maxHeight: '72vh' }}>
                    <div className="alert alert-info py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle-fill fs-5" />
                      <div>
                        Thực tập sinh <strong>tự điền các thông tin cá nhân và trường lớp</strong> dưới đây.
                        Các thông tin của công ty (phòng ban, vị trí, mentor, thời gian, điểm số và nhận xét) được hệ thống tự động điền và khóa cố định.
                      </div>
                    </div>

                    {/* PHẦN 1: THÔNG TIN CÁ NHÂN (Sinh viên tự điền) */}
                    <div className="mb-4">
                      <div className="fw-bold text-primary small uppercase border-bottom pb-1 mb-2 d-flex justify-content-between">
                        <span>1. THÔNG TIN CÁ NHÂN SINH VIÊN (Tự điền)</span>
                        <span className="badge bg-primary-subtle text-primary fw-normal">Sinh viên chịu trách nhiệm</span>
                      </div>
                      <div className="row g-2">
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold" htmlFor="custom_intern_name">
                            Họ và tên sinh viên <span className="text-danger">*</span>
                          </label>
                          <input
                            id="custom_intern_name"
                            type="text"
                            required
                            value={certForm.custom_intern_name}
                            onChange={(e) => setCertForm({ ...certForm, custom_intern_name: e.target.value })}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-6 col-sm-3">
                          <label className="form-label small fw-semibold" htmlFor="student_dob">
                            Ngày sinh
                          </label>
                          <input
                            id="student_dob"
                            type="text"
                            value={certForm.student_dob}
                            onChange={(e) => setCertForm({ ...certForm, student_dob: e.target.value })}
                            placeholder="dd/mm/yyyy (ví dụ: 15/08/2002)"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-6 col-sm-3">
                          <label className="form-label small fw-semibold" htmlFor="student_gender">
                            Giới tính
                          </label>
                          <select
                            id="student_gender"
                            value={certForm.student_gender}
                            onChange={(e) => setCertForm({ ...certForm, student_gender: e.target.value })}
                            className="form-select form-select-sm"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>

                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold" htmlFor="student_phone">
                            Số điện thoại cá nhân
                          </label>
                          <input
                            id="student_phone"
                            type="text"
                            value={certForm.student_phone}
                            onChange={(e) => setCertForm({ ...certForm, student_phone: e.target.value })}
                            placeholder="Ví dụ: 0912 345 678"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold" htmlFor="student_address">
                            Quê quán / Địa chỉ thường trú
                          </label>
                          <input
                            id="student_address"
                            type="text"
                            value={certForm.student_address}
                            onChange={(e) => setCertForm({ ...certForm, student_address: e.target.value })}
                            placeholder="Ví dụ: Quận Cầu Giấy, TP. Hà Nội"
                            className="form-control form-control-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PHẦN 2: THÔNG TIN TRƯỜNG LỚP (Sinh viên tự điền) */}
                    <div className="mb-4">
                      <div className="fw-bold text-primary small uppercase border-bottom pb-1 mb-2 d-flex justify-content-between">
                        <span>2. THÔNG TIN TRƯỜNG LỚP & KHÓA ĐÀO TẠO (Tự điền)</span>
                        <span className="badge bg-primary-subtle text-primary fw-normal">Sinh viên tự điền</span>
                      </div>
                      <div className="row g-2">
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold" htmlFor="school_name">
                            Tên Trường Đại học / Học viện <span className="text-danger">*</span>
                          </label>
                          <input
                            id="school_name"
                            type="text"
                            value={certForm.school_name}
                            onChange={(e) => setCertForm({ ...certForm, school_name: e.target.value })}
                            required
                            placeholder="Ví dụ: Trường Đại học Bách Khoa Hà Nội"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold" htmlFor="faculty_name">
                            Khoa / Viện đào tạo
                          </label>
                          <input
                            id="faculty_name"
                            type="text"
                            value={certForm.faculty_name}
                            onChange={(e) => setCertForm({ ...certForm, faculty_name: e.target.value })}
                            placeholder="Ví dụ: Khoa Công nghệ Thông tin"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-6 col-sm-3">
                          <label className="form-label small fw-semibold" htmlFor="student_code">
                            Mã số sinh viên (MSSV) <span className="text-danger">*</span>
                          </label>
                          <input
                            id="student_code"
                            type="text"
                            value={certForm.student_code}
                            onChange={(e) => setCertForm({ ...certForm, student_code: e.target.value })}
                            required
                            placeholder="Ví dụ: 20210123"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-6 col-sm-3">
                          <label className="form-label small fw-semibold" htmlFor="university_class">
                            Lớp sinh viên
                          </label>
                          <input
                            id="university_class"
                            type="text"
                            value={certForm.university_class}
                            onChange={(e) => setCertForm({ ...certForm, university_class: e.target.value })}
                            placeholder="Ví dụ: CNTT 01-K65"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-6 col-sm-3">
                          <label className="form-label small fw-semibold" htmlFor="major_name">
                            Chuyên ngành đào tạo
                          </label>
                          <input
                            id="major_name"
                            type="text"
                            value={certForm.major_name}
                            onChange={(e) => setCertForm({ ...certForm, major_name: e.target.value })}
                            placeholder="Ví dụ: Kỹ thuật Phần mềm"
                            className="form-control form-control-sm"
                          />
                        </div>

                        <div className="col-6 col-sm-3">
                          <label className="form-label small fw-semibold" htmlFor="academic_year">
                            Khóa học / Niên khóa
                          </label>
                          <input
                            id="academic_year"
                            type="text"
                            value={certForm.academic_year}
                            onChange={(e) => setCertForm({ ...certForm, academic_year: e.target.value })}
                            placeholder="Ví dụ: 2021 - 2025"
                            className="form-control form-control-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PHẦN 3: THÔNG TIN CÔNG TY & ĐÁNH GIÁ (Do hệ thống tự động điền - Khóa cố định) */}
                    <div className="mb-3">
                      <div className="fw-bold text-secondary small uppercase border-bottom pb-1 mb-2 d-flex justify-content-between">
                        <span>3. THÔNG TIN DOANH NGHIỆP & KẾT QUẢ ĐÁNH GIÁ (Hệ thống tự điền)</span>
                        <span className="badge bg-secondary-subtle text-secondary fw-normal">
                          <i className="bi bi-lock-fill me-1" />Khóa cố định
                        </span>
                      </div>
                      <div className="row g-2 p-3 bg-light rounded border text-muted small">
                        <div className="col-12 col-sm-6">
                          🏢 Đơn vị tiếp nhận: <strong className="text-dark">CÔNG TY CỔ PHẦN CÔNG NGHỆ & ĐÀO TẠO VYMI</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                          📍 Cơ sở / Chi nhánh: <strong className="text-dark">{internship?.branch_name || 'Hà Nội'}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                          💼 Phòng ban: <strong className="text-dark">{internship?.department_name || 'Phòng Kỹ thuật'}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                          🎯 Vị trí thực tập: <strong className="text-dark">{internship?.position_title || 'Thực tập sinh'}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                          👨‍🏫 Cán bộ hướng dẫn (Mentor): <strong className="text-dark">{internship?.mentor_name || 'Chưa phân công'}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                          ⏱️ Thời gian thực tập: <strong className="text-dark">
                            {internship?.start_date ? new Date(internship.start_date).toLocaleDateString('vi-VN') : '...'} đến {internship?.end_date ? new Date(internship.end_date).toLocaleDateString('vi-VN') : '...'}
                          </strong>
                        </div>
                        <div className="col-12 mt-2 pt-2 border-top">
                          ⭐ Điểm số & Xếp loại từ Mentor: <strong className="text-primary">{internship?.rating || '9.0'}/10</strong> &nbsp;|&nbsp;
                          Xếp loại: <span className="badge bg-success ms-1">{internship?.rating >= 9 ? 'Xuất sắc' : (internship?.rating >= 8 ? 'Giỏi' : 'Khá')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-0">
                      <label className="form-label small fw-semibold" htmlFor="cert_request_note">
                        Ghi chú thêm gửi HR (nếu có)
                      </label>
                      <textarea
                        id="cert_request_note"
                        rows={2}
                        value={certForm.certificate_request_note}
                        onChange={(e) => setCertForm({ ...certForm, certificate_request_note: e.target.value })}
                        placeholder="Ví dụ: Em cần giấy xác nhận có đóng dấu đỏ trước ngày 20 để kịp hạn nộp của Khoa..."
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setCertModal(false)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={certSubmitting}
                      className="btn btn-sm btn-primary fw-semibold px-4"
                    >
                      {certSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang gửi yêu cầu...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill me-1" /> Gửi yêu cầu đến HR
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

      {/* Modal Thống nhất thời gian & địa điểm Deal Job (TTS đề xuất cho HR) */}
      {dealModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-primary text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-calendar2-heart-fill me-2" />
                    Đề xuất Thời gian & Địa điểm Trao đổi Deal Job
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setDealModal(false)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleProposeDealMeeting}>
                  <div className="modal-body p-4">
                    <p className="text-muted small mb-3">
                      Bạn hãy chọn thời gian và hình thức thuận tiện nhất để trao đổi cùng Bộ phận Nhân sự về mức lương chính thức, chế độ đãi ngộ và lộ trình công việc.
                    </p>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="intern_deal_time">
                          Thời gian mong muốn (Ngày & Giờ) <span className="text-danger">*</span>
                        </label>
                        <input
                          id="intern_deal_time"
                          type="datetime-local"
                          required
                          value={dealForm.deal_meeting_time}
                          onChange={(e) => setDealForm({ ...dealForm, deal_meeting_time: e.target.value })}
                          className="form-control"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold" htmlFor="intern_deal_type">
                          Hình thức gặp mặt <span className="text-danger">*</span>
                        </label>
                        <select
                          id="intern_deal_type"
                          value={dealForm.deal_meeting_type}
                          onChange={(e) => setDealForm({
                            ...dealForm,
                            deal_meeting_type: e.target.value,
                            deal_meeting_location: e.target.value === 'ONLINE' ? 'Trực tuyến Google Meet' : 'Văn phòng công ty (Tầng 4)'
                          })}
                          className="form-select"
                        >
                          <option value="OFFLINE">🏢 Gặp trực tiếp tại Văn phòng Công ty</option>
                          <option value="ONLINE">💻 Trực tuyến qua Google Meet / Zoom</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold" htmlFor="intern_deal_loc">
                          Địa điểm / Phòng họp mong muốn <span className="text-danger">*</span>
                        </label>
                        <input
                          id="intern_deal_loc"
                          type="text"
                          required
                          value={dealForm.deal_meeting_location}
                          onChange={(e) => setDealForm({ ...dealForm, deal_meeting_location: e.target.value })}
                          placeholder="Ví dụ: Văn phòng công ty (Tầng 4) hoặc Gửi link Google Meet qua email"
                          className="form-control"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold" htmlFor="intern_deal_note">
                          Nguyện vọng / Ghi chú thêm gửi HR
                        </label>
                        <textarea
                          id="intern_deal_note"
                          rows={3}
                          value={dealForm.deal_meeting_note}
                          onChange={(e) => setDealForm({ ...dealForm, deal_meeting_note: e.target.value })}
                          placeholder="Ví dụ: Em muốn tìm hiểu thêm về các dự án sắp triển khai và chế độ bảo hiểm, thời gian bắt đầu làm việc chính thức..."
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setDealModal(false)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={dealSubmitting}
                      className="btn btn-sm btn-primary fw-semibold px-4"
                    >
                      {dealSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill me-1" /> Gửi đề xuất tới HR
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

      {/* ====== MODAL: Thực tập sinh từ chối lời mời làm việc chính thức ====== */}
      {declineModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-danger text-white py-3">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-x-octagon-fill me-2" />
                    Từ chối Lời mời Làm việc Chính thức
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setDeclineModal(false)} />
                </div>
                <form onSubmit={handleDeclineOffer}>
                  <div className="modal-body p-4">
                    <div className="alert alert-warning py-2 px-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1" />
                      <strong>Xác nhận:</strong> Sau khi từ chối, phản hồi này sẽ được gửi tới Phòng Nhân sự và các lịch hẹn trao đổi tuyển dụng sẽ tự động đóng lại.
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Lý do từ chối chính <span className="text-danger">*</span></label>
                      <select 
                        className="form-select" 
                        value={declineReasonType} 
                        onChange={(e) => setDeclineReasonType(e.target.value)}
                      >
                        <option value="Tiếp tục học tập / hoàn thành đồ án tốt nghiệp">🎓 Tiếp tục học tập / hoàn thành đồ án tốt nghiệp</option>
                        <option value="Đã nhận lời mời làm việc tại doanh nghiệp khác">💼 Đã nhận lời mời làm việc tại doanh nghiệp khác</option>
                        <option value="Chưa phù hợp với định hướng phát triển cá nhân tại thời điểm này">🧭 Chưa phù hợp với định hướng phát triển cá nhân</option>
                        <option value="Kế hoạch cá nhân / chuyển nơi cư trú">🏡 Kế hoạch cá nhân / chuyển nơi cư trú</option>
                        <option value="Khác">📝 Lý do khác (Nhập chi tiết bên dưới)</option>
                      </select>
                    </div>

                    <div className="mb-0">
                      <label className="form-label small fw-semibold" htmlFor="decline_detail">
                        Chia sẻ thêm với phòng Nhân sự (không bắt buộc)
                      </label>
                      <textarea
                        id="decline_detail"
                        rows={3}
                        value={declineCustomReason}
                        onChange={(e) => setDeclineCustomReason(e.target.value)}
                        placeholder="Em xin cảm ơn công ty và anh/chị đã tạo điều kiện trong kỳ thực tập vừa qua..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button type="button" onClick={() => setDeclineModal(false)} className="btn btn-sm btn-outline-secondary">
                      Giữ lại lời mời / Hủy
                    </button>
                    <button type="submit" className="btn btn-sm btn-danger fw-semibold px-3" disabled={declineSubmitting}>
                      {declineSubmitting ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-x-circle-fill me-1" />}
                      Xác nhận Từ chối
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {/* Modal Xem & In Giấy xác nhận & Phiếu đánh giá thực tập chính thức */}
      {viewCertModal && (
        <CertificateModal
          internship={internship}
          onClose={() => setViewCertModal(false)}
          onUpdate={(updated) => setInternship(updated)}
        />
      )}
    </DashboardLayout>
  );
}
