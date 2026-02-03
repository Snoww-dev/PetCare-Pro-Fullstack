import mongoose from 'mongoose';

const petTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
});

export default mongoose.model('PetType', petTypeSchema);
