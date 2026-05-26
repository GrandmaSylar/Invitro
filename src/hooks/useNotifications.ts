import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getNotifications(userId!),
    enabled: !!userId,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => notificationService.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for new notifications
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] });
    },
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    unreadCount: unreadCountQuery.data ?? 0,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    deleteNotification: deleteNotificationMutation.mutate,
    isDeleting: deleteNotificationMutation.isPending,
  };
}
