import mongoose from "mongoose";

const petOwnerSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true
  },
  phone: String,
  email: String,
  address: String,
  notes: String,
}, {
  timestamps: true
});

petOwnerSchema.index({ full_name: "text", phone: "text", email: "text", address: "text" });

export default mongoose.model('PetOwner', petOwnerSchema);
