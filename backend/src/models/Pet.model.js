import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pet_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PetType', required: true },
  breed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PetBreed', required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  birth_date: Date,
  color: String,
  weight: Number,
  avatar_url: String,
  health_status: String,
  notes: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

export default mongoose.model('Pet', petSchema);