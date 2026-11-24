import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteFocusManager:
 * On every route change:
 * 1. Smoothly scrolls window to top.
 * 2. Shifts focus to the page's main <h1> heading (with tabIndex -1) for keyboard and screen reader accessibility.
 */
export const RouteFocusManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      const heading = document.querySelector('main h1') as HTMLElement | null;
      if (heading) {
        if (!heading.hasAttribute('tabindex')) {
          heading.setAttribute('tabindex', '-1');
        }
        heading.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
};
