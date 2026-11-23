import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { CellLayout } from '../layouts/CellLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { CellApplicantsPage } from '../pages/cell/CellApplicantsPage';
import { CellDashboard } from '../pages/cell/CellDashboard';
import { CellDrivesPage } from '../pages/cell/CellDrivesPage';
import { CreateDrivePage } from '../pages/cell/CreateDrivePage';
import { EditDrivePage } from '../pages/cell/EditDrivePage';
import { CellResultsPage } from '../pages/cell/CellResultsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ApplicationsPage } from '../pages/student/ApplicationsPage';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { DrivesPage } from '../pages/student/DrivesPage';
import { DriveDetailsPage } from '../pages/student/DriveDetailsPage';
import { ProfilePage } from '../pages/student/ProfilePage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

/**
 * Directs root "/" visits to the corresponding role-based home or /login.
 */
const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === 'CELL' ? '/cell' : '/student'} replace />;
};

/**
 * Central application route definition for PlaceSync.
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public authentication routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* STUDENT portal routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<ProfilePage />} />
          <Route path="/student/drives" element={<DrivesPage />} />
          <Route path="/student/drives/:id" element={<DriveDetailsPage />} />
          <Route path="/student/applications" element={<ApplicationsPage />} />
        </Route>
      </Route>

      {/* PLACEMENT CELL portal routes */}
      <Route element={<ProtectedRoute allowedRoles={['CELL']} />}>
        <Route element={<CellLayout />}>
          <Route path="/cell" element={<CellDashboard />} />
          <Route path="/cell/drives" element={<CellDrivesPage />} />
          <Route path="/cell/drives/new" element={<CreateDrivePage />} />
          <Route path="/cell/drives/:id/edit" element={<EditDrivePage />} />
          <Route path="/cell/applicants" element={<CellApplicantsPage />} />
          <Route path="/cell/results" element={<CellResultsPage />} />
        </Route>
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
