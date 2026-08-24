import { api } from "./client";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get<{ notifications: Notification[]; unreadCount: number }>("/notifications"),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};
