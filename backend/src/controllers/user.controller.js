import bcrypt from 'bcrypt';
import User from '../models/users.model.js';

const SALT_ROUNDS = 10;

export const authMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'oldPassword, newPassword and confirmPassword are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match.' });
    }

    const user = await User.findById(req.user._id).select('+password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const passwordCorrect = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordCorrect) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.findByIdAndUpdate(user._id, { password_hash: hashedNewPassword });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getStaffOptions = async (req, res) => {
  try {
    const staffUsers = await User.find({ role: "staff", is_active: true })
      .select("_id full_name username email")
      .sort({ full_name: 1, username: 1 })
      .lean();

    return res.status(200).json({ data: staffUsers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
