import React from 'react';
import { Card, CardContent } from '../../app/components/ui/card';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotifications } from '../../hooks/useNotifications';
import { format } from 'date-fns';
import { cn } from '../../app/components/ui/utils';

export function NotificationsPage() {
  const { user } = useAuthStore();
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(user?.id);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">View and manage your alerts and updates.</p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-md"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground">You're all caught up! Check back later for updates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                notification.isRead
                  ? "bg-card border-border/50 opacity-70"
                  : "bg-primary/5 border-primary/20 shadow-sm"
              )}
            >
              <div className="shrink-0 mt-1">
                {getIconForType(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h3 className={cn(
                    "text-sm font-semibold truncate",
                    !notification.isRead && "text-foreground"
                  )}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
