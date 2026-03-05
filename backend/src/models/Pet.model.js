import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  pet_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetType',
    required: true
  },
  breed_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetBreed',
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetOwner',
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  birth_date: Date,
  color: String,
  weight: Number,
  avatar_url: String,
  health_status: {
    type: String,
    enum: ['healthy', 'sick', 'recovering', 'unknown'],
    default: 'unknown'
  },
  notes: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true
});

petSchema.index({ name: 'text' });
petSchema.index({ owner_id: 1 });
petSchema.index({ pet_type_id: 1 });
petSchema.index({ breed_id: 1 });
petSchema.index({ createdAt: -1 });

export default mongoose.model('Pet', petSchema);
