import { api } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export const categoriesApi = {
  list: () => api.get<{ categories: Category[] }>("/categories"),
};

export const contactApi = {
  send: (data: { name: string; email: string; subject: string; message: string }) => api.post("/contact", data),
};

export const searchApi = {
  global: (q: string) =>
    api.get<{
      professionals: { id: string; slug: string; companyName: string; city: string; logoUrl?: string | null }[];
      services: { id: string; name: string; price: number; professional: { slug: string; companyName: string } }[];
      cities: string[];
    }>(`/search?q=${encodeURIComponent(q)}`),
};
