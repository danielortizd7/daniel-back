const { Muestra } = require('../../../shared/models/muestrasModel');
const { NotFoundError, DatabaseError, ValidationError } = require('../../../shared/errors/AppError');

// Validar rol de usuario
const validarRolUsuario = (usuario) => {
    if (!usuario) {
        throw new ValidationError('Usuario no autenticado');
    }

    if (!usuario.rol) {
        throw new ValidationError('No se encontró el rol del usuario');
    }

    const rolesPermitidos = ['administrador', 'laboratorista'];
    if (!rolesPermitidos.includes(usuario.rol.toLowerCase())) {
        throw new ValidationError('No tienes permisos para realizar esta acción');
    }

    return true;
};

// Obtener todas las muestras
const obtenerMuestras = async () => {
    try {
        const muestras = await Muestra.find()
            .sort({ fechaHora: -1 });
        return muestras;
    } catch (error) {
        throw new DatabaseError('Error al obtener las muestras', error);
    }
};

// Obtener una muestra por ID
const obtenerMuestra = async (id) => {
    try {
        console.log('Buscando muestra con ID:', id);
        const muestra = await Muestra.findOne({ id_muestra: id.trim() })
            .collation({ locale: "es", strength: 2 });
        
        if (!muestra) {
            console.log('Muestra no encontrada');
            throw new NotFoundError('Muestra no encontrada');
        }
        console.log('Muestra encontrada:', muestra.id_muestra);
        return muestra;
    } catch (error) {
        console.error('Error al obtener la muestra:', error);
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Error al obtener la muestra', error);
    }
};

// Crear una nueva muestra
const crearMuestra = async (datosMuestra, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        const muestra = new Muestra({
            ...datosMuestra,
            registradoPor: {
                documento: usuario.documento,
                nombre: usuario.nombre
            }
        });
        await muestra.save();
        return muestra;
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al crear la muestra', error);
    }
};

// Actualizar una muestra
const actualizarMuestra = async (id, datosActualizacion, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: id },
            {
                ...datosActualizacion,
                'actualizadoPor.usuario': usuario.documento,
                'actualizadoPor.fecha': new Date()
            },
            { 
                new: true, 
                runValidators: true
            }
        );

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al actualizar la muestra', error);
    }
};

// Registrar firma en una muestra
const registrarFirma = async (idMuestra, datosFirma, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Inicializar el objeto de firmas si no existe
        if (!muestra.firmas) {
            muestra.firmas = {};
        }

        // Actualizar las firmas según el rol
        if (usuario.rol === 'administrador' || usuario.rol === 'laboratorista') {
            muestra.firmas.firmaLaboratorista = datosFirma.firma;
            muestra.firmas.cedulaLaboratorista = usuario.documento;
            muestra.firmas.fechaFirmaLaboratorista = new Date();
        } else if (usuario.rol === 'cliente') {
            muestra.firmas.firmaCliente = datosFirma.firma;
            muestra.firmas.cedulaCliente = usuario.documento;
            muestra.firmas.fechaFirmaCliente = new Date();
        }

        await muestra.save();
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al registrar la firma', error);
    }
};

// Eliminar una muestra
const eliminarMuestra = async (id, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al eliminar la muestra', error);
    }
};

// Obtener muestras por tipo
const obtenerMuestrasPorTipo = async (tipo) => {
    try {
        const muestras = await Muestra.find({ 'tipoDeAgua.tipo': tipo })
            .sort({ fechaHora: -1 });
        return muestras;
    } catch (error) {
        throw new DatabaseError('Error al obtener las muestras por tipo', error);
    }
};

// Obtener muestras por estado
const obtenerMuestrasPorEstado = async (estado) => {
    try {
        const muestras = await Muestra.find({ 'historial.estado': estado })
            .sort({ fechaHora: -1 });
        return muestras;
    } catch (error) {
        throw new DatabaseError('Error al obtener las muestras por estado', error);
    }
};

module.exports = {
    obtenerMuestras,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    eliminarMuestra,
    obtenerMuestrasPorTipo,
    obtenerMuestrasPorEstado,
    registrarFirma
}; 