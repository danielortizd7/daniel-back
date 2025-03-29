const { ValidationError } = require('../errors/AppError');

// Middleware para verificar rol de administrador
const verificarRolAdmin = (req, res, next) => {
    try {
        const { rol } = req.usuario;
        if (rol !== 'administrador') {
            throw new ValidationError('No tiene permisos para realizar esta acción. Se requiere rol de administrador.');
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    verificarRolAdmin
};
