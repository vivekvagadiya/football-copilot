import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // 'right' or 'bottom'
  className = ''
}) => {
  const isRight = position === 'right';

  const drawerVariants = {
    hidden: isRight ? { x: '100%' } : { y: '100%' },
    visible: isRight ? { x: 0 } : { y: 0 },
    exit: isRight ? { x: '100%' } : { y: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Drawer Box */}
          <div className={`fixed inset-0 pointer-events-none flex ${isRight ? 'justify-end' : 'items-end'}`}>
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`pointer-events-auto bg-card border-border shadow-2xl flex flex-col ${
                isRight 
                  ? 'h-full w-full max-w-sm border-l' 
                  : 'w-full max-h-[85vh] rounded-t-2xl border-t'
              } ${className}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                {title && <h3 className="font-display font-semibold text-text">{title}</h3>}
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                  <X size={16} />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
