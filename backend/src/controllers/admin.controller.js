import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/users.model.js";
import Session from "../models/session.model.js";

const SALT_ROUNDS = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const VALID_ROLES = ["admin", "staff"];
const SAFE_USER_FIELDS =
  "username email full_name phone address role is_active last_login createdAt updatedAt";
const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "username",
  "email",
  "role",
  "last_login",
  "is_active",
]);

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
};

const toSafeUser = (userDoc) => {
  if (!userDoc) return null;
  return {
    id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    full_name: userDoc.full_name,
    phone: userDoc.phone,
    address: userDoc.address,
    role: userDoc.role,
    is_active: userDoc.is_active,
    last_login: userDoc.last_login,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
};

const buildUpsertPayload = (payload = {}, options = {}) => {
  const { includePassword = false } = options;
  const result = {};

  if (typeof payload.username === "string") {
    result.username = payload.username.trim();
  }
  if (typeof payload.email === "string") {
    result.email = payload.email.trim().toLowerCase();
  }
  if (typeof payload.full_name === "string") {
    result.full_name = payload.full_name.trim();
  }
  if (typeof payload.phone === "string") {
    result.phone = payload.phone.trim();
  }
  if (typeof payload.address === "string") {
    result.address = payload.address.trim();
  }
  if (typeof payload.role === "string") {
    result.role = payload.role.trim();
  }
  if ("is_active" in payload) {
    const status = parseBoolean(payload.is_active);
    if (status !== null) {
      result.is_active = status;
    }
  }
  if (includePassword && typeof payload.password === "string") {
    result.password = payload.password;
  }

  return result;
};

export const getAllUsers = async (req, res) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      username,
      email,
      full_name,
      phone,
      address,
      role,
      is_active,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, toInt(page, DEFAULT_PAGE));
    const pageSize = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, DEFAULT_LIMIT)));
    const skip = (currentPage - 1) * pageSize;

    const sortField = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const filter = {};

    if (VALID_ROLES.includes(role)) {
      filter.role = role;
    }

    const activeStatus = parseBoolean(is_active);
    if (activeStatus !== null) {
      filter.is_active = activeStatus;
    }

    const normalizedUsername = normalizeText(username);
    const normalizedEmail = normalizeText(email);
    const normalizedFullName = normalizeText(full_name);
    const normalizedPhone = normalizeText(phone);
    const normalizedAddress = normalizeText(address);
    const normalizedSearch = normalizeText(search);

    if (normalizedUsername) {
      filter.username = { $regex: escapeRegex(normalizedUsername), $options: "i" };
    }
    if (normalizedEmail) {
      filter.email = { $regex: escapeRegex(normalizedEmail), $options: "i" };
    }
    if (normalizedFullName) {
      filter.full_name = { $regex: escapeRegex(normalizedFullName), $options: "i" };
    }
    if (normalizedPhone) {
      filter.phone = { $regex: escapeRegex(normalizedPhone), $options: "i" };
    }
    if (normalizedAddress) {
      filter.address = { $regex: escapeRegex(normalizedAddress), $options: "i" };
    }

    if (normalizedSearch) {
      const searchRegex = { $regex: escapeRegex(normalizedSearch), $options: "i" };
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { full_name: searchRegex },
        { phone: searchRegex },
        { address: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(SAFE_USER_FIELDS)
        .sort({ [sortField]: sortDirection, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.status(200).json({
      data: users,
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

export const createUser = async (req, res) => {
  try {
    const payload = buildUpsertPayload(req.body, { includePassword: true });

    if (!payload.username || !payload.email || !payload.password) {
      return res.status(400).json({ message: "Username, email and password are required." });
    }

    if (payload.password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (payload.role && !VALID_ROLES.includes(payload.role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: payload.email }, { username: payload.username }],
    })
      .select("email username")
      .lean();

    if (existingUser) {
      const conflictField =
        existingUser.email === payload.email ? "Email already exists." : "Username already exists.";
      return res.status(400).json({ message: conflictField });
    }

    const password_hash = await bcrypt.hash(payload.password, SALT_ROUNDS);

    const newUser = await User.create({
      username: payload.username,
      email: payload.email,
      password_hash,
      full_name: payload.full_name || "",
      phone: payload.phone || "",
      address: payload.address || "",
      role: payload.role || "staff",
      is_active: typeof payload.is_active === "boolean" ? payload.is_active : true,
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: toSafeUser(newUser),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Email or username already exists." });
    }
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const payload = buildUpsertPayload(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    if (payload.role && !VALID_ROLES.includes(payload.role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (payload.email || payload.username) {
      const duplicateChecks = [];
      if (payload.email) duplicateChecks.push({ email: payload.email });
      if (payload.username) duplicateChecks.push({ username: payload.username });

      const duplicatedUser = await User.findOne({
        _id: { $ne: userId },
        $or: duplicateChecks,
      })
        .select("email username")
        .lean();

      if (duplicatedUser) {
        const conflict =
          duplicatedUser.email === payload.email ? "Email already exists." : "Username already exists.";
        return res.status(400).json({ message: conflict });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: payload },
      { new: true, runValidators: true }
    )
      .select(SAFE_USER_FIELDS)
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User updated successfully.",
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Email or username already exists." });
    }
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const setUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const status = parseBoolean(req.body?.is_active);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (status === null) {
      return res.status(400).json({ message: "is_active must be true or false." });
    }

    if (String(req.user?._id) === String(userId) && status === false) {
      return res.status(400).json({ message: "You cannot deactivate your own account." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { is_active: status } },
      { new: true, runValidators: true }
    )
      .select(SAFE_USER_FIELDS)
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (status === false) {
      await Session.deleteMany({ userId });
    }

    return res.status(200).json({
      message: `User ${status ? "activated" : "deactivated"} successfully.`,
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    if (String(req.user?._id) === String(userId)) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const deletedUser = await User.findByIdAndDelete(userId).select("username").lean();
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
