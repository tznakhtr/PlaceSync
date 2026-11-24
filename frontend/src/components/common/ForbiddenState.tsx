import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

export interface ForbiddenStateProps {
  title?: string;
  message?: string;
  className?: string;
}

/**
 * ForbiddenState:
 * Displayed when an API request fails with HTTP 403 Forbidden.
 * Informs the user of access limitations and provides a path back to their active portal.
 */
export const ForbiddenState: React.FC<ForbiddenStateProps> = ({
  title = 'Access Denied',
  message = 'You do not have access to this page or action.',
  className = '',
}) => {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'CELL' ? '/cell' : '/student';

  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <Card className="max-w-md w-full text-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-navy-900">{title}</h2>
        <p className="text-sm text-grey-500">{message}</p>
        <div className="pt-2">
          <Link to={dashboardPath}>
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Go to dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
