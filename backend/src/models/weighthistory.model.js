import mongoose from 'mongoose';

const weightHistorySchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  weight: { type: Number, required: true },
  measurement_date: { type: Date, required: true },
  notes: String,
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('WeightHistory', weightHistorySchema);
