import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { NotificationDropdown } from './NotificationDropdown';

export interface NotificationBellProps {
  className?: string;
}

/**
 * NotificationBell:
 * Reusable top-bar bell button showing an unread notification count badge.
 * Toggles the NotificationDropdown with complete keyboard accessibility (Escape, outside click, focus return).
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount } = useUnreadCount();
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown and return focus to bell button
  const handleClose = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();
  const ariaLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="p-2 text-grey-600 hover:text-navy-900 hover:bg-grey-100 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
        title={ariaLabel}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-surface animate-in zoom-in-75 duration-100"
            aria-hidden="true"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <NotificationDropdown
        isOpen={isOpen}
        onClose={handleClose}
        unreadCount={unreadCount}
      />
    </div>
  );
};
