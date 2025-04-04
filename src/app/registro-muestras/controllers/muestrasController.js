const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos, TipoAgua } = require('../../../shared/models/muestrasModel');
const { analisisDisponibles, matrizMap, getAnalisisPorTipoAgua } = require('../../../shared/models/analisisModel');
const Usuario = require('../../../shared/models/usuarioModel');
const { validarUsuario } = require('../services/usuariosService');
const muestrasService = require('../services/muestrasService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const USUARIOS_API = 'https://back-usuarios-f.onrender.com/api/usuarios';
const BUSCAR_USUARIO_API = 'https://back-usuarios-f.onrender.com/api/usuarios';

//Funciones de Utilidad 
const obtenerDatosUsuario = (req) => {
    if (!req.usuario) {
        throw new ValidationError('Usuario no autenticado');
    }
    return {
        id: req.usuario.id,
        documento: req.usuario.documento,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol
    };
};

const normalizarCampos = (datos) => {
    // Normalizar tipo de análisis
    if (datos.tipoAnalisis) {
        datos.tipoAnalisis = datos.tipoAnalisis.charAt(0).toUpperCase() + 
                            datos.tipoAnalisis.slice(1).toLowerCase();
        if (datos.tipoAnalisis === 'Fisicoquimico') {
            datos.tipoAnalisis = 'Fisicoquímico';
        }
    }

    // Normalizar preservación
    if (datos.preservacionMuestra) {
        datos.preservacionMuestra = datos.preservacionMuestra.charAt(0).toUpperCase() + 
                                  datos.preservacionMuestra.slice(1).toLowerCase();
        if (datos.preservacionMuestra === 'Refrigeracion') {
            datos.preservacionMuestra = 'Refrigeración';
        }
    }

    // Normalizar tipo de agua
    if (datos.tipoDeAgua?.tipo) {
        datos.tipoDeAgua.tipo = datos.tipoDeAgua.tipo.toLowerCase();
    }

    return datos;
};

const validarDatosMuestra = (datos) => {
    const errores = [];

    // Si la muestra está rechazada, solo validar campos básicos
    if (datos.estado === 'Rechazada') {
        if (!datos.documento) errores.push('El documento es requerido');
        if (!datos.tipoDeAgua?.tipo) errores.push('El tipo de agua es requerido');
        if (!datos.lugarMuestreo) errores.push('El lugar de muestreo es requerido');
        if (!datos.motivoRechazo) errores.push('El motivo de rechazo es requerido');
        
        if (errores.length > 0) {
            throw new ValidationError(errores.join('. '));
        }
        return;
    }

    // 1. Documento
    if (!datos.documento) errores.push('El documento es requerido');
    
    // 2. Tipo de Agua
    if (!datos.tipoDeAgua?.tipo) errores.push('El tipo de agua es requerido');
    if (!datos.tipoDeAgua?.codigo) errores.push('El código del tipo de agua es requerido');
    if (!datos.tipoDeAgua?.descripcion) errores.push('La descripción del tipo de agua es requerida');
    
    // 3. Lugar de Muestreo
    if (!datos.lugarMuestreo) errores.push('El lugar de muestreo es requerido');
    
    // 4. Fecha y Hora de Muestreo
    if (!datos.fechaHoraMuestreo) errores.push('La fecha y hora de muestreo son requeridas');
    
    // 5. Tipo de Análisis
    if (!datos.tipoAnalisis) errores.push('El tipo de análisis es requerido');
    
    // 7. Plan de Muestreo
    if (!datos.planMuestreo) errores.push('El plan de muestreo es requerido');
    
    // 8. Condiciones Ambientales
    if (!datos.condicionesAmbientales) {
        errores.push('Las condiciones ambientales son requeridas');
    }
    
    // 9. Preservación de la Muestra
    if (!datos.preservacionMuestra) {
        errores.push('El método de preservación es requerido');
    } else if (datos.preservacionMuestra === 'Otra' && !datos.preservacionOtra) {
        errores.push('Debe especificar el método de preservación cuando selecciona "Otra"');
    }
    
    // 10. Análisis Seleccionados
    if (!Array.isArray(datos.analisisSeleccionados) || datos.analisisSeleccionados.length === 0) {
        errores.push('Debe seleccionar al menos un análisis');
    } else {
        // Validar que los análisis seleccionados existan y correspondan al tipo de agua
        const analisisDisponibles = getAnalisisPorTipoAgua(datos.tipoDeAgua.tipo);
        const todosLosAnalisis = [...analisisDisponibles.fisicoquimico, ...analisisDisponibles.microbiologico];
        const analisisInvalidos = datos.analisisSeleccionados.filter(
            analisis => !todosLosAnalisis.some(a => a.nombre === analisis)
        );
        if (analisisInvalidos.length > 0) {
            errores.push(`Los siguientes análisis no son válidos para el tipo de agua seleccionado: ${analisisInvalidos.join(', ')}`);
        }
    }

    // Validar firmas
    if (!datos.firmas?.firmaAdministrador?.firma || !datos.firmas?.firmaCliente?.firma) {
        errores.push('Se requieren las firmas del administrador y del cliente');
    }

    if (errores.length > 0) {
        throw new ValidationError(errores.join('. '));
    }
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

// Función de validación de análisis según tipo de agua
const validarAnalisisParaTipoAgua = (analisisSeleccionados, tipoAgua, subtipoResidual = null) => {

    // Determinar matriz permitida según tipo de agua
    let matrizPermitida;
    switch (tipoAgua) {
        case 'potable':
            matrizPermitida = 'AP';
            break;
        case 'natural':
            matrizPermitida = 'AS';
            break;
        case 'residual':
            matrizPermitida = subtipoResidual === 'doméstica' ? 'ARD' : 'ARnD';
            break;
        default:
            throw new ValidationError('Tipo de agua no válido');
    }

    // Verificar cada análisis seleccionado
    for (const analisis of analisisSeleccionados) {
        const analisisInfo = analisisDisponibles.find(a => a.nombre === analisis);
        if (!analisisInfo) {
            throw new ValidationError(`El análisis "${analisis}" no existe en el catálogo`);
        }

        if (!analisisInfo.matriz.includes(matrizPermitida)) {
            throw new ValidationError(`El análisis "${analisis}" no es válido para ${tipoAgua}${subtipoResidual ? ` ${subtipoResidual}` : ''}`);
        }
    }
    return true;
};

// Controladores de Usuarios
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

//Tipos de Agua 
const obtenerTiposAgua = async (req, res, next) => {
    try {
        const tiposAgua = await TipoAgua.find({ activo: true });
        ResponseHandler.success(res, { tiposAgua }, 'Tipos de agua obtenidos exitosamente');
    } catch (error) {
        next(error);
    }
};

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
        ResponseHandler.success(res, { tipoAgua }, 'Tipo de agua creado exitosamente', 201);
    } catch (error) {
        next(error);
    }
};

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

        ResponseHandler.success(res, { tipoAgua }, 'Tipo de agua actualizado exitosamente');
    } catch (error) {
        next(error);
    }
};

// Análisis 
const obtenerAnalisis = async (req, res) => {
    try {
        ResponseHandler.success(res, { 
            analisis: analisisDisponibles,
            matrices: matrizMap
        }, 'Análisis obtenidos correctamente');
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const obtenerAnalisisPorTipoAgua = async (req, res) => {
    try {
        const { tipo, subtipo } = req.query;
        const analisis = getAnalisisPorTipoAgua(tipo, subtipo);
        ResponseHandler.success(res, { 
            analisis,
            tipo,
            subtipo,
            matriz: matrizMap[tipo === 'residual' ? (subtipo === 'domestica' ? 'ARD' : 'ARnD') : tipo === 'potable' ? 'AP' : 'AS']
        }, 'Análisis filtrados correctamente');
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

//Controladores de Muestras
const obtenerMuestras = async (req, res, next) => {
    try {
        const { tipo, estado, fechaInicio, fechaFin } = req.query;
        let filtro = {};

        // Aplicar filtros si se proporcionan
        if (tipo) filtro['tipoDeAgua.tipo'] = tipo;
        if (estado) filtro.estado = estado;
        if (fechaInicio || fechaFin) {
            filtro.fechaHoraMuestreo = {};
            if (fechaInicio) filtro.fechaHoraMuestreo.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaHoraMuestreo.$lte = new Date(fechaFin);
        }

        const muestras = await Muestra.find(filtro)
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHoraMuestreo: -1 });

        ResponseHandler.success(res, { muestras }, 'Muestras obtenidas correctamente');
    } catch (error) {
        next(error);
    }
};

const obtenerMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        const muestra = await Muestra.findOne({ id_muestra: id })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento');

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, { muestra }, 'Muestra obtenida correctamente');
    } catch (error) {
        next(error);
    }
};

const registrarMuestra = async (req, res, next) => {
    try {
        const datos = req.body;
        
        // Validar los datos de la muestra
        validarDatosMuestra(datos);

        // Generar ID único de muestra
        const fecha = new Date();
        const año = fecha.getFullYear().toString().slice(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        
        // Obtener el último consecutivo del día
        const ultimaMuestra = await Muestra.findOne({
            id_muestra: new RegExp(`^${datos.tipoDeAgua.codigo}${datos.tipoAnalisis.charAt(0)}${año}${mes}${dia}`)
        }).sort({ id_muestra: -1 });
        
        let consecutivo = '001';
        if (ultimaMuestra) {
            const ultimoConsecutivo = parseInt(ultimaMuestra.id_muestra.slice(-3));
            consecutivo = (ultimoConsecutivo + 1).toString().padStart(3, '0');
        }
        
        const id_muestra = `${datos.tipoDeAgua.codigo}${datos.tipoAnalisis.charAt(0)}${año}${mes}${dia}${consecutivo}`;

        // Verificar que tenemos el ID del usuario
        if (!req.usuario || !req.usuario.id) {
            throw new ValidationError('Usuario no autenticado o ID no disponible');
        }

        // Convertir el ID a ObjectId
        const usuarioId = new mongoose.Types.ObjectId(req.usuario.id);

        // Preparar las firmas en el formato correcto
        const firmas = {
            cedulaAdministrador: req.usuario.documento || datos.documento,
            firmaAdministrador: datos.firmas?.firmaAdministrador?.firma || '',
            fechaFirmaAdministrador: datos.firmas?.firmaAdministrador?.fecha || new Date(),
            cedulaCliente: datos.documento,
            firmaCliente: datos.firmas?.firmaCliente?.firma || '',
            fechaFirmaCliente: datos.firmas?.firmaCliente?.fecha || new Date()
        };

        // Crear la muestra con los datos formateados correctamente
        const muestra = new Muestra({
            ...datos,
            id_muestra,
            estado: 'Recibida',
            firmas,
            creadoPor: usuarioId, // Usar el ID convertido a ObjectId
            historial: [{
                estado: 'Recibida',
                cedulaadministrador: req.usuario.documento || datos.documento,
                nombreadministrador: req.usuario.nombre || 'Sistema',
                fechaCambio: new Date(),
                observaciones: datos.observaciones || 'Registro inicial de muestra'
            }]
        });

        await muestra.save();
        ResponseHandler.success(res, { muestra }, 'Muestra registrada exitosamente');

    } catch (error) {
        console.error('Error al registrar muestra:', error);
        return ResponseHandler.error(res, error);
    }
};

const actualizarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        const datosActualizacion = normalizarCampos(req.body);
        
        // Validar campos que no se pueden actualizar
        const camposInmutables = ['documento', 'fechaHoraRecepcion', 'tipoAnalisis', 'tipoDeAgua'];
        const camposActualizacion = Object.keys(datosActualizacion);
        const camposInvalidos = camposInmutables.filter(campo => camposActualizacion.includes(campo));
        
        if (camposInvalidos.length > 0) {
            throw new ValidationError(`Los siguientes campos no se pueden modificar: ${camposInvalidos.join(', ')}`);
        }

        // Validaciones específicas
        if (datosActualizacion.estado === 'Rechazada' && !datosActualizacion.motivoRechazo) {
            throw new ValidationError('Debe especificar el motivo del rechazo');
        }

        if (datosActualizacion.preservacionMuestra === 'Otra' && !datosActualizacion.preservacionOtra) {
            throw new ValidationError('Debe especificar el método de preservación cuando selecciona "Otra"');
        }

        // Actualizar la muestra
        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: id },
            {
                ...datosActualizacion,
                $push: {
                    actualizadoPor: {
                        usuario: usuario.id,
                        nombre: usuario.nombre,
                        fecha: new Date(),
                        accion: 'Actualización de muestra'
                    }
                }
            },
            { new: true }
        );

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, { muestra }, 'Muestra actualizada exitosamente');
    } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            return ResponseHandler.error(res, error);
        }
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
        const { id } = req.params;
        
        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, null, 'Muestra eliminada exitosamente');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Controladores de Usuario
    validarUsuarioController,
    
    // Controladores de Tipos de Agua
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua,
    
    // Controladores de Análisis
    obtenerAnalisis,
    obtenerAnalisisPorTipoAgua,
    
    // Controladores de Muestras
    obtenerMuestras,
    obtenerMuestra,
    registrarMuestra,
    actualizarMuestra,
    registrarFirma,
    eliminarMuestra
};