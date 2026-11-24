import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * OfflineBanner:
 * Non-blocking indicator displayed at the top of portal layouts when network connectivity is lost.
 * Automatically clears when internet connectivity resumes.
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-navy-900 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 border-b border-navy-800 animate-in fade-in duration-200"
    >
      <WifiOff className="w-4 h-4 text-warning shrink-0" />
      <span>You appear to be offline. Some actions may not work.</span>
    </div>
  );
};
