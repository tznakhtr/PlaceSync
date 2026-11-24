import React, { useRef } from 'react';
import { ShieldCheck, User } from 'lucide-react';

export interface AuthTabsProps {
  activeTab: 'student' | 'admin';
  onChange: (tab: 'student' | 'admin') => void;
  className?: string;
}

/**
 * AuthTabs:
 * Accessible segmented tab control for switching between Student and Admin logins.
 * Follows WAI-ARIA Tabs pattern with role="tablist", role="tab", aria-selected,
 * aria-controls, roving tabIndex (0 on active, -1 on inactive), and Arrow key navigation.
 */
export const AuthTabs: React.FC<AuthTabsProps> = ({
  activeTab,
  onChange,
  className = '',
}) => {
  const studentTabRef = useRef<HTMLButtonElement>(null);
  const adminTabRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (activeTab === 'student') {
        onChange('admin');
        adminTabRef.current?.focus();
      } else {
        onChange('student');
        studentTabRef.current?.focus();
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Account Login Mode"
      className={`grid grid-cols-2 p-1 bg-grey-50 rounded-xl border border-grey-200 gap-1 ${className}`}
    >
      <button
        ref={studentTabRef}
        id="tab-student"
        role="tab"
        type="button"
        aria-selected={activeTab === 'student'}
        aria-controls="auth-tabpanel"
        tabIndex={activeTab === 'student' ? 0 : -1}
        onClick={() => onChange('student')}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-center min-h-[44px] px-3 py-2 text-sm rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          activeTab === 'student'
            ? 'bg-navy-700 text-white font-semibold shadow-sm'
            : 'text-navy-700 hover:bg-grey-200/50 font-medium'
        }`}
      >
        <User className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
        <span>Student Login</span>
      </button>

      <button
        ref={adminTabRef}
        id="tab-admin"
        role="tab"
        type="button"
        aria-selected={activeTab === 'admin'}
        aria-controls="auth-tabpanel"
        tabIndex={activeTab === 'admin' ? 0 : -1}
        onClick={() => onChange('admin')}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-center min-h-[44px] px-3 py-2 text-sm rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          activeTab === 'admin'
            ? 'bg-navy-700 text-white font-semibold shadow-sm'
            : 'text-navy-700 hover:bg-grey-200/50 font-medium'
        }`}
      >
        <ShieldCheck className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
        <span>Admin Login</span>
      </button>
    </div>
  );
};
