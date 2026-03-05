import mongoose from "mongoose";
import Service from "../models/services.model.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Service name is required." });
    }
    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ message: "price must be >= 0." });
    }
    if (duration !== undefined && Number(duration) <= 0) {
      return res.status(400).json({ message: "duration must be > 0." });
    }

    const newService = await Service.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      price: price !== undefined ? Number(price) : 0,
      duration: duration !== undefined ? Number(duration) : 0,
    });

    return res.status(201).json({
      message: "Service created successfully.",
      service: newService,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Service name already exists." });
    }
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getServices = async (req, res) => {
  try {
    const { search, status, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    }
    if (status === "true" || status === "false") {
      filter.status = status === "true";
    }

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const [services, total] = await Promise.all([
      Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Service.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.status(200).json({
      data: services,
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

export const getServiceById = async (req, res) => {
  try {
    const serviceId = req.params.id;
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ message: "Invalid service id." });
    }

    const service = await Service.findById(serviceId).lean();
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    return res.status(200).json({ service });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ message: "Invalid service id." });
    }

    const { name, description, price, duration, status } = req.body;
    const payload = {};

    if (typeof name === "string") payload.name = name.trim();
    if (typeof description === "string") payload.description = description.trim();
    if (price !== undefined) payload.price = Number(price);
    if (duration !== undefined) payload.duration = Number(duration);
    if (status !== undefined) payload.status = Boolean(status);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }
    if (payload.price !== undefined && payload.price < 0) {
      return res.status(400).json({ message: "price must be >= 0." });
    }
    if (payload.duration !== undefined && payload.duration <= 0) {
      return res.status(400).json({ message: "duration must be > 0." });
    }

    const service = await Service.findByIdAndUpdate(
      serviceId,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    return res.status(200).json({
      message: "Service updated successfully.",
      service,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Service name already exists." });
    }
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ message: "Invalid service id." });
    }

    const deletedService = await Service.findByIdAndDelete(serviceId).lean();
    if (!deletedService) {
      return res.status(404).json({ message: "Service not found." });
    }

    return res.status(200).json({ message: "Service deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const toggleServiceStatus = async (req, res) => {
  try {
    const serviceId = req.params.id;
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ message: "Invalid service id." });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    service.status = !service.status;
    await service.save();

    return res.status(200).json({
      message: `Service has been ${service.status ? "activated" : "deactivated"}.`,
      service,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
