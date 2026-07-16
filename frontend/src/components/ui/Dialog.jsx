import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Dialog = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-card border border-border p-6 shadow-xl ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              {title && <h3 className="font-display text-lg font-semibold text-text">{title}</h3>}
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                <X size={16} />
              </Button>
            </div>

            {/* Content */}
            <div className="text-sm text-text/80">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
