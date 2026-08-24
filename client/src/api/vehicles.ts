import { api } from "./client";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string | null;
  mileage?: number | null;
  photoUrl?: string | null;
  plate?: string | null;
  nickname?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export type VehicleInput = Omit<Vehicle, "id" | "createdAt">;

export const vehiclesApi = {
  list: () => api.get<{ vehicles: Vehicle[] }>("/vehicles"),
  history: (id: string) => api.get<{ bookings: any[] }>(`/vehicles/${id}/history`),
  create: (data: Partial<VehicleInput>) => api.post<{ vehicle: Vehicle }>("/vehicles", data),
  update: (id: string, data: Partial<VehicleInput>) => api.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, data),
  remove: (id: string) => api.delete(`/vehicles/${id}`),
};
