import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  videoId: {
    type: Number, // formatted like '001', '002'
    required: true,
    unique: true,
  },
  filename: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.Video || mongoose.model('Video', VideoSchema);
