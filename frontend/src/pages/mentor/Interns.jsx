import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import CvViewerModal from '../../components/common/CvViewerModal';
import CertificateModal from '../../components/common/CertificateModal';
import { useNotification } from '../../contexts/NotificationContext';

const SCORE_TEXT = {
  10: 'Mười điểm',
  9.5: 'Chín phẩy năm điểm',
  9: 'Chín điểm',
  8.5: 'Tám phẩy năm điểm',
  8: 'Tám điểm',
  7.5: 'Bảy phẩy năm điểm',
  7: 'Bảy điểm',
  6.5: 'Sáu phẩy năm điểm',
  6: 'Sáu điểm',
  5.5: 'Năm phẩy năm điểm',
  5: 'Năm điểm'
};

function getScoreText(score) {
  if (!score) return 'Chín điểm';
  const num = parseFloat(score);
  return SCORE_TEXT[num] || `${num} điểm`;
}

function getRatingRank(score) {
  const num = parseFloat(score || 9);
  if (num >= 9.0) return 'Xuất sắc';
  if (num >= 8.0) return 'Giỏi';
  if (num >= 6.5) return 'Khá';
  if (num >= 5.0) return 'Trung bình';
  return 'Không đạt';
}

const DEFAULT_CRITERIA = {
  c1_1: 0.5,
  c1_2: 0.5,
  c1_3: 0.5,
  c1_4: 0.5,
  c2_1: 1.0,
  c2_2: 1.8,
  c2_3: 0.9,
  c2_4: 0.8,
  c3_1: 0.8,
  c3_2: 0.9,
  c3_3: 0.8
};

export default function MentorInterns() {
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [viewingCv, setViewingCv] = useState(null);
  const [viewingCertificate, setViewingCertificate] = useState(null);
  const [evaluatingIntern, setEvaluatingIntern] = useState(null);
  const [evalData, setEvalData] = useState({
    rating: 9.0,
    score_discipline: 2.0,
    score_competence: 4.5,
    score_skills: 2.5,
    evaluation_criteria: { ...DEFAULT_CRITERIA },
    evaluation_advantages: '',
    evaluation_limitations: '',
    final_review: '',
    mentor_recommendation: 'PASS',
    mentor_offer_recommendation: false
  });
  const [quickTaskIntern, setQuickTaskIntern] = useState(null);
  const [quickTaskForm, setQuickTaskForm] = useState({ title: '', description: '', deadline: '' });

  const fetchData = async () => {
    try {
      const [iRes, tRes] = await Promise.all([
        api.get('/mentor/interns'),
        api.get('/mentor/tasks'),
      ]);
      setInterns(iRes.data.data || []);
      setTasks(tRes.data.data || []);
    } catch (err) {
      console.error('Error fetching mentor interns data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEvaluation = (intern) => {
    setEvaluatingIntern(intern);
    let parsedCriteria = null;
    if (intern.evaluation_criteria) {
      try {
        parsedCriteria = typeof intern.evaluation_criteria === 'string'
          ? JSON.parse(intern.evaluation_criteria)
          : intern.evaluation_criteria;
      } catch (e) {
        parsedCriteria = null;
      }
    }

    const disc = intern.score_discipline !== null && intern.score_discipline !== undefined
      ? parseFloat(intern.score_discipline)
      : (intern.rating ? (parseFloat(intern.rating) >= 9 ? 2.0 : 1.8) : 2.0);
    const comp = intern.score_competence !== null && intern.score_competence !== undefined
      ? parseFloat(intern.score_competence)
      : (intern.rating ? (parseFloat(intern.rating) >= 9 ? 4.5 : 4.0) : 4.5);
    const skill = intern.score_skills !== null && intern.score_skills !== undefined
      ? parseFloat(intern.score_skills)
      : (intern.rating ? (parseFloat(intern.rating) >= 9 ? 2.5 : 2.2) : 2.5);
    const total = intern.rating !== null && intern.rating !== undefined
      ? parseFloat(intern.rating)
      : Math.round((disc + comp + skill) * 10) / 10;

    const c1_4_val = Math.max(0, Math.round((disc - 1.5) * 10) / 10);
    const c2_4_val = Math.max(0, Math.round((comp - 3.7) * 10) / 10);
    const c3_3_val = Math.max(0, Math.round((skill - 1.7) * 10) / 10);

    setEvalData({
      rating: total,
      score_discipline: disc,
      score_competence: comp,
      score_skills: skill,
      evaluation_criteria: parsedCriteria || {
        c1_1: 0.5,
        c1_2: 0.5,
        c1_3: 0.5,
        c1_4: c1_4_val > 0.5 ? 0.5 : (c1_4_val > 0 ? c1_4_val : 0.4),
        c2_1: 1.0,
        c2_2: 1.8,
        c2_3: 0.9,
        c2_4: c2_4_val > 1.0 ? 1.0 : (c2_4_val > 0 ? c2_4_val : 0.8),
        c3_1: 0.8,
        c3_2: 0.9,
        c3_3: c3_3_val > 1.0 ? 1.0 : (c3_3_val > 0 ? c3_3_val : 0.8)
      },
      evaluation_advantages: intern.evaluation_advantages || '',
      evaluation_limitations: intern.evaluation_limitations || '',
      final_review: intern.final_review || '',
      mentor_recommendation: intern.mentor_recommendation || 'PASS',
      mentor_offer_recommendation: !!intern.mentor_offer_recommendation
    });
  };

  const handleCriterionChange = (key, val, maxVal) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxVal) num = maxVal;

    const newCriteria = {
      ...evalData.evaluation_criteria,
      [key]: num
    };

    const disc = Math.round(((parseFloat(newCriteria.c1_1) || 0) + (parseFloat(newCriteria.c1_2) || 0) + (parseFloat(newCriteria.c1_3) || 0) + (parseFloat(newCriteria.c1_4) || 0)) * 10) / 10;
    const comp = Math.round(((parseFloat(newCriteria.c2_1) || 0) + (parseFloat(newCriteria.c2_2) || 0) + (parseFloat(newCriteria.c2_3) || 0) + (parseFloat(newCriteria.c2_4) || 0)) * 10) / 10;
    const skill = Math.round(((parseFloat(newCriteria.c3_1) || 0) + (parseFloat(newCriteria.c3_2) || 0) + (parseFloat(newCriteria.c3_3) || 0)) * 10) / 10;
    const total = Math.round((disc + comp + skill) * 10) / 10;

    setEvalData({
      ...evalData,
      evaluation_criteria: newCriteria,
      score_discipline: disc,
      score_competence: comp,
      score_skills: skill,
      rating: total
    });
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!evaluatingIntern) return;
    try {
      await api.patch(`/mentor/interns/${evaluatingIntern.id}/final-review`, {
        rating: evalData.rating,
        score_discipline: evalData.score_discipline,
        score_competence: evalData.score_competence,
        score_skills: evalData.score_skills,
        evaluation_criteria: evalData.evaluation_criteria,
        evaluation_advantages: evalData.evaluation_advantages,
        evaluation_limitations: evalData.evaluation_limitations,
        final_review: evalData.final_review,
        mentor_recommendation: evalData.mentor_recommendation,
        mentor_offer_recommendation: evalData.mentor_offer_recommendation ? 1 : 0
      });
      await fetchData();
      setEvaluatingIntern(null);
      notify.success('Đã lưu kết quả đánh giá thực tập sinh chuẩn phiếu đánh giá thành công.', 'Đánh giá thực tập');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đánh giá.', 'Đánh giá thất bại');
    }
  };

  const handleQuickCreateTask = async (e) => {
    e.preventDefault();
    if (!quickTaskIntern) return;
    try {
      await api.post('/mentor/tasks', {
        intern_id: quickTaskIntern.id,
        title: quickTaskForm.title,
        description: quickTaskForm.description,
        deadline: quickTaskForm.deadline,
      });
      await fetchData();
      setQuickTaskIntern(null);
      setQuickTaskForm({ title: '', description: '', deadline: '' });
      notify.success(`Đã giao công việc mới thành công cho ${quickTaskIntern.intern_name}!`, 'Giao việc thành công');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Có lỗi xảy ra khi giao việc.', 'Giao việc thất bại');
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-5 text-center">
          <Loading text="Đang tải danh sách Thực tập sinh phụ trách..." />
        </div>
      </DashboardLayout>
    );
  }

  const evaluatedCount = interns.filter((i) => i.final_review || i.rating).length;
  const inProgressCount = interns.filter((i) => i.status === 'IN_PROGRESS').length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Quản lý & Đánh giá Thực tập sinh (Interns Evaluation)"
        subtitle="Theo dõi chi tiết năng lực, tiến độ công việc và đánh giá kết quả thực tập của từng học viên"
        breadcrumbs={[
          { label: 'Trang chủ', link: '/' },
          { label: 'Mentor', link: '/mentor' },
          { label: 'Thực tập sinh phụ trách' },
        ]}
      >
        <button
          onClick={() => navigate('/mentor/tasks')}
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 shadow-sm"
        >
          <i className="bi bi-list-task"></i>
          <span>Xem tất cả công việc</span>
        </button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Thực tập sinh phụ trách"
            value={interns.length}
            icon="bi-people-fill"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đang trong kỳ thực tập"
            value={inProgressCount}
            icon="bi-person-check-fill"
            variant="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Đã đánh giá tổng kết"
            value={`${evaluatedCount} / ${interns.length}`}
            icon="bi-award-fill"
            variant="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Tổng nhiệm vụ đã giao"
            value={tasks.length}
            icon="bi-clipboard-data"
            variant="warning"
          />
        </div>
      </div>

      {/* Interns Showcase Grid: Spacious, Full-Width Cards */}
      {interns.length === 0 ? (
        <EmptyState
          icon="bi-person-x"
          title="Chưa có thực tập sinh nào được phân công"
          description="Hiện tại bộ phận Nhân sự (HR) chưa chỉ định thực tập sinh nào cho bạn phụ trách."
        />
      ) : (
        <div className="row g-4">
          {interns.map((intern) => {
            // Calculate task stats for this intern
            const internTasks = tasks.filter((t) => t.intern_id === intern.id);
            const totalTasks = internTasks.length;
            const completed = internTasks.filter((t) => t.status === 'COMPLETED').length;
            const submitted = internTasks.filter((t) => t.status === 'SUBMITTED').length;
            const inProgress = internTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
            const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

            // Internship duration progress
            const startDate = intern.start_date ? new Date(intern.start_date) : null;
            const endDate = intern.end_date ? new Date(intern.end_date) : null;
            const now = new Date();
            let daysRemaining = null;
            let timeProgress = 0;

            if (startDate && endDate) {
              const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
              const passedDays = Math.max(0, Math.round((now - startDate) / (1000 * 60 * 60 * 24)));
              daysRemaining = Math.max(0, Math.round((endDate - now) / (1000 * 60 * 60 * 24)));
              timeProgress = Math.min(100, Math.max(0, Math.round((passedDays / totalDays) * 100)));
            }

            return (
              <div key={intern.id} className="col-12 col-xl-6">
                <div className="card border shadow-sm h-100 bg-white hover-shadow transition-all">
                  {/* Card Header with identification info */}
                  <div className="card-header bg-white py-3 px-4 border-bottom">
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                          style={{ width: '52px', height: '52px', fontSize: '1.35rem' }}
                        >
                          {intern.intern_name?.[0]?.toUpperCase() || 'I'}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h5 className="fw-bold text-dark mb-0">{intern.intern_name}</h5>
                            <StatusBadge status={intern.status} />
                          </div>
                          <div className="text-primary fw-medium small mt-0.5">
                            {intern.position_title}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {intern.branch_name && (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5">
                            <i className="bi bi-geo-alt-fill me-1" />
                            {intern.branch_name}
                          </span>
                        )}
                        {(intern.cv_id || intern.cv_file_path) && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingCv({
                                cv_id: intern.cv_id,
                                cv_original_name: intern.cv_original_name || `CV_${intern.intern_name}.pdf`,
                                cv_file_path: intern.cv_file_path,
                                applicant_name: intern.intern_name,
                                position_title: intern.position_title,
                              })
                            }
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 shadow-xs"
                            title="Xem hồ sơ CV"
                          >
                            <i className="bi bi-file-earmark-pdf-fill" /> Xem CV
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      {/* Contact Info Pills */}
                      <div className="row g-2 mb-3 small">
                        <div className="col-12 col-sm-6">
                          <div className="bg-light p-2.5 rounded border d-flex align-items-center gap-2">
                            <i className="bi bi-envelope-fill text-muted" />
                            <a
                              href={`mailto:${intern.intern_email}`}
                              className="text-dark text-truncate text-decoration-none"
                            >
                              {intern.intern_email}
                            </a>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6">
                          <div className="bg-light p-2.5 rounded border d-flex align-items-center gap-2">
                            <i className="bi bi-telephone-fill text-muted" />
                            <a
                              href={`tel:${intern.intern_phone}`}
                              className="text-dark text-truncate text-decoration-none"
                            >
                              {intern.intern_phone || 'Chưa cập nhật SĐT'}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Internship Duration & Progress */}
                      {startDate && endDate && (
                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="d-flex align-items-center justify-content-between small mb-1">
                            <span className="text-muted fw-semibold">
                              <i className="bi bi-calendar-range text-primary me-1" />
                              Thời gian thực tập:
                            </span>
                            <span className="text-dark fw-bold">
                              {startDate.toLocaleDateString('vi-VN')} → {endDate.toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="progress mt-2 mb-1" style={{ height: '6px' }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: `${timeProgress}%` }}
                              aria-valuenow={timeProgress}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                          <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                            <span>Tiến độ kỳ: {timeProgress}%</span>
                            <span className={daysRemaining <= 14 ? 'text-danger fw-bold' : ''}>
                              {daysRemaining > 0 ? `Còn lại ${daysRemaining} ngày` : 'Đã đến hạn kết thúc'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Task Stats & Progress Bar */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="small fw-semibold text-dark">
                            <i className="bi bi-list-task text-primary me-1" />
                            Tiến độ hoàn thành công việc:
                          </span>
                          <span className="badge bg-success-subtle text-success fw-bold">
                            {completionRate}% hoàn thành
                          </span>
                        </div>
                        <div className="progress mb-2" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${completionRate}%` }}
                            aria-valuenow={completionRate}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>

                        {/* Metric Tiles */}
                        <div className="row g-2 text-center small">
                          <div className="col-3">
                            <div className="bg-light p-2 rounded border">
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Tổng task</div>
                              <strong className="fs-6 text-dark">{totalTasks}</strong>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="bg-success-subtle p-2 rounded border border-success-subtle text-success">
                              <div style={{ fontSize: '0.7rem' }}>Đã xong</div>
                              <strong className="fs-6">{completed}</strong>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="bg-warning-subtle p-2 rounded border border-warning-subtle text-warning-emphasis">
                              <div style={{ fontSize: '0.7rem' }}>Chờ duyệt</div>
                              <strong className="fs-6">{submitted}</strong>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="bg-info-subtle p-2 rounded border border-info-subtle text-info-emphasis">
                              <div style={{ fontSize: '0.7rem' }}>Đang làm</div>
                              <strong className="fs-6">{inProgress}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Evaluation Section */}
                      <div className="p-3 bg-white rounded-3 border mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-1.5">
                            <i className="bi bi-award-fill text-warning fs-5" />
                            <strong className="small text-dark">Đánh giá quá trình thực tập:</strong>
                          </div>
                          {intern.rating ? (
                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                              <span className={`badge ${parseFloat(intern.rating) >= 9 ? 'bg-success' :
                                parseFloat(intern.rating) >= 8 ? 'bg-primary' :
                                  parseFloat(intern.rating) >= 6.5 ? 'bg-info text-dark' : 'bg-warning text-dark'
                                } fw-bold px-2.5 py-1`}>
                                ⭐ {parseFloat(intern.rating).toFixed(1)} / 10 ({getRatingRank(intern.rating)})
                              </span>
                              {intern.mentor_recommendation === 'FAIL' ? (
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                  <i className="bi bi-x-circle me-1" />Không đạt
                                </span>
                              ) : (
                                <span className="badge bg-success-subtle text-success border border-success-subtle">
                                  <i className="bi bi-check-circle me-1" />Đạt yêu cầu
                                </span>
                              )}
                              {intern.mentor_offer_recommendation ? (
                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                  <i className="bi bi-star-fill text-warning me-1" /> Đề xuất tuyển dụng
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="badge bg-light text-muted border small">
                              Chưa có điểm đánh giá
                            </span>
                          )}
                        </div>

                        {intern.rating && (
                          <div className="row g-1.5 mb-2.5 text-center" style={{ fontSize: '0.78rem' }}>
                            <div className="col-4">
                              <div className="bg-light p-1.5 rounded border">
                                <span className="text-muted d-block small">1. Kỷ luật (Max 2)</span>
                                <strong className="text-dark">{intern.score_discipline ? parseFloat(intern.score_discipline).toFixed(1) : '2.0'}</strong>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light p-1.5 rounded border">
                                <span className="text-muted d-block small">2. Chuyên môn (Max 5)</span>
                                <strong className="text-dark">{intern.score_competence ? parseFloat(intern.score_competence).toFixed(1) : '4.5'}</strong>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light p-1.5 rounded border">
                                <span className="text-muted d-block small">3. Kỹ năng (Max 3)</span>
                                <strong className="text-dark">{intern.score_skills ? parseFloat(intern.score_skills).toFixed(1) : '2.5'}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {intern.final_review ? (
                          <div className="p-2.5 bg-light rounded text-secondary small border">
                            {intern.evaluation_advantages && (
                              <div className="mb-1 text-dark">
                                <strong className="text-success"><i className="bi bi-check-circle-fill text-success me-1" />Ưu điểm nổi bật:</strong> {intern.evaluation_advantages}
                              </div>
                            )}
                            {intern.evaluation_limitations && (
                              <div className="mb-1 text-dark">
                                <strong className="text-warning-emphasis"><i className="bi bi-exclamation-triangle-fill text-warning me-1" />Điểm cần khắc phục:</strong> {intern.evaluation_limitations}
                              </div>
                            )}
                            <div className="fst-italic text-muted mt-1 pt-1 border-top">
                              <strong>Nhận xét tổng kết:</strong> &ldquo;{intern.final_review}&rdquo;
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted small mb-0 fst-italic">
                            Chưa có nhận xét tổng kết. Bạn có thể bấm nút "Đánh giá theo mẫu" bên dưới để chấm điểm chi tiết 11 tiêu chí theo chuẩn phiếu đánh giá của trường/doanh nghiệp.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Bar */}
                    <div className="pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEvaluation(intern)}
                          className={`btn btn-sm d-inline-flex align-items-center gap-1.5 ${intern.final_review ? 'btn-outline-primary' : 'btn-primary'
                            } shadow-xs`}
                        >
                          <i className="bi bi-pencil-square" />
                          <span>{intern.final_review ? 'Sửa đánh giá' : 'Đánh giá theo phiếu'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewingCertificate(intern)}
                          className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 shadow-xs"
                          title="Xem trước hoặc tải xuống Phiếu đánh giá & Giấy xác nhận chuẩn khổ A4"
                        >
                          <i className="bi bi-file-earmark-check-fill text-success" />
                          <span>Phiếu đánh giá A4</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setQuickTaskIntern(intern);
                            setQuickTaskForm({ title: '', description: '', deadline: '' });
                          }}
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 shadow-xs"
                        >
                          <i className="bi bi-plus-circle" />
                          <span>Giao việc mới</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/mentor/tasks?intern_id=${intern.id}`)}
                        className="btn btn-sm btn-link text-decoration-none text-primary fw-semibold p-0"
                      >
                        Quản lý tasks ({totalTasks}) →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL ĐÁNH GIÁ TỔNG KẾT (CHUẨN PHIẾU ĐÁNH GIÁ) ================= */}
      {evaluatingIntern && (
        <>
          <div
            className="modal show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}
          >
            <div
              className="modal-dialog modal-xl modal-dialog-centered"
              role="document"
              style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', margin: '1.5rem auto' }}
            >
              <div
                className="modal-content shadow-lg border-0"
                style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                {/* Header */}
                <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between flex-shrink-0">
                  <div>
                    <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2 mb-0">
                      <i className="bi bi-file-earmark-check-fill text-success fs-4" />
                      <span>Phiếu Nhận Xét & Đánh Giá Thực Tập: {evaluatingIntern.intern_name}</span>
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setEvaluatingIntern(null)}
                    aria-label="Close"
                  />
                </div>

                <form
                  onSubmit={handleSaveEvaluation}
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: '1 1 auto', minHeight: 0 }}
                >
                  <div
                    className="modal-body p-4 bg-light"
                    style={{ overflowY: 'auto', flex: '1 1 auto', WebkitOverflowScrolling: 'touch' }}
                  >
                    {/* Candidate Info Bar */}
                    <div className="card border shadow-xs mb-4">
                      <div className="card-body p-3 bg-white">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                            style={{ width: '46px', height: '46px', fontSize: '1.25rem' }}
                          >
                            {evaluatingIntern.intern_name?.[0]?.toUpperCase() || 'I'}
                          </div>
                          <div className="small">
                            <div className="fw-bold text-dark fs-6">{evaluatingIntern.intern_name}</div>
                            <div className="text-muted">
                              <span className="me-2"><i className="bi bi-briefcase me-1 text-primary" />{evaluatingIntern.position_title}</span>
                              <span className="me-2">•</span>
                              <span><i className="bi bi-geo-alt me-1 text-danger" />{evaluatingIntern.branch_name || 'Hà Nội'}</span>
                              {evaluatingIntern.student_code && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>MSSV: <strong>{evaluatingIntern.student_code}</strong></span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: NỘI DUNG ĐÁNH GIÁ & TIÊU CHÍ CHẤM ĐIỂM (CHUẨN BỘ GD&ĐT) */}
                    <div className="card border shadow-xs mb-4">
                      <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Phần I</span>
                          <strong className="text-dark small text-uppercase">
                            Nội dung đánh giá & tiêu chí chấm điểm
                          </strong>
                        </div>
                      </div>

                      <div className="card-body p-0 table-responsive">
                        <table className="table table-bordered table-hover mb-0 align-middle small">
                          <thead className="table-light text-center">
                            <tr>
                              <th style={{ width: '60px' }}>TT</th>
                              <th>Nội dung và tiêu chí đánh giá</th>
                              <th style={{ width: '100px' }}>Điểm Max</th>
                              <th style={{ width: '130px' }}>Điểm đánh giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* NHÓM 1 */}
                            <tr className="table-secondary fw-bold">
                              <td className="text-center">1</td>
                              <td colSpan="3">Ý THỨC TỔ CHỨC KỶ LUẬT VÀ TÁC PHONG LÀM VIỆC (TỐI ĐA 2.0 ĐIỂM)</td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">1.1</td>
                              <td>Chấp hành nghiêm chỉnh nội quy, quy chế và bảo mật công ty</td>
                              <td className="text-center text-muted">0.5</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="0.5"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c1_1}
                                  onChange={(e) => handleCriterionChange('c1_1', e.target.value, 0.5)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">1.2</td>
                              <td>Chấp hành giờ giấc làm việc, đi làm đúng giờ, nghỉ có phép</td>
                              <td className="text-center text-muted">0.5</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="0.5"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c1_2}
                                  onChange={(e) => handleCriterionChange('c1_2', e.target.value, 0.5)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">1.3</td>
                              <td>Tác phong làm việc nghiêm túc, giao tiếp văn minh chuẩn mực</td>
                              <td className="text-center text-muted">0.5</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="0.5"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c1_3}
                                  onChange={(e) => handleCriterionChange('c1_3', e.target.value, 0.5)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">1.4</td>
                              <td>Tinh thần cầu thị, trung thực và tinh thần trách nhiệm cao</td>
                              <td className="text-center text-muted">0.5</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="0.5"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c1_4}
                                  onChange={(e) => handleCriterionChange('c1_4', e.target.value, 0.5)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr className="table-success fw-bold">
                              <td colSpan="2" className="text-end">Cộng mục 1 (Ý thức kỷ luật):</td>
                              <td className="text-center">2.0</td>
                              <td className="text-center text-success fs-6">
                                {evalData.score_discipline.toFixed(1)}
                              </td>
                            </tr>

                            {/* NHÓM 2 */}
                            <tr className="table-secondary fw-bold">
                              <td className="text-center">2</td>
                              <td colSpan="3">NĂNG LỰC CHUYÊN MÔN VÀ KẾT QUẢ THỰC HIỆN CÔNG VIỆC (TỐI ĐA 5.0 ĐIỂM)</td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">2.1</td>
                              <td>Khả năng tiếp thu hướng dẫn, nắm bắt quy trình công việc</td>
                              <td className="text-center text-muted">1.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="1.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c2_1}
                                  onChange={(e) => handleCriterionChange('c2_1', e.target.value, 1.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">2.2</td>
                              <td>Vận dụng kiến thức học đường vào giải quyết công việc thực tế</td>
                              <td className="text-center text-muted">2.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="2.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c2_2}
                                  onChange={(e) => handleCriterionChange('c2_2', e.target.value, 2.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">2.3</td>
                              <td>Kỹ năng giải quyết vấn đề, xử lý tình huống nghiệp vụ phát sinh</td>
                              <td className="text-center text-muted">1.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="1.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c2_3}
                                  onChange={(e) => handleCriterionChange('c2_3', e.target.value, 1.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">2.4</td>
                              <td>Chất lượng sản phẩm và tiến độ hoàn thành các nhiệm vụ được giao</td>
                              <td className="text-center text-muted">1.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="1.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c2_4}
                                  onChange={(e) => handleCriterionChange('c2_4', e.target.value, 1.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr className="table-success fw-bold">
                              <td colSpan="2" className="text-end">Cộng mục 2 (Năng lực chuyên môn):</td>
                              <td className="text-center">5.0</td>
                              <td className="text-center text-success fs-6">
                                {evalData.score_competence.toFixed(1)}
                              </td>
                            </tr>

                            {/* NHÓM 3 */}
                            <tr className="table-secondary fw-bold">
                              <td className="text-center">3</td>
                              <td colSpan="3">KỸ NĂNG MỀM VÀ KHẢ NĂNG HÒA NHẬP MÔI TRƯỜNG (TỐI ĐA 3.0 ĐIỂM)</td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">3.1</td>
                              <td>Khả năng giao tiếp, trình bày và báo cáo công việc</td>
                              <td className="text-center text-muted">1.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="1.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c3_1}
                                  onChange={(e) => handleCriterionChange('c3_1', e.target.value, 1.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">3.2</td>
                              <td>Tinh thần làm việc nhóm, phối hợp tốt với đồng nghiệp</td>
                              <td className="text-center text-muted">1.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="1.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c3_2}
                                  onChange={(e) => handleCriterionChange('c3_2', e.target.value, 1.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-center text-muted">3.3</td>
                              <td>Tính chủ động, sáng tạo và tự học nâng cao trình độ</td>
                              <td className="text-center text-muted">1.0</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="1.0"
                                  step="0.1"
                                  value={evalData.evaluation_criteria.c3_3}
                                  onChange={(e) => handleCriterionChange('c3_3', e.target.value, 1.0)}
                                  className="form-control form-control-sm text-center fw-bold text-primary mx-auto"
                                  style={{ maxWidth: '85px' }}
                                />
                              </td>
                            </tr>
                            <tr className="table-success fw-bold">
                              <td colSpan="2" className="text-end">Cộng mục 3 (Kỹ năng mềm):</td>
                              <td className="text-center">3.0</td>
                              <td className="text-center text-success fs-6">
                                {evalData.score_skills.toFixed(1)}
                              </td>
                            </tr>

                            {/* TỔNG ĐIỂM */}
                            <tr className="table-primary fw-bold fs-6">
                              <td colSpan="2" className="text-end text-uppercase">TỔNG ĐIỂM TOÀN BỘ (THANG 10):</td>
                              <td className="text-center">10.0</td>
                              <td className="text-center text-danger fw-bolder fs-5">
                                {evalData.rating.toFixed(1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Summary banner */}
                      <div className="card-footer bg-light p-3 border-top">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                            <span className="text-muted me-2">Điểm số bằng chữ:</span>
                            <strong className="text-primary">{getScoreText(evalData.rating)}</strong>
                          </div>
                          <div>
                            <span className="text-muted me-2">Xếp loại kết quả:</span>
                            <span className={`badge ${evalData.rating >= 9.0 ? 'bg-success' :
                              evalData.rating >= 8.0 ? 'bg-primary' :
                                evalData.rating >= 6.5 ? 'bg-info text-dark' : 'bg-warning text-dark'
                              } fs-6 px-3 py-1`}>
                              {getRatingRank(evalData.rating)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Ý KIẾN NHẬN XÉT CỦA ĐƠN VỊ TIẾP NHẬN */}
                    <div className="card border shadow-xs mb-4">
                      <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center gap-2">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">Phần II</span>
                        <strong className="text-dark small text-uppercase">
                          Ý kiến nhận xét chi tiết của Cán bộ hướng dẫn / Doanh nghiệp
                        </strong>
                      </div>

                      <div className="card-body p-3">
                        {/* 1. Ưu điểm nổi bật */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label small fw-semibold text-dark mb-0">
                              1. Ưu điểm nổi bật của thực tập sinh:
                            </label>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              (Ghi nhận về thái độ, thế mạnh chuyên môn, tốc độ hòa nhập)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={evalData.evaluation_advantages}
                            onChange={(e) => setEvalData({ ...evalData, evaluation_advantages: e.target.value })}
                            placeholder="Ví dụ: Có tinh thần tự học cao, chủ động nghiên cứu công nghệ mới, hòa nhập nhanh với team và có trách nhiệm cao trong công việc..."
                            className="form-control form-control-sm"
                          />
                          <div className="d-flex gap-1.5 mt-1.5 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setEvalData({
                                ...evalData,
                                evaluation_advantages: (evalData.evaluation_advantages ? evalData.evaluation_advantages + ' ' : '') + 'Chủ động học hỏi, nắm bắt nhanh yêu cầu công việc.'
                              })}
                            >
                              + Chủ động học hỏi
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setEvalData({
                                ...evalData,
                                evaluation_advantages: (evalData.evaluation_advantages ? evalData.evaluation_advantages + ' ' : '') + 'Ý thức kỷ luật tốt, đi làm đầy đủ đúng giờ.'
                              })}
                            >
                              + Kỷ luật tốt
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setEvalData({
                                ...evalData,
                                evaluation_advantages: (evalData.evaluation_advantages ? evalData.evaluation_advantages + ' ' : '') + 'Phối hợp làm việc nhóm hiệu quả, tinh thần trách nhiệm cao.'
                              })}
                            >
                              + Tinh thần đồng đội
                            </button>
                          </div>
                        </div>

                        {/* 2. Điểm cần khắc phục */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label small fw-semibold text-dark mb-0">
                              2. Điểm cần khắc phục / hoàn thiện thêm:
                            </label>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              (Góp ý để sinh viên hoàn thiện kỹ năng sau khi tốt nghiệp)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={evalData.evaluation_limitations}
                            onChange={(e) => setEvalData({ ...evalData, evaluation_limitations: e.target.value })}
                            placeholder="Ví dụ: Cần trau dồi thêm kinh nghiệm xử lý các hệ thống thực tế quy mô lớn và nâng cao tốc độ tối ưu mã nguồn..."
                            className="form-control form-control-sm"
                          />
                          <div className="d-flex gap-1.5 mt-1.5 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setEvalData({
                                ...evalData,
                                evaluation_limitations: (evalData.evaluation_limitations ? evalData.evaluation_limitations + ' ' : '') + 'Cần tích lũy thêm kinh nghiệm thực chiến với dự án quy mô lớn.'
                              })}
                            >
                              + Tích lũy kinh nghiệm lớn
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setEvalData({
                                ...evalData,
                                evaluation_limitations: (evalData.evaluation_limitations ? evalData.evaluation_limitations + ' ' : '') + 'Cần tự tin hơn khi trình bày báo cáo kỹ thuật trước team.'
                              })}
                            >
                              + Tự tin thuyết trình
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setEvalData({
                                ...evalData,
                                evaluation_limitations: (evalData.evaluation_limitations ? evalData.evaluation_limitations + ' ' : '') + 'Cần tối ưu kỹ năng quản lý thời gian và lập kế hoạch.'
                              })}
                            >
                              + Quản lý thời gian
                            </button>
                          </div>
                        </div>

                        {/* 3. Nhận xét tổng kết */}
                        <div className="mb-0">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label small fw-semibold text-dark mb-0">
                              3. Nhận xét tổng kết toàn bộ kỳ thực tập <span className="text-danger">*</span>
                            </label>
                            <span className="text-danger" style={{ fontSize: '0.75rem' }}>
                              * Bắt buộc hiển thị vào Phiếu đánh giá A4 & Giấy xác nhận
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            required
                            value={evalData.final_review}
                            onChange={(e) => setEvalData({ ...evalData, final_review: e.target.value })}
                            placeholder="Nhận xét tổng kết mức độ hoàn thành nhiệm vụ và sự trưởng thành của sinh viên sau kỳ thực tập..."
                            className="form-control form-control-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: KẾT QUẢ ĐỀ XUẤT CỦA CÁN BỘ HƯỚNG DẪN */}
                    <div className="card border shadow-xs mb-2">
                      <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center gap-2">
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">Phần III</span>
                        <strong className="text-dark small text-uppercase">
                          Kết quả đề xuất & định hướng nhân sự
                        </strong>
                      </div>

                      <div className="card-body p-3">
                        <div className="row g-3 align-items-center">
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold d-block mb-1.5">Kết luận hoàn thành kỳ thực tập: <span className="text-danger">*</span></label>
                            <div className="d-flex gap-4">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  id="rec_pass"
                                  name="mentor_recommendation"
                                  value="PASS"
                                  checked={evalData.mentor_recommendation === 'PASS'}
                                  onChange={(e) => setEvalData({ ...evalData, mentor_recommendation: e.target.value })}
                                />
                                <label className="form-check-label text-success fw-bold" htmlFor="rec_pass">
                                  <i className="bi bi-check-circle-fill me-1" />ĐẠT YÊU CẦU (PASS)
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  id="rec_fail"
                                  name="mentor_recommendation"
                                  value="FAIL"
                                  checked={evalData.mentor_recommendation === 'FAIL'}
                                  onChange={(e) => setEvalData({ ...evalData, mentor_recommendation: e.target.value })}
                                />
                                <label className="form-check-label text-danger fw-bold" htmlFor="rec_fail">
                                  <i className="bi bi-x-circle-fill me-1" />KHÔNG ĐẠT (FAIL)
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <div className="p-2.5 bg-warning bg-opacity-10 rounded border border-warning-subtle">
                              <div className="form-check form-switch mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="offer_recommend"
                                  checked={evalData.mentor_offer_recommendation}
                                  onChange={(e) => setEvalData({ ...evalData, mentor_offer_recommendation: e.target.checked })}
                                />
                                <label className="form-check-label small fw-semibold text-dark" htmlFor="offer_recommend">
                                  <i className="bi bi-star-fill text-warning me-1.5" />
                                  Đề xuất tiếp nhận làm nhân viên chính thức (Offer job)
                                </label>
                              </div>
                              <div className="text-muted mt-1" style={{ fontSize: '0.75rem', paddingLeft: '2.5rem' }}>
                                HR sẽ nhận được thông báo đề xuất này để tiến hành quy trình phỏng vấn & đàm phán hợp đồng.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer bg-white py-2.5 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2 border-top flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEvaluatingIntern(null)}
                      className="btn btn-sm btn-outline-secondary px-3"
                    >
                      Đóng
                    </button>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingCertificate({
                            ...evaluatingIntern,
                            ...evalData,
                            rating: evalData.rating,
                            score_discipline: evalData.score_discipline,
                            score_competence: evalData.score_competence,
                            score_skills: evalData.score_skills,
                            evaluation_criteria: evalData.evaluation_criteria,
                            evaluation_advantages: evalData.evaluation_advantages,
                            evaluation_limitations: evalData.evaluation_limitations,
                            final_review: evalData.final_review
                          });
                        }}
                        className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5"
                      >
                        <i className="bi bi-eye-fill text-success" />
                        <span>Xem trước Phiếu đánh giá A4</span>
                      </button>

                      <button type="submit" className="btn btn-sm btn-primary fw-semibold px-4 shadow-sm">
                        <i className="bi bi-floppy2-fill me-1" />
                        Lưu kết quả đánh giá
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* ================= MODAL GIAO VIỆC NHANH CHO 1 INTERN ================= */}
      {quickTaskIntern && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow">
                <div className="modal-header bg-white py-3">
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-plus-circle text-primary me-2"></i>
                    Giao việc cho: {quickTaskIntern.intern_name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setQuickTaskIntern(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleQuickCreateTask}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="quick_title">
                        Tiêu đề công việc <span className="text-danger">*</span>
                      </label>
                      <input
                        id="quick_title"
                        type="text"
                        value={quickTaskForm.title}
                        onChange={(e) => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                        required
                        placeholder="Ví dụ: Triển khai kiểm thử Unit Test cho API Auth"
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="quick_deadline">
                        Hạn chót hoàn thành (Deadline) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="quick_deadline"
                        type="date"
                        value={quickTaskForm.deadline}
                        onChange={(e) => setQuickTaskForm({ ...quickTaskForm, deadline: e.target.value })}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" htmlFor="quick_desc">
                        Mô tả chi tiết và hướng dẫn
                      </label>
                      <textarea
                        id="quick_desc"
                        rows={4}
                        value={quickTaskForm.description}
                        onChange={(e) => setQuickTaskForm({ ...quickTaskForm, description: e.target.value })}
                        placeholder="Mô tả các yêu cầu kỹ thuật và kết quả cần đạt..."
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      onClick={() => setQuickTaskIntern(null)}
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

      {/* Modal xem CV */}
      <CvViewerModal
        isOpen={!!viewingCv}
        onClose={() => setViewingCv(null)}
        cv={viewingCv}
      />

      {/* Modal xem / in Phiếu đánh giá & Giấy xác nhận chuẩn khổ A4 */}
      {viewingCertificate && (
        <CertificateModal
          internship={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
          onUpdate={(updatedData) => {
            setViewingCertificate(updatedData);
            fetchData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
