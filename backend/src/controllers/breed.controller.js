import mongoose from "mongoose";
import PetBreed from "../models/breeds.model.js";
import PetType from "../models/petTypes.model.js";
import Pet from "../models/pet.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensurePetTypeExists = async (petTypeId) => {
  const petType = await PetType.findById(petTypeId).select("_id").lean();
  return Boolean(petType);
};

const findBreedByNameAndType = (name, petTypeId) =>
  PetBreed.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    pet_type_id: petTypeId,
  });

export const createBreed = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const petTypeId = normalizeText(req.body.pet_type_id);

    if (!name || !petTypeId) {
      return res.status(400).json({ message: "name and pet_type_id are required." });
    }
    if (!isValidObjectId(petTypeId)) {
      return res.status(400).json({ message: "Invalid pet_type_id." });
    }

    const petTypeExists = await ensurePetTypeExists(petTypeId);
    if (!petTypeExists) {
      return res.status(404).json({ message: "Pet type not found." });
    }

    const exists = await findBreedByNameAndType(name, petTypeId);
    if (exists) {
      return res.status(409).json({ message: "Breed name already exists in this pet type." });
    }

    const breed = await PetBreed.create({ name, pet_type_id: petTypeId });
    const created = await PetBreed.findById(breed._id).populate("pet_type_id", "name").lean();

    return res.status(201).json({
      message: "Breed created successfully.",
      breed: created,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getBreeds = async (req, res) => {
  try {
    const {
      search,
      pet_type_id,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } = req.query;

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const filter = {};
    const normalizedSearch = normalizeText(search);
    if (normalizedSearch) {
      filter.name = { $regex: escapeRegex(normalizedSearch), $options: "i" };
    }
    if (pet_type_id && isValidObjectId(pet_type_id)) {
      filter.pet_type_id = pet_type_id;
    }

    const [data, total] = await Promise.all([
      PetBreed.find(filter)
        .populate("pet_type_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      PetBreed.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return res.status(200).json({
      data,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateBreed = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid breed id." });
    }

    const payload = {};
    const name = normalizeText(req.body.name);
    const petTypeId = normalizeText(req.body.pet_type_id);

    if (petTypeId) {
      if (!isValidObjectId(petTypeId)) {
        return res.status(400).json({ message: "Invalid pet_type_id." });
      }
      const exists = await ensurePetTypeExists(petTypeId);
      if (!exists) {
        return res.status(404).json({ message: "Pet type not found." });
      }
      payload.pet_type_id = petTypeId;
    }
    if (name) payload.name = name;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const current = await PetBreed.findById(id).lean();
    if (!current) {
      return res.status(404).json({ message: "Breed not found." });
    }

    const targetName = payload.name || current.name;
    const targetPetType = payload.pet_type_id || current.pet_type_id;
    const duplicate = await findBreedByNameAndType(targetName, targetPetType);
    if (duplicate && String(duplicate._id) !== String(id)) {
      return res.status(409).json({ message: "Breed name already exists in this pet type." });
    }

    const breed = await PetBreed.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true },
    )
      .populate("pet_type_id", "name")
      .lean();

    return res.status(200).json({
      message: "Breed updated successfully.",
      breed,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteBreed = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid breed id." });
    }

    const petCount = await Pet.countDocuments({ breed_id: id });
    if (petCount > 0) {
      return res.status(409).json({
        message: "Cannot delete breed because it is already assigned to pets.",
      });
    }

    const deleted = await PetBreed.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Breed not found." });
    }

    return res.status(200).json({ message: "Breed deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
