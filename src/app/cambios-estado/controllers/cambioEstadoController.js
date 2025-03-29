const { validationResult } = require('express-validator');
const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");
const { Muestra, estadosValidos } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

// Función para cambiar estado (solo laboratorista)
const cambiarEstado = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const { cedula, estado } = req.body;
        const { idMuestra } = req.params;

        // Verificar que no sea el estado inicial
        if (estado === "Recibida") {
            throw new ValidationError("El estado 'Recibida' es asignado automáticamente al registrar la muestra");
        }

        console.log("Cambiando estado:", { cedula, idMuestra, estado });

        const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

        if (!muestra) {
            throw new NotFoundError("No se encontró la muestra o no se pudo cambiar el estado.");
        }

        return ResponseHandler.success(
            res, 
            { muestra }, 
            "Estado cambiado con éxito"
        );

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        return ResponseHandler.error(res, error);
    }
};

// Función para actualizar estado (solo laboratorista)
const actualizarEstado = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const { cedula, estado } = req.body;
        const { idMuestra } = req.params;

        // Verificar que no sea el estado inicial
        if (estado === "Recibida") {
            throw new ValidationError("El estado 'Recibida' es asignado automáticamente al registrar la muestra");
        }

        console.log("Actualizando estado:", { cedula, idMuestra, estado });

        const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

        if (!muestra) {
            throw new NotFoundError("No se encontró la muestra o no se pudo actualizar.");
        }

        if (estado === "Finalizada" && !muestra.resultado) {
            return ResponseHandler.success(
                res,
                { muestra },
                "Estado actualizado con éxito, pero no se encontró resultado"
            );
        }

        return ResponseHandler.success(
            res,
            { muestra },
            "Estado actualizado con éxito"
        );

    } catch (error) {
        console.error("Error al actualizar estado:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { cambiarEstado, actualizarEstado };
