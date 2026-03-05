import {
  LayoutDashboard,
  Calendar,
  Cat,
  Users,
  PawPrint,
  Moon,
  Sun,
  BriefcaseBusiness,
  Syringe,
  FileHeart,
  UserRound,
  LogOut,
  Shapes,
  GitBranch,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";

const menuGroups = [
  {
    id: "overview",
    title: "Tổng quan",
    items: [
      {
        id: "dashboard",
        label: "Bảng điều khiển",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    id: "operations",
    title: "Vận hành",
    items: [
      {
        id: "pets",
        label: "Quản lý thú cưng",
        icon: Cat,
        path: "/pets",
      },
      {
        id: "pet-owners",
        label: "Chủ thú cưng",
        icon: UserRound,
        path: "/pet-owners",
      },
      {
        id: "services",
        label: "Dịch vụ",
        icon: BriefcaseBusiness,
        path: "/services",
      },
      {
        id: "pet-types",
        label: "Loại thú cưng",
        icon: Shapes,
        path: "/pet-types",
      },
      {
        id: "breeds",
        label: "Giống loài",
        icon: GitBranch,
        path: "/breeds",
      },
      {
        id: "appointments",
        label: "Lịch hẹn",
        icon: Calendar,
        path: "/appointments",
      },
    ],
  },
  {
    id: "healthcare",
    title: "Chăm sóc sức khỏe",
    items: [
      {
        id: "medical-records",
        label: "Hồ sơ bệnh án",
        icon: FileHeart,
        path: "/medical-records",
      },
      {
        id: "vaccinations",
        label: "Tiêm chủng",
        icon: Syringe,
        path: "/vaccinations",
      },
    ],
  },
  {
    id: "administration",
    title: "Quản trị",
    items: [
      {
        id: "users",
        label: "Quản lý người dùng",
        icon: Users,
        path: "/users",
        roles: ["admin"],
      },
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const displayName =
    user?.full_name || user?.username || user?.email || "Người dùng không xác định";

  const allowedMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(user?.role),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-72 h-full shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-6 transition-all duration-200">
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3">
        <div className="flex items-center gap-3">
          <PawPrint className="size-10 text-white bg-primary p-1.5 rounded-xl" />
          <span>
            <h2 className="text-lg font-bold text-primary leading-tight">PetCare Pro</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Bảng quản trị
            </p>
          </span>
        </div>
      </div>

      <nav className="space-y-4 flex-1 overflow-y-auto pr-1">
        {allowedMenuGroups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path ? location.pathname === item.path : false;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3">
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Đăng nhập với</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100 break-all">
            {displayName}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          <span>{theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-500 text-white px-4 py-2.5 hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2"
        >
          <LogOut className="size-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
