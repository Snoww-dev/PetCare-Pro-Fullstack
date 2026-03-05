import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../stores/useAuthStore";

const LoginForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = await authService.login({ username, password });
      const accessToken = loginData?.accessToken;

      if (!accessToken) {
        throw new Error("Missing access token");
      }

      setAuth({ token: accessToken, user: null });

      const user = await authService.getMyProfile();
      if (user) {
        setUser(user);
      }

      toast.success(loginData?.message || "Đăng nhập thành công.");
      navigate("/dashboard");
    } catch (err) {
      clearAuth();
      toast.error(err.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-lg shadow-black/5 dark:shadow-black/25">
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <label className="mb-2 text-sm font-semibold text-[var(--app-text)]">
          Tên đăng nhập
        </label>
        <input
          type="text"
          placeholder="Nhập tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-md border px-3 py-2"
        />

        <label className="mb-2 mt-4 text-sm font-semibold text-[var(--app-text)]">
          Mật khẩu
        </label>
        <input
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <hr className="my-5" />

      <p className="text-center text-sm text-[var(--app-text-muted)]">
        (c) 2026 PetCare Pro. Bảo lưu mọi quyền.
      </p>
    </div>
  );
};

export default LoginForm;
