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

exports.registrarResultado = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const {
      pH,
      turbidez,
      oxigenoDisuelto,
      nitratos,
      solidosSuspendidos,
      fosfatos
    } = req.body;

    // Verificar que la muestra existe
    const muestraEncontrada = await Muestra.findOne({
      id_muestra: idMuestra.trim()
    }).collation({ locale: "es", strength: 2 });

    if (!muestraEncontrada) {
      throw new ValidationError("Muestra no encontrada");
    }

    // Verificar que la muestra tenga firmas
    if (!muestraEncontrada.firmas || !muestraEncontrada.firmas.cedulaLaboratorista || !muestraEncontrada.firmas.cedulaCliente) {
      throw new ValidationError("La muestra debe tener firmas registradas para poder ingresar resultados");
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
    if (!pH?.valor && !turbidez?.valor && !oxigenoDisuelto?.valor && 
        !nitratos?.valor && !solidosSuspendidos?.valor && !fosfatos?.valor) {
      throw new ValidationError("Debe ingresar al menos un resultado");
    }

    // Obtener información del laboratorista del token
    const laboratorista = req.laboratorista;

    const resultadoOrdenado = {
      idMuestra: idMuestra.trim(),
      documento: muestraEncontrada.documento,
      fechaHora: muestraEncontrada.fechaHora,
      tipoMuestreo: muestraEncontrada.tipoMuestreo,
      pH: pH?.valor ? { 
        valor: pH.valor.toString().trim(),
        unidad: "mg/L"
      } : undefined,
      turbidez: turbidez?.valor ? {
        valor: turbidez.valor.toString().trim(),
        unidad: "NTU"
      } : undefined,
      oxigenoDisuelto: oxigenoDisuelto?.valor ? {
        valor: oxigenoDisuelto.valor.toString().trim(),
        unidad: "mg/L"
      } : undefined,
      nitratos: nitratos?.valor ? {
        valor: nitratos.valor.toString().trim(),
        unidad: "mg/L"
      } : undefined,
      solidosSuspendidos: solidosSuspendidos?.valor ? {
        valor: solidosSuspendidos.valor.toString().trim(),
        unidad: "mg/L"
      } : undefined,
      fosfatos: fosfatos?.valor ? {
        valor: fosfatos.valor.toString().trim(),
        unidad: "mg/L"
      } : undefined,
      verificado: false,
      cedulaLaboratorista: laboratorista.documento,
      nombreLaboratorista: laboratorista.nombre,
      historialCambios: [
        {
          nombre: laboratorista.nombre,
          cedula: laboratorista.documento,
          fecha: new Date()
        }
      ]
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

    // Verificar que sea el mismo laboratorista
    const laboratorista = req.laboratorista;
    if (resultado.cedulaLaboratorista !== laboratorista.documento) {
      throw new AuthorizationError("No autorizado para modificar este resultado");
    }

    // Validar que al menos un campo tenga valor
    if (!pH?.valor && !turbidez?.valor && !oxigenoDisuelto?.valor && 
        !nitratos?.valor && !solidosSuspendidos?.valor && !fosfatos?.valor) {
      throw new ValidationError("Debe ingresar al menos un resultado");
    }

    // Preparar los cambios
    const cambios = {};
    let hayCambios = false;
    const cambiosRealizados = {}; // Objeto para almacenar los cambios realizados

    // Función auxiliar para actualizar un campo si hay cambios
    const actualizarCampo = (campo, nuevoValor) => {
      if (nuevoValor?.valor !== undefined) {
        const valor = nuevoValor.valor.toString().trim();
        
        // Solo registrar cambio si el valor es diferente
        if (!resultado[campo] || resultado[campo].valor !== valor) {
          // Guardar el valor anterior y el nuevo valor
          cambiosRealizados[campo] = {
            valorAnterior: resultado[campo]?.valor || 'No registrado',
            valorNuevo: valor,
            unidad: resultado[campo]?.unidad || (campo === 'turbidez' ? 'NTU' : 'mg/L')
          };

          // Actualizar el valor en el resultado
          cambios[campo] = {
            valor: valor,
            unidad: resultado[campo]?.unidad || (campo === 'turbidez' ? 'NTU' : 'mg/L')
          };
          resultado[campo] = cambios[campo];
          hayCambios = true;
        }
      }
    };

    // Actualizar cada campo si hay cambios
    actualizarCampo('pH', pH);
    actualizarCampo('turbidez', turbidez);
    actualizarCampo('oxigenoDisuelto', oxigenoDisuelto);
    actualizarCampo('nitratos', nitratos);
    actualizarCampo('solidosSuspendidos', solidosSuspendidos);
    actualizarCampo('fosfatos', fosfatos);

    // Manejar las observaciones
    if (observaciones !== undefined && observaciones !== resultado.observaciones) {
      // Buscar la última entrada en el historial que tenga observaciones
      let ultimaObservacion = 'No registrado';
      if (resultado.historialCambios && resultado.historialCambios.length > 0) {
        for (let i = resultado.historialCambios.length - 1; i >= 0; i--) {
          const cambio = resultado.historialCambios[i];
          if (cambio.cambiosRealizados?.observaciones?.valorNuevo) {
            ultimaObservacion = cambio.cambiosRealizados.observaciones.valorNuevo;
            break;
          }
        }
      }

      cambiosRealizados.observaciones = {
        valorAnterior: resultado.observaciones || ultimaObservacion,
        valorNuevo: observaciones
      };
      cambios.observaciones = observaciones;
      resultado.observaciones = observaciones;
      hayCambios = true;
    }

    if (!hayCambios) {
      throw new ValidationError("No se realizaron cambios");
    }

    // Registrar el cambio en el historial con los valores específicos
    resultado.historialCambios.push({
      nombre: laboratorista.nombre,
      cedula: laboratorista.documento,
      fecha: new Date(),
      cambiosRealizados: cambiosRealizados
    });

    await resultado.save();

    // Actualizar historial de la muestra
    const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() });
    if (muestra) {
      await Muestra.findByIdAndUpdate(muestra._id, {
        $push: {
          historial: {
            estado: muestra.estado,
            cedulaadministrador: laboratorista.documento,
            nombreadministrador: laboratorista.nombre,
            fechaCambio: new Date(),
            observaciones: "Resultados actualizados",
            detallesCambios: cambiosRealizados
          }
        }
      });
    }

    return ResponseHandler.success(
      res,
      { resultado },
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
    const laboratorista = req.laboratorista;

    const resultado = await Resultado.findOne({ 
      idMuestra: idMuestra.trim() 
    }).collation({ locale: "es", strength: 2 });

    if (!resultado) {
      throw new ValidationError("No se encontraron resultados para esta muestra");
    }

    // Verificar que no sea el mismo laboratorista que registró
    if (resultado.cedulaLaboratorista === laboratorista.documento) {
      throw new ValidationError("No puede verificar sus propios resultados");
    }

    // Verificar que no esté ya verificado
    if (resultado.verificado) {
      throw new ValidationError("Los resultados ya están verificados");
    }

    resultado.verificado = true;
    resultado.historialCambios.push({
      nombre: laboratorista.nombre,
      cedula: laboratorista.documento,
      fecha: new Date()
    });

    await resultado.save();

    // Actualizar estado de la muestra
    const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() });
    await Muestra.findByIdAndUpdate(muestra._id, {
      estado: "Verificada",
      $push: {
        historial: {
          estado: "Verificada",
          cedulaadministrador: laboratorista.documento,
          nombreadministrador: laboratorista.nombre,
          fechaCambio: new Date(),
          observaciones: "Resultados verificados"
        }
      }
    });

    return ResponseHandler.success(
      res,
      { resultado },
      "Resultados verificados exitosamente"
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
