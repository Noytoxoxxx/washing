import { api } from "./client";

export interface Post {
  id: string;
  images: string[];
  description: string;
  vehicleTag?: string | null;
  serviceTag?: string | null;
  hashtags: string;
  isBeforeAfter: boolean;
  createdAt: string;
  author: { firstName: string; lastName: string; avatarUrl?: string | null };
  professional?: { companyName: string; slug: string; logoUrl?: string | null; verified: boolean; isFounder: boolean } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export const postsApi = {
  feed: (params: { page?: number; following?: boolean; professionalId?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.following) qs.set("following", "true");
    if (params.professionalId) qs.set("professionalId", params.professionalId);
    return api.get<{ posts: Post[]; total: number; totalPages: number }>(`/posts?${qs.toString()}`);
  },
  create: (data: { images: string[]; description?: string; vehicleTag?: string; serviceTag?: string; hashtags?: string; isBeforeAfter?: boolean }) =>
    api.post<{ post: Post }>("/posts", data),
  remove: (id: string) => api.delete(`/posts/${id}`),
  like: (id: string) => api.post<{ liked: boolean }>(`/posts/${id}/like`),
  save: (id: string) => api.post<{ saved: boolean }>(`/posts/${id}/save`),
  comments: (id: string) => api.get<{ comments: any[] }>(`/posts/${id}/comments`),
  addComment: (id: string, text: string) => api.post<{ comment: any }>(`/posts/${id}/comments`, { text }),
  removeComment: (id: string) => api.delete(`/posts/comments/${id}`),
  report: (id: string, reason?: string) => api.post(`/posts/${id}/report`, { reason }),
};
