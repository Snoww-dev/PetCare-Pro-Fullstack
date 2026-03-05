import { useCallback, useEffect, useMemo, useState } from "react";
import { FileHeart, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CardSection from "../components/common/CardSection";
import PageHeader from "../components/common/PageHeader";
import PaginationControls from "../components/common/PaginationControls";
import SearchableSelect from "../components/common/SearchableSelect";
import TableStateRow from "../components/common/TableStateRow";
import { medicalRecordService } from "../services/medicalRecordService";
import { petService } from "../services/petService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = {
  pet_id: "",
  diagnosis: "",
  treatment: "",
  doctor_name: "",
  visit_date: "",
  weight: "",
  temperature: "",
  notes: "",
};

const toOptionId = (item) => item?._id || item?.id || "";

const MedicalRecordManagementPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [petFilter, setPetFilter] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [petOptionsRaw, setPetOptionsRaw] = useState([]);

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

  const loadOptions = useCallback(async () => {
    try {
      const res = await petService.getPetFormOptions();
      setPetOptionsRaw(res?.pets ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách thú cưng."));
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (petFilter) params.pet_id = petFilter;
      const res = await medicalRecordService.getMedicalRecords(params);
      setRecords(res?.data ?? []);
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
      toast.error(getApiErrorMessage(error, "Không thể tải hồ sơ bệnh án."));
    } finally {
      setLoading(false);
    }
  }, [page, petFilter]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const resetForm = () => {
    setEditingId("");
    setForm(defaultForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.pet_id || !form.visit_date) {
      toast.error("Thú cưng và ngày khám là bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pet_id: form.pet_id,
        diagnosis: form.diagnosis.trim(),
        treatment: form.treatment.trim(),
        doctor_name: form.doctor_name.trim(),
        visit_date: form.visit_date,
        weight: form.weight === "" ? undefined : Number(form.weight),
        temperature: form.temperature === "" ? undefined : Number(form.temperature),
        notes: form.notes.trim(),
      };

      if (editingId) {
        const res = await medicalRecordService.updateMedicalRecord(editingId, payload);
        toast.success(res?.message || "Cập nhật hồ sơ bệnh án thành công.");
      } else {
        const res = await medicalRecordService.createMedicalRecord(payload);
        toast.success(res?.message || "Tạo hồ sơ bệnh án thành công.");
      }

      resetForm();
      await loadRecords();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Lưu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      pet_id: item.pet_id?._id || item.pet_id || "",
      diagnosis: item.diagnosis || "",
      treatment: item.treatment || "",
      doctor_name: item.doctor_name || "",
      visit_date: item.visit_date
        ? new Date(item.visit_date).toISOString().slice(0, 16)
        : "",
      weight: item.weight ?? "",
      temperature: item.temperature ?? "",
      notes: item.notes || "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Xóa hồ sơ bệnh án này?")) return;
    try {
      const res = await medicalRecordService.deleteMedicalRecord(id);
      toast.success(res?.message || "Xóa hồ sơ bệnh án thành công.");
      await loadRecords();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xóa thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileHeart}
        title="Medical Records"
        description="Theo dõi chẩn đoán và lịch sử điều trị."
        onRefresh={loadRecords}
        refreshing={loading}
      />

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <SearchableSelect
          value={form.pet_id}
          onChange={(value) => setForm((p) => ({ ...p, pet_id: value }))}
          options={petOptions}
          placeholder="Chọn thú cưng *"
        />
        <input type="datetime-local" value={form.visit_date} onChange={(e) => setForm((p) => ({ ...p, visit_date: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.doctor_name} onChange={(e) => setForm((p) => ({ ...p, doctor_name: e.target.value }))} placeholder="Bác sĩ" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{editingId ? "Cập nhật" : "Tạo"}</button>
        <input value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} placeholder="Chẩn đoán" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 md:col-span-2" />
        <input value={form.treatment} onChange={(e) => setForm((p) => ({ ...p, treatment: e.target.value }))} placeholder="Điều trị" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 md:col-span-2" />
        <input type="number" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} placeholder="Cân nặng" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input type="number" value={form.temperature} onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))} placeholder="Nhiệt độ" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 md:col-span-2" />
      </form>

      <CardSection>
        <SearchableSelect
          value={petFilter}
          onChange={(value) => {
            setPage(1);
            setPetFilter(value);
          }}
          options={petOptions}
          placeholder="Lọc theo thú cưng"
          allowClear
        />
      </CardSection>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-4 py-3 text-left">Thú cưng</th><th className="px-4 py-3 text-left">Ngày khám</th><th className="px-4 py-3 text-left">Chẩn đoán</th><th className="px-4 py-3 text-left">Bác sĩ</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
          <tbody>
            {loading || records.length === 0 ? (<TableStateRow loading={loading} colSpan={5} loadingText="Đang tải hồ sơ..." empty={records.length === 0} emptyText="Không có hồ sơ." />) : records.map((item) => {
              const id = item._id || item.id;
              return (
                <tr key={id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{item.pet_id?.name || item.pet_id || "-"}</td>
                  <td className="px-4 py-3">{item.visit_date ? new Date(item.visit_date).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">{item.diagnosis || "-"}</td>
                  <td className="px-4 py-3">{item.doctor_name || "-"}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => onEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5"><Pencil className="size-3.5" />Sửa</button><button onClick={() => onDelete(id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600"><Trash2 className="size-3.5" />Xóa</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <PaginationControls pagination={pagination} page={page} setPage={setPage} />
      </div>
    </div>
  );
};

export default MedicalRecordManagementPage;
