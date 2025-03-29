const path = require("path");
const fs = require("fs");
const { validationResult } = require('express-validator');
const { Muestra } = require("../../../shared/models/muestrasModel");
const generarPDF = require("../../../shared/utils/generarPDF");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

// Función para limpiar Base64 y asegurarse de que tenga el prefijo correcto
const formatearBase64 = (firma) => {
    if (!firma.startsWith("data:image/png;base64,")) {
        return `data:image/png;base64,${firma}`;
    }
    return firma;
};

// Buscar muestra por ID
const buscarMuestra = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        console.log("Buscando muestra con ID:", req.params.idMuestra);
        const { idMuestra } = req.params;

        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            throw new NotFoundError(`No se encontró la muestra con ID: ${idMuestra}`);
        }

        console.log("Muestra encontrada:", muestra.id_muestra);
        return ResponseHandler.success(res, { muestra });

    } catch (error) {
        console.error("Error al buscar la muestra:", error);
        return ResponseHandler.error(res, error);
    }
};

// Guardar firmas en la base de datos
const guardarFirma = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        console.log("Recibiendo datos de firma:", req.body);
        const { id_muestra, cedulaLaboratorista, firmaLaboratorista, cedulaCliente, firmaCliente } = req.body;

        const muestra = await Muestra.findOne({ id_muestra: id_muestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            throw new NotFoundError(`Muestra no encontrada con ID: ${id_muestra}`);
        }

        console.log("Muestra encontrada:", muestra.id_muestra);

        // Asegurar que existe el objeto firmas
        const nuevasFirmas = { ...muestra.firmas || {} };

        // Guardar firma del laboratorista
        if (!nuevasFirmas.firmaLaboratorista) {
            nuevasFirmas.cedulaLaboratorista = cedulaLaboratorista;
            nuevasFirmas.firmaLaboratorista = formatearBase64(firmaLaboratorista);
            console.log("Firma del laboratorista agregada.");
        }

        // Guardar firma del cliente
        if (cedulaCliente && firmaCliente) {
            nuevasFirmas.cedulaCliente = cedulaCliente;
            nuevasFirmas.firmaCliente = formatearBase64(firmaCliente);
            console.log("Firma del cliente agregada.");
        }

        // Actualizar la muestra en la base de datos
        const muestraActualizada = await Muestra.findByIdAndUpdate(
            muestra._id,
            { $set: { firmas: nuevasFirmas } },
            { new: true }
        );

        console.log("Muestra actualizada con las firmas.");

        let rutaPDF = null;
        if (nuevasFirmas.cedulaCliente && nuevasFirmas.firmaCliente) {
            console.log("Generando PDF...");
            rutaPDF = await generarPDF(
                muestraActualizada,
                nuevasFirmas.cedulaCliente,
                nuevasFirmas.firmaCliente,
                nuevasFirmas.cedulaLaboratorista,
                nuevasFirmas.firmaLaboratorista
            );
            console.log("PDF generado:", rutaPDF);
        }

        return ResponseHandler.success(
            res,
            { 
                muestra: muestraActualizada,
                rutaPDF 
            },
            "Firmas guardadas correctamente"
        );

    } catch (error) {
        console.error("Error al guardar las firmas:", error);
        return ResponseHandler.error(res, error);
    }
};

// Obtener todas las firmas de la base de datos
const obtenerTodasLasFirmas = async (req, res) => {
    try {
        console.log("Obteniendo todas las firmas...");
        const firmas = await Muestra.find({}, "id_muestra firmas");
        console.log("Firmas obtenidas:", firmas.length);

        return ResponseHandler.success(
            res,
            { firmas },
            "Lista de todas las firmas obtenida con éxito"
        );

    } catch (error) {
        console.error("Error al obtener todas las firmas:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { buscarMuestra, obtenerTodasLasFirmas, guardarFirma };
