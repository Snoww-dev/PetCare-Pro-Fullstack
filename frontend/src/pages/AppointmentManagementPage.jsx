import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import CardSection from "../components/common/CardSection";
import PageHeader from "../components/common/PageHeader";
import PaginationControls from "../components/common/PaginationControls";
import SearchableSelect from "../components/common/SearchableSelect";
import SelectControl from "../components/common/SelectControl";
import TableStateRow from "../components/common/TableStateRow";
import { appointmentService } from "../services/appointmentService";
import { authService } from "../services/authService";
import { petService } from "../services/petService";
import { serviceService } from "../services/serviceService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = {
  pet_id: "",
  service_id: "",
  appointment_date: "",
  staff_id: "",
};

const toOptionId = (item) => item?._id || item?.id || "";

const statusLabel = (status) => {
  if (status === "pending") return "Chờ xử lý";
  if (status === "completed") return "Hoàn thành";
  if (status === "cancelled") return "Đã hủy";
  return status || "-";
};

const AppointmentManagementPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [petId, setPetId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [form, setForm] = useState(defaultForm);
  const [petOptionsRaw, setPetOptionsRaw] = useState([]);
  const [serviceOptionsRaw, setServiceOptionsRaw] = useState([]);
  const [staffOptionsRaw, setStaffOptionsRaw] = useState([]);

  const petOptions = useMemo(
    () =>
      petOptionsRaw.map((pet) => ({
        value: toOptionId(pet),
        label:
          pet?.name && pet?.owner_id?.full_name
            ? `${pet.name} - ${pet.owner_id.full_name}`
            : pet?.name || toOptionId(pet),
      })),
    [petOptionsRaw],
  );

  const serviceOptions = useMemo(
    () =>
      serviceOptionsRaw.map((service) => ({
        value: toOptionId(service),
        label: service?.name || toOptionId(service),
      })),
    [serviceOptionsRaw],
  );

  const staffOptions = useMemo(
    () =>
      staffOptionsRaw.map((staff) => ({
        value: toOptionId(staff),
        label: staff?.full_name || staff?.username || staff?.email || toOptionId(staff),
      })),
    [staffOptionsRaw],
  );

  const loadOptions = useCallback(async () => {
    try {
      const [petOptionRes, serviceRes, staffRes] = await Promise.all([
        petService.getPetFormOptions(),
        serviceService.getServices({ page: 1, limit: 200 }),
        authService.getStaffOptions(),
      ]);
      setPetOptionsRaw(petOptionRes?.pets ?? []);
      setStaffOptionsRaw(staffRes?.data ?? []);
      setServiceOptionsRaw(serviceRes?.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải dữ liệu lựa chọn."));
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (petId) params.pet_id = petId;
      const res = await appointmentService.getAppointments(params);
      setAppointments(res?.data ?? []);
      setPagination(
        res?.pagination ?? {
          total: 0,
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải lịch hẹn."));
    } finally {
      setLoading(false);
    }
  }, [page, status, petId]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.pet_id || !form.service_id || !form.appointment_date) {
      toast.error("Thú cưng, dịch vụ và ngày hẹn là bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const res = await appointmentService.createAppointment({
        pet_id: form.pet_id,
        service_id: form.service_id,
        appointment_date: form.appointment_date,
        staff_id: form.staff_id || undefined,
      });
      toast.success(res?.message || "Tạo lịch hẹn thành công.");
      setForm(defaultForm);
      await loadAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Tạo mới thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const onUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await appointmentService.updateAppointmentStatus(id, nextStatus);
      toast.success(res?.message || "Cập nhật trạng thái thành công.");
      await loadAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cập nhật trạng thái thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarClock}
        title="Quản lý lịch hẹn"
        description="Quản lý lịch đặt và trạng thái."
        onRefresh={loadAppointments}
        refreshing={loading}
      />

      <form
        onSubmit={onCreate}
        className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:grid-cols-5"
      >
        <SearchableSelect
          value={form.pet_id}
          onChange={(value) => setForm((p) => ({ ...p, pet_id: value }))}
          options={petOptions}
          placeholder="Chọn thú cưng *"
        />
        <SearchableSelect
          value={form.service_id}
          onChange={(value) => setForm((p) => ({ ...p, service_id: value }))}
          options={serviceOptions}
          placeholder="Chọn dịch vụ *"
        />
        <input
          type="datetime-local"
          value={form.appointment_date}
          onChange={(e) => setForm((p) => ({ ...p, appointment_date: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
        <SearchableSelect
          value={form.staff_id}
          onChange={(value) => setForm((p) => ({ ...p, staff_id: value }))}
          options={staffOptions}
          placeholder="Chọn nhân viên (tùy chọn)"
          allowClear
        />
        <button
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-white"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Tạo
        </button>
      </form>

      <CardSection className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SelectControl
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </SelectControl>

        <SearchableSelect
          value={petId}
          onChange={(value) => {
            setPage(1);
            setPetId(value);
          }}
          options={petOptions}
          placeholder="Lọc theo thú cưng"
          allowClear
        />
      </CardSection>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Thú cưng</th>
              <th className="px-4 py-3 text-left">Dịch vụ</th>
              <th className="px-4 py-3 text-left">Ngày</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading || appointments.length === 0 ? (
              <TableStateRow
                loading={loading}
                colSpan={5}
                loadingText="Đang tải lịch hẹn..."
                empty={appointments.length === 0}
                emptyText="Không có lịch hẹn."
              />
            ) : (
              appointments.map((item) => {
                const id = item._id || item.id;
                return (
                  <tr key={id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">{item.pet_id?.name || item.pet_id || "-"}</td>
                    <td className="px-4 py-3">{item.service_id?.name || item.service_id || "-"}</td>
                    <td className="px-4 py-3">
                      {item.appointment_date ? new Date(item.appointment_date).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">{statusLabel(item.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onUpdateStatus(id, "pending")}
                          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
                        >
                          Chờ xử lý
                        </button>
                        <button
                          onClick={() => onUpdateStatus(id, "completed")}
                          className="rounded-lg border border-green-300 px-2.5 py-1.5 text-xs"
                        >
                          Hoàn tất
                        </button>
                        <button
                          onClick={() => onUpdateStatus(id, "cancelled")}
                          className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <PaginationControls pagination={pagination} page={page} setPage={setPage} />
      </div>
    </div>
  );
};

export default AppointmentManagementPage;
