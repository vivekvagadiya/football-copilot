import React from 'react';

export const Avatar = ({
  src,
  fallback = 'U',
  alt = 'avatar',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl'
  };

  return (
    <div
      className={`relative flex shrink-0 overflow-hidden rounded-full border border-border items-center justify-center bg-border/20 text-muted font-semibold ${sizes[size]} ${className}`}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <span className="absolute">{fallback}</span>
    </div>
  );
};
