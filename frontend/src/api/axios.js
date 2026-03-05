import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../stores/useAuthStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || "");
    const normalizedMessage = message.toLowerCase();
    const shouldForceLogout =
      status === 401 ||
      normalizedMessage.includes("invalid or expired access token");

    if (shouldForceLogout) {
      toast.error(
        error.response?.data?.message ||
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
