import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import petRoutes from "./pet.route.js";
import adminRoutes from "./admin.route.js";
import serviceRoutes from "./service.route.js";
import appointmentRoutes from "./appointment.route.js";
import medicalRecordRoutes from "./medicalRecord.route.js";
import vaccinationRoutes from "./vaccination.route.js";
import petOwnerRoutes from "./petOwner.route.js";
import petTypeRoutes from "./petType.route.js";
import breedRoutes from "./breed.route.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

export const registerRoutes = (app) => {
  app.use("/api/auth", authRoutes);

  app.use(protectedRoute);
  app.use("/api/admin", adminRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/pet", petRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/medical-records", medicalRecordRoutes);
  app.use("/api/vaccinations", vaccinationRoutes);
  app.use("/api/pet-owners", petOwnerRoutes);
  app.use("/api/pet-types", petTypeRoutes);
  app.use("/api/breeds", breedRoutes);
};
