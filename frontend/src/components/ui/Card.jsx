import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  hover = true,
  onClick,
  ...props
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover && onClick ? { y: -2 } : undefined}
      className={`bg-card border border-border rounded-xl p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`font-display text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-xs text-muted ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`flex items-center mt-4 pt-4 border-t border-border ${className}`}>{children}</div>
);
