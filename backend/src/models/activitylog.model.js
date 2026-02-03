import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  activity_date: { type: Date, required: true },
  activity_type: { type: String, required: true },
  duration_minutes: Number,
  description: String,
  notes: String,
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recorded_at: { type: Date, default: Date.now }
});

export default mongoose.model('ActivityLog', activityLogSchema);
