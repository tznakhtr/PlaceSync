/**
 * Safe wrapper around browser localStorage.
 * Handles storage unavailability in private browsing modes or restricted sandbox environments.
 */
export const storage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore write errors if storage is disabled or quota exceeded
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore deletion errors
    }
  },
};
