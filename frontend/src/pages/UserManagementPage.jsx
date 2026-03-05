import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import SelectControl from "../components/common/SelectControl";
import { authService } from "../services/authService";
import { useAuthStore } from "../stores/useAuthStore";

const DEFAULT_FORM = {
  username: "",
  password: "",
  email: "",
  full_name: "",
  phone: "",
  address: "",
  role: "staff",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const roleLabel = (role) => {
  if (role === "admin") return "Quản trị viên";
  return "Nhân viên";
};

const UserManagementPage = () => {
  const users = useAuthStore((state) => state.adminUsers);
  const setAdminUsers = useAuthStore((state) => state.setAdminUsers);
  const addAdminUser = useAuthStore((state) => state.addAdminUser);
  const patchAdminUser = useAuthStore((state) => state.updateAdminUser);
  const removeAdminUser = useAuthStore((state) => state.removeAdminUser);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.is_active = statusFilter;

    return params;
  }, [page, limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await authService.getAllUsers(queryParams);
      setAdminUsers(response?.data ?? []);
      setPagination(
        response?.pagination ?? {
          total: 0,
          page: 1,
          limit,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tải người dùng.");
    } finally {
      setLoading(false);
    }
  }, [queryParams, setAdminUsers, limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(DEFAULT_FORM);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      username: user?.username || "",
      password: "",
      email: user?.email || "",
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      role: user?.role || "staff",
    });
    setIsModalOpen(true);
  };

  const handleChangeForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    if (!form.username.trim() || !form.email.trim()) {
      toast.error("Tên đăng nhập và email là bắt buộc.");
      setSubmitting(false);
      return;
    }

    if (!editingUser && form.password.trim().length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự khi tạo người dùng.");
      setSubmitting(false);
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      role: form.role,
    };

    if (!editingUser) {
      payload.password = form.password;
    }

    try {
      if (editingUser) {
        const userId = editingUser._id || editingUser.id;
        const response = await authService.updateUser(userId, payload);
        patchAdminUser(userId, response?.user || payload);
        toast.success(response?.message || "Cập nhật người dùng thành công.");
      } else {
        const response = await authService.createUser(payload);
        if (page === 1) {
          addAdminUser(response?.user || payload);
        }
        toast.success(response?.message || "Tạo người dùng thành công.");
      }

      resetModal();
      await loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const confirmed = window.confirm(`Xóa người dùng ${user.username}?`);
    if (!confirmed) return;

    try {
      const response = await authService.deleteUser(userId);
      removeAdminUser(userId);
      toast.success(response?.message || "Xóa người dùng thành công.");

      if (users.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadUsers();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xóa thất bại.");
    }
  };

  const handleToggleStatus = async (user) => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const nextStatus = user?.is_active === false;
    const confirmed = window.confirm(
      `${nextStatus ? "Kích hoạt" : "Vô hiệu hóa"} người dùng ${user.username}?`
    );
    if (!confirmed) return;

    try {
      const response = await authService.setUserStatus(userId, nextStatus);
      patchAdminUser(userId, response?.user || { is_active: nextStatus });
      toast.success(
        response?.message ||
          `Người dùng ${nextStatus ? "đã kích hoạt" : "đã vô hiệu hóa"} thành công.`
      );
      await loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật trạng thái thất bại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="size-6" />
            Quản lý người dùng
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý tài khoản admin và staff.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden md:flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:bg-gray-900 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSortOrder("asc");
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                sortOrder === "asc"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <ArrowDownAZ className="size-3.5" />
              ASC
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSortOrder("desc");
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                sortOrder === "desc"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <ArrowUpZA className="size-3.5" />
              DESC
            </button>
          </div>

          <SelectControl
            value={sortBy}
            onChange={(event) => {
              setPage(1);
              setSortBy(event.target.value);
            }}
          >
            <option value="createdAt">Sắp xếp: Ngày tạo</option>
            <option value="username">Sắp xếp: Tên đăng nhập</option>
            <option value="email">Sắp xếp: Email</option>
            <option value="role">Sắp xếp: Vai trò</option>
            <option value="last_login">Sắp xếp: Đăng nhập gần nhất</option>
            <option value="is_active">Sắp xếp: Trạng thái</option>
          </SelectControl>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            <Plus className="size-4" />
            Thêm người dùng
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên đăng nhập, email, tên, số điện thoại..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vai trò
            </label>
            <SelectControl
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value);
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
            </SelectControl>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <SelectControl
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Ngưng hoạt động</option>
            </SelectControl>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-semibold">Tên đăng nhập</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Họ và tên</th>
                <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                <th className="px-4 py-3 font-semibold">Vai trò</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải người dùng...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    Không tìm thấy người dùng.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userId = user?._id || user?.id;

                  return (
                    <tr
                      key={userId}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {user.full_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {user.phone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.is_active === false
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          }`}
                        >
                          {user.is_active === false ? "Ngưng hoạt động" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Pencil className="size-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                              user.is_active === false
                                ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                : "border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-950/30"
                            }`}
                          >
                            {user.is_active === false ? (
                              <ShieldCheck className="size-3.5" />
                            ) : (
                              <ShieldX className="size-3.5" />
                            )}
                            {user.is_active === false ? "Kích hoạt" : "Vô hiệu hóa"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="size-3.5" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700 md:flex-row md:items-center md:justify-between">
          <p className="text-gray-600 dark:text-gray-300">
            Tổng: <span className="font-semibold">{pagination.total || 0}</span> người dùng
          </p>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 dark:text-gray-300">Số dòng</label>
            <SelectControl
              value={limit}
              onChange={(event) => {
                const newLimit = Number(event.target.value);
                setLimit(newLimit);
                setPage(1);
              }}
              className="w-20"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectControl>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev || loading}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Trước
            </button>
            <span className="min-w-24 text-center text-gray-600 dark:text-gray-300">
              Trang {pagination.page || page} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNext || loading}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {editingUser ? "Sửa người dùng" : "Tạo người dùng"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Nhập thông tin người dùng và lưu.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(event) => handleChangeForm("username", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChangeForm("email", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mật khẩu *
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) => handleChangeForm("password", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(event) => handleChangeForm("full_name", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(event) => handleChangeForm("phone", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vai trò
                  </label>
                  <SelectControl
                    value={form.role}
                    onChange={(event) => handleChangeForm("role", event.target.value)}
                  >
                    <option value="staff">Nhân viên</option>
                    <option value="admin">Quản trị viên</option>
                  </SelectControl>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Địa chỉ
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(event) => handleChangeForm("address", event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {editingUser ? "Lưu thay đổi" : "Tạo người dùng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
