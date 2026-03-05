import mongoose from "mongoose";
import MedicalRecord from "../models/medicalRecords.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createMedicalRecord = async (req, res) => {
  try {
    const { pet_id, diagnosis, treatment, doctor_name, visit_date, weight, temperature, notes } =
      req.body;

    if (!pet_id || !visit_date) {
      return res.status(400).json({ message: "pet_id and visit_date are required." });
    }
    if (!isValidObjectId(pet_id)) {
      return res.status(400).json({ message: "Invalid pet_id." });
    }

    const visitDate = new Date(visit_date);
    if (Number.isNaN(visitDate.getTime())) {
      return res.status(400).json({ message: "Invalid visit_date." });
    }

    const newMedicalRecord = await MedicalRecord.create({
      pet_id,
      diagnosis,
      treatment,
      doctor_name,
      visit_date: visitDate,
      weight,
      temperature,
      notes,
    });

    return res.status(201).json({
      message: "Medical record created successfully.",
      medicalRecord: newMedicalRecord,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllMedicalRecords = async (req, res) => {
  try {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, pet_id } = req.query;

    const filter = {};
    if (pet_id) {
      if (!isValidObjectId(pet_id)) {
        return res.status(400).json({ message: "Invalid pet_id." });
      }
      filter.pet_id = pet_id;
    }

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate("pet_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      MedicalRecord.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.status(200).json({
      data: records,
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
    console.error("Get All Medical Records Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getMedicalRecordsByPetId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid medical record id." });
    }

    const record = await MedicalRecord.findById(id).populate("pet_id").lean();
    if (!record) {
      return res.status(404).json({ message: "Medical record not found." });
    }

    return res.status(200).json({ medicalRecord: record });
  } catch (error) {
    console.error("Get Medical Record By Id Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid medical record id." });
    }

    if (req.body?.pet_id && !isValidObjectId(req.body.pet_id)) {
      return res.status(400).json({ message: "Invalid pet_id." });
    }
    if (req.body?.visit_date) {
      const parsedVisitDate = new Date(req.body.visit_date);
      if (Number.isNaN(parsedVisitDate.getTime())) {
        return res.status(400).json({ message: "Invalid visit_date." });
      }
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("pet_id", "name")
      .lean();

    if (!updatedRecord) {
      return res.status(404).json({ message: "Medical record not found." });
    }

    return res.status(200).json({
      message: "Medical record updated successfully.",
      medicalRecord: updatedRecord,
    });
  } catch (error) {
    console.error("Update Medical Record Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid medical record id." });
    }

    const deletedRecord = await MedicalRecord.findByIdAndDelete(id).lean();
    if (!deletedRecord) {
      return res.status(404).json({ message: "Medical record not found." });
    }

    return res.status(200).json({ message: "Medical record deleted successfully." });
  } catch (error) {
    console.error("Delete Medical Record Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
