import mongoose from "mongoose";
import PetType from "../models/petTypes.model.js";
import PetBreed from "../models/breeds.model.js";
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

const findByNameExact = (name) =>
  PetType.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });

export const createPetType = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const description = normalizeText(req.body.description);

    if (!name) {
      return res.status(400).json({ message: "name is required." });
    }

    const exists = await findByNameExact(name);
    if (exists) {
      return res.status(409).json({ message: "Pet type name already exists." });
    }

    const petType = await PetType.create({ name, description });
    return res.status(201).json({
      message: "Pet type created successfully.",
      petType,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getPetTypes = async (req, res) => {
  try {
    const { search, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const filter = {};
    const normalizedSearch = normalizeText(search);
    if (normalizedSearch) {
      filter.name = { $regex: escapeRegex(normalizedSearch), $options: "i" };
    }

    const [data, total] = await Promise.all([
      PetType.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      PetType.countDocuments(filter),
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

export const updatePetType = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pet type id." });
    }

    const payload = {};
    const name = normalizeText(req.body.name);
    const description = normalizeText(req.body.description);

    if (name) {
      const existing = await findByNameExact(name);
      if (existing && String(existing._id) !== String(id)) {
        return res.status(409).json({ message: "Pet type name already exists." });
      }
      payload.name = name;
    }
    if (req.body.description !== undefined) {
      payload.description = description;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const petType = await PetType.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    if (!petType) {
      return res.status(404).json({ message: "Pet type not found." });
    }

    return res.status(200).json({
      message: "Pet type updated successfully.",
      petType,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deletePetType = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pet type id." });
    }

    const [breedCount, petCount] = await Promise.all([
      PetBreed.countDocuments({ pet_type_id: id }),
      Pet.countDocuments({ pet_type_id: id }),
    ]);

    if (breedCount > 0 || petCount > 0) {
      return res.status(409).json({
        message: "Cannot delete pet type because it is in use by breeds or pets.",
      });
    }

    const deleted = await PetType.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Pet type not found." });
    }

    return res.status(200).json({ message: "Pet type deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
