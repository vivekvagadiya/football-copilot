import React from 'react';

export const Badge = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none';
  
  const variants = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-card text-muted border border-border',
    success: 'bg-green-500/10 text-green-500 border border-green-500/20',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    live: 'bg-red-500 text-white animate-pulse'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
