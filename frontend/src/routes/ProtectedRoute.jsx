import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';

// Redirect unauthenticated users to login
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
}

// Redirect users without the required role
export function RoleRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Redirect already-logged-in users away from login/register
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return children;

  // Redirect to role-specific dashboard
  const dashboardMap = {
    APPLICANT: '/dashboard',
    INTERN: '/intern',
    MENTOR: '/mentor',
    HR: '/hr',
    ADMIN: '/admin',
  };
  return <Navigate to={dashboardMap[user.role] || '/'} replace />;
}
