import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Cat,
  RefreshCw,
  ShieldUser,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { appointmentService } from "../services/appointmentService";
import { authService } from "../services/authService";
import { petService } from "../services/petService";
import { petOwnerService } from "../services/petOwnerService";
import { serviceService } from "../services/serviceService";
import { useAuthStore } from "../stores/useAuthStore";
import { getApiErrorMessage } from "../utils/apiMessage";

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pets: 0,
    services: 0,
    appointments: 0,
    petOwners: 0,
    users: 0,
  });

  const isAdmin = user?.role === "admin";

  const cards = useMemo(() => {
    const baseCards = [
      {
        id: "pets",
        title: "Thú cưng",
        value: stats.pets,
        icon: Cat,
        path: "/pets",
      },
      {
        id: "petOwners",
        title: "Chủ thú cưng",
        value: stats.petOwners,
        icon: UserRound,
        path: "/pet-owners",
      },
      {
        id: "services",
        title: "Dịch vụ",
        value: stats.services,
        icon: Stethoscope,
        path: "/services",
      },
      {
        id: "appointments",
        title: "Lịch hẹn",
        value: stats.appointments,
        icon: CalendarClock,
        path: "/appointments",
      },
    ];

    if (isAdmin) {
      baseCards.push({
        id: "users",
        title: "Người dùng",
        value: stats.users,
        icon: ShieldUser,
        path: "/users",
      });
    }

    return baseCards;
  }, [isAdmin, stats]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        petService.getPets({ page: 1, limit: 1 }),
        petOwnerService.getPetOwners({ page: 1, limit: 1 }),
        serviceService.getServices({ page: 1, limit: 1 }),
        appointmentService.getAppointments({ page: 1, limit: 1 }),
      ];

      if (isAdmin) {
        requests.push(authService.getAllUsers({ page: 1, limit: 1 }));
      }

      const responses = await Promise.all(requests);

      setStats({
        pets: responses[0]?.pagination?.total || 0,
        petOwners: responses[1]?.pagination?.total || 0,
        services: responses[2]?.pagination?.total || 0,
        appointments: responses[3]?.pagination?.total || 0,
        users: isAdmin ? responses[4]?.pagination?.total || 0 : 0,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải thống kê bảng điều khiển."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Bảng điều khiển
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Chào mừng quay lại, {user?.full_name || user?.username || "Người dùng"}.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới thống kê
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={card.path}
              className="rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {loading ? "..." : card.value}
                  </p>
                </div>
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
