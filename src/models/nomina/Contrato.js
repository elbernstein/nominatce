// models/nomina/Contrato.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contratoSchema = new Schema({
  // El 'empleado' es ahora opcional. Un contrato sin empleado
  // se considera un "Contrato Maestro" o una plantilla.
  // Cuando se asigne a una persona, este campo se llenará.
  empleado: { 
    type: Schema.Types.ObjectId, 
    ref: 'Empleado', 
    required: false // <-- CAMBIO CLAVE
  },
  
  tipo: { 
    type: String, 
    enum: ['FIJO','INDEFINIDO','POR_HORAS'], 
    required: true 
  },
  
  // Para diferenciar una plantilla de un contrato ya asignado.
  // Será útil para filtrar en el futuro.
  esMaestro: {
    type: Boolean,
    default: true
  },

  salario_base_mensual: { type: Number, default: 0 },
  salario_por_hora: { type: Number, default: 0 },

  periodicidad: { 
    type: String, 
    enum: ['MENSUAL','QUINCENAL','SEMANAL'], 
    default: 'MENSUAL' 
  },
  
  // Las fechas de inicio y fin también son opcionales en una plantilla maestra.
  // Se establecerán cuando se asigne el contrato a un empleado.
  inicio: { 
    type: Date, 
    required: false // <-- CAMBIO CLAVE
  },

  fin: { type: Date },

  activo: { type: Boolean, default: true },

}, { timestamps: true });

// Este índice sigue siendo útil para buscar rápidamente los contratos
// activos de un empleado específico.
contratoSchema.index({ empleado: 1, activo: 1 });

module.exports = mongoose.model('Contrato', contratoSchema);