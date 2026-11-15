import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();

  const homePath = user ? (user.role === 'CELL' ? '/cell' : '/student') : '/login';
  const homeLabel = user ? 'Return to Dashboard' : 'Go to Sign In';

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-700 flex items-center justify-center mb-6 shadow-xs border border-grey-200">
        <Compass className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-navy-100 text-navy-700 mb-3">
        404 Error
      </span>

      <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight mb-2">
        Page Not Found
      </h1>

      <p className="text-sm text-grey-500 max-w-md mb-8">
        The page you are looking for doesn't exist, was removed, or you don't have access to this link.
      </p>

      <Link to={homePath}>
        <Button variant="primary" size="lg" leftIcon={<Home className="w-4 h-4" />}>
          {homeLabel}
        </Button>
      </Link>
    </div>
  );
};
