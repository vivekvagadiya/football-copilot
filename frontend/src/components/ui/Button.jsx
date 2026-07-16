import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/45 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-primary text-[#07120D] hover:bg-primary/90 font-semibold',
    secondary: 'bg-card text-text border border-border hover:bg-border/30',
    outline: 'border border-border text-text hover:bg-border/20',
    ghost: 'text-muted hover:text-text hover:bg-border/20',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    link: 'text-primary hover:underline bg-transparent p-0'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'h-9 w-9 p-0'
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
