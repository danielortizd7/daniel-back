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

exports.registrarResultado = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const {
      pH,
      turbidez,
      oxigenoDisuelto,
      nitratos,
      solidosSuspendidos,
      fosfatos,
      observaciones
    } = req.body;

    // Verificar que la muestra existe
    const muestraEncontrada = await Muestra.findOne({
      id_muestra: idMuestra.trim()
    }).collation({ locale: "es", strength: 2 });

    if (!muestraEncontrada) {
      throw new ValidationError("Muestra no encontrada");
    }

    // Verificar que la muestra esté en estado "Recibida"
    if (muestraEncontrada.estado !== "Recibida") {
      throw new ValidationError("Solo se pueden registrar resultados de muestras en estado 'Recibida'");
    }

    // Verificar que no existan resultados previos
    const resultadoExistente = await Resultado.findOne({ idMuestra: idMuestra.trim() });
    if (resultadoExistente) {
      throw new ValidationError("Esta muestra ya tiene resultados registrados");
    }

    // Validar que al menos un análisis tenga valor
    if (!pH && !turbidez && !oxigenoDisuelto && 
        !nitratos && !solidosSuspendidos && !fosfatos) {
      throw new ValidationError("Debe ingresar al menos un resultado");
    }

    // Obtener información del laboratorista del token
    const laboratorista = req.laboratorista;
    const fechaRegistro = new Date();

    // Procesar los valores iniciales
    const valoresIniciales = {
      pH: procesarMedicion(pH),
      turbidez: procesarMedicion(turbidez),
      oxigenoDisuelto: procesarMedicion(oxigenoDisuelto),
      nitratos: procesarMedicion(nitratos),
      solidosSuspendidos: procesarMedicion(solidosSuspendidos),
      fosfatos: procesarMedicion(fosfatos)
    };

    // Crear el registro inicial de cambios
    const cambiosIniciales = {};
    Object.entries(valoresIniciales).forEach(([campo, valor]) => {
      if (valor) {
        cambiosIniciales[campo] = {
          valorAnterior: "No registrado",
          valorNuevo: valor.valor,
          unidad: valor.unidad
        };
      }
    });

    if (observaciones) {
      cambiosIniciales.observaciones = {
        valorAnterior: "No registrado",
        valorNuevo: observaciones
      };
    }

    const historialInicial = {
      nombre: laboratorista.nombre,
      cedula: laboratorista.documento,
      fecha: fechaRegistro,
      cambiosRealizados: cambiosIniciales
    };

    const resultadoOrdenado = {
      idMuestra: idMuestra.trim(),
      documento: muestraEncontrada.documento,
      fechaHora: muestraEncontrada.fechaHora,
      tipoMuestreo: muestraEncontrada.tipoMuestreo,
      ...valoresIniciales,
      observaciones: observaciones || "Sin observaciones",
      verificado: false,
      cedulaLaboratorista: laboratorista.documento,
      nombreLaboratorista: laboratorista.nombre,
      historialCambios: [historialInicial]
    };

    const nuevoResultado = await Resultado.create(resultadoOrdenado);

    // Actualizar estado de la muestra
    await Muestra.findByIdAndUpdate(muestraEncontrada._id, {
      estado: "En análisis",
      $push: {
        historial: {
          estado: "En análisis",
          cedulaadministrador: laboratorista.documento,
          nombreadministrador: laboratorista.nombre,
          fechaCambio: new Date(),
          observaciones: "Resultados registrados"
        }
      }
    });

    return ResponseHandler.success(
      res,
      { resultado: nuevoResultado },
      "Resultado registrado exitosamente"
    );

  } catch (error) {
    console.error("Error registrando el resultado:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.obtenerResultados = async (req, res) => {
  try {
    const { idMuestra } = req.params;

    const resultado = await Resultado.findOne({ 
      idMuestra: idMuestra.trim() 
    }).collation({ locale: "es", strength: 2 });

    if (!resultado) {
      throw new ValidationError("No se encontraron resultados para esta muestra");
    }

    return ResponseHandler.success(
      res,
      { resultado },
      "Resultados obtenidos exitosamente"
    );

  } catch (error) {
    console.error("Error obteniendo resultados:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.editarResultado = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const {
      pH,
      turbidez,
      oxigenoDisuelto,
      nitratos,
      solidosSuspendidos,
      fosfatos,
      observaciones
    } = req.body;

    // Buscar el resultado existente
    const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() })
      .collation({ locale: "es", strength: 2 });

    if (!resultado) {
      throw new NotFoundError("Resultado no encontrado");
    }

    if (resultado.verificado) {
      throw new ValidationError("Este resultado ya fue verificado, no se puede editar");
    }

    // Validar que al menos un campo tenga valor
    if (!pH && !turbidez && !oxigenoDisuelto && 
        !nitratos && !solidosSuspendidos && !fosfatos) {
      throw new ValidationError("Debe ingresar al menos un resultado");
    }

    const fechaActualizacion = new Date();
    const valoresNuevos = {
      pH: procesarMedicion(pH),
      turbidez: procesarMedicion(turbidez),
      oxigenoDisuelto: procesarMedicion(oxigenoDisuelto),
      nitratos: procesarMedicion(nitratos),
      solidosSuspendidos: procesarMedicion(solidosSuspendidos),
      fosfatos: procesarMedicion(fosfatos)
    };

    const cambiosRealizados = {};
    Object.entries(valoresNuevos).forEach(([campo, valorNuevo]) => {
      if (valorNuevo && resultado[campo]) {
        const valorAnterior = resultado[campo].valor;
        
        if (valorAnterior !== valorNuevo.valor) {
          cambiosRealizados[campo] = {
            valorAnterior: valorAnterior,
            valorNuevo: valorNuevo.valor,
            unidad: valorNuevo.unidad
          };
        }
      }
    });

    // Manejar las observaciones de manera más controlada
    if (observaciones && observaciones !== resultado.observaciones) {
      const observacionAnterior = resultado.observaciones || "Sin observaciones";
      const observacionNueva = observaciones || "Sin observaciones";
      
      // Solo registrar el cambio si es diferente
      if (observacionAnterior !== observacionNueva) {
        cambiosRealizados.observaciones = {
          valorAnterior: observacionAnterior,
          valorNuevo: observacionNueva
        };
      }
    }

    // Solo actualizar si hay cambios
    if (Object.keys(cambiosRealizados).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se detectaron cambios para actualizar"
      });
    }

    const nuevoHistorial = {
      nombre: req.laboratorista.nombre,
      cedula: req.laboratorista.documento,
      fecha: fechaActualizacion,
      cambiosRealizados
    };

    // Actualizar el resultado
    const resultadoActualizado = await Resultado.findByIdAndUpdate(
      resultado._id,
      {
        $set: {
          ...valoresNuevos,
          observaciones: observaciones || resultado.observaciones || "Sin observaciones"
        },
        $push: {
          historialCambios: nuevoHistorial
        }
      },
      { new: true }
    );

    // Actualizar historial de la muestra
    const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() });
    if (muestra) {
      await Muestra.findByIdAndUpdate(muestra._id, {
        $push: {
          historial: {
            estado: muestra.estado,
            cedulaadministrador: req.laboratorista.documento,
            nombreadministrador: req.laboratorista.nombre,
            fechaCambio: new Date(),
            observaciones: "Resultados actualizados",
            detallesCambios: cambiosRealizados
          }
        }
      });
    }

    return ResponseHandler.success(
      res,
      { resultado: resultadoActualizado },
      "Resultado actualizado correctamente"
    );

  } catch (error) {
    console.error("Error al editar resultado:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.verificarResultado = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const { observaciones } = req.body;
    const administrador = req.usuario;

    const resultado = await Resultado.findOne({ 
      idMuestra: idMuestra.trim() 
    }).collation({ locale: "es", strength: 2 });

    if (!resultado) {
      throw new ValidationError("No se encontraron resultados para esta muestra");
    }

    // Verificar que no esté ya verificado
    if (resultado.verificado) {
      throw new ValidationError("Los resultados ya están verificados");
    }

    // Crear el registro de verificación
    const cambiosVerificacion = {
      verificado: {
        valorAnterior: false,
        valorNuevo: true
      }
    };

    // Si hay observaciones, incluirlas en el historial
    if (observaciones) {
      cambiosVerificacion.observaciones = {
        valorAnterior: resultado.observaciones || "Sin observaciones",
        valorNuevo: `[VERIFICACIÓN] ${observaciones}`
      };
      resultado.observaciones = `[VERIFICACIÓN] ${observaciones}`;
    }

    // Agregar entrada al historial
    resultado.historialCambios.push({
      nombre: administrador.nombre,
      cedula: administrador.documento,
      fecha: new Date(),
      cambiosRealizados: cambiosVerificacion
    });

    resultado.verificado = true;
    await resultado.save();

    // Actualizar estado de la muestra
    const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() });
    await Muestra.findByIdAndUpdate(muestra._id, {
      estado: "Verificada",
      $push: {
        historial: {
          estado: "Verificada",
          cedulaadministrador: administrador.documento,
          nombreadministrador: administrador.nombre,
          fechaCambio: new Date(),
          observaciones: observaciones 
            ? `Resultados verificados por administrador: ${observaciones}`
            : "Resultados verificados por administrador"
        }
      }
    });

    return ResponseHandler.success(
      res,
      { resultado },
      observaciones 
        ? `Resultados verificados exitosamente con observaciones: ${observaciones}`
        : "Resultados verificados exitosamente"
    );

  } catch (error) {
    console.error("Error verificando resultados:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.obtenerTodosResultados = async (req, res) => {
  try {
    const resultados = await Resultado.find()
      .sort({ createdAt: -1 }); // Ordenados por fecha de creación, más recientes primero

    return ResponseHandler.success(
      res,
      { resultados },
      "Resultados obtenidos exitosamente"
    );

  } catch (error) {
    console.error("Error obteniendo todos los resultados:", error);
    return ResponseHandler.error(res, error);
  }
};
