import { api } from "./client";

function qs(params: Record<string, unknown>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  dashboard: () => api.get<any>("/admin/dashboard"),
  search: (q: string) => api.get<any>(`/admin/search?q=${encodeURIComponent(q)}`),

  professionals: {
    list: (params: Record<string, unknown> = {}) => api.get<any>(`/admin/professionals${qs(params)}`),
    get: (id: string) => api.get<any>(`/admin/professionals/${id}`),
    create: (data: Record<string, unknown>) => api.post<any>("/admin/professionals", data),
    update: (id: string, data: Record<string, unknown>) => api.put<any>(`/admin/professionals/${id}`, data),
    setStatus: (id: string, status: string) => api.post<any>(`/admin/professionals/${id}/status`, { status }),
    setVerified: (id: string, verified: boolean) => api.post<any>(`/admin/professionals/${id}/verify`, { verified }),
    setFounder: (id: string, isFounder: boolean) => api.post<any>(`/admin/professionals/${id}/founder`, { isFounder }),
    setPlan: (id: string, plan: string, commissionOverride?: number | null) =>
      api.post<any>(`/admin/professionals/${id}/plan`, { plan, commissionOverride }),
    resetAccess: (id: string) => api.post<{ ok: true; tempPassword: string }>(`/admin/professionals/${id}/reset-access`),
    remove: (id: string) => api.delete(`/admin/professionals/${id}`),
  },

  prospects: {
    list: (params: Record<string, unknown> = {}) => api.get<any>(`/admin/prospects${qs(params)}`),
    create: (data: Record<string, unknown>) => api.post<any>("/admin/prospects", data),
    update: (id: string, data: Record<string, unknown>) => api.put<any>(`/admin/prospects/${id}`, data),
    remove: (id: string) => api.delete(`/admin/prospects/${id}`),
    convert: (id: string, data: Record<string, unknown>) => api.post<any>(`/admin/prospects/${id}/convert`, data),
  },

  users: {
    list: (params: Record<string, unknown> = {}) => api.get<any>(`/admin/users${qs(params)}`),
    get: (id: string) => api.get<any>(`/admin/users/${id}`),
    setStatus: (id: string, status: string) => api.post<any>(`/admin/users/${id}/status`, { status }),
    remove: (id: string) => api.delete(`/admin/users/${id}`),
  },

  bookings: {
    list: (params: Record<string, unknown> = {}) => api.get<any>(`/admin/bookings${qs(params)}`),
  },

  moderation: {
    posts: () => api.get<any>("/admin/moderation/posts"),
    deletePost: (id: string) => api.delete(`/admin/moderation/posts/${id}`),
    reviews: () => api.get<any>("/admin/moderation/reviews"),
    flagReview: (id: string) => api.post(`/admin/moderation/reviews/${id}/report`),
    deleteReview: (id: string) => api.delete(`/admin/moderation/reviews/${id}`),
    reports: () => api.get<any>("/admin/moderation/reports"),
    resolveReport: (id: string, status: "reviewed" | "dismissed") => api.post(`/admin/moderation/reports/${id}/resolve`, { status }),
  },

  settings: {
    plans: () => api.get<{ plans: any[] }>("/admin/settings/plans"),
    updatePlan: (plan: string, data: Record<string, unknown>) => api.put<any>(`/admin/settings/plans/${plan}`, data),
  },

  logs: (page = 1) => api.get<any>(`/admin/logs?page=${page}`),

  contact: {
    list: () => api.get<{ messages: any[] }>("/admin/contact"),
    markRead: (id: string) => api.post(`/admin/contact/${id}/read`),
  },
};
