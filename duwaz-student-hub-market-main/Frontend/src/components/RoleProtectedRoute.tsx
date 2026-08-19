import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/context/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-duwaz-brown" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Send drivers to driver login, everyone else to main login
    const loginPath = requiredRole === 'DRIVER' ? '/driver/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (user?.role !== requiredRole) {
    // Wrong role — give a helpful message with the right login link
    const loginPath = requiredRole === 'DRIVER' ? '/driver/login' : '/login';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">
            Your current account doesn't have permission to view this page.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Logged in as: <span className="font-medium">{user?.email}</span> ({user?.role})
          </p>
          <a
            href={loginPath}
            className="inline-block px-4 py-2 bg-duwaz-brown text-white rounded-md hover:bg-duwaz-brown/90 text-sm"
          >
            Sign in as {requiredRole === 'DRIVER' ? 'Driver' : requiredRole}
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
