// src/models/nomina/Cargos.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cargoSchema = new Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String },
  nivel_jerarquico: { type: Number, default: 1 },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Cargos', cargoSchema);