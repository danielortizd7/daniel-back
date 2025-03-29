const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos } = require('../../../shared/models/muestrasModel');
const Usuario = require('../../../shared/models/usuarioModel');
const { validarUsuario } = require('../services/usuariosService');
const muestrasService = require('../services/muestrasService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const USUARIOS_API = 'https://back-usuarios-f.onrender.com/api/usuarios';
const BUSCAR_USUARIO_API = 'https://back-usuarios-f.onrender.com/api/usuarios';

// ============= Funciones de Validación =============
const obtenerDatosUsuario = (req) => {
    if (!req.usuario) {
        throw new ValidationError('Usuario no autenticado');
    }

    const usuario = {
        id: req.usuario.id,
        documento: req.usuario.documento,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol
    };

    console.log('Datos de usuario extraídos:', usuario);
    return usuario;
};

const validarRolAdministrador = (usuario) => {
    if (!usuario || !usuario.rol) {
        throw new ValidationError('Usuario no autenticado o sin rol definido');
    }

    if (usuario.rol !== 'administrador') {
        throw new ValidationError('Se requieren permisos de administrador');
    }

    return true;
};

// ============= Controladores de Usuario =============
const validarUsuarioController = async (req, res) => {
    try {
        const { documento } = req.query;
        
        if (!documento) {
            return ResponseHandler.error(res, new ValidationError('El documento es requerido'));
        }

        const resultado = await validarUsuario(documento);
        return ResponseHandler.success(res, resultado, 'Usuario validado correctamente');
    } catch (error) {
        console.error('Error en validarUsuarioController:', error);
        return ResponseHandler.error(res, error);
    }
};

// ============= Controladores de Muestras =============
const obtenerMuestras = async (req, res, next) => {
    try {
        console.log('Iniciando obtención de muestras...');
        const muestras = await Muestra.find()
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });
        console.log('Muestras obtenidas:', muestras);
        ResponseHandler.success(res, { muestras }, 'Muestras obtenidas correctamente');
    } catch (error) {
        console.error('Error detallado al obtener muestras:', error);
        next(error);
    }
};

const obtenerMuestrasPorTipo = async (req, res, next) => {
    try {
        console.log('Iniciando obtención de muestras por tipo...');
        const { tipo } = req.params;
        const muestras = await Muestra.find({ 'tipoDeAgua.tipo': tipo })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });
        console.log('Muestras obtenidas por tipo:', muestras);
        ResponseHandler.success(res, { muestras }, `Muestras de tipo ${tipo} obtenidas correctamente`);
    } catch (error) {
        console.error('Error detallado al obtener muestras por tipo:', error);
        next(error);
    }
};

const obtenerMuestrasPorEstado = async (req, res, next) => {
    try {
        console.log('Iniciando obtención de muestras por estado...');
        const { estado } = req.params;
        if (!estadosValidos.includes(estado)) {
            console.log('Estado no válido:', estado);
            throw new ValidationError('Estado no válido');
        }

        const muestras = await Muestra.find({ estado })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });

        console.log('Muestras obtenidas por estado:', muestras);
        ResponseHandler.success(res, { muestras }, `Muestras en estado ${estado} obtenidas correctamente`);
    } catch (error) {
        console.error('Error detallado al obtener muestras por estado:', error);
        next(error);
    }
};

const obtenerMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        const muestra = await muestrasService.obtenerMuestra(id);
        ResponseHandler.success(res, { muestra }, 'Muestra obtenida exitosamente');
    } catch (error) {
        next(error);
    }
};

const crearMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const muestra = await muestrasService.crearMuestra(req.body, usuario);
        ResponseHandler.success(res, { muestra }, 'Muestra creada exitosamente');
    } catch (error) {
        next(error);
    }
};

const actualizarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        const muestra = await muestrasService.actualizarMuestra(id, req.body, usuario);
        ResponseHandler.success(res, { muestra }, 'Muestra actualizada exitosamente');
    } catch (error) {
        next(error);
    }
};

const registrarFirma = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        validarRolAdministrador(usuario);
        const { id } = req.params;
        const { firmas } = req.body;
        const muestra = await muestrasService.registrarFirma(id, firmas, usuario);
        ResponseHandler.success(res, { muestra }, 'Firma registrada exitosamente');
    } catch (error) {
        next(error);
    }
};

const eliminarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        validarRolAdministrador(usuario);
        const { id } = req.params;
        await muestrasService.eliminarMuestra(id);
        ResponseHandler.success(res, null, 'Muestra eliminada exitosamente');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Controladores de Usuario
    validarUsuarioController,
    
    // Controladores de Muestras
    obtenerMuestras,
    obtenerMuestrasPorTipo,
    obtenerMuestrasPorEstado,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    registrarFirma,
    eliminarMuestra
};