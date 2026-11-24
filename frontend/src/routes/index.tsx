import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { CellLayout } from '../layouts/CellLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { RouteFocusManager } from '../components/common/RouteFocusManager';
import { Skeleton } from '../components/ui/Skeleton';

// Route-level code splitting with React.lazy
const LoginPage = React.lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const NotFoundPage = React.lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// Student portal routes
const StudentDashboard = React.lazy(() =>
  import('../pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })),
);
const ProfilePage = React.lazy(() =>
  import('../pages/student/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const DrivesPage = React.lazy(() =>
  import('../pages/student/DrivesPage').then((m) => ({ default: m.DrivesPage })),
);
const DriveDetailsPage = React.lazy(() =>
  import('../pages/student/DriveDetailsPage').then((m) => ({ default: m.DriveDetailsPage })),
);
const ApplicationsPage = React.lazy(() =>
  import('../pages/student/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })),
);

// Placement Cell portal routes
const CellDashboard = React.lazy(() =>
  import('../pages/cell/CellDashboard').then((m) => ({ default: m.CellDashboard })),
);
const ManageDrivesPage = React.lazy(() =>
  import('../pages/cell/ManageDrivesPage').then((m) => ({ default: m.ManageDrivesPage })),
);
const CreateDrivePage = React.lazy(() =>
  import('../pages/cell/CreateDrivePage').then((m) => ({ default: m.CreateDrivePage })),
);
const EditDrivePage = React.lazy(() =>
  import('../pages/cell/EditDrivePage').then((m) => ({ default: m.EditDrivePage })),
);
const CellApplicantsPage = React.lazy(() =>
  import('../pages/cell/CellApplicantsPage').then((m) => ({ default: m.CellApplicantsPage })),
);
const CellResultsPage = React.lazy(() =>
  import('../pages/cell/CellResultsPage').then((m) => ({ default: m.CellResultsPage })),
);

// Shared notifications page
const NotificationsPage = React.lazy(() =>
  import('../pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);

/**
 * Animated route loading skeleton fallback displayed while downloading chunk.
 */
const RouteSuspenseFallback: React.FC = () => (
  <div
    className="space-y-6 max-w-7xl w-full mx-auto p-4 sm:p-6 animate-pulse"
    role="status"
    aria-label="Loading page content"
  >
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48 sm:w-64" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
);

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
    <RouteFocusManager>
      <Suspense fallback={<RouteSuspenseFallback />}>
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
              <Route path="/student/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* PLACEMENT CELL portal routes */}
          <Route element={<ProtectedRoute allowedRoles={['CELL']} />}>
            <Route element={<CellLayout />}>
              <Route path="/cell" element={<CellDashboard />} />
              <Route path="/cell/drives" element={<ManageDrivesPage />} />
              <Route path="/cell/drives/new" element={<CreateDrivePage />} />
              <Route path="/cell/drives/:id/edit" element={<EditDrivePage />} />
              <Route path="/cell/applicants" element={<CellApplicantsPage />} />
              <Route path="/cell/results" element={<CellResultsPage />} />
              <Route path="/cell/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteFocusManager>
  );
};
