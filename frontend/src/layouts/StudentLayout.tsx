import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/profile', label: 'My Profile', icon: User, end: false },
  { to: '/student/drives', label: 'Drives', icon: Briefcase, end: false },
  { to: '/student/applications', label: 'My Applications', icon: FileText, end: false },
];

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-page flex">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop static & Mobile drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">PlaceSync</span>
            </div>
            <button
              onClick={closeMobile}
              className="md:hidden text-grey-400 hover:text-white p-1 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-grey-500 uppercase tracking-wider">
              Student Portal
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-navy-800 text-white border-l-[3px] border-emerald-500 font-medium'
                        : 'text-grey-400 hover:text-white hover:bg-navy-800/50 border-l-[3px] border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card in Sidebar Bottom */}
        <div className="p-4 border-t border-navy-800 bg-navy-900/50">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center font-bold text-emerald-500 text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-grey-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-surface border-b border-grey-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-grey-700 hover:text-navy-900 p-1.5 rounded-lg border border-grey-200"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-navy-900">Student Portal</h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notifications Bell Placeholder */}
            <button
              className="p-2 text-grey-500 hover:text-navy-700 hover:bg-grey-50 rounded-full transition-colors relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* User Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-grey-50 border border-grey-200 rounded-full text-xs">
              <span className="font-medium text-grey-700">{user?.name}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-navy-100 text-navy-700 font-bold uppercase text-[10px]">
                {user?.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-grey-700 hover:text-navy-900 hover:bg-grey-50 px-2.5 py-1.5 rounded-lg border border-grey-200 transition-colors"
            >
              <LogOut className="w-4 h-4 text-grey-500" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
