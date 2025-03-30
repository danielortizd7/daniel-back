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

        console.log("Recibiendo datos de firma:", {
            id_muestra: req.body.id_muestra,
            firmas: req.body.firmas,
            estructuraFirmaAdmin: req.body.firmas?.firmaAdministrador,
            estructuraFirmaCliente: req.body.firmas?.firmaCliente
        });

        const { id_muestra, firmas } = req.body;

        if (!firmas || !firmas.firmaAdministrador || !firmas.firmaCliente) {
            throw new ValidationError('Estructura de firmas inválida', [{
                msg: 'Se requieren las firmas del administrador y del cliente',
                path: 'firmas'
            }]);
        }

        const muestra = await Muestra.findOne({ id_muestra: id_muestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            throw new NotFoundError(`Muestra no encontrada con ID: ${id_muestra}`);
        }

        console.log("Muestra encontrada:", {
            id_muestra: muestra.id_muestra,
            historial: muestra.historial,
            documento: muestra.documento
        });

        // Asegurar que existe el objeto firmas
        const nuevasFirmas = { ...muestra.firmas || {} };
        console.log("Firmas actuales:", nuevasFirmas);

        // Guardar firma del administrador
        if (firmas.firmaAdministrador.firma && firmas.firmaAdministrador.firma.trim() !== "") {
            nuevasFirmas.cedulaAdministrador = muestra.historial[0]?.cedulaadministrador;
            nuevasFirmas.firmaAdministrador = formatearBase64(firmas.firmaAdministrador.firma);
            nuevasFirmas.fechaFirmaAdministrador = new Date();
            console.log("Firma del administrador agregada:", {
                cedula: nuevasFirmas.cedulaAdministrador,
                firma: "Presente",
                fecha: nuevasFirmas.fechaFirmaAdministrador
            });
        } else {
            console.log("No se guardó la firma del administrador:", {
                tieneFirmaAdmin: !!firmas.firmaAdministrador.firma,
                firmaVacia: firmas.firmaAdministrador.firma ? firmas.firmaAdministrador.firma.trim() === "" : true
            });
            throw new ValidationError('La firma del administrador es requerida', [{
                msg: 'La firma del administrador no puede estar vacía',
                path: 'firmas.firmaAdministrador.firma'
            }]);
        }

        // Guardar firma del cliente
        if (firmas.firmaCliente.firma && firmas.firmaCliente.firma.trim() !== "") {
            nuevasFirmas.cedulaCliente = muestra.documento;
            nuevasFirmas.firmaCliente = formatearBase64(firmas.firmaCliente.firma);
            nuevasFirmas.fechaFirmaCliente = new Date();
            console.log("Firma del cliente agregada:", {
                cedula: nuevasFirmas.cedulaCliente,
                firma: "Presente",
                fecha: nuevasFirmas.fechaFirmaCliente
            });
        } else {
            console.log("No se guardó la firma del cliente:", {
                tieneFirmaCliente: !!firmas.firmaCliente.firma,
                firmaVacia: firmas.firmaCliente.firma ? firmas.firmaCliente.firma.trim() === "" : true
            });
            throw new ValidationError('La firma del cliente es requerida', [{
                msg: 'La firma del cliente no puede estar vacía',
                path: 'firmas.firmaCliente.firma'
            }]);
        }

        // Actualizar la muestra en la base de datos
        const muestraActualizada = await Muestra.findByIdAndUpdate(
            muestra._id,
            { $set: { firmas: nuevasFirmas } },
            { new: true }
        );

        console.log("Muestra actualizada con las firmas:", {
            firmas: muestraActualizada.firmas
        });

        let rutaPDF = null;
        if (nuevasFirmas.cedulaCliente && nuevasFirmas.firmaCliente && nuevasFirmas.cedulaAdministrador && nuevasFirmas.firmaAdministrador) {
            console.log("Generando PDF...");
            rutaPDF = await generarPDF(
                muestraActualizada,
                nuevasFirmas.cedulaCliente,
                nuevasFirmas.firmaCliente,
                nuevasFirmas.cedulaAdministrador,
                nuevasFirmas.firmaAdministrador
            );
            console.log("PDF generado:", rutaPDF);
        } else {
            console.log("No se generó el PDF - Faltan firmas:", {
                tieneCedulaCliente: !!nuevasFirmas.cedulaCliente,
                tieneFirmaCliente: !!nuevasFirmas.firmaCliente,
                tieneCedulaAdmin: !!nuevasFirmas.cedulaAdministrador,
                tieneFirmaAdmin: !!nuevasFirmas.firmaAdministrador
            });
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
