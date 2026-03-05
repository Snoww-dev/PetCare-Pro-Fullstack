import mongoose from 'mongoose';

const petTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
}, {
  timestamps: true
});

export default mongoose.model('PetType', petTypeSchema);
