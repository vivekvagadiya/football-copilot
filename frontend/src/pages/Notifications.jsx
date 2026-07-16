import React from 'react';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { NotificationCard } from '../components/football/NotificationCard';

export const Notifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <Bell size={18} className="text-primary" /> Alerts Feed Monitor
          </h2>
          <p className="text-xs text-muted">Core broadcast channel for live goals, transfer news, and system status updates.</p>
        </div>

        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllNotificationsAsRead}
            className="text-xs gap-1.5"
          >
            <CheckCheck size={14} /> Clear all alerts ({unreadCount})
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3 max-w-2xl mx-auto">
          {notifications.map(n => (
            <NotificationCard 
              key={n.id} 
              notification={n} 
              onMarkRead={markNotificationAsRead} 
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 text-xs text-muted border-dashed border-border space-y-2">
          <Bell size={32} className="mx-auto text-border" />
          <p className="font-semibold text-text">No active notifications.</p>
          <p>You are up to date on all tactical profiles.</p>
        </Card>
      )}
    </div>
  );
};
export default Notifications;
