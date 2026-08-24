import { api } from "./client";

export interface ProfessionalListItem {
  id: string;
  slug: string;
  companyName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  city: string;
  category?: { id: string; name: string; slug: string; icon: string } | null;
  verified: boolean;
  isFounder: boolean;
  homeService: boolean;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  reviewCount: number;
  minPrice: number | null;
  distance: number | null;
  openNow: boolean;
  favoriteCount: number;
  followerCount: number;
}

export interface ExplorerFilters {
  q?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  homeService?: boolean;
  verified?: boolean;
  founder?: boolean;
  openNow?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

function toQuery(filters: ExplorerFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters as Record<string, unknown>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const professionalsApi = {
  list: (filters: ExplorerFilters) =>
    api.get<{ professionals: ProfessionalListItem[]; total: number; page: number; totalPages: number }>(
      `/professionals${toQuery(filters)}`
    ),
  get: (slug: string) => api.get<{ professional: any; isFavorite: boolean; isFollowing: boolean }>(`/professionals/${slug}`),
  toggleFavorite: (id: string) => api.post<{ favorited: boolean }>(`/professionals/${id}/favorite`),
  toggleFollow: (id: string) => api.post<{ following: boolean }>(`/professionals/${id}/follow`),
};
