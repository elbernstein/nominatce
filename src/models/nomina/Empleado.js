// models/nomina/Empleado.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definimos la estructura del turno una vez para reutilizarla
const turnoSchema = new Schema({
    dia_semana: { type: Number, required: true }, // 0=Domingo a 6=Sábado
    inicio: { type: String, required: true },     // "HH:mm" -> "08:00"
    fin: { type: String, required: true },        // "HH:mm" -> "17:00"
    descanso_min: { type: Number, default: 60 }
}, { _id: false }); // No necesitamos IDs para los turnos individuales

const empleadoSchema = new Schema({
  sector: { 
    type: Schema.Types.ObjectId, 
    ref: 'Sector', 
    required: true 
  },
  cargo:  { 
    type: Schema.Types.ObjectId, 
    ref: 'Cargos', 
    required: true 
  },
  nombres: { 
    type: String, 
    required: true 
  },
  apellidos: { 
    type: String, 
    required: true 
  },
  documento: { 
    type: String, 
    required: true 
  },
  correo: { 
    type: String 
  },
  telefono: { 
    type: String 
  },
  fecha_ingreso: { 
    type: Date, 
    required: true 
  },
  estado: { 
    type: String, 
    enum: ['ACTIVO','INACTIVO'], 
    default: 'ACTIVO' 
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  contrato: {
    type: Schema.Types.ObjectId,
    ref: 'Contrato',
    required: false
  },
  // ===================== NUEVOS CAMPOS PARA HORARIOS =====================
  // Guarda la referencia a una plantilla de horario reutilizable.
  // La mayoría de los empleados usarán esto.
  horario_plantilla: {
    type: Schema.Types.ObjectId,
    ref: 'HorarioPlantilla',
    required: false
  },

  // Campo para empleados con un horario único que no existe como plantilla.
  // Si este campo tiene datos, el sistema debe ignorar 'horario_plantilla'.
  horario_personalizado: {
    type: [turnoSchema], // Es un array de turnos
    default: undefined   // Importante para que Mongoose no cree un array vacío por defecto
  }
  // =======================================================================
}, { timestamps: true });

// Índice para asegurar que no haya empleados duplicados en el mismo sector
empleadoSchema.index({ sector: 1, documento: 1 }, { unique: true });

// Índice para asegurar que un 'User' del sistema solo pueda ser asignado a un 'Empleado'
empleadoSchema.index(
  { usuario: 1 },
  { unique: true, partialFilterExpression: { usuario: { $type: 'objectId' } } }
);

module.exports = mongoose.model('Empleado', empleadoSchema);