const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Finalizada", "Rechazada"];

// Constantes para tipos de muestreo
const TIPOS_MUESTREO = {
    SIMPLE: "Simple",
    COMPUESTO: "Compuesto"
};

// Constantes para validación
const TIPOS_AGUA = {
    POTABLE: 'potable',
    NATURAL: 'natural',
    RESIDUAL: 'residual',
    OTRA: 'otra'
};

const SUBTIPOS_RESIDUAL = {
    DOMESTICA: 'domestica',
    NO_DOMESTICA: 'no domestica'
};

const ESTADOS = {
    RECIBIDA: 'Recibida',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    RECHAZADA: 'Rechazada'
};

// Esquema para resultados de análisis
const resultadoAnalisisSchema = new mongoose.Schema({
    valor: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    unidad: {
        type: String,
        required: true
    }
});

// Esquema para tipos de agua
const tipoAguaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        enum: Object.values(TIPOS_AGUA)
    },
    codigo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    subtipoResidual: {
        type: String,
        enum: Object.values(SUBTIPOS_RESIDUAL),
        required: function() {
            return this.tipo === TIPOS_AGUA.RESIDUAL;
        }
    }
});

// Esquema para datos de usuario
const datosUsuarioSchema = new mongoose.Schema({
    documento: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    email: String,
    telefono: String,
    direccion: String
}, { _id: false });

// Esquema para las firmas
const firmasSchema = new mongoose.Schema({
    administrador: {
        type: datosUsuarioSchema,
        required: true
    },
    cliente: {
        type: datosUsuarioSchema,
        required: true
    },
    fechaFirmaAdministrador: {
        type: Date,
        required: true
    },
    firmaAdministrador: {
        type: String,
        required: true
    },
    fechaFirmaCliente: {
        type: Date,
        required: true
    },
    firmaCliente: {
        type: String,
        required: true
    }
}, { _id: false });

// Esquema para historial de estados
const historialEstadoSchema = new mongoose.Schema({
    estado: {
        type: String,
        required: true,
        enum: ['Recibida', 'En análisis','Finalizada', 'Rechazada']
    },
    administrador: {
        type: datosUsuarioSchema,
        required: true
    },
    fechaCambio: {
        type: Date,
        required: true
    },
    observaciones: {
        type: String
    }
});

// Esquema para rechazo de muestra
const rechazoSchema = new mongoose.Schema({
    rechazada: {
        type: Boolean,
        default: false
    },
    motivo: {
        type: String
    },
    fechaRechazo: {
        type: Date
    }
});

// Esquema para actualizaciones
const actualizacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    accion: {
        type: String,
        required: true
    }
});

// Esquema principal de muestra
const muestraSchema = new mongoose.Schema({
    // 1. ID único generado automáticamente
    id_muestra: {
        type: String,
        required: true,
        unique: true
    },

    // 2. Datos del cliente
    cliente: {
        type: datosUsuarioSchema,
        required: true
    },
    
    // 3. Tipo de Agua
    tipoDeAgua: {
        type: tipoAguaSchema,
        required: true
    },
    
    // 4. Tipo de Muestreo
    tipoMuestreo: {
        type: String,
        required: true,
        enum: Object.values(TIPOS_MUESTREO),
        default: TIPOS_MUESTREO.SIMPLE
    },

    // 5. Lugar de Muestreo
    lugarMuestreo: {
        type: String,
        required: true
    },
    
    // 6. Fecha y Hora de Muestreo
    fechaHoraMuestreo: {
        type: Date,
        required: true
    },
    
    // 7. Tipo de Análisis
    tipoAnalisis: {
        type: String,
        required: true,
        enum: ['Fisicoquímico', 'Microbiológico']
    },
    
    // 8. Identificación proporcionada por el cliente
    identificacionMuestra: {
        type: String,
        required: true
    },

    
    
    // 9. Plan de muestreo
    planMuestreo: {
        type: String,
        required: true
    },
    
    // 10. Condiciones ambientales
    condicionesAmbientales: {
        type: String,
        required: true
    },
    
    // 11. Preservación de la muestra
    preservacionMuestra: {
        type: String,
        required: true,
        enum: ['Refrigeración', 'Congelación', 'Acidificación', 'Otra']
    },
    preservacionOtra: {
        type: String,
        required: function() {
            return this.preservacionMuestra === 'Otra';
        }
    },
    
    // 12. Análisis seleccionados
    analisisSeleccionados: [{
        type: String,
        required: true
    }],
    
    // 13. Estado y rechazo
    estado: {
        type: String,
        required: true,
        enum: ['Recibida', 'En análisis', 'Finalizada', 'Rechazada'],
        default: 'Recibida'
    },
    rechazoMuestra: {
        rechazada: {
            type: Boolean,
            default: false
        },
        motivo: String,
        fechaRechazo: Date
    },

    // Campos adicionales
    observaciones: {
        type: String
    },
    firmas: {
        type: firmasSchema,
        required: true
    },
    historial: [historialEstadoSchema],
    creadoPor: {
        type: datosUsuarioSchema,
        required: true
    },
    actualizadoPor: [{
        usuario: {
            type: datosUsuarioSchema,
            required: true
        },
        fecha: {
            type: Date,
            required: true
        },
        accion: {
            type: String,
            required: true
        }
    }],
    laboratorista: {
        type: datosUsuarioSchema
    }
}, {
    timestamps: true
});

// Modelos
const Muestra = mongoose.models.Muestra || mongoose.model('Muestra', muestraSchema, 'muestras');
const TipoAgua = mongoose.models.TipoAgua || mongoose.model('TipoAgua', tipoAguaSchema, 'tipos_agua');

module.exports = {
    Muestra,
    TipoAgua,
    TIPOS_AGUA,
    SUBTIPOS_RESIDUAL,
    ESTADOS,
    estadosValidos,
    TIPOS_MUESTREO
};