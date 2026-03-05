import mongoose from "mongoose";

const vaccinationSchema = new mongoose.Schema({
    pet_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    vaccine_name: {
        type: String,
        required: true
    },
    vaccination_date: Date,
    next_due_date: Date,
    veterinarian: String,
    notes: String
}, {
    timestamps: true
});

export default mongoose.model('Vaccination', vaccinationSchema);