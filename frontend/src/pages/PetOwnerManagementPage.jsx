import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import CardSection from "../components/common/CardSection";
import PageHeader from "../components/common/PageHeader";
import PaginationControls from "../components/common/PaginationControls";
import TableStateRow from "../components/common/TableStateRow";
import { petOwnerService } from "../services/petOwnerService";
import { petService } from "../services/petService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = { full_name: "", phone: "", email: "", address: "", notes: "" };

const PetOwnerManagementPage = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, hasNext: false, hasPrev: false });
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [petsByOwner, setPetsByOwner] = useState({});

  const loadOwners = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) {
        const keyword = search.trim();
        params.search = keyword;
        params.pet_keyword = keyword;
      }
      const res = await petOwnerService.getPetOwners(params);
      setOwners(res?.data ?? []);
      setPagination(res?.pagination ?? { total: 0, page: 1, totalPages: 1, hasNext: false, hasPrev: false });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải chủ thú cưng."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadOwners(); }, [loadOwners]);

  const loadPetsByOwner = useCallback(async () => {
    try {
      const res = await petOwnerService.getPetOwners({ page: 1, limit: 200 });
      const ownerIds = (res?.data ?? []).map((item) => item._id || item.id).filter(Boolean);
      if (ownerIds.length === 0) {
        setPetsByOwner({});
        return;
      }

      const petRes = await petService.getPets({ page: 1, limit: 500 });
      const petMap = {};
      (petRes?.data ?? []).forEach((pet) => {
        const ownerId = pet?.owner_id?._id || pet?.owner_id;
        if (!ownerId) return;
        if (!petMap[ownerId]) petMap[ownerId] = [];
        petMap[ownerId].push(pet?.name || "-");
      });
      setPetsByOwner(petMap);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách thú cưng theo chủ."));
    }
  }, []);

  useEffect(() => {
    loadPetsByOwner();
  }, [loadPetsByOwner]);

  const resetForm = () => {
    setEditingId("");
    setForm(defaultForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Họ và tên là bắt buộc.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      };
      if (editingId) {
        const res = await petOwnerService.updatePetOwner(editingId, payload);
        toast.success(res?.message || "Cập nhật chủ thú cưng thành công.");
      } else {
        const res = await petOwnerService.createPetOwner(payload);
        toast.success(res?.message || "Tạo chủ thú cưng thành công.");
      }
      resetForm();
      await loadPetsByOwner();
      await loadOwners();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Lưu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      full_name: item.full_name || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      notes: item.notes || "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Xóa chủ thú cưng này?")) return;
    try {
      const res = await petOwnerService.deletePetOwner(id);
      toast.success(res?.message || "Xóa chủ thú cưng thành công.");
      await loadOwners();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xóa thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRound}
        title="Quản lý chủ thú cưng"
        description="Quản lý thông tin liên hệ chủ thú cưng. Mỗi chủ có thể sở hữu nhiều thú cưng."
        onRefresh={loadOwners}
        refreshing={loading}
      />

      <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Họ và tên *" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Số điện thoại" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Địa chỉ" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 md:col-span-2" />
        <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú" className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{editingId ? "Cập nhật" : "Tạo"}</button>
      </form>

      <CardSection>
        <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Tìm theo tên chủ, email, số điện thoại hoặc tên thú cưng" className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
      </CardSection>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-4 py-3 text-left">Tên</th><th className="px-4 py-3 text-left">Thú cưng sở hữu</th><th className="px-4 py-3 text-left">Số điện thoại</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
          <tbody>
            {loading || owners.length === 0 ? (<TableStateRow loading={loading} colSpan={5} loadingText="Đang tải chủ thú cưng..." empty={owners.length === 0} emptyText="Không có chủ thú cưng." />) : owners.map((item) => {
              const id = item._id || item.id;
              const petNames = petsByOwner[id] || [];
              return (
                <tr key={id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{item.full_name}</td>
                  <td className="px-4 py-3">{petNames.length > 0 ? petNames.join(", ") : "-"}</td>
                  <td className="px-4 py-3">{item.phone || "-"}</td>
                  <td className="px-4 py-3">{item.email || "-"}</td>
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

export default PetOwnerManagementPage;

