import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-surface border border-grey-200 rounded-xl shadow-soft ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
