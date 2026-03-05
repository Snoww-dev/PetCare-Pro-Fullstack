import { useCallback, useEffect, useMemo, useState } from "react";
import { GitBranch, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/common/PageHeader";
import PaginationControls from "../components/common/PaginationControls";
import SearchableSelect from "../components/common/SearchableSelect";
import TableStateRow from "../components/common/TableStateRow";
import { breedService } from "../services/breedService";
import { petTypeService } from "../services/petTypeService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = {
  name: "",
  pet_type_id: "",
};

const toOptionId = (item) => item?._id || item?.id || "";

const BreedManagementPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [petTypeFilter, setPetTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [petTypes, setPetTypes] = useState([]);

  const petTypeOptions = useMemo(
    () =>
      petTypes.map((item) => ({
        value: toOptionId(item),
        label: item.name || toOptionId(item),
      })),
    [petTypes],
  );

  const params = useMemo(() => {
    const p = { page, limit: 10 };
    if (search.trim()) p.search = search.trim();
    if (petTypeFilter) p.pet_type_id = petTypeFilter;
    return p;
  }, [page, search, petTypeFilter]);

  const loadPetTypes = useCallback(async () => {
    try {
      const res = await petTypeService.getPetTypes({ page: 1, limit: 200 });
      setPetTypes(res?.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải loại thú cưng."));
    }
  }, []);

  const loadBreeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await breedService.getBreeds(params);
      setRows(res?.data ?? []);
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
      toast.error(getApiErrorMessage(error, "Không thể tải giống loài."));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadPetTypes();
  }, [loadPetTypes]);

  useEffect(() => {
    loadBreeds();
  }, [loadBreeds]);

  const resetForm = () => {
    setEditingId("");
    setForm(defaultForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.pet_type_id) {
      toast.error("Tên giống và loại thú cưng là bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        pet_type_id: form.pet_type_id,
      };
      if (editingId) {
        const res = await breedService.updateBreed(editingId, payload);
        toast.success(res?.message || "Cập nhật giống loài thành công.");
      } else {
        const res = await breedService.createBreed(payload);
        toast.success(res?.message || "Tạo giống loài thành công.");
      }
      resetForm();
      await loadBreeds();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Lưu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      name: item.name || "",
      pet_type_id: item.pet_type_id?._id || item.pet_type_id || "",
    });
  };

  const onDelete = async (id, name) => {
    if (!window.confirm(`Xóa giống loài ${name}?`)) return;
    try {
      const res = await breedService.deleteBreed(id);
      toast.success(res?.message || "Xóa giống loài thành công.");
      await loadBreeds();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xóa thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GitBranch}
        title="Quản lý giống loài"
        description="Quản lý danh mục giống loài và liên kết với loại thú cưng."
        onRefresh={loadBreeds}
        refreshing={loading}
      />

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tên giống *" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <SearchableSelect value={form.pet_type_id} onChange={(value) => setForm((p) => ({ ...p, pet_type_id: value }))} options={petTypeOptions} placeholder="Chọn loại thú cưng *" />
        <div className="flex gap-2 md:col-span-2">
          <button disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{editingId ? "Cập nhật" : "Tạo"}</button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700">Hủy</button>}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Tìm giống theo tên" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <SearchableSelect value={petTypeFilter} onChange={(value) => { setPage(1); setPetTypeFilter(value); }} options={petTypeOptions} placeholder="Lọc theo loại thú cưng" allowClear />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-4 py-3 text-left">Giống</th><th className="px-4 py-3 text-left">Loại thú cưng</th><th className="px-4 py-3 text-left">Ngày tạo</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
          <tbody>
            {loading || rows.length === 0 ? (<TableStateRow loading={loading} colSpan={4} loadingText="Đang tải giống loài..." empty={rows.length === 0} emptyText="Không có giống loài." />) : rows.map((item) => {
              const id = item._id || item.id;
              return (
                <tr key={id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.pet_type_id?.name || "-"}</td>
                  <td className="px-4 py-3">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => onEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5"><Pencil className="size-3.5" />Sửa</button><button onClick={() => onDelete(id, item.name)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600"><Trash2 className="size-3.5" />Xóa</button></div></td>
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

export default BreedManagementPage;
