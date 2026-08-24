import { api } from "./client";

export const proApi = {
  me: () => api.get<{ profile: any }>("/pro/me"),
  plan: () => api.get<{ plan: string; label: string; priceMonthly: number; ratePercent: number; isFounder: boolean; founderSince: string | null }>("/pro/plan"),
  dashboard: () => api.get<{ profile: any; kpis: any; recentBookings: any[]; nextBooking: any }>("/pro/dashboard"),
  updateProfile: (data: Record<string, unknown>) => api.put<{ profile: any }>("/pro/me", data),
  updateHours: (hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; closed: boolean }[]) =>
    api.put<{ hours: any[] }>("/pro/me/hours", hours as any),

  services: () => api.get<{ services: any[] }>("/pro/services"),
  createService: (data: Record<string, unknown>) => api.post<{ service: any }>("/pro/services", data),
  updateService: (id: string, data: Record<string, unknown>) => api.put<{ service: any }>(`/pro/services/${id}`, data),
  removeService: (id: string) => api.delete(`/pro/services/${id}`),
  reorderServices: (order: string[]) => api.put("/pro/services/reorder", { order }),

  gallery: () => api.get<{ images: any[] }>("/pro/gallery"),
  addGalleryImage: (data: { url: string; isBeforeAfter?: boolean; pairUrl?: string }) => api.post<{ image: any }>("/pro/gallery", data),
  removeGalleryImage: (id: string) => api.delete(`/pro/gallery/${id}`),
  setGalleryCover: (id: string) => api.put(`/pro/gallery/${id}/cover`),

  clients: (q?: string) => api.get<{ clients: any[] }>(`/pro/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  stats: (period: string) => api.get<any>(`/pro/stats?period=${period}`),
};
