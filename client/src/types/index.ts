export type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: Role;
  status: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  notifyEmail: boolean;
  notifyBooking: boolean;
  notifyLikes: boolean;
  notifyFollows: boolean;
  createdAt: string;
}

export interface ProfessionalSummary {
  id: string;
  slug: string;
  status: string;
}
