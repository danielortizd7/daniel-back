const { validationResult } = require('express-validator');
const generarPDF = require("../../../shared/utils/generarPDF");
const { Muestra } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

const generarReportePDF = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const { idMuestra } = req.params;

        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            throw new NotFoundError("Muestra no encontrada");
        }

        if (!muestra.firmas) {
            throw new ValidationError("La muestra no tiene firmas registradas");
        }

        const { 
            cedulaCliente, 
            firmaCliente, 
            cedulaLaboratorista, 
            firmaLaboratorista 
        } = muestra.firmas;

        // Generar el PDF
        const rutaPDF = await generarPDF(
            muestra, 
            cedulaCliente, 
            firmaCliente, 
            cedulaLaboratorista, 
            firmaLaboratorista
        );

        return ResponseHandler.success(
            res,
            { rutaPDF },
            "PDF generado correctamente"
        );

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { generarReportePDF };