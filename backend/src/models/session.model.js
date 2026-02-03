import mongoose from "mongoose";
const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, require: true } // Session expires after 14 days
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // 14 days

export default mongoose.model('Session', sessionSchema);