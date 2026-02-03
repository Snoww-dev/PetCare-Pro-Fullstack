import mongoose from 'mongoose';

const petBreedSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pet_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PetType', required: true },
});

export default mongoose.model('PetBreed', petBreedSchema);
