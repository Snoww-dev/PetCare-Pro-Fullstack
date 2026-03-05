import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  pet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  appointment_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, {
  timestamps: true
});

appointmentSchema.index({ appointment_date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ pet_id: 1 });

export default mongoose.model('Appointment', appointmentSchema);
