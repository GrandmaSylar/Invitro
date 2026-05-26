import { supabase } from '../lib/supabase';
import { mapNotificationRow } from '../lib/mappers';
import type { Notification } from '../lib/types';

export const notificationService = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
    return (data ?? []).map(mapNotificationRow);
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(`Failed to fetch unread count: ${error.message}`);
    return count ?? 0;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw new Error(`Failed to delete notification: ${error.message}`);
  },

  createNotification: async (userId: string, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info'): Promise<Notification> => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create notification: ${error.message}`);
    return mapNotificationRow(data);
  }
};
