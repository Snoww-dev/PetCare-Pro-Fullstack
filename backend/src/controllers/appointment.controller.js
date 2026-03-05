import mongoose from "mongoose";
import Appointment from "../models/appointments.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const VALID_STATUS = ["pending", "completed", "cancelled"];

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createAppointment = async (req, res) => {
  try {
    const { pet_id, service_id, appointment_date, staff_id } = req.body;

    if (!pet_id || !service_id || !appointment_date) {
      return res.status(400).json({ message: "pet_id, service_id and appointment_date are required." });
    }
    if (!isValidObjectId(pet_id) || !isValidObjectId(service_id)) {
      return res.status(400).json({ message: "Invalid pet_id or service_id." });
    }
    if (staff_id && !isValidObjectId(staff_id)) {
      return res.status(400).json({ message: "Invalid staff_id." });
    }

    const appointmentDate = new Date(appointment_date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment_date." });
    }

    if (staff_id) {
      const existingAppointment = await Appointment.findOne({
        appointment_date: appointmentDate,
        staff_id,
      }).lean();
      if (existingAppointment) {
        return res.status(400).json({ message: "Staff already has an appointment at this time." });
      }
    }

    const newAppointment = await Appointment.create({
      pet_id,
      service_id,
      appointment_date: appointmentDate,
      staff_id: staff_id || null,
    });

    return res.status(201).json({
      message: "Appointment created successfully.",
      appointment: newAppointment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "date is required." });
    }

    const selectedDate = new Date(date);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date." });
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      appointment_date: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ appointment_date: 1 })
      .populate("pet_id")
      .populate("service_id")
      .populate("staff_id")
      .lean();

    return res.status(200).json({ data: appointments });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { status, pet_id, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;

    const filter = {};
    if (status && VALID_STATUS.includes(status)) {
      filter.status = status;
    }
    if (pet_id) {
      if (!isValidObjectId(pet_id)) {
        return res.status(400).json({ message: "Invalid pet_id." });
      }
      filter.pet_id = pet_id;
    }

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("pet_id")
        .populate("service_id")
        .populate("staff_id")
        .sort({ appointment_date: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.status(200).json({
      data: appointments,
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

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id." });
    }
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.status(200).json({
      message: "Appointment status updated successfully.",
      appointment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
