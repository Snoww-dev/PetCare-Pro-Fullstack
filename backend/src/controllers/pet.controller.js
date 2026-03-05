import mongoose from "mongoose";
import Pet from "../models/pet.model.js";
import PetType from "../models/petTypes.model.js";
import PetBreed from "../models/breeds.model.js";
import PetOwner from "../models/petOwners.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const VALID_GENDERS = ["male", "female", "unknown"];
const VALID_HEALTH_STATUS = ["healthy", "sick", "recovering", "unknown"];
const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "weight",
  "birth_date",
  "health_status",
]);
const SAFE_PET_FIELDS =
  "name pet_type_id breed_id owner_id gender birth_date color weight avatar_url health_status notes created_by createdAt updatedAt";

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toFloat = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
};

const exactNameRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

const ownerMatchFilter = (keyword) => {
  const regex = { $regex: escapeRegex(keyword), $options: "i" };
  return {
    $or: [{ full_name: regex }, { email: regex }, { phone: regex }, { address: regex }],
  };
};

const buildPetPayload = (payload = {}) => {
  const result = {};

  if (typeof payload.name === "string") result.name = payload.name.trim();
  if (typeof payload.color === "string") result.color = payload.color.trim();
  if (typeof payload.avatar_url === "string") result.avatar_url = payload.avatar_url.trim();
  if (typeof payload.notes === "string") result.notes = payload.notes.trim();

  if (payload.pet_type_id !== undefined) result.pet_type_id = payload.pet_type_id;
  if (payload.breed_id !== undefined) result.breed_id = payload.breed_id || null;
  if (payload.owner_id !== undefined) result.owner_id = payload.owner_id;
  if (typeof payload.pet_type_name === "string") {
    result.pet_type_name = payload.pet_type_name.trim();
  }
  if (typeof payload.breed_name === "string") result.breed_name = payload.breed_name.trim();
  if (typeof payload.owner_name === "string") result.owner_name = payload.owner_name.trim();

  if (typeof payload.gender === "string") result.gender = payload.gender.trim();
  if (typeof payload.health_status === "string") {
    result.health_status = payload.health_status.trim();
  }

  if (payload.weight !== undefined && payload.weight !== null && payload.weight !== "") {
    const parsedWeight = toFloat(payload.weight);
    if (parsedWeight !== null) result.weight = parsedWeight;
  }

  if (payload.birth_date !== undefined) {
    const parsedBirthDate = normalizeDate(payload.birth_date);
    if (parsedBirthDate) {
      result.birth_date = parsedBirthDate;
    }
  }

  return result;
};

const resolvePetReferences = async (payload) => {
  const resolved = { ...payload };

  if (resolved.pet_type_name && !resolved.pet_type_id) {
    const petType = await PetType.findOne({
      name: exactNameRegex(resolved.pet_type_name),
    })
      .select("_id")
      .lean();
    if (!petType) {
      return { error: `Pet type "${resolved.pet_type_name}" not found.` };
    }
    resolved.pet_type_id = petType._id;
  }

  if (resolved.owner_name && !resolved.owner_id) {
    const owners = await PetOwner.find(ownerMatchFilter(resolved.owner_name))
      .select("_id full_name email")
      .limit(2)
      .lean();

    if (owners.length === 0) {
      return { error: `Owner "${resolved.owner_name}" not found.` };
    }
    if (owners.length > 1) {
      return { error: `Owner "${resolved.owner_name}" is ambiguous. Please pick a specific owner.` };
    }
    resolved.owner_id = owners[0]._id;
  }

  if (resolved.breed_name && !resolved.breed_id) {
    const breedFilter = {
      name: exactNameRegex(resolved.breed_name),
    };
    if (resolved.pet_type_id) {
      breedFilter.pet_type_id = resolved.pet_type_id;
    }

    const breed = await PetBreed.findOne(breedFilter).select("_id pet_type_id").lean();
    if (!breed) {
      return { error: `Breed "${resolved.breed_name}" not found.` };
    }
    resolved.breed_id = breed._id;
  }

  if (resolved.breed_id && resolved.pet_type_id) {
    const breed = await PetBreed.findById(resolved.breed_id).select("_id pet_type_id").lean();
    if (!breed) {
      return { error: "Invalid breed_id." };
    }
    if (String(breed.pet_type_id) !== String(resolved.pet_type_id)) {
      return { error: "Selected breed does not belong to selected pet type." };
    }
  }

  delete resolved.pet_type_name;
  delete resolved.breed_name;
  delete resolved.owner_name;

  return { payload: resolved };
};

const validatePetPayload = (payload, { isCreate = false } = {}) => {
  if (isCreate) {
    if (!payload.name || !payload.pet_type_id || !payload.owner_id) {
      return "name, pet_type_id and owner_id are required.";
    }
  }

  if (payload.name !== undefined && !payload.name) {
    return "Pet name cannot be empty.";
  }

  if (payload.pet_type_id !== undefined && !isValidObjectId(payload.pet_type_id)) {
    return "Invalid pet_type_id.";
  }

  if (payload.owner_id !== undefined && !isValidObjectId(payload.owner_id)) {
    return "Invalid owner_id.";
  }

  if (payload.breed_id !== undefined && payload.breed_id !== null && !isValidObjectId(payload.breed_id)) {
    return "Invalid breed_id.";
  }

  if (payload.gender !== undefined && !VALID_GENDERS.includes(payload.gender)) {
    return "Invalid gender.";
  }

  if (
    payload.health_status !== undefined &&
    !VALID_HEALTH_STATUS.includes(payload.health_status)
  ) {
    return "Invalid health_status.";
  }

  if (payload.weight !== undefined && (typeof payload.weight !== "number" || payload.weight < 0)) {
    return "weight must be a non-negative number.";
  }

  return null;
};

const petPopulate = [
  { path: "pet_type_id", select: "name" },
  { path: "breed_id", select: "name" },
  { path: "owner_id", select: "full_name phone email address" },
  { path: "created_by", select: "full_name username" },
];

export const createPet = async (req, res) => {
  try {
    const basePayload = buildPetPayload(req.body);
    const resolved = await resolvePetReferences(basePayload);
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }

    const payload = {
      ...resolved.payload,
      created_by: req.user?._id,
    };

    const validationError = validatePetPayload(payload, { isCreate: true });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newPet = await Pet.create(payload);
    const createdPet = await Pet.findById(newPet._id)
      .select(SAFE_PET_FIELDS)
      .populate(petPopulate)
      .lean();

    return res.status(201).json({
      message: "Pet created successfully.",
      pet: createdPet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getPets = async (req, res) => {
  try {
    const {
      search,
      pet_type_id,
      breed_id,
      owner_id,
      owner_name,
      pet_type_name,
      breed_name,
      gender,
      health_status,
      created_by,
      min_weight,
      max_weight,
      birth_date_from,
      birth_date_to,
      created_from,
      created_to,
      has_avatar,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const filter = {};
    const normalizedSearch = normalizeText(search);

    if (normalizedSearch) {
      filter.name = {
        $regex: escapeRegex(normalizedSearch),
        $options: "i",
      };
    }

    if (pet_type_id && isValidObjectId(pet_type_id)) filter.pet_type_id = pet_type_id;
    if (breed_id && isValidObjectId(breed_id)) filter.breed_id = breed_id;
    if (owner_id && isValidObjectId(owner_id)) filter.owner_id = owner_id;

    if (pet_type_name) {
      const typeIds = await PetType.find({
        name: { $regex: escapeRegex(pet_type_name), $options: "i" },
      })
        .select("_id")
        .lean();
      filter.pet_type_id = { $in: typeIds.map((item) => item._id) };
    }

    if (breed_name) {
      const breedIds = await PetBreed.find({
        name: { $regex: escapeRegex(breed_name), $options: "i" },
      })
        .select("_id")
        .lean();
      filter.breed_id = { $in: breedIds.map((item) => item._id) };
    }

    if (owner_name) {
      const ownerIds = await PetOwner.find(ownerMatchFilter(owner_name)).select("_id").lean();
      filter.owner_id = { $in: ownerIds.map((item) => item._id) };
    }
    if (created_by && isValidObjectId(created_by)) filter.created_by = created_by;
    if (VALID_GENDERS.includes(gender)) filter.gender = gender;
    if (VALID_HEALTH_STATUS.includes(health_status)) filter.health_status = health_status;

    const minWeight = toFloat(min_weight);
    const maxWeight = toFloat(max_weight);
    if (minWeight !== null || maxWeight !== null) {
      filter.weight = {};
      if (minWeight !== null) filter.weight.$gte = minWeight;
      if (maxWeight !== null) filter.weight.$lte = maxWeight;
    }

    const birthFrom = normalizeDate(birth_date_from);
    const birthTo = normalizeDate(birth_date_to);
    if (birthFrom || birthTo) {
      filter.birth_date = {};
      if (birthFrom) filter.birth_date.$gte = birthFrom;
      if (birthTo) filter.birth_date.$lte = birthTo;
    }

    const createdFromDate = normalizeDate(created_from);
    const createdToDate = normalizeDate(created_to);
    if (createdFromDate || createdToDate) {
      filter.createdAt = {};
      if (createdFromDate) filter.createdAt.$gte = createdFromDate;
      if (createdToDate) filter.createdAt.$lte = createdToDate;
    }

    const hasAvatar = parseBoolean(has_avatar);
    if (hasAvatar !== null) {
      if (hasAvatar) {
        filter.avatar_url = { $exists: true, $nin: ["", null] };
      } else {
        filter.$or = [{ avatar_url: { $exists: false } }, { avatar_url: "" }, { avatar_url: null }];
      }
    }

    const sortField = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [pets, total] = await Promise.all([
      Pet.find(filter)
        .select(SAFE_PET_FIELDS)
        .populate(petPopulate)
        .sort({ [sortField]: sortDirection, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Pet.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.status(200).json({
      data: pets,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      sort: {
        sortBy: sortField,
        sortOrder: sortDirection === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getPetById = async (req, res) => {
  try {
    const petId = req.params.id;
    if (!isValidObjectId(petId)) {
      return res.status(400).json({ message: "Invalid pet id." });
    }

    const pet = await Pet.findById(petId)
      .select(SAFE_PET_FIELDS)
      .populate(petPopulate)
      .lean();

    if (!pet) {
      return res.status(404).json({ message: "Pet not found." });
    }

    return res.status(200).json({ pet });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updatePet = async (req, res) => {
  try {
    const petId = req.params.id;
    if (!isValidObjectId(petId)) {
      return res.status(400).json({ message: "Invalid pet id." });
    }

    const basePayload = buildPetPayload(req.body);
    const resolved = await resolvePetReferences(basePayload);
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }

    const payload = resolved.payload;
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const validationError = validatePetPayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      petId,
      { $set: payload },
      { new: true, runValidators: true }
    )
      .select(SAFE_PET_FIELDS)
      .populate(petPopulate)
      .lean();

    if (!updatedPet) {
      return res.status(404).json({ message: "Pet not found." });
    }

    return res.status(200).json({
      message: "Pet updated successfully.",
      pet: updatedPet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getPetFormOptions = async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const petTypeId = normalizeText(req.query.pet_type_id);

    const typeFilter = {};
    const breedFilter = {};
    const ownerFilter = {};

    if (search) {
      typeFilter.name = { $regex: escapeRegex(search), $options: "i" };
      breedFilter.name = { $regex: escapeRegex(search), $options: "i" };
      Object.assign(ownerFilter, ownerMatchFilter(search));
    }

    if (petTypeId && isValidObjectId(petTypeId)) {
      breedFilter.pet_type_id = petTypeId;
    }

    const petFilter = {};
    if (search) {
      petFilter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    const [petTypes, breeds, owners, pets] = await Promise.all([
      PetType.find(typeFilter).select("_id name").sort({ name: 1 }).limit(100).lean(),
      PetBreed.find(breedFilter)
        .select("_id name pet_type_id")
        .sort({ name: 1 })
        .limit(200)
        .lean(),
      PetOwner.find(ownerFilter)
        .select("_id full_name email phone address")
        .sort({ full_name: 1, email: 1 })
        .limit(100)
        .lean(),
      Pet.find(petFilter)
        .select("_id name owner_id pet_type_id breed_id")
        .populate({ path: "owner_id", select: "full_name email phone" })
        .populate({ path: "pet_type_id", select: "name" })
        .populate({ path: "breed_id", select: "name" })
        .sort({ name: 1 })
        .limit(200)
        .lean(),
    ]);

    return res.status(200).json({
      petTypes,
      breeds,
      owners,
      pets,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deletePet = async (req, res) => {
  try {
    const petId = req.params.id;
    if (!isValidObjectId(petId)) {
      return res.status(400).json({ message: "Invalid pet id." });
    }

    const deletedPet = await Pet.findByIdAndDelete(petId).select("_id name").lean();
    if (!deletedPet) {
      return res.status(404).json({ message: "Pet not found." });
    }

    return res.status(200).json({
      message: "Pet deleted successfully.",
      pet: deletedPet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
