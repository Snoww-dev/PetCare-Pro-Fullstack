import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  record_type: {
    type: String,
    enum: ['vaccination', 'checkup', 'surgery', 'treatment', 'other']
  },
  title: String,
  description: String,
  diagnosis: String,
  treatment: String,
  medications: String,
  vet_name: String,
  clinic_name: String,
  next_visit_date: Date,
  attachment_url: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);
