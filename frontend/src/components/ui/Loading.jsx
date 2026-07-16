import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading = ({
  className = '',
  size = 'md',
  text = 'Syncing copilot engine...'
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizes[size]}`} />
      {text && <p className="text-xs font-medium text-muted tracking-wide animate-pulse">{text}</p>}
    </div>
  );
};
