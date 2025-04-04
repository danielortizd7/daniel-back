const mongoose = require("mongoose");

// Esquema para los análisis disponibles
const analisisSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    metodo: {
        type: String,
        required: true
    },
    rango: {
        type: String,
        required: true
    },
    matriz: {
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

// Lista predefinida de análisis según la tabla
const analisisDisponibles = {
    fisicoquimico: [
        {
            nombre: "Alcalinidad",
            metodo: "SM2320B",
            rango: "20 a 500 mg/L CaCO3",
            matriz: ["AP"]
        },
        {
            nombre: "Cadmio",
            metodo: "SM3111B",
            rango: "0,050 a 0,2 mg/L Cd",
            matriz: ["AP"]
        },
        {
            nombre: "Cloruros",
            metodo: "SM 4500Cl- B",
            rango: "10 a 500 mg/L Cl-",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Conductividad",
            metodo: "SM 2510 B",
            rango: "10 a 10000 µS/cm",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Demanda biológica de oxígeno (DBO5)",
            metodo: "10360 HACH",
            rango: "6 a 2032 mg/L O2 (Aprox)",
            matriz: ["AS", "ARnD", "ARD"]
        },
        {
            nombre: "Demanda Química de Oxígeno (DQO)",
            metodo: "8000 EPA",
            rango: "20 a 1500 mg/L",
            matriz: ["AS", "ARnD", "ARD"]
        },
        {
            nombre: "Dureza total, dureza calcica, dureza magenesica, calcio y magnesio",
            metodo: "SM 2340 C, SM 3500-CaB y SM 3500-MgB",
            rango: "10 a 500 mg/L CaCO3",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Fluoruros",
            metodo: "10225 HACH",
            rango: "0,05 a 2,00 mg/L F-",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Fosfatos",
            metodo: "Método 4500-P E",
            rango: "0,1 a 2,0 mg/L PO4",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Hierro (UV-VIS)",
            metodo: "8008 HACH",
            rango: "0,02 mg/L Fe a 3,00 mg/L Fe",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Hierro (AA)",
            metodo: "SM3030E - SM311D",
            rango: "0,5 mg/L a 10 mg/L Fe",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Manganeso",
            metodo: "SM3111B",
            rango: "0,1 mg/L a 2 mg/L Mn",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Mercurio",
            metodo: "SM3112B",
            rango: "0,8 a 30 µg/L Hg",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Nitratos",
            metodo: "SM4500-NO3- B",
            rango: "0,5 a 15 mg/L NO3",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Nitritos",
            metodo: "SM4500NO2-B",
            rango: "0,03 a 0,5 mg/L NO2",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Oxígeno Disuelto",
            metodo: "10360 HACH",
            rango: "0,1 a 20 mg/L O2",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "pH",
            metodo: "SM 4500 H+ B",
            rango: "4,0 a 10,0 Und pH",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        },
        {
            nombre: "Solidos sedimentables (Ssed)",
            metodo: "8165 HACH",
            rango: "0 a 1000 mL/L",
            matriz: ["AS", "ARnD", "ARD"]
        },
        {
            nombre: "Solidos suspendidos totales (SST)",
            metodo: "SM2540D",
            rango: "5,0 a 2000 mg/L",
            matriz: ["AS", "ARnD", "ARD"]
        },
        {
            nombre: "Sulfatos",
            metodo: "SM 4500-SO42- E",
            rango: "3 a 40 mg/L SO4",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Turbiedad",
            metodo: "SM2130B",
            rango: "1 a 4000 NTU",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        }
    ],
    microbiologico: [
        {
            nombre: "Coliformes totales y E. coli (Cualitativa)",
            metodo: "Readycult",
            rango: "Presencia/Ausencia",
            matriz: ["AP", "AS"]
        },
        {
            nombre: "Coliformes totales y E. coli (Cuantitativa)",
            metodo: "HACH 10029",
            rango: "0 a 25000 UFC/100mL",
            matriz: ["AP", "AS", "ARnD", "ARD"]
        }
    ]
};

// Mapeo de matrices
const matrizMap = {
    "AP": "Agua Potable",
    "AS": "Agua Superficial",
    "ARnD": "Agua Residual no Doméstica",
    "ARD": "Agua Residual Doméstica"
};

// Función para obtener análisis disponibles por tipo de agua
const getAnalisisPorTipoAgua = (tipoAgua, subtipoResidual = null) => {
    let matrizBuscar;
    switch(tipoAgua) {
        case 'potable':
            matrizBuscar = 'AP';
            break;
        case 'natural':
            matrizBuscar = 'AS';
            break;
        case 'residual':
            matrizBuscar = subtipoResidual === 'domestica' ? 'ARD' : 'ARnD';
            break;
        case 'otra':
            // Para "otra", permitir todos los análisis disponibles
            return {
                fisicoquimico: analisisDisponibles.fisicoquimico,
                microbiologico: analisisDisponibles.microbiologico
            };
        default:
            return {
                fisicoquimico: [],
                microbiologico: []
            };
    }

    const analisis = {
        fisicoquimico: analisisDisponibles.fisicoquimico.filter(a => a.matriz.includes(matrizBuscar)),
        microbiologico: analisisDisponibles.microbiologico.filter(a => a.matriz.includes(matrizBuscar))
    };

    return analisis;
};

// Crear el modelo
const Analisis = mongoose.models.Analisis || mongoose.model('Analisis', analisisSchema);

// Función para inicializar los análisis en la base de datos
const inicializarAnalisis = async () => {
    try {
        // Verificar si ya existen análisis
        const count = await Analisis.countDocuments();
        if (count === 0) {
            // Si no hay análisis, insertar los predefinidos
            await Analisis.insertMany(analisisDisponibles);
            console.log('Análisis inicializados correctamente');
        }
    } catch (error) {
        console.error('Error al inicializar análisis:', error);
    }
};

module.exports = {
    Analisis,
    inicializarAnalisis,
    analisisDisponibles,
    matrizMap,
    getAnalisisPorTipoAgua
}; 