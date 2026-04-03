import { computed } from 'vue';
import { useWebSocket, type Notification } from './useWebSocket';

export type NotificationType = 'github' | 'project' | 'todo' | 'security' | 'calendar' | 'system';

export interface NotificationGroup {
  label: string;
  notifications: Notification[];
}

export function useNotifications() {
  const {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    deleteNotification,
    deleteAllNotifications,
  } = useWebSocket();

  // Get unread notifications
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.isRead);
  });

  // Get read notifications
  const readNotifications = computed(() => {
    return notifications.value.filter(n => n.isRead);
  });

  // Get notifications grouped by time
  const groupedNotifications = computed(() => {
    const groups: NotificationGroup[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayNotifications: Notification[] = [];
    const yesterdayNotifications: Notification[] = [];
    const thisWeekNotifications: Notification[] = [];
    const olderNotifications: Notification[] = [];

    notifications.value.forEach(notification => {
      const createdAt = new Date(notification.createdAt);
      
      if (createdAt >= today) {
        todayNotifications.push(notification);
      } else if (createdAt >= yesterday) {
        yesterdayNotifications.push(notification);
      } else if (createdAt >= weekAgo) {
        thisWeekNotifications.push(notification);
      } else {
        olderNotifications.push(notification);
      }
    });

    if (todayNotifications.length > 0) {
      groups.push({ label: 'Today', notifications: todayNotifications });
    }
    if (yesterdayNotifications.length > 0) {
      groups.push({ label: 'Yesterday', notifications: yesterdayNotifications });
    }
    if (thisWeekNotifications.length > 0) {
      groups.push({ label: 'This Week', notifications: thisWeekNotifications });
    }
    if (olderNotifications.length > 0) {
      groups.push({ label: 'Older', notifications: olderNotifications });
    }

    return groups;
  });

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'github':
        return 'i-simple-icons-github';
      case 'project':
        return 'i-lucide-folder';
      case 'todo':
        return 'i-lucide-circle-check';
      case 'security':
        return 'i-lucide-shield';
      case 'calendar':
        return 'i-lucide-calendar';
      case 'system':
        return 'i-lucide-bell';
      default:
        return 'i-lucide-bell';
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'github':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'project':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'todo':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'security':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'calendar':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'system':
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Format time ago
  const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  return {
    isConnected,
    unreadCount,
    notifications,
    unreadNotifications,
    readNotifications,
    groupedNotifications,
    getNotificationIcon,
    getNotificationColor,
    timeAgo,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    deleteNotification,
    deleteAllNotifications,
  };
}
