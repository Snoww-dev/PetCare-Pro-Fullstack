import mongoose from 'mongoose';

const feedingScheduleSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  food_type: { type: String, required: true },
  portion_size: String,
  feeding_times: [String],
  special_instructions: String,
  start_date: { type: Date, required: true },
  end_date: Date,
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

export default mongoose.model('FeedingSchedule', feedingScheduleSchema);
