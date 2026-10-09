import { Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, PrivateRoute, RoleRoute } from './ProtectedRoute';

// Public pages
import Home from '../pages/public/Home';
import Positions from '../pages/public/Positions';
import PositionDetail from '../pages/public/PositionDetail';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Applicant
import ApplicantDashboard from '../pages/applicant/Dashboard';

// Intern
import InternDashboard from '../pages/intern/Dashboard';

// Mentor
import MentorDashboard from '../pages/mentor/Dashboard';
import MentorInterns from '../pages/mentor/Interns';
import MentorTasks from '../pages/mentor/Tasks';

// HR
import HRDashboard from '../pages/hr/Dashboard';
import HRInterns from '../pages/hr/Interns';
import HRMentors from '../pages/hr/Mentors';
import HRApplicants from '../pages/hr/Applicants';

// Admin
import AdminDashboard from '../pages/admin/Dashboard';

// Shared
import Profile from '../pages/shared/Profile';

// Public positions list (same as home but focused)
import PublicLayout from '../layouts/PublicLayout';
import PositionCard from '../components/PositionCard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC ===== */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/positions" element={<PublicLayout><Positions /></PublicLayout>} />
      <Route path="/positions/:id" element={<PublicLayout><PositionDetail /></PublicLayout>} />

      {/* ===== AUTH ===== */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ===== APPLICANT ===== */}
      <Route path="/dashboard" element={
        <RoleRoute roles={['APPLICANT']}>
          <ApplicantDashboard />
        </RoleRoute>
      } />

      {/* ===== INTERN ===== */}
      <Route path="/intern" element={
        <RoleRoute roles={['INTERN']}>
          <InternDashboard />
        </RoleRoute>
      } />
      <Route path="/intern/tasks" element={
        <RoleRoute roles={['INTERN']}>
          <InternDashboard />
        </RoleRoute>
      } />

      {/* ===== MENTOR ===== */}
      <Route path="/mentor" element={
        <RoleRoute roles={['MENTOR']}>
          <MentorDashboard />
        </RoleRoute>
      } />
      <Route path="/mentor/interns" element={
        <RoleRoute roles={['MENTOR']}>
          <MentorInterns />
        </RoleRoute>
      } />
      <Route path="/mentor/tasks" element={
        <RoleRoute roles={['MENTOR']}>
          <MentorTasks />
        </RoleRoute>
      } />

      {/* ===== HR ===== */}
      <Route path="/hr" element={
        <RoleRoute roles={['HR']}>
          <HRDashboard />
        </RoleRoute>
      } />
      <Route path="/hr/positions" element={
        <RoleRoute roles={['HR']}>
          <HRDashboard />
        </RoleRoute>
      } />
      <Route path="/hr/applications" element={
        <RoleRoute roles={['HR']}>
          <HRDashboard />
        </RoleRoute>
      } />
      <Route path="/hr/interns" element={
        <RoleRoute roles={['HR']}>
          <HRInterns />
        </RoleRoute>
      } />
      <Route path="/hr/mentors" element={
        <RoleRoute roles={['HR']}>
          <HRMentors />
        </RoleRoute>
      } />
      <Route path="/hr/applicants" element={
        <RoleRoute roles={['HR']}>
          <HRApplicants />
        </RoleRoute>
      } />

      {/* ===== ADMIN ===== */}
      <Route path="/admin" element={
        <RoleRoute roles={['ADMIN']}>
          <AdminDashboard />
        </RoleRoute>
      } />
      <Route path="/admin/branches" element={
        <RoleRoute roles={['ADMIN']}>
          <AdminDashboard />
        </RoleRoute>
      } />
      <Route path="/admin/users" element={
        <RoleRoute roles={['ADMIN']}>
          <AdminDashboard />
        </RoleRoute>
      } />

      {/* ===== SHARED ===== */}
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />

      {/* ===== 404 Fallback ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
