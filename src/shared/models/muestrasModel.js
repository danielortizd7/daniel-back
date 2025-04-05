const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Finalizada", "Rechazada"];

// Constantes para tipos de muestreo
const TIPOS_MUESTREO = {
    SIMPLE: "Simple",
    COMPUESTO: "Compuesto"
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
        enum: ['potable', 'natural', 'residual', 'otra']
    },
    codigo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    }
});

// Esquema para firmas
const firmaSchema = new mongoose.Schema({
    firma: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    }
});

// Esquema para historial de estados
const historialEstadoSchema = new mongoose.Schema({
    estado: {
        type: String,
        required: true,
        enum: ['Recibida', 'En análisis','Finalizada', 'Rechazada']
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

    // 2. Documento del cliente
    documento: {
        type: String,
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
        cedulaAdministrador: {
            type: String,
            required: true
        },
        firmaAdministrador: {
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
        },
        fechaFirmaAdministrador: {
            type: Date,
            required: true
        },
        fechaFirmaCliente: {
            type: Date,
            required: true
        }
    },
    historial: [historialEstadoSchema],
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    actualizadoPor: [actualizacionSchema]
}, {
    timestamps: true
});

// Modelos
const Muestra = mongoose.models.Muestra || mongoose.model('Muestra', muestraSchema, 'muestras');
const TipoAgua = mongoose.models.TipoAgua || mongoose.model('TipoAgua', tipoAguaSchema, 'tipos_agua');

module.exports = {
    Muestra,
    TipoAgua,
    estadosValidos,
    TIPOS_MUESTREO
};