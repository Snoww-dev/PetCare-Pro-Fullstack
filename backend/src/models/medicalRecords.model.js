import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema({
    pet_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    diagnosis: String,
    treatment: String,
    doctor_name: String,
    visit_date: {
        type: Date,
        required: true
    },
    weight: Number,
    temperature: Number,
    notes: String
}, {
    timestamps: true
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);