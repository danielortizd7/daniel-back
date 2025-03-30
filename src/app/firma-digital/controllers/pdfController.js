const generarPDF = require("../../../shared/utils/generarPDF");
const { Muestra } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const path = require("path");
const fs = require("fs");

const generarReportePDF = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        console.log("Generando PDF para muestra:", idMuestra);

        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            return ResponseHandler.error(res, { message: "Muestra no encontrada" });
        }

        // Obtener datos del administrador del historial
        const adminData = muestra.historial[0] || {};
        console.log("Datos del administrador:", adminData);

        // Generar el PDF sin validaciones
        const rutaPDF = await generarPDF(
            muestra, 
            muestra.documento || '', 
            '', // firma cliente
            adminData.cedulaadministrador || 'Admin', 
            '' // firma admin
        );

        // Construir la ruta completa del archivo
        const filePath = path.join(process.cwd(), "public", rutaPDF);

        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            console.error("Archivo PDF no encontrado:", filePath);
            return ResponseHandler.error(res, { message: "PDF no encontrado" });
        }

        // Enviar el archivo PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=muestra_${idMuestra}.pdf`);
        return res.sendFile(filePath);

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { generarReportePDF };