import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Shapes, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/common/PageHeader";
import PaginationControls from "../components/common/PaginationControls";
import TableStateRow from "../components/common/TableStateRow";
import { petTypeService } from "../services/petTypeService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = {
  name: "",
  description: "",
};

const PetTypeManagementPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
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

  const params = useMemo(() => {
    const p = { page, limit: 10 };
    if (search.trim()) p.search = search.trim();
    return p;
  }, [page, search]);

  const loadPetTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await petTypeService.getPetTypes(params);
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
      toast.error(getApiErrorMessage(error, "Không thể tải loại thú cưng."));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadPetTypes();
  }, [loadPetTypes]);

  const resetForm = () => {
    setEditingId("");
    setForm(defaultForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tên loại thú cưng là bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };
      if (editingId) {
        const res = await petTypeService.updatePetType(editingId, payload);
        toast.success(res?.message || "Cập nhật loại thú cưng thành công.");
      } else {
        const res = await petTypeService.createPetType(payload);
        toast.success(res?.message || "Tạo loại thú cưng thành công.");
      }
      resetForm();
      await loadPetTypes();
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
      description: item.description || "",
    });
  };

  const onDelete = async (id, name) => {
    if (!window.confirm(`Xóa loại thú cưng ${name}?`)) return;
    try {
      const res = await petTypeService.deletePetType(id);
      toast.success(res?.message || "Xóa loại thú cưng thành công.");
      await loadPetTypes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xóa thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shapes}
        title="Quản lý loại thú cưng"
        description="Quản lý danh mục loại thú cưng dùng trong hồ sơ thú cưng."
        onRefresh={loadPetTypes}
        refreshing={loading}
      />

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tên loại thú cưng *" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mô tả" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 md:col-span-2" />
        <div className="flex gap-2">
          <button disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{editingId ? "Cập nhật" : "Tạo"}</button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700">Hủy</button>}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Tìm loại thú cưng theo tên" className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-4 py-3 text-left">Tên</th><th className="px-4 py-3 text-left">Mô tả</th><th className="px-4 py-3 text-left">Ngày tạo</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
          <tbody>
            {loading || rows.length === 0 ? (<TableStateRow loading={loading} colSpan={4} loadingText="Đang tải loại thú cưng..." empty={rows.length === 0} emptyText="Không có loại thú cưng." />) : rows.map((item) => {
              const id = item._id || item.id;
              return (
                <tr key={id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.description || "-"}</td>
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

export default PetTypeManagementPage;
