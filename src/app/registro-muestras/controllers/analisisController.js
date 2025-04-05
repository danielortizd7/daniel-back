const { 
    getAnalisisPorTipoAgua, 
    analisisDisponibles,
    TIPOS_ANALISIS,
    Analisis 
} = require('../../../shared/models/analisisModel');

// Obtener lista simplificada de análisis (solo nombre y unidad)
const getAnalisisSimplificado = async (req, res) => {
    try {
        const { tipoAnalisis } = req.query;
        
        if (!tipoAnalisis || !analisisDisponibles[tipoAnalisis]) {
            return res.status(400).json({ error: 'El tipo de análisis es requerido (fisicoquimico o microbiologico)' });
        }

        // Solo devolver los análisis del tipo solicitado
        const analisisFiltrados = analisisDisponibles[tipoAnalisis].map(analisis => ({
            nombre: analisis.nombre,
            unidad: analisis.unidad || obtenerUnidadPorDefecto(analisis.nombre)
        }));
        
        res.json(analisisFiltrados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener detalles completos de un análisis específico
const getDetalleAnalisis = async (req, res) => {
    try {
        const { nombre, tipoAgua, subtipoResidual } = req.query;
        const analisisCompletos = getAnalisisPorTipoAgua(tipoAgua, subtipoResidual);
        
        // Buscar en ambos tipos de análisis
        const analisis = 
            analisisCompletos.fisicoquimico.find(a => a.nombre === nombre) ||
            analisisCompletos.microbiologico.find(a => a.nombre === nombre);
        
        if (!analisis) {
            return res.status(404).json({ error: 'Análisis no encontrado' });
        }
        
        res.json(analisis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Función auxiliar para obtener la unidad por defecto según el nombre del análisis
const obtenerUnidadPorDefecto = (nombreAnalisis) => {
    // Mapeo de unidades por defecto según el nombre del análisis
    const unidadesPorDefecto = {
        "pH": "Und. pH",
        "Conductividad": "µS/cm",
        "Turbiedad": "UNT",
        "Color aparente": "UPC",
        "Alcalinidad": "mg/L CaCO3",
        "Dureza total": "mg/L CaCO3",
        "Dureza cálcica": "mg/L CaCO3",
        "Calcio": "mg/L Ca",
        "Magnesio": "mg/L Mg",
        "Cloro libre (residual)": "mg/L Cl2",
        "Cloruros": "mg/L Cl-",
        "Fluoruros": "mg/L F-",
        "Nitratos": "mg/L NO3",
        "Nitritos": "mg/L NO2",
        "Sulfatos": "mg/L SO4",
        "Fosfatos": "mg/L PO4",
        "Manganeso": "mg/L Mn",
        "Hierro": "mg/L Fe",
        "Mercurio total": "µg/L Hg",
        "Cadmio": "mg/L Cd",
        "Oxígeno Disuelto": "mg/L O2",
        "Demanda Bioquímica de Oxígeno (DBO5)": "mg/L O2",
        "Demanda Química de Oxígeno (DQO)": "mg/L",
        "Sólidos Sedimentables (SSED)": "mL/L",
        "Sólidos Suspendidos Totales (SST)": "mg/L",
        "Coliformes totales y E. coli (Cualitativa)": "Presencia/Ausencia",
        "Coliformes totales y E. coli (Cuantitativa)": "UFC/100mL"
    };
    
    return unidadesPorDefecto[nombreAnalisis] || "N/A";
};

module.exports = {
    getAnalisisSimplificado,
    getDetalleAnalisis
}; 