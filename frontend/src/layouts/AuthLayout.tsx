import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const currentYear = new Date().getFullYear();

/**
 * Layout for public authentication pages (Login, Register).
 * Centers a white card on PlaceSync soft background with the logo and brand title.
 */
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-page flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-navy-700 text-white flex items-center justify-center shadow-md mb-3">
            <GraduationCap className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-navy-900 tracking-tight">PlaceSync</p>
          <p className="text-sm text-grey-500 mt-1">Campus Placement Portal</p>
        </div>

        {/* Auth Content Card */}
        <div className="bg-surface border border-grey-200 shadow-soft rounded-2xl p-6 sm:p-8">
          <Outlet />
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-grey-400 mt-8">
          &copy; {currentYear} PlaceSync. Secure College Placement System.
        </p>
      </div>
    </div>
  );
};
