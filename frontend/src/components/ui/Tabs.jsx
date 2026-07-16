import React from 'react';
import { motion } from 'framer-motion';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex border-b border-border space-x-1 overflow-x-auto scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative py-2.5 px-4 text-sm font-medium transition-colors focus:outline-none cursor-pointer whitespace-nowrap ${
              isActive ? 'text-primary' : 'text-muted hover:text-text'
            }`}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
