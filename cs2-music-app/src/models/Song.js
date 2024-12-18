import { Schema, model, models } from 'mongoose';

const SongSchema = new Schema({
  source: { type: String, required: true },
  mapName: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String },
  url: { type: String, required: true },
  preview_url: { type: String },
  likes: { type: Number, default: 0 }
}, { timestamps: true });

SongSchema.index({ source: 1, mapName: 1 });

const Song = models.Song || model('Song', SongSchema);

export default Song;
