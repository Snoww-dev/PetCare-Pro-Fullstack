import mongoose from "mongoose";
import PetOwner from "../models/petOwners.model.js";
import Pet from "../models/pet.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ownerMatchFilter = (keyword) => ({
  $or: [
    { full_name: { $regex: escapeRegex(keyword), $options: "i" } },
    { phone: { $regex: escapeRegex(keyword), $options: "i" } },
    { email: { $regex: escapeRegex(keyword), $options: "i" } },
    { address: { $regex: escapeRegex(keyword), $options: "i" } },
  ],
});

export const createPetOwner = async (req, res) => {
  try {
    const { full_name, phone, email, address, notes } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: "full_name is required." });
    }

    const newPetOwner = await PetOwner.create({
      full_name: full_name.trim(),
      phone: typeof phone === "string" ? phone.trim() : "",
      email: typeof email === "string" ? email.trim() : "",
      address: typeof address === "string" ? address.trim() : "",
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    return res.status(201).json({
      message: "Pet owner created successfully.",
      petOwner: newPetOwner,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getPetOwners = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      address,
      search,
      pet_keyword,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } =
      req.query;

    const filter = {};
    if (full_name) filter.full_name = { $regex: escapeRegex(full_name), $options: "i" };
    if (phone) filter.phone = { $regex: escapeRegex(phone), $options: "i" };
    if (email) filter.email = { $regex: escapeRegex(email), $options: "i" };
    if (address) filter.address = { $regex: escapeRegex(address), $options: "i" };
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ full_name: regex }, { phone: regex }, { email: regex }, { address: regex }];
    }

    const ownerKeyword = typeof search === "string" ? search.trim() : "";
    const petKeyword = typeof pet_keyword === "string" ? pet_keyword.trim() : "";

    if (ownerKeyword || petKeyword) {
      if (ownerKeyword) {
        Object.assign(filter, ownerMatchFilter(ownerKeyword));
      }
      if (petKeyword) {
        const matchedPetOwnerIds = await Pet.find({
          name: { $regex: escapeRegex(petKeyword), $options: "i" },
        })
          .select("owner_id")
          .lean();
        filter._id = { $in: matchedPetOwnerIds.map((item) => item.owner_id).filter(Boolean) };
      }
    }

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const [petOwners, total] = await Promise.all([
      PetOwner.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      PetOwner.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.status(200).json({
      data: petOwners,
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

export const getPetOwnerById = async (req, res) => {
  try {
    const petOwnerId = req.params.id;
    if (!isValidObjectId(petOwnerId)) {
      return res.status(400).json({ message: "Invalid pet owner id." });
    }

    const petOwner = await PetOwner.findById(petOwnerId).lean();
    if (!petOwner) {
      return res.status(404).json({ message: "Pet owner not found." });
    }

    return res.status(200).json({ petOwner });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updatePetOwner = async (req, res) => {
  try {
    const petOwnerId = req.params.id;
    if (!isValidObjectId(petOwnerId)) {
      return res.status(400).json({ message: "Invalid pet owner id." });
    }

    const payload = {};
    const { full_name, phone, email, address, notes } = req.body;

    if (typeof full_name === "string") payload.full_name = full_name.trim();
    if (typeof phone === "string") payload.phone = phone.trim();
    if (typeof email === "string") payload.email = email.trim();
    if (typeof address === "string") payload.address = address.trim();
    if (typeof notes === "string") payload.notes = notes.trim();

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const petOwner = await PetOwner.findByIdAndUpdate(
      petOwnerId,
      { $set: payload },
      { new: true, runValidators: true }
    )
      .lean();

    if (!petOwner) {
      return res.status(404).json({ message: "Pet owner not found." });
    }

    return res.status(200).json({
      message: "Pet owner updated successfully.",
      petOwner,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deletePetOwner = async (req, res) => {
  try {
    const petOwnerId = req.params.id;
    if (!isValidObjectId(petOwnerId)) {
      return res.status(400).json({ message: "Invalid pet owner id." });
    }

    const hasPets = await Pet.exists({ owner_id: petOwnerId });
    if (hasPets) {
      return res
        .status(409)
        .json({ message: "Cannot delete owner because there are pets linked to this owner." });
    }

    const deleted = await PetOwner.findByIdAndDelete(petOwnerId).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Pet owner not found." });
    }

    return res.status(200).json({ message: "Pet owner deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const searchPetOwners = getPetOwners;
