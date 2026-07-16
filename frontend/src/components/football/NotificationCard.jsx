import React from 'react';
import { Bell, ShieldAlert, Award, ArrowRightLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const NotificationCard = ({ notification, onMarkRead }) => {
  const { id, type, title, message, time, read } = notification;

  const getIcon = () => {
    switch (type) {
      case 'match':
        return <Award className="text-primary" size={16} />;
      case 'transfer':
        return <ArrowRightLeft className="text-yellow-500" size={16} />;
      default:
        return <Bell className="text-muted" size={16} />;
    }
  };

  return (
    <Card 
      hover={false} 
      className={`border p-3.5 flex items-start gap-3 transition-colors ${
        read ? 'bg-card border-border/40' : 'bg-primary/5 border-primary/20'
      }`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${read ? 'bg-border/20' : 'bg-primary/10'}`}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <h5 className={`text-xs font-semibold text-text truncate ${read ? '' : 'font-bold'}`}>{title}</h5>
          <span className="text-[9px] text-muted whitespace-nowrap shrink-0">{time}</span>
        </div>
        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{message}</p>
        
        {!read && onMarkRead && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => onMarkRead(id)} 
            className="text-[10px] mt-1 hover:text-primary/80"
          >
            Mark as read
          </Button>
        )}
      </div>
    </Card>
  );
};
