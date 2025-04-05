const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos, TipoAgua, TIPOS_AGUA, SUBTIPOS_RESIDUAL } = require('../../../shared/models/muestrasModel');
const { getAnalisisPorTipoAgua } = require('../../../shared/models/analisisModel');
const Usuario = require('../../../shared/models/usuarioModel');
const { validarUsuario } = require('../services/usuariosService');
const muestrasService = require('../services/muestrasService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// URL base para las peticiones a la API de usuarios
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://backend-sena-lab-1-qpzp.onrender.com'
    : 'http://localhost:5000';

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
    
    // Validación específica para agua residual
    if (datos.tipoDeAgua?.tipo === TIPOS_AGUA.RESIDUAL) {
        if (!datos.tipoDeAgua?.subtipoResidual) {
            errores.push('Para agua residual debe especificar si es doméstica o no doméstica');
        } else if (!Object.values(SUBTIPOS_RESIDUAL).includes(datos.tipoDeAgua.subtipoResidual)) {
            errores.push('El subtipo de agua residual debe ser "domestica" o "no_domestica"');
        }
    }
    
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

//Controladores de Muestras
const formatearFechaHora = (fecha) => {
    if (!fecha) return null;
    
    const fechaObj = new Date(fecha);
    
    // Formatear fecha
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    
    // Formatear hora en formato 12 horas
    let horas = fechaObj.getHours();
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12; // la hora '0' debe ser '12'
    
    return {
        fecha: `${dia}/${mes}/${año}`,
        hora: `${horas}:${minutos} ${ampm}`
    };
};

const obtenerMuestras = async (req, res, next) => {
    try {
        const { 
            tipo, 
            estado, 
            fechaInicio, 
            fechaFin,
            page = 1,
            limit = 10,
            sortBy = 'fechaHoraMuestreo',
            sortOrder = 'desc'
        } = req.query;

        let filtro = {};

        // Aplicar filtros si se proporcionan
        if (tipo) filtro['tipoDeAgua.tipo'] = tipo;
        if (estado) filtro.estado = estado;
        if (fechaInicio || fechaFin) {
            filtro.fechaHoraMuestreo = {};
            if (fechaInicio) filtro.fechaHoraMuestreo.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaHoraMuestreo.$lte = new Date(fechaFin);
        }

        // Calcular skip para paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitInt = parseInt(limit);

        // Configurar el ordenamiento
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Ejecutar las consultas en paralelo
        const [muestras, total] = await Promise.all([
            Muestra.find(filtro)
                .select('id_muestra documento tipoDeAgua lugarMuestreo fechaHoraMuestreo estado')
                .populate('creadoPor', 'nombre email documento')
                .sort(sort)
                .skip(skip)
                .limit(limitInt)
                .lean(), // Usar lean() para obtener objetos JavaScript planos
            Muestra.countDocuments(filtro)
        ]);

        // Formatear las fechas en las muestras
        const muestrasFormateadas = muestras.map(muestra => ({
            ...muestra,
            fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo)
        }));

        // Calcular información de paginación
        const totalPages = Math.ceil(total / limitInt);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        ResponseHandler.success(res, {
            muestras: muestrasFormateadas,
            pagination: {
                total,
                totalPages,
                currentPage: parseInt(page),
                limit: limitInt,
                hasNextPage,
                hasPrevPage
            }
        }, 'Muestras obtenidas correctamente');
    } catch (error) {
        next(error);
    }
};

const obtenerMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        const muestra = await Muestra.findOne({ id_muestra: id })
            .populate('creadoPor', 'nombre email documento')
            .lean();

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Obtener datos actualizados de los usuarios
        const [datosCliente, datosAdministrador] = await Promise.all([
            obtenerDatosUsuarioExterno(muestra.firmas.documentoCliente),
            obtenerDatosUsuarioExterno(muestra.firmas.documentoAdministrador)
        ]);

        // Formatear la fecha y actualizar datos de usuarios
        const muestraFormateada = {
            ...muestra,
            fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
            firmas: {
                ...muestra.firmas,
                fechaFirmaAdministrador: formatearFechaHora(muestra.firmas.fechaFirmaAdministrador),
                fechaFirmaCliente: formatearFechaHora(muestra.firmas.fechaFirmaCliente),
                datosAdministrador,
                datosCliente
            },
            historial: muestra.historial.map(h => ({
                ...h,
                fechaCambio: formatearFechaHora(h.fechaCambio)
            })),
            createdAt: formatearFechaHora(muestra.createdAt),
            updatedAt: formatearFechaHora(muestra.updatedAt)
        };

        ResponseHandler.success(res, { muestra: muestraFormateada }, 'Muestra obtenida correctamente');
    } catch (error) {
        next(error);
    }
};

const obtenerDatosUsuarioExterno = async (documento) => {
    try {
        console.log(`Consultando API externa para documento: ${documento}`);
        let userData;

        // Primero intentar con la ruta específica de roles
        try {
            const responseRoles = await axios.get(`${BASE_URL}/api/usuarios/roles/${documento}`);
            if (responseRoles.data && responseRoles.data.nombre) {
                userData = responseRoles.data;
                console.log('Usuario encontrado en API (roles):', userData);
            }
        } catch (rolesError) {
            console.log('No se encontró en roles, intentando ruta general');
        }

        // Si no se encontró en roles, intentar con la ruta general
        if (!userData) {
            const response = await axios.get(`${BASE_URL}/api/usuarios`, {
                params: { documento }
            });
            console.log('Respuesta de la API general:', response.data);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                userData = response.data[0];
                console.log('Usuario encontrado en API general:', userData);
            }
        }

        // Si aún no tenemos datos, buscar en la base de datos local
        if (!userData) {
            console.log('Buscando en base de datos local');
            const usuarioLocal = await Usuario.findOne({ documento }).lean();
            if (usuarioLocal) {
                userData = usuarioLocal;
                console.log('Usuario encontrado en base de datos local:', userData);
            }
        }

        // Si encontramos datos del usuario, devolverlos
        if (userData) {
            return {
                nombre: userData.nombre || 'Usuario no identificado',
                documento: userData.documento,
                email: userData.email,
                telefono: userData.telefono,
                direccion: userData.direccion
            };
        }

        // Si no se encontró el usuario en ninguna fuente
        console.log(`No se encontró usuario para documento: ${documento}, usando valor por defecto`);
        return {
            nombre: 'Usuario no identificado',
            documento: documento
        };
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error.message);
        return {
            nombre: 'Usuario no identificado',
            documento: documento
        };
    }
};

const registrarMuestra = async (req, res, next) => {
    try {
        const datos = req.body;
        
        // Validar los datos de la muestra
        validarDatosMuestra(datos);

        // Verificar que tenemos el ID del usuario
        if (!req.usuario || !req.usuario.id) {
            throw new ValidationError('Usuario no autenticado o ID no disponible');
        }

        // Obtener datos del administrador
        let datosAdministrador;
        try {
            datosAdministrador = await obtenerDatosUsuarioExterno(req.usuario.documento);
            if (!datosAdministrador || !datosAdministrador.nombre) {
                throw new Error('No se pudieron obtener los datos del administrador');
            }
            console.log('Datos del administrador:', datosAdministrador);
        } catch (error) {
            console.error('Error al obtener datos del administrador:', error);
            throw new ValidationError(`Error al obtener datos del administrador: ${error.message}`);
        }

        // Obtener datos del cliente
        let datosCliente;
        try {
            datosCliente = await obtenerDatosUsuarioExterno(datos.documento);
            console.log('Datos del cliente:', datosCliente);
        } catch (error) {
            console.error('Error al obtener datos del cliente:', error);
            datosCliente = {
                documento: datos.documento,
                nombre: 'Cliente no identificado',
                rol: 'cliente'
            };
        }

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

        // Crear la muestra con los datos formateados correctamente
        const muestra = new Muestra({
            ...datos,
            id_muestra,
            cliente: datosCliente,
            estado: 'Recibida',
            firmas: {
                administrador: datosAdministrador,
                cliente: datosCliente,
                firmaAdministrador: datos.firmas?.firmaAdministrador?.firma || '',
                fechaFirmaAdministrador: datos.firmas?.firmaAdministrador?.fecha || new Date(),
                firmaCliente: datos.firmas?.firmaCliente?.firma || '',
                fechaFirmaCliente: datos.firmas?.firmaCliente?.fecha || new Date()
            },
            creadoPor: datosAdministrador,
            historial: [{
                estado: 'Recibida',
                administrador: datosAdministrador,
                fechaCambio: new Date(),
                observaciones: datos.observaciones || 'Registro inicial de muestra'
            }],
            actualizadoPor: []
        });

        console.log('Datos de la muestra antes de guardar:', {
            cliente: muestra.cliente,
            creadoPor: muestra.creadoPor,
            firmas: muestra.firmas
        });

        // Guardar la muestra
        const muestraGuardada = await muestra.save();

        // Formatear las fechas para la respuesta
        const formatearFecha = (fecha) => {
            return {
                fecha: fecha.toLocaleDateString('es-CO'),
                hora: fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: 'numeric', hour12: true })
            };
        };

        // Preparar la respuesta
        const respuesta = {
            ...muestraGuardada.toObject(),
            createdAt: formatearFecha(muestraGuardada.createdAt),
            updatedAt: formatearFecha(muestraGuardada.updatedAt),
            fechaHoraMuestreo: formatearFecha(muestraGuardada.fechaHoraMuestreo),
            historial: muestraGuardada.historial.map(h => ({
                ...h,
                fechaCambio: formatearFecha(h.fechaCambio)
            })),
            firmas: {
                ...muestraGuardada.firmas,
                fechaFirmaAdministrador: formatearFecha(muestraGuardada.firmas.fechaFirmaAdministrador),
                fechaFirmaCliente: formatearFecha(muestraGuardada.firmas.fechaFirmaCliente)
            }
        };

        return res.status(201).json({
            success: true,
            message: 'Muestra registrada exitosamente',
            data: {
                muestra: respuesta
            }
        });

    } catch (error) {
        console.error('Error al registrar muestra:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        return ResponseHandler.error(res, new Error('Error interno al registrar la muestra'));
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
                        documento: usuario.documento,
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

        // Formatear fechas para la respuesta
        const formatearFecha = (fecha) => {
            return {
                fecha: fecha.toLocaleDateString('es-CO'),
                hora: fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: 'numeric', hour12: true })
            };
        };

        // Preparar la respuesta
        const respuesta = {
            ...muestra.toObject(),
            createdAt: formatearFecha(muestra.createdAt),
            updatedAt: formatearFecha(muestra.updatedAt),
            fechaHoraMuestreo: formatearFecha(muestra.fechaHoraMuestreo),
            historial: muestra.historial.map(h => ({
                ...h,
                fechaCambio: formatearFecha(h.fechaCambio)
            })),
            firmas: {
                ...muestra.firmas,
                fechaFirmaAdministrador: formatearFecha(muestra.firmas.fechaFirmaAdministrador),
                fechaFirmaCliente: formatearFecha(muestra.firmas.fechaFirmaCliente)
            }
        };

        ResponseHandler.success(res, { muestra: respuesta }, 'Muestra actualizada exitosamente');
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
    
    // Controladores de Muestras
    obtenerMuestras,
    obtenerMuestra,
    registrarMuestra,
    actualizarMuestra,
    registrarFirma,
    eliminarMuestra
};