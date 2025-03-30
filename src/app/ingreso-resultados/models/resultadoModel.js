const mongoose = require("mongoose");

const valorCambioSchema = new mongoose.Schema({
  valorAnterior: {
    type: String,
    required: true
  },
  valorNuevo: {
    type: String,
    required: true
  },
  unidad: {
    type: String
  }
}, { _id: false });

const cambiosRealizadosSchema = new mongoose.Schema({
  pH: {
    type: valorCambioSchema,
    required: false
  },
  turbidez: {
    type: valorCambioSchema,
    required: false
  },
  oxigenoDisuelto: {
    type: valorCambioSchema,
    required: false
  },
  nitratos: {
    type: valorCambioSchema,
    required: false
  },
  solidosSuspendidos: {
    type: valorCambioSchema,
    required: false
  },
  fosfatos: {
    type: valorCambioSchema,
    required: false
  },
  observaciones: {
    type: {
      valorAnterior: {
        type: String,
        required: true
      },
      valorNuevo: {
        type: String,
        required: true
      }
    },
    required: false
  }
}, { _id: false });

const resultadoSchema = new mongoose.Schema(
  {
    idMuestra: {
      type: String,
      required: true,
      trim: true
    },
    documento: {
      type: String,
      required: true,
      trim: true
    },
    fechaHora: {
      type: Date,
      required: true
    },
    tipoMuestreo: {
      type: String,
      required: true
    },
    pH: {
      valor: {
        type: String,
        trim: true
      },
      unidad: {
        type: String,
        default: "mv"
      }
    },
    turbidez: {
      valor: {
        type: String,
        trim: true
      },
      unidad: {
        type: String,
        default: "NTU"
      }
    },
    oxigenoDisuelto: {
      valor: {
        type: String,
        trim: true
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    nitratos: {
      valor: {
        type: String,
        trim: true
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    solidosSuspendidos: {
      valor: {
        type: String,
        trim: true
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    fosfatos: {
      valor: {
        type: String,
        trim: true
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    observaciones: {
      type: String,
      trim: true
    },
    verificado: {
      type: Boolean,
      default: false
    },
    cedulaLaboratorista: {
      type: String,
      required: true
    },
    nombreLaboratorista: {
      type: String,
      required: true
    },
    historialCambios: [{
      nombre: {
        type: String,
        required: true
      },
      cedula: {
        type: String,
        required: true
      },
      fecha: {
        type: Date,
        default: Date.now
      },
      cambiosRealizados: {
        type: cambiosRealizadosSchema,
        required: false,
        default: {}
      }
    }]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para mejorar el rendimiento de las consultas
resultadoSchema.index({ idMuestra: 1 });
resultadoSchema.index({ documento: 1 });
resultadoSchema.index({ fechaHora: -1 });

module.exports = mongoose.model("Resultado", resultadoSchema);
