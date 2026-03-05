import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    price: Number,
    duration: Number,
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

serviceSchema.index({ name: 'text' });
serviceSchema.index({ status: 1 });
serviceSchema.index({ createdAt: -1 });

export default mongoose.model('Service', serviceSchema);