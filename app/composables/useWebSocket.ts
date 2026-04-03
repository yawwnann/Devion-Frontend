import { ref, onMounted, onUnmounted, watch, type Ref } from "vue";
import { io, Socket } from "socket.io-client";
import { useRuntimeConfig } from "#app";

export interface Notification {
  id: string;
  type: "github" | "project" | "todo" | "security" | "calendar" | "system";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface UseWebSocketReturn {
  isConnected: Ref<boolean>;
  unreadCount: Ref<number>;
  notifications: Ref<Notification[]>;
  connect: () => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: (limit?: number, unreadOnly?: boolean) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

let socket: Socket | null = null;

export function useWebSocket(): UseWebSocketReturn {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl || "http://localhost:3000/api";

  const isConnected = useState<boolean>('ws-connected', () => false);
  const unreadCount = useState<number>('ws-unread-count', () => 0);
  const notifications = useState<Notification[]>('ws-notifications', () => []);

  // Get auth token from cookies (same as useAuth)
  const getAuthToken = () => {
    if (import.meta.client) {
      // Try to get from cookie directly
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      return cookieValue || null;
    }
    return null;
  };

  const connect = () => {
    if (socket?.connected) {
      console.log("[WebSocket] Already connected");
      return;
    }

    const token = getAuthToken();
    console.log("[WebSocket] Token from cookie:", token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.log("[WebSocket] No token, skipping connection");
      return;
    }

    // Convert HTTP URL to WebSocket URL
    const baseUrl = apiUrl.replace('/api', '');
    const wsUrl = baseUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    console.log("[WebSocket] Connecting to:", `${wsUrl}/notifications`);

    socket = io(`${wsUrl}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    // Connection established
    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket?.id);
      isConnected.value = true;
      fetchNotifications();
    });

    // Connection lost
    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      isConnected.value = false;
    });

    // Connection error
    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error.message);
      isConnected.value = false;
    });

    // New notification received
    socket.on("notification", (notification: Notification) => {
      console.log("[WebSocket] New notification:", notification);
      notifications.value.unshift(notification);
      showNotificationToast(notification);
    });

    // Unread count update
    socket.on("unread_count", ({ count }: { count: number }) => {
      console.log("[WebSocket] Unread count:", count);
      unreadCount.value = count;
    });

    // Welcome event
    socket.on("connected", (data: any) => {
      console.log("[WebSocket] Welcome:", data);
    });

    // Error event
    socket.on("error", (error: any) => {
      console.error("[WebSocket] Error:", error);
      if (
        error.message === "Authentication required" ||
        error.message === "Invalid authentication token"
      ) {
        disconnect();
      }
    });
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnected.value = false;
      console.log("[WebSocket] Disconnected by client");
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      socket?.emit("mark_read", { notificationId }, (response: any) => {
        if (response.success) {
          // Update local state
          const notification = notifications.value.find(
            (n) => n.id === notificationId,
          );
          if (notification) {
            notification.isRead = true;
          }
          unreadCount.value = response.count;
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const markAllAsRead = async () => {
    if (!socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      socket?.emit("mark_all_read", (response: any) => {
        if (response.success) {
          // Update local state
          notifications.value.forEach((n) => (n.isRead = true));
          unreadCount.value = response.count;
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const fetchNotifications = async (limit = 50, unreadOnly = false) => {
    if (!socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      socket?.emit(
        "get_notifications",
        { limit, unreadOnly },
        (response: any) => {
          if (response.success) {
            notifications.value = response.notifications;
            resolve();
          } else {
            reject(new Error(response.error));
          }
        },
      );
    });
  };

  const deleteNotification = async (notificationId: string) => {
    if (!socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      socket?.emit("delete_notification", { notificationId }, (response: any) => {
        if (response.success) {
          // Update local state
          const index = notifications.value.findIndex(
            (n) => n.id === notificationId,
          );
          if (index !== -1) {
            notifications.value.splice(index, 1);
          }
          unreadCount.value = response.count;
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const deleteAllNotifications = async () => {
    if (!socket?.connected) return;

    return new Promise<void>((resolve, reject) => {
      socket?.emit("delete_all_notifications", (response: any) => {
        if (response.success) {
          // Update local state
          notifications.value = [];
          unreadCount.value = response.count;
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  // Show toast notification (custom event that can be listened to)
  const showNotificationToast = (notification: Notification) => {
    if (import.meta.client) {
      window.dispatchEvent(
        new CustomEvent("notification-toast", { detail: notification }),
      );
    }
  };

  // Watch for token changes (reconnect on login/logout)
  if (import.meta.client) {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        if (e.newValue) {
          connect();
        } else {
          disconnect();
        }
      }
    };

    onMounted(() => {
      window.addEventListener("storage", handleStorageChange);
      connect();
    });

    onUnmounted(() => {
      window.removeEventListener("storage", handleStorageChange);
      disconnect();
    });
  } else {
    onMounted(connect);
    onUnmounted(disconnect);
  }

  return {
    isConnected,
    unreadCount,
    notifications,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    deleteNotification,
    deleteAllNotifications,
  };
}
