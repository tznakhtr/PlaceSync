import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

/**
 * Route wrapper that ensures the user is authenticated and possesses one of the allowed roles.
 * Unauthenticated users are redirected to /login.
 * Users with the wrong role are redirected to their own dashboard.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultDashboard = user.role === 'CELL' ? '/cell' : '/student';
    return <Navigate to={defaultDashboard} replace />;
  }

  return <Outlet />;
};
