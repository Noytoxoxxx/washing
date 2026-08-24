import path from "path";

// Centralized configuration. Nothing business-critical (names, limits, plan labels) should be
// hardcoded elsewhere — commission RATES live in the CommissionSetting DB table (admin-editable),
// this file only holds static defaults used to seed that table and non-monetary constants.

export const APP_NAME = "VEYZA";
export const APP_TAGLINE = "The car care network.";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export const JWT_EXPIRES_IN = "30d";
export const COOKIE_NAME = "veyza_session";

export const PORT = Number(process.env.PORT || 4000);
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const NODE_ENV = process.env.NODE_ENV || "development";

// Override with an absolute path (e.g. a Render persistent disk mount) in production so uploaded
// files survive redeploys — the default is fine for local dev but Render's filesystem is otherwise
// ephemeral and would silently lose every uploaded image on the next deploy.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
export const MAX_UPLOAD_SIZE_MB = 8;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Default plan/commission seed values — the single source of truth is the DB (CommissionSetting).
// These are only used by prisma/seed.ts to populate that table on first run.
export const DEFAULT_PLANS = [
  { plan: "free", label: "Free", ratePercent: 0, priceMonthly: 0 },
  { plan: "pro", label: "Pro", ratePercent: 3, priceMonthly: 29 },
  { plan: "business", label: "Business", ratePercent: 1.5, priceMonthly: 49 },
  { plan: "founder", label: "Founding Partner", ratePercent: 5, priceMonthly: 0 },
];

export const PROSPECT_STATUSES = [
  "to_contact",
  "contacted",
  "replied",
  "interested",
  "account_created",
  "onboarding",
  "verified",
  "active",
  "refused",
] as const;

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "refused"] as const;
export const PROFESSIONAL_STATUSES = ["pending", "active", "suspended", "inactive"] as const;
