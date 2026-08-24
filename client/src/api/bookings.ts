import { api } from "./client";

export interface Booking {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  vehicleId?: string | null;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refused";
  price: number;
  notes?: string | null;
  createdAt: string;
  service?: any;
  vehicle?: any;
  professional?: any;
  client?: any;
  review?: any;
}

export const bookingsApi = {
  create: (data: { professionalId: string; serviceId: string; vehicleId?: string; date: string; timeSlot: string; notes?: string }) =>
    api.post<{ booking: Booking }>("/bookings", data),
  mine: () => api.get<{ bookings: Booking[] }>("/bookings/mine"),
  pro: () => api.get<{ bookings: Booking[] }>("/bookings/pro"),
  confirm: (id: string) => api.post<{ booking: Booking }>(`/bookings/${id}/confirm`),
  refuse: (id: string) => api.post<{ booking: Booking }>(`/bookings/${id}/refuse`),
  cancel: (id: string) => api.post<{ booking: Booking }>(`/bookings/${id}/cancel`),
  complete: (id: string) => api.post<{ booking: Booking }>(`/bookings/${id}/complete`),
};

export const reviewsApi = {
  create: (data: { bookingId: string; rating: number; text?: string }) => api.post("/reviews", data),
  forProfessional: (professionalId: string, sort = "recent") => api.get<{ reviews: any[] }>(`/reviews/professional/${professionalId}?sort=${sort}`),
  report: (id: string, reason?: string) => api.post(`/reviews/${id}/report`, { reason }),
};
