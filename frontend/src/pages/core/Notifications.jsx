import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getNotificationsApi } from '../../api/notification.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { Pagination } from '../../components/ui/Pagination';
import { NotificationCard } from '../../components/football/NotificationCard';

export const Notifications = () => {
  const { 
    notifications: contextNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    triggerAINotifications 
  } = useApp();

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch paginated notifications from backend
  const { 
    data: responseData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => getNotificationsApi({ page, limit }),
    staleTime: 60 * 1000,
  });

  const rawNotifications = responseData?.data?.notifications || 
    (Array.isArray(responseData?.data) ? responseData.data : null);

  const serverPagination = responseData?.data?.pagination;

  const total = serverPagination?.total ?? 
    (rawNotifications ? rawNotifications.length : contextNotifications.length);

  const totalPages = serverPagination?.totalPages ?? 
    Math.max(1, Math.ceil(total / limit));

  const unreadCount = serverPagination?.unreadCount ?? 
    (rawNotifications 
      ? rawNotifications.filter(n => !n.read).length 
      : contextNotifications.filter(n => !n.read).length);

  // Ensure current page does not exceed totalPages when filters/limits change
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const mapNotification = (n) => ({
    id: n._id || n.id,
    title: n.title,
    message: n.message,
    type: n.type || 'system',
    priority: n.priority || 'medium',
    read: Boolean(n.read),
    time: n.createdAt 
      ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : (n.time || 'Just now'),
  });

  const displayList = rawNotifications 
    ? rawNotifications.map(mapNotification)
    : contextNotifications.slice((page - 1) * limit, page * limit);

  const handleMarkRead = async (id) => {
    // Optimistically update query cache
    queryClient.setQueryData(['notifications', page, limit], (old) => {
      if (!old?.data) return old;
      if (old.data.notifications) {
        return {
          ...old,
          data: {
            ...old.data,
            notifications: old.data.notifications.map((n) => 
              (n._id === id || n.id === id) ? { ...n, read: true } : n
            ),
            pagination: {
              ...old.data.pagination,
              unreadCount: Math.max(0, (old.data.pagination?.unreadCount || 1) - 1),
            },
          },
        };
      }
      if (Array.isArray(old.data)) {
        return {
          ...old,
          data: old.data.map((n) => 
            (n._id === id || n.id === id) ? { ...n, read: true } : n
          ),
        };
      }
      return old;
    });

    await markNotificationAsRead(id);
  };

  const handleClearAll = async () => {
    queryClient.setQueryData(['notifications', page, limit], (old) => {
      if (!old?.data) return old;
      if (old.data.notifications) {
        return {
          ...old,
          data: {
            ...old.data,
            notifications: old.data.notifications.map((n) => ({ ...n, read: true })),
            pagination: {
              ...old.data.pagination,
              unreadCount: 0,
            },
          },
        };
      }
      if (Array.isArray(old.data)) {
        return {
          ...old,
          data: old.data.map((n) => ({ ...n, read: true })),
        };
      }
      return old;
    });

    await markAllNotificationsAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleScanAI = async () => {
    setIsScanning(true);
    try {
      await triggerAINotifications();
      setPage(1);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } finally {
      setIsScanning(false);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };



  if (isLoading && !responseData) {
    return <Loading text="Syncing alerts feed..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <Bell size={18} className="text-primary" /> Alerts Feed Monitor
          </h2>
          <p className="text-xs text-muted">Core broadcast channel for live goals, tactical alerts, transfer intelligence, and AI briefings.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleScanAI}
            disabled={isScanning}
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-text-on-accent"
          >
            <Sparkles size={14} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? "Scanning with Gaffer AI..." : "Scan with Gaffer AI"}
          </Button>

          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="text-xs gap-1.5"
            >
              <CheckCheck size={14} /> Clear all ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List or Empty State */}
      {displayList.length > 0 ? (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Subtle fetching indicator */}
          <div className="relative">
            {isFetching && (
              <div className="absolute -top-3 right-0 flex items-center gap-1.5 text-[10px] text-muted font-mono animate-pulse">
                <Loader2 size={11} className="animate-spin text-primary" /> Updating...
              </div>
            )}
            
            <div className="space-y-3">
              {displayList.map(n => (
                <NotificationCard 
                  key={n.id} 
                  notification={n} 
                  onMarkRead={handleMarkRead} 
                />
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            itemLabel="alerts"
            pageSizeOptions={[5, 10, 20]}
            onPageChange={setPage}
            onPageSizeChange={handleLimitChange}
            disabled={isFetching}
          />
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
