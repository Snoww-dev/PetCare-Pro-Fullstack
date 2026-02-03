import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  full_name: String,
  phone: String,
  address: String,
  is_active: { type: Boolean, default: true },
  last_login: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);