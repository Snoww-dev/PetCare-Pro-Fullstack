import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Cat,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from "../components/common/SearchableSelect";
import SelectControl from "../components/common/SelectControl";
import { petService } from "../services/petService";
import { usePetStore } from "../stores/usePetStore";

const DEFAULT_FORM = {
  name: "",
  pet_type_id: "",
  breed_id: "",
  owner_id: "",
  gender: "unknown",
  birth_date: "",
  color: "",
  weight: "",
  avatar_url: "",
  health_status: "unknown",
  notes: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || value?.id || "";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const toWeightText = (weight) => {
  if (weight === null || weight === undefined || weight === "") return "-";
  const num = Number(weight);
  if (Number.isNaN(num)) return "-";
  return `${num} kg`;
};

const genderLabel = (gender) => {
  if (gender === "male") return "Đực";
  if (gender === "female") return "Cái";
  return "Không xác định";
};

const healthLabel = (health) => {
  if (health === "healthy") return "Khỏe mạnh";
  if (health === "sick") return "Bệnh";
  if (health === "recovering") return "Đang hồi phục";
  return "Không xác định";
};

const PetManagementPage = () => {
  const pets = usePetStore((state) => state.pets);
  const pagination = usePetStore((state) => state.pagination);
  const setPets = usePetStore((state) => state.setPets);
  const setPagination = usePetStore((state) => state.setPagination);
  const upsertPet = usePetStore((state) => state.upsertPet);
  const removePet = usePetStore((state) => state.removePet);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [petTypeFilter, setPetTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formOptions, setFormOptions] = useState({
    petTypes: [],
    breeds: [],
    owners: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

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
    if (petTypeFilter) params.pet_type_id = petTypeFilter;
    if (ownerFilter.trim()) params.owner_name = ownerFilter.trim();
    if (genderFilter) params.gender = genderFilter;
    if (healthFilter) params.health_status = healthFilter;

    return params;
  }, [page, limit, sortBy, sortOrder, search, petTypeFilter, ownerFilter, genderFilter, healthFilter]);

  const filteredBreeds = useMemo(() => {
    if (!form.pet_type_id) return formOptions.breeds;
    return formOptions.breeds.filter(
      (breed) => String(breed.pet_type_id) === String(form.pet_type_id)
    );
  }, [formOptions.breeds, form.pet_type_id]);

  const loadFormOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const response = await petService.getPetFormOptions();
      setFormOptions({
        petTypes: response?.petTypes ?? [],
        breeds: response?.breeds ?? [],
        owners: response?.owners ?? [],
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tải dữ liệu biểu mẫu.");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadPets = useCallback(async () => {
    setLoading(true);

    try {
      const response = await petService.getPets(queryParams);
      setPets(response?.data ?? []);
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
      toast.error(err?.response?.data?.message || "Không thể tải thú cưng.");
    } finally {
      setLoading(false);
    }
  }, [queryParams, setPets, setPagination, limit]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  useEffect(() => {
    loadFormOptions();
  }, [loadFormOptions]);

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingPet(null);
    setForm(DEFAULT_FORM);
  };

  const openCreateModal = () => {
    setEditingPet(null);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (pet) => {
    setEditingPet(pet);
    setForm({
      name: pet?.name || "",
      pet_type_id: getId(pet?.pet_type_id),
      breed_id: getId(pet?.breed_id),
      owner_id: getId(pet?.owner_id),
      gender: pet?.gender || "unknown",
      birth_date: pet?.birth_date ? new Date(pet.birth_date).toISOString().slice(0, 10) : "",
      color: pet?.color || "",
      weight: pet?.weight ?? "",
      avatar_url: pet?.avatar_url || "",
      health_status: pet?.health_status || "unknown",
      notes: pet?.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleChangeForm = (key, value) => {
    setForm((prev) => {
      if (key === "pet_type_id") {
        return { ...prev, pet_type_id: value, breed_id: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      pet_type_id: form.pet_type_id,
      owner_id: form.owner_id,
      gender: form.gender,
      health_status: form.health_status,
      color: form.color.trim(),
      avatar_url: form.avatar_url.trim(),
      notes: form.notes.trim(),
    };

    if (form.breed_id) payload.breed_id = form.breed_id;
    if (form.birth_date) payload.birth_date = form.birth_date;
    if (form.weight !== "") payload.weight = Number(form.weight);

    if (!payload.name || !payload.pet_type_id || !payload.owner_id) {
      toast.error("Tên thú cưng, loại thú cưng và chủ sở hữu là bắt buộc.");
      setSubmitting(false);
      return;
    }

    if (payload.weight !== undefined && (Number.isNaN(payload.weight) || payload.weight < 0)) {
      toast.error("Cân nặng phải là số không âm.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingPet) {
        const petId = editingPet?._id || editingPet?.id;
        const response = await petService.updatePet(petId, payload);
        upsertPet(response?.pet || payload);
        toast.success(response?.message || "Cập nhật thú cưng thành công.");
      } else {
        const response = await petService.createPet(payload);
        upsertPet(response?.pet || payload);
        toast.success(response?.message || "Tạo thú cưng thành công.");
      }

      resetModal();
      await loadPets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pet) => {
    const petId = pet?._id || pet?.id;
    if (!petId) return;

    const confirmed = window.confirm(`Xóa thú cưng ${pet?.name || "thú cưng này"}?`);
    if (!confirmed) return;

    try {
      const response = await petService.deletePet(petId);
      removePet(petId);
      toast.success(response?.message || "Xóa thú cưng thành công.");

      if (pets.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadPets();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xóa thất bại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Cat className="size-6" />
            Quản lý thú cưng
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý hồ sơ thú cưng, tình trạng sức khỏe và chủ sở hữu.
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
            <option value="updatedAt">Sắp xếp: Cập nhật</option>
            <option value="name">Sắp xếp: Tên</option>
            <option value="weight">Sắp xếp: Cân nặng</option>
            <option value="birth_date">Sắp xếp: Ngày sinh</option>
            <option value="health_status">Sắp xếp: Sức khỏe</option>
          </SelectControl>

          <button
            type="button"
            onClick={loadPets}
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
            Thêm thú cưng
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
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
                placeholder="Tìm theo tên thú cưng"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loại thú cưng
            </label>
            <SelectControl
              value={petTypeFilter}
              onChange={(event) => {
                setPage(1);
                setPetTypeFilter(event.target.value);
              }}
            >
              <option value="">Tất cả loại thú cưng</option>
              {formOptions.petTypes.map((type) => (
                <option key={type._id || type.id} value={type._id || type.id}>
                  {type.name}
                </option>
              ))}
            </SelectControl>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chủ sở hữu
            </label>
            <input
              type="text"
              value={ownerFilter}
              onChange={(event) => {
                setPage(1);
                setOwnerFilter(event.target.value);
              }}
              placeholder="Tìm chủ theo tên/email/tên đăng nhập"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giới tính
            </label>
            <SelectControl
              value={genderFilter}
              onChange={(event) => {
                setPage(1);
                setGenderFilter(event.target.value);
              }}
            >
              <option value="">Tất cả giới tính</option>
              <option value="male">Đực</option>
              <option value="female">Cái</option>
              <option value="unknown">Không xác định</option>
            </SelectControl>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sức khỏe
            </label>
            <SelectControl
              value={healthFilter}
              onChange={(event) => {
                setPage(1);
                setHealthFilter(event.target.value);
              }}
            >
              <option value="">Tất cả tình trạng</option>
              <option value="healthy">Khỏe mạnh</option>
              <option value="sick">Bệnh</option>
              <option value="recovering">Đang hồi phục</option>
              <option value="unknown">Không xác định</option>
            </SelectControl>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-semibold">Tên</th>
                <th className="px-4 py-3 font-semibold">Loại</th>
                <th className="px-4 py-3 font-semibold">Chủ sở hữu</th>
                <th className="px-4 py-3 font-semibold">Giới tính</th>
                <th className="px-4 py-3 font-semibold">Sức khỏe</th>
                <th className="px-4 py-3 font-semibold">Cân nặng</th>
                <th className="px-4 py-3 font-semibold">Ngày sinh</th>
                <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải thú cưng...
                    </span>
                  </td>
                </tr>
              ) : pets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    Không tìm thấy thú cưng.
                  </td>
                </tr>
              ) : (
                pets.map((pet) => {
                  const petId = pet?._id || pet?.id;
                  const typeName = pet?.pet_type_id?.name || getId(pet?.pet_type_id) || "-";
                  const ownerName =
                    pet?.owner_id?.full_name || pet?.owner_id?.username || getId(pet?.owner_id) || "-";

                  return (
                    <tr key={petId} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{pet?.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{typeName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{ownerName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{genderLabel(pet?.gender)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 capitalize">
                          {healthLabel(pet?.health_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{toWeightText(pet?.weight)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(pet?.birth_date)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(pet?.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(pet)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Pencil className="size-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pet)}
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
            Tổng: <span className="font-semibold">{pagination.total || 0}</span> thú cưng
          </p>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 dark:text-gray-300">Số dòng</label>
            <SelectControl
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
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
          <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {editingPet ? "Sửa thú cưng" : "Tạo thú cưng"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Các trường bắt buộc: tên, loại thú cưng, chủ sở hữu.
                </p>
                {loadingOptions && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Đang tải dữ liệu biểu mẫu...
                  </p>
                )}
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
                    Tên *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => handleChangeForm("name", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loại thú cưng *
                  </label>
                  <SelectControl
                    value={form.pet_type_id}
                    onChange={(event) => handleChangeForm("pet_type_id", event.target.value)}
                  >
                    <option value="">Chọn loại thú cưng</option>
                    {formOptions.petTypes.map((type) => (
                      <option key={type._id || type.id} value={type._id || type.id}>
                        {type.name}
                      </option>
                    ))}
                  </SelectControl>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chủ sở hữu *
                  </label>
                  <SearchableSelect
                    value={form.owner_id}
                    onChange={(value) => handleChangeForm("owner_id", value)}
                    options={formOptions.owners.map((owner) => ({
                      value: owner._id || owner.id,
                      label: owner.full_name || owner.email || owner.phone || owner._id || owner.id,
                    }))}
                    placeholder="Chọn chủ sở hữu *"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giống
                  </label>
                  <SelectControl
                    value={form.breed_id}
                    onChange={(event) => handleChangeForm("breed_id", event.target.value)}
                  >
                    <option value="">Chọn giống</option>
                    {filteredBreeds.map((breed) => (
                      <option key={breed._id || breed.id} value={breed._id || breed.id}>
                        {breed.name}
                      </option>
                    ))}
                  </SelectControl>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giới tính
                  </label>
                  <SelectControl
                    value={form.gender}
                    onChange={(event) => handleChangeForm("gender", event.target.value)}
                  >
                    <option value="unknown">Không xác định</option>
                    <option value="male">Đực</option>
                    <option value="female">Cái</option>
                  </SelectControl>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tình trạng sức khỏe
                  </label>
                  <SelectControl
                    value={form.health_status}
                    onChange={(event) => handleChangeForm("health_status", event.target.value)}
                  >
                    <option value="unknown">Không xác định</option>
                    <option value="healthy">Khỏe mạnh</option>
                    <option value="sick">Bệnh</option>
                    <option value="recovering">Đang hồi phục</option>
                  </SelectControl>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(event) => handleChangeForm("birth_date", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.weight}
                    onChange={(event) => handleChangeForm("weight", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Màu sắc
                  </label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(event) => handleChangeForm("color", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    URL ảnh đại diện
                  </label>
                  <input
                    type="text"
                    value={form.avatar_url}
                    onChange={(event) => handleChangeForm("avatar_url", event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none ring-primary focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => handleChangeForm("notes", event.target.value)}
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
                  {editingPet ? "Lưu thay đổi" : "Tạo thú cưng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetManagementPage;
