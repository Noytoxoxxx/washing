import { api } from "./client";

export const meApi = {
  favorites: () => api.get<{ favorites: { favoriteId: string; professional: any }[] }>("/me/favorites"),
  follows: () => api.get<{ follows: { id: string; professional: any }[] }>("/me/follows"),
  update: (data: Record<string, unknown>) => api.put("/me", data),
};
