import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  file_name: { type: String, required: true },
  file_url: { type: String, required: true },
  file_type: String,
  file_size: Number,
  description: String,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploaded_at: { type: Date, default: Date.now }
});

export default mongoose.model('Attachment', attachmentSchema);
