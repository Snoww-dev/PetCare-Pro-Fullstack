import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  appointment_at: { type: Date, required: true },
  appointment_type: {
    type: String,
    enum: ['vaccination', 'grooming', 'checkup', 'surgery', 'other']
  },
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  location: String,
  notes: String,
  reminder_sent: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);
