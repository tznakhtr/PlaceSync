import React, { useCallback, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';
import type { Toast, ToastType } from './toast-context';

// oxlint-disable-next-line react/only-export-components
export { useToast } from './useToast';

/**
 * ToastProvider:
 * Renders non-blocking user feedback notifications.
 * Auto-dismisses (5s for success/info, 7s for errors), limits stack to at most 3 items,
 * and includes screen-reader alert / status role announcements.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);

      // Keep at most 2 previous toasts so adding 1 yields a maximum stack of 3
      setToasts((prev) => [...prev.slice(-2), { id, type, message }]);

      // Duration: 5000ms for success/info, 7000ms for error
      const timeoutMs = type === 'error' ? 7000 : 5000;
      setTimeout(() => {
        removeToast(id);
      }, timeoutMs);
    },
    [removeToast],
  );

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border transition-all duration-200 bg-surface ${
              t.type === 'success'
                ? 'border-emerald-500/40 text-grey-700'
                : t.type === 'error'
                  ? 'border-danger/40 text-grey-700'
                  : 'border-navy-400/40 text-grey-700'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-navy-600 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium flex-1 text-grey-700 leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-grey-400 hover:text-grey-700 shrink-0 p-1 rounded-md cursor-pointer transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
