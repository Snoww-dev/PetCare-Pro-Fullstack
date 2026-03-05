import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import PetManagementPage from "./pages/PetManagementPage";
import ServiceManagementPage from "./pages/ServiceManagementPage";
import AppointmentManagementPage from "./pages/AppointmentManagementPage";
import MedicalRecordManagementPage from "./pages/MedicalRecordManagementPage";
import VaccinationManagementPage from "./pages/VaccinationManagementPage";
import PetOwnerManagementPage from "./pages/PetOwnerManagementPage";
import PetTypeManagementPage from "./pages/PetTypeManagementPage";
import BreedManagementPage from "./pages/BreedManagementPage";
import DashboardLayout from "./layouts/DashboardLayout";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Toaster richColors theme={theme === "dark" ? "dark" : "light"} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pets" element={<PetManagementPage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="appointments" element={<AppointmentManagementPage />} />
          <Route path="medical-records" element={<MedicalRecordManagementPage />} />
          <Route path="vaccinations" element={<VaccinationManagementPage />} />
          <Route path="pet-owners" element={<PetOwnerManagementPage />} />
          <Route path="pet-types" element={<PetTypeManagementPage />} />
          <Route path="breeds" element={<BreedManagementPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
