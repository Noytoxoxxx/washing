import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { PORT, CLIENT_URL, UPLOAD_DIR } from "./config";
import { attachUser } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";

import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import professionalRoutes from "./routes/professionals";
import vehicleRoutes from "./routes/vehicles";
import bookingRoutes from "./routes/bookings";
import reviewRoutes from "./routes/reviews";
import postRoutes from "./routes/posts";
import notificationRoutes from "./routes/notifications";
import meRoutes from "./routes/me";
import uploadRoutes from "./routes/upload";
import proRoutes from "./routes/pro";
import contactRoutes from "./routes/contact";
import searchRoutes from "./routes/search";
import adminRoutes from "./routes/admin";

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(attachUser);
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "VEYZA API" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/me", meRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pro", proRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`VEYZA API listening on http://localhost:${PORT}`);
});
