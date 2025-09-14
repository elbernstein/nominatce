const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paisSchema = new Schema({
  nombre: { type: String, required: true, unique: true },
  iso2: { type: String, required: true, unique: true, uppercase: true, maxlength: 2 }
}, { timestamps: true });

module.exports = mongoose.model('Pais', paisSchema);