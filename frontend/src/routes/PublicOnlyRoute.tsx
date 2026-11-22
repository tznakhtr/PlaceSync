import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that prevents authenticated users from visiting public auth pages (/login, /register).
 * Logged-in users are redirected to their appropriate role-based dashboard.
 */
export const PublicOnlyRoute: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    const defaultDashboard = user.role === 'CELL' ? '/cell' : '/student';
    return <Navigate to={defaultDashboard} replace />;
  }

  return <Outlet />;
};
