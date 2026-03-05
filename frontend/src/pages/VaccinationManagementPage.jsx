import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, ShieldPlus, Syringe } from "lucide-react";
import { toast } from "sonner";
import CardSection from "../components/common/CardSection";
import PageHeader from "../components/common/PageHeader";
import SearchableSelect from "../components/common/SearchableSelect";
import TableStateRow from "../components/common/TableStateRow";
import { petService } from "../services/petService";
import { vaccinationService } from "../services/vaccinationService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = {
  pet_id: "",
  vaccine_name: "",
  vaccination_date: "",
  next_due_date: "",
  veterinarian: "",
  notes: "",
};

const toOptionId = (item) => item?._id || item?.id || "";

const VaccinationManagementPage = () => {
  const [petId, setPetId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const loadByPet = async (targetPetId = petId) => {
    if (!targetPetId) {
      toast.error("Vui lòng chọn thú cưng trước.");
      return;
    }

    setLoading(true);
    try {
      const res = await vaccinationService.getVaccinationsByPet(targetPetId);
      setRecords(res?.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải dữ liệu tiêm chủng."));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.pet_id || !form.vaccine_name.trim()) {
      toast.error("Thú cưng và tên vắc-xin là bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const res = await vaccinationService.createVaccination({
        pet_id: form.pet_id,
        vaccine_name: form.vaccine_name.trim(),
        vaccination_date: form.vaccination_date || undefined,
        next_due_date: form.next_due_date || undefined,
        veterinarian: form.veterinarian.trim(),
        notes: form.notes.trim(),
      });
      toast.success(res?.message || "Tạo lịch tiêm thành công.");
      setForm(defaultForm);
      if (petId) await loadByPet(petId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Tạo mới thất bại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Syringe}
        title="Quản lý tiêm chủng"
        description="Tạo và theo dõi lịch tiêm theo thú cưng."
      />

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <SearchableSelect
          value={form.pet_id}
          onChange={(value) => setForm((p) => ({ ...p, pet_id: value }))}
          options={petOptions}
          placeholder="Chọn thú cưng *"
        />
        <input value={form.vaccine_name} onChange={(e) => setForm((p) => ({ ...p, vaccine_name: e.target.value }))} placeholder="Tên vắc-xin *" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.veterinarian} onChange={(e) => setForm((p) => ({ ...p, veterinarian: e.target.value }))} placeholder="Bác sĩ thú y" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input type="date" value={form.vaccination_date} onChange={(e) => setForm((p) => ({ ...p, vaccination_date: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input type="date" value={form.next_due_date} onChange={(e) => setForm((p) => ({ ...p, next_due_date: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Tạo</button>
        <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 md:col-span-3" />
      </form>

      <CardSection className="flex gap-2">
        <SearchableSelect
          value={petId}
          onChange={setPetId}
          options={petOptions}
          placeholder="Chọn thú cưng để xem hồ sơ"
          allowClear
        />
        <button onClick={() => loadByPet()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2"><ShieldPlus className="size-4" />Tải dữ liệu</button>
      </CardSection>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-4 py-3 text-left">Vắc-xin</th><th className="px-4 py-3 text-left">Đã tiêm</th><th className="px-4 py-3 text-left">Lần kế tiếp</th><th className="px-4 py-3 text-left">Bác sĩ thú y</th><th className="px-4 py-3 text-left">Ghi chú</th></tr></thead>
          <tbody>{loading || records.length === 0 ? (<TableStateRow loading={loading} colSpan={5} loadingText="Đang tải dữ liệu tiêm chủng..." empty={records.length === 0} emptyText="Không có dữ liệu tiêm chủng." />) : records.map((item) => (<tr key={item._id || item.id} className="border-t border-gray-100 dark:border-gray-800"><td className="px-4 py-3">{item.vaccine_name}</td><td className="px-4 py-3">{item.vaccination_date ? new Date(item.vaccination_date).toLocaleDateString() : "-"}</td><td className="px-4 py-3">{item.next_due_date ? new Date(item.next_due_date).toLocaleDateString() : "-"}</td><td className="px-4 py-3">{item.veterinarian || "-"}</td><td className="px-4 py-3">{item.notes || "-"}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default VaccinationManagementPage;
