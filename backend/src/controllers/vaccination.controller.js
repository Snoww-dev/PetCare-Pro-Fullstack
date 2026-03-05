import mongoose from "mongoose";
import Vaccination from "../models/vaccinations.model.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createVaccination = async (req, res) => {
  try {
    const { pet_id, vaccine_name, vaccination_date, next_due_date, veterinarian, notes } = req.body;

    if (!pet_id || !vaccine_name) {
      return res.status(400).json({ message: "pet_id and vaccine_name are required." });
    }
    if (!isValidObjectId(pet_id)) {
      return res.status(400).json({ message: "Invalid pet_id." });
    }

    const payload = {
      pet_id,
      vaccine_name: vaccine_name.trim(),
      veterinarian: typeof veterinarian === "string" ? veterinarian.trim() : "",
      notes: typeof notes === "string" ? notes.trim() : "",
    };

    if (vaccination_date) {
      const vaccinationDate = new Date(vaccination_date);
      if (Number.isNaN(vaccinationDate.getTime())) {
        return res.status(400).json({ message: "Invalid vaccination_date." });
      }
      payload.vaccination_date = vaccinationDate;
    }

    if (next_due_date) {
      const nextDueDate = new Date(next_due_date);
      if (Number.isNaN(nextDueDate.getTime())) {
        return res.status(400).json({ message: "Invalid next_due_date." });
      }
      payload.next_due_date = nextDueDate;
    }

    const savedVaccination = await Vaccination.create(payload);

    return res.status(201).json({
      message: "Vaccination created successfully.",
      vaccination: savedVaccination,
    });
  } catch (error) {
    console.error("Create Vaccination Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getVaccinationsByPet = async (req, res) => {
  try {
    const { pet_id } = req.params;
    if (!isValidObjectId(pet_id)) {
      return res.status(400).json({ message: "Invalid pet_id." });
    }

    const vaccinations = await Vaccination.find({ pet_id })
      .populate("pet_id", "name owner_id")
      .sort({ vaccination_date: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      data: vaccinations,
      total: vaccinations.length,
    });
  } catch (error) {
    console.error("Get Vaccinations By Pet Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
