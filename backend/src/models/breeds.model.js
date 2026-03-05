import mongoose from "mongoose";

const petOwnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pet_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PetType', required: true },
}, {
    timestamps: true
});

export default mongoose.model('PetBreed', petOwnerSchema);