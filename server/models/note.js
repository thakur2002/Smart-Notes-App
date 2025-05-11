const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true, unique: true },
  content: String,
  summary: String,
  keywords: [String],
  tag: { type: String, enum: ['work', 'personal', 'research'], default: 'personal' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Note', noteSchema);
