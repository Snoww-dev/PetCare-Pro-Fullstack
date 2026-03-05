import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import CardSection from "../components/common/CardSection";
import PageHeader from "../components/common/PageHeader";
import PaginationControls from "../components/common/PaginationControls";
import SelectControl from "../components/common/SelectControl";
import TableStateRow from "../components/common/TableStateRow";
import { serviceService } from "../services/serviceService";
import { getApiErrorMessage } from "../utils/apiMessage";

const defaultForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
};

const ServiceManagementPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    const p = { page, limit };
    if (search.trim()) p.search = search.trim();
    if (status) p.status = status;
    return p;
  }, [page, limit, search, status]);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await serviceService.getServices(params);
      setServices(response?.data ?? []);
      setPagination(
        response?.pagination ?? {
          total: 0,
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải dịch vụ."));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const resetForm = () => {
    setEditingId("");
    setForm(defaultForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tên dịch vụ là bắt buộc.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price === "" ? undefined : Number(form.price),
        duration: form.duration === "" ? undefined : Number(form.duration),
      };
      if (editingId) {
        const res = await serviceService.updateService(editingId, payload);
        toast.success(res?.message || "Cập nhật dịch vụ thành công.");
      } else {
        const res = await serviceService.createService(payload);
        toast.success(res?.message || "Tạo dịch vụ thành công.");
      }
      resetForm();
      await loadServices();
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
      price: item.price ?? "",
      duration: item.duration ?? "",
    });
  };

  const onToggleStatus = async (id) => {
    try {
      const res = await serviceService.toggleServiceStatus(id);
      toast.success(res?.message || "Cập nhật trạng thái thành công.");
      await loadServices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cập nhật trạng thái thất bại."));
    }
  };

  const onDelete = async (id, name) => {
    if (!window.confirm(`Xóa dịch vụ ${name}?`)) return;
    try {
      const res = await serviceService.deleteService(id);
      toast.success(res?.message || "Xóa dịch vụ thành công.");
      await loadServices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xóa thất bại."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Quản lý dịch vụ"
        description="Quản lý dịch vụ, giá và trạng thái hoạt động."
        onRefresh={loadServices}
        refreshing={loading}
      />

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Tên dịch vụ *"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
        <input
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Mô tả"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
        <input
          type="number"
          min="0"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          placeholder="Giá"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
        <input
          type="number"
          min="1"
          value={form.duration}
          onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
          placeholder="Thời lượng (phút)"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="flex gap-2">
          <button
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingId ? "Cập nhật" : "Tạo"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      <CardSection className="grid grid-cols-1 md:grid-cols-4 gap-3 text-gray-800 dark:text-gray-200">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Tìm theo tên"
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
        <SelectControl
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Ngưng hoạt động</option>
        </SelectControl>
        <SelectControl
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(Number(e.target.value));
          }}
        >
          <option value={5}>5 dòng</option>
          <option value={10}>10 dòng</option>
          <option value={20}>20 dòng</option>
        </SelectControl>
      </CardSection>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-left">Giá</th>
              <th className="px-4 py-3 text-left">Thời lượng</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading || services.length === 0 ? (
              <TableStateRow
                loading={loading}
                colSpan={5}
                loadingText="Đang tải dịch vụ..."
                empty={services.length === 0}
                emptyText="Không có dịch vụ."
              />
            ) : (
              services.map((item) => {
                const id = item._id || item.id;
                return (
                  <tr
                    key={id}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.price ?? "-"}</td>
                    <td className="px-4 py-3">{item.duration ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.status === false
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        }`}
                      >
                        {item.status === false ? "Ngưng hoạt động" : "Hoạt động"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5"
                        >
                          <Pencil className="size-3.5" />
                          Sửa
                        </button>
                        <button
                          onClick={() => onToggleStatus(id)}
                          className="rounded-lg border border-yellow-300 px-2.5 py-1.5"
                        >
                          Chuyển trạng thái
                        </button>
                        <button
                          onClick={() => onDelete(id, item.name)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600"
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
        <PaginationControls pagination={pagination} page={page} setPage={setPage} />
      </div>
    </div>
  );
};

export default ServiceManagementPage;
