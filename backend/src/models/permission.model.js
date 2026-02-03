import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('Permission', permissionSchema);