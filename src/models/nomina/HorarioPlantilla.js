// models/nomina/HorarioPlantilla.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const turnoDiaSchema = new Schema({
  dia_semana: { type: Number, required: true }, // 0=Domingo a 6=Sábado
  inicio: { type: String, required: true },     // "HH:mm" -> "08:00"
  fin: { type: String, required: true },        // "HH:mm" -> "17:00"
  descanso_min: { type: Number, default: 60 }
}, { _id: false }); // No necesitamos IDs para los turnos individuales

const horarioPlantillaSchema = new Schema({
  nombre_plantilla: { type: String, required: true, unique: true },
  descripcion: { type: String },
  turnos: [turnoDiaSchema],
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('HorarioPlantilla', horarioPlantillaSchema);