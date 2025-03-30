const mongoose = require("mongoose");
const { PERMISOS } = require("../../../shared/config/rolesConfig");

const auditoriaSchema = new mongoose.Schema(
  {
    usuario: {
      id: String,
      nombre: String,
      rol: String,
      documento: String,
      permisos: [{
        type: String,
        enum: Object.values(PERMISOS)
      }]
    },
    accion: {
      tipo: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        required: true
      },
      ruta: {
        type: String,
        required: true
      },
      descripcion: String,
      permisosRequeridos: [{
        type: String,
        enum: Object.values(PERMISOS)
      }]
    },
    detalles: {
      idMuestra: String,
      cambios: {
        antes: Object,
        despues: Object
      },
      ip: String,
      userAgent: String,
      parametros: Object,
      query: Object
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },
    estado: {
      type: String,
      enum: ['exitoso', 'fallido'],
      default: 'exitoso',
      required: true
    },
    mensaje: String,
    duracion: Number, // Duración de la acción en milisegundos
    error: {
      codigo: String,
      mensaje: String,
      stack: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices para mejorar el rendimiento de las consultas
auditoriaSchema.index({ 'usuario.documento': 1 });
auditoriaSchema.index({ fecha: -1 });
auditoriaSchema.index({ 'accion.ruta': 1 });
auditoriaSchema.index({ estado: 1 });
auditoriaSchema.index({ 'usuario.rol': 1 });
auditoriaSchema.index({ 'accion.tipo': 1 });
auditoriaSchema.index({ 'detalles.idMuestra': 1 });

// Método para limpiar registros antiguos
auditoriaSchema.statics.limpiarRegistrosAntiguos = async function(diasAntiguedad = 30) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
  
  return this.deleteMany({
    fecha: { $lt: fechaLimite }
  });
};

// Método para obtener estadísticas
auditoriaSchema.statics.obtenerEstadisticas = async function(fechaInicio, fechaFin) {
  return this.aggregate([
    {
      $match: {
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin
        }
      }
    },
    {
      $group: {
        _id: {
          rol: '$usuario.rol',
          accion: '$accion.tipo',
          estado: '$estado'
        },
        total: { $sum: 1 },
        duracionPromedio: { $avg: '$duracion' }
      }
    }
  ]);
};

module.exports = mongoose.model("Auditoria", auditoriaSchema); 