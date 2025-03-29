const axios = require('axios');
const { AuthenticationError } = require('../../../shared/errors/AppError');

const USUARIOS_API = process.env.VITE_BACKEND_URL || 'https://back-usuarios-f.onrender.com';
const ROL_ADMIN_ID = '67d8c23082d1ef13162bdc18';

const verificarRolUsuario = async (usuario) => {
    try {
        if (!usuario) {
            throw new AuthenticationError('Usuario no proporcionado');
        }

        // Verificar si el usuario tiene el rol de administrador
        const esAdmin = usuario.rol === 'administrador';

        return {
            esAdmin,
            usuario,
            rol: usuario.rol,
            descripcion: esAdmin ? 'Administrador del sistema' : 'Cliente del laboratorio'
        };
    } catch (error) {
        console.error('Error al verificar rol:', error);
        throw new AuthenticationError('Error al verificar rol del usuario');
    }
};

const validarUsuario = async (usuario) => {
    try {
        if (!usuario) {
            throw new AuthenticationError('Usuario no proporcionado');
        }

        const resultado = await verificarRolUsuario(usuario);
        return resultado;
    } catch (error) {
        console.error('Error al validar usuario:', error);
        throw new AuthenticationError('Error al validar usuario');
    }
};

module.exports = {
    verificarRolUsuario,
    validarUsuario
};