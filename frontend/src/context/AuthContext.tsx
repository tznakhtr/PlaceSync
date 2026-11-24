import React, { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { TOKEN_STORAGE_KEY } from '../api/axios';
import { queryClient } from '../api/queryClient';
import { Spinner } from '../components/ui/Spinner';
import { storage } from '../utils/storage';
import type { User } from '../types';
import { AuthContext } from './auth-context';
import { RoleMismatchError } from './RoleMismatchError';

// oxlint-disable-next-line react/only-export-components
export { useAuth } from './useAuth';
// oxlint-disable-next-line react/only-export-components
export { RoleMismatchError } from './RoleMismatchError';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => storage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore user session on application initialization
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = storage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await authApi.getMe();
        setUser(me);
        setToken(storedToken);
      } catch {
        // Clear invalid or expired credentials
        storage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string,
    expectedRole?: 'STUDENT' | 'CELL',
  ): Promise<User> => {
    const res = await authApi.login({ email, password });

    // Validate account role against expected portal before saving credentials
    if (expectedRole && res.user.role !== expectedRole) {
      throw new RoleMismatchError(res.user.role as 'STUDENT' | 'CELL');
    }

    storage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    // Register only creates STUDENT role on backend
    await authApi.register({ name, email, password });
    // Automatically log in the student with the newly created account
    return await login(email, password);
  };

  const logout = () => {
    storage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  // Full-page loading spinner while verifying token on startup
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page">
        <Spinner size="xl" variant="navy" />
        <p className="mt-4 text-sm font-medium text-grey-500">Initializing PlaceSync...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
