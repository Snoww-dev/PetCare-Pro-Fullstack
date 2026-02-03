import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('Role', roleSchema);