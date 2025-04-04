const { validationResult } = require('express-validator');
const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");
const { ResponseHandler } = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError, AuthorizationError } = require("../../../shared/errors/AppError");
const { Muestra } = require("../../../shared/models/muestrasModel");

// Validar que los valores numéricos sean válidos
const validarValoresNumericos = (datos) => {
  const campos = ['pH', 'turbidez', 'oxigenoDisuelto', 'nitratos', 'solidosSuspendidos', 'fosfatos'];
  campos.forEach(campo => {
    if (datos[campo] !== undefined) {
      const valor = Number(datos[campo]);
      if (isNaN(valor)) {
        throw new ValidationError(`El valor de ${campo} debe ser numérico`);
      }
      // Validaciones específicas para cada campo
      switch (campo) {
        case 'pH':
          if (valor < 0 || valor > 14) {
            throw new ValidationError('El pH debe estar entre 0 y 14');
          }
          break;
        case 'turbidez':
        case 'oxigenoDisuelto':
        case 'nitratos':
        case 'solidosSuspendidos':
        case 'fosfatos':
          if (valor < 0) {
            throw new ValidationError(`El valor de ${campo} no puede ser negativo`);
          }
          break;
      }
    }
  });
};

const procesarMedicion = (valorCompleto) => {
  if (!valorCompleto) return null;

  // Si es un string, procesamos el formato "valor unidad"
  const valorStr = valorCompleto.toString().trim();
  
  // Si tiene formato "1.3mg/L" (sin espacio)
  const matchSinEspacio = valorStr.match(/^([\d.]+)(.+)$/);
  if (matchSinEspacio) {
    return {
      valor: matchSinEspacio[1],
      unidad: matchSinEspacio[2].trim()
    };
  }

  // Si tiene formato "7.5 mv" (con espacio)
  const partes = valorStr.split(' ');
  if (partes.length >= 2) {
    return {
      valor: partes[0],
      unidad: partes.slice(1).join(' ').trim()
    };
  }

  // Si no tiene unidad
  return {
    valor: valorStr,
    unidad: ''
  };
};

const formatearValorCompleto = (valor, unidad) => {
  if (!valor) return '';
  return unidad ? `${valor} ${unidad}` : valor;
};

const crearCambioMedicion = (campo, valorAnterior, valorNuevo) => {
  const anterior = valorAnterior ? formatearValorCompleto(valorAnterior.valor, valorAnterior.unidad) : "No registrado";
  const nuevo = formatearValorCompleto(valorNuevo.valor, valorNuevo.unidad);
  
  return {
    valorAnterior: anterior,
    valorNuevo: nuevo,
    unidad: valorNuevo.unidad
  };
};

const registrarResultado = async (req, res, next) => {
    try {
        const { idMuestra } = req.params;
        const { resultados, observaciones } = req.body;
        const usuario = req.usuario; // Datos del usuario del token

        // Validar que la muestra existe
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            throw new ValidationError('Muestra no encontrada');
        }

        // Validar que hay resultados y que es un objeto
        if (!resultados || typeof resultados !== 'object' || Array.isArray(resultados)) {
            throw new ValidationError('Los resultados deben ser un objeto con al menos un análisis');
        }

        // Validar que hay al menos un resultado
        if (Object.keys(resultados).length === 0) {
            throw new ValidationError('Debe ingresar al menos un resultado');
        }

        // Validar que los análisis registrados correspondan a los seleccionados
        const analisisNoSeleccionados = Object.keys(resultados).filter(
            analisis => !muestra.analisisSeleccionados.includes(analisis)
        );

        if (analisisNoSeleccionados.length > 0) {
            throw new ValidationError(`Los siguientes análisis no fueron seleccionados originalmente: ${analisisNoSeleccionados.join(', ')}`);
        }

        // Preparar el registro de cambios
        const cambiosRealizados = {
            resultados: {}
        };

        // Validar estructura de cada resultado y preparar registro de cambios
        Object.entries(resultados).forEach(([analisis, resultado]) => {
            if (!resultado || typeof resultado !== 'object') {
                throw new ValidationError(`El resultado para ${analisis} debe ser un objeto`);
            }
            if (!resultado.valor) {
                throw new ValidationError(`Debe especificar un valor para ${analisis}`);
            }
            if (!resultado.unidad) {
                throw new ValidationError(`Debe especificar una unidad para ${analisis}`);
            }

            // Registrar cambios para cada análisis
            cambiosRealizados.resultados[analisis] = {
                valorAnterior: muestra.resultados?.[analisis]?.valor || "",
                valorNuevo: resultado.valor,
                unidad: resultado.unidad
            };
        });

        // Registrar cambios en observaciones
        if (observaciones) {
            cambiosRealizados.observaciones = {
                valorAnterior: muestra.observaciones || "",
                valorNuevo: observaciones
            };
        }

        // Crear entrada en el historial de cambios
        const cambioHistorial = {
            nombre: usuario.nombre,
            cedula: usuario.documento,
            fecha: new Date(),
            cambiosRealizados
        };

        // Actualizar la muestra
        const actualizacion = {
            resultados,
            observaciones,
            verificado: false,
            cedulaLaboratorista: usuario.documento,
            nombreLaboratorista: usuario.nombre,
            $push: {
                historialCambios: cambioHistorial
            }
        };

        const muestraActualizada = await Muestra.findOneAndUpdate(
            { id_muestra: idMuestra },
            actualizacion,
            { new: true }
        );

        if (!muestraActualizada) {
            throw new ValidationError('Error al actualizar la muestra');
        }

        ResponseHandler.success(res, { 
            muestra: muestraActualizada 
        }, 'Resultados registrados exitosamente');

    } catch (error) {
        console.error('Error al registrar resultados:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const editarResultado = async (req, res, next) => {
    try {
        const { idMuestra } = req.params;
        const { resultados, observaciones } = req.body;
        const usuario = req.usuario; // Datos del usuario del token

        // Validar que la muestra existe
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            throw new ValidationError('Muestra no encontrada');
        }

        // Las mismas validaciones que en registrar
        if (!resultados || typeof resultados !== 'object' || Array.isArray(resultados)) {
            throw new ValidationError('Los resultados deben ser un objeto con al menos un análisis');
        }

        if (Object.keys(resultados).length === 0) {
            throw new ValidationError('Debe ingresar al menos un resultado');
        }

        // Preparar el registro de cambios
        const cambiosRealizados = {
            resultados: {}
        };

        // Validar y registrar cambios para cada resultado
        Object.entries(resultados).forEach(([analisis, resultado]) => {
            if (!resultado || typeof resultado !== 'object') {
                throw new ValidationError(`El resultado para ${analisis} debe ser un objeto`);
            }
            if (!resultado.valor) {
                throw new ValidationError(`Debe especificar un valor para ${analisis}`);
            }
            if (!resultado.unidad) {
                throw new ValidationError(`Debe especificar una unidad para ${analisis}`);
            }

            // Solo registrar si hay cambios
            if (muestra.resultados?.[analisis]?.valor !== resultado.valor) {
                cambiosRealizados.resultados[analisis] = {
                    valorAnterior: muestra.resultados?.[analisis]?.valor || "",
                    valorNuevo: resultado.valor,
                    unidad: resultado.unidad
                };
            }
        });

        // Registrar cambios en observaciones si hay
        if (observaciones && observaciones !== muestra.observaciones) {
            cambiosRealizados.observaciones = {
                valorAnterior: muestra.observaciones || "",
                valorNuevo: observaciones
            };
        }

        // Solo actualizar si hay cambios
        if (Object.keys(cambiosRealizados.resultados).length > 0 || cambiosRealizados.observaciones) {
            const cambioHistorial = {
                nombre: usuario.nombre,
                cedula: usuario.documento,
                fecha: new Date(),
                cambiosRealizados
            };

            const actualizacion = {
                resultados: {
                    ...muestra.resultados,
                    ...resultados
                },
                observaciones,
                verificado: false,
                $push: {
                    historialCambios: cambioHistorial
                }
            };

            const muestraActualizada = await Muestra.findOneAndUpdate(
                { id_muestra: idMuestra },
                actualizacion,
                { new: true }
            );

            if (!muestraActualizada) {
                throw new ValidationError('Error al actualizar la muestra');
            }

            ResponseHandler.success(res, { 
                muestra: muestraActualizada 
            }, 'Resultados actualizados exitosamente');
        } else {
            ResponseHandler.success(res, { 
                muestra 
            }, 'No se detectaron cambios en los resultados');
        }

    } catch (error) {
        console.error('Error al editar resultados:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const obtenerResultados = async (req, res, next) => {
    try {
        const { idMuestra } = req.params;

        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            throw new ValidationError('Muestra no encontrada');
        }

        ResponseHandler.success(res, {
            resultados: muestra.resultados,
            observaciones: muestra.observaciones,
            historialCambios: muestra.historialCambios,
            verificado: muestra.verificado
        });

    } catch (error) {
        console.error('Error al obtener resultados:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const verificarResultado = async (req, res, next) => {
    try {
        const { idMuestra } = req.params;
        const usuario = req.usuario;

        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: idMuestra },
            { 
                verificado: true,
                $push: {
                    historialCambios: {
                        nombre: usuario.nombre,
                        cedula: usuario.documento,
                        fecha: new Date(),
                        cambiosRealizados: {
                            verificacion: {
                                valorAnterior: false,
                                valorNuevo: true
                            }
                        }
                    }
                }
            },
            { new: true }
        );

        if (!muestra) {
            throw new ValidationError('Muestra no encontrada');
        }

        ResponseHandler.success(res, { 
            muestra 
        }, 'Resultados verificados exitosamente');

    } catch (error) {
        console.error('Error al verificar resultados:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const obtenerTodosResultados = async (req, res, next) => {
    try {
        const muestras = await Muestra.find({
            resultados: { $exists: true, $ne: {} }
        }).sort({ createdAt: -1 });

        ResponseHandler.success(res, {
            resultados: muestras
        }, 'Resultados obtenidos exitosamente');

    } catch (error) {
        console.error('Error al obtener todos los resultados:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

module.exports = {
    registrarResultado,
    editarResultado,
    obtenerResultados,
    verificarResultado,
    obtenerTodosResultados
};
