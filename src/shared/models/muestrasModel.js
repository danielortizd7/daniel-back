const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];

// Esquema de Firmas
const firmasSchema = new mongoose.Schema({
    cedulaLaboratorista: {
        type: String,
        required: true
    },
    firmaLaboratorista: {
        type: String,
        required: true
    },
    cedulaCliente: {
        type: String,
        required: true
    },
    firmaCliente: {
        type: String,
        required: true
    }
});

// Esquema de Tipos de Agua
const tipoAguaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        unique: true
    },
    descripcion: {
        type: String,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Esquema de Muestras
const muestraSchema = new mongoose.Schema(
  {
    id_muestra: {
      type: String,
      unique: true,
      sparse: true
    },
    documento: { 
      type: String, 
      required: true,
      immutable: true
    },
    tipoMuestra: {
      type: String,
      enum: ['Agua', 'Suelo'],
      required: true
    },
    tipoMuestreo: { 
      type: String,
      enum: ['Simple', 'Compuesto'],
      required: true 
    },
    fechaHora: { 
      type: Date, 
      required: true,
      default: Date.now,
      immutable: true
    },
    lugarMuestreo: {
      type: String,
      required: true
    },
    planMuestreo: {
      type: String,
      default: ''
    },
    condicionesAmbientales: {
      type: String,
      default: ''
    },
    preservacionMuestra: {
      type: String,
      enum: ['Refrigeración', 'Congelación', 'Temperatura Ambiente'],
      default: 'Temperatura Ambiente'
    },
    identificacionMuestra: {
      type: String,
      default: ''
    },
    analisisSeleccionados: { 
      type: [String], 
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Debe seleccionar al menos un análisis'
      }
    },
    tipoDeAgua: {
      tipo: {
        type: String,
        enum: ['potable', 'natural', 'residual', 'otra'],
        required: function() {
          return this.tipoMuestra === 'Agua';
        }
      },
      tipoPersonalizado: String,
      descripcion: String
    },
    estado: {
      type: String,
      enum: estadosValidos,
      default: 'Recibida'
    },
    historial: [{
      estado: {
        type: String,
        enum: estadosValidos,
        required: true
      },
      cedulaadministrador: {
        type: String,
        required: true
      },
      nombreadministrador: {
        type: String,
        required: true
      },
      fechaCambio: {
        type: Date,
        default: Date.now
      },
      observaciones: String
    }],
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    actualizadoPor: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
      },
      nombre: String,
      fecha: {
        type: Date,
        default: Date.now
      },
      accion: String
    }],
    firmas: {
      type: firmasSchema,
      required: false // Inicialmente no es requerido, se puede agregar después
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware para generar el id_muestra antes de guardar
muestraSchema.pre('save', async function(next) {
    if (!this.id_muestra) {
        try {
            const count = await mongoose.model('Muestra').countDocuments();
            this.id_muestra = `MUESTRA-H${(count + 111).toString()}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Crear los modelos
const Muestra = mongoose.models.Muestra || mongoose.model("Muestra", muestraSchema, "muestras");
const TipoAgua = mongoose.models.TipoAgua || mongoose.model('TipoAgua', tipoAguaSchema, 'tipos_agua');

module.exports = {
    Muestra,
    TipoAgua,
    estadosValidos
};