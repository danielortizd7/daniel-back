const { TipoAgua } = require('../../../shared/models/muestrasModel');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError } = require('../../../shared/errors/AppError');

// Obtener todos los tipos de agua
const obtenerTiposAgua = async (req, res, next) => {
    try {
        const tiposAgua = await TipoAgua.find({ activo: true });
        ResponseHandler.success(res, 'Tipos de agua obtenidos exitosamente', tiposAgua);
    } catch (error) {
        next(error);
    }
};

// Crear un nuevo tipo de agua
const crearTipoAgua = async (req, res, next) => {
    try {
        const { tipo, descripcion } = req.body;
        
        if (!tipo || !descripcion) {
            throw new ValidationError('Tipo y descripción son requeridos');
        }

        const tipoAgua = new TipoAgua({
            tipo: tipo.toLowerCase(),
            descripcion
        });

        await tipoAgua.save();
        ResponseHandler.success(res, 'Tipo de agua creado exitosamente', tipoAgua, 201);
    } catch (error) {
        next(error);
    }
};

// Actualizar un tipo de agua
const actualizarTipoAgua = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descripcion, activo } = req.body;

        const tipoAgua = await TipoAgua.findByIdAndUpdate(
            id,
            { descripcion, activo },
            { new: true }
        );

        if (!tipoAgua) {
            throw new ValidationError('Tipo de agua no encontrado');
        }

        ResponseHandler.success(res, 'Tipo de agua actualizado exitosamente', tipoAgua);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua
};
