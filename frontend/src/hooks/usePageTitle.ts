import { useEffect } from 'react';

/**
 * Sets document.title dynamically per route in the format:
 * "{Page Title} | PlaceSync"
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | PlaceSync`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
