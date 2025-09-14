const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const monedaSchema = new Schema({
  nombre: { type: String, required: true, unique: true },
  iso3: { type: String, required: true, unique: true, uppercase: true, maxlength: 3 }
}, { timestamps: true });

module.exports = mongoose.model('Moneda', monedaSchema);