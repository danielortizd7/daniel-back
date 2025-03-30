const Resultado = require("../models/resultadoModel");

const procesarValorUnidad = (dato) => {
  if (typeof dato === 'string') {
    // Si es string, separar el valor y la unidad
    const partes = dato.split(' ');
    return {
      valor: partes[0],
      unidad: partes[1] || ''
    };
  } else if (typeof dato === 'object' && dato !== null) {
    // Si ya es un objeto, retornarlo como está
    return dato;
  }
  return null;
};

const registrarResultado = async (datos) => {
  try {
    // Procesar los datos de entrada
    const datosFormateados = {};
    
    // Procesar cada campo si existe
    const campos = ['pH', 'turbidez', 'oxigenoDisuelto', 'nitratos', 'solidosSuspendidos', 'fosfatos'];
    campos.forEach(campo => {
      if (datos[campo]) {
        const valorProcesado = procesarValorUnidad(datos[campo]);
        if (valorProcesado) {
          datosFormateados[campo] = {
            valor: valorProcesado.valor,
            unidad: valorProcesado.unidad || obtenerUnidadPorDefecto(campo)
          };
        }
      }
    });

    // Crear el resultado con los valores iniciales
    const resultado = new Resultado({
      idMuestra: datos.idMuestra,
      documento: datos.documento,
      fechaHora: datos.fechaHora || new Date(),
      tipoMuestreo: datos.tipoMuestreo || "Simple",
      pH: datosFormateados.pH,
      turbidez: datosFormateados.turbidez,
      oxigenoDisuelto: datosFormateados.oxigenoDisuelto,
      nitratos: datosFormateados.nitratos,
      solidosSuspendidos: datosFormateados.solidosSuspendidos,
      fosfatos: datosFormateados.fosfatos,
      observaciones: datos.observaciones || "",
      verificado: false,
      cedulaLaboratorista: datos.cedulaLaboratorista,
      nombreLaboratorista: datos.nombreLaboratorista,
      historialCambios: [] // El historial comienza vacío, solo se llenará con los PUT
    });

    console.log("Registrando resultado inicial:", JSON.stringify({
      idMuestra: resultado.idMuestra,
      valores: {
        pH: resultado.pH,
        turbidez: resultado.turbidez,
        oxigenoDisuelto: resultado.oxigenoDisuelto,
        nitratos: resultado.nitratos,
        solidosSuspendidos: resultado.solidosSuspendidos,
        fosfatos: resultado.fosfatos
      },
      observaciones: resultado.observaciones
    }, null, 2));

    await resultado.save();
    return resultado;
  } catch (error) {
    console.error("Error al registrar el resultado:", error);
    throw new Error("Error al registrar el resultado: " + error.message);
  }
};

// Función auxiliar para obtener la unidad por defecto según el campo
const obtenerUnidadPorDefecto = (campo) => {
  switch (campo) {
    case 'pH':
      return 'mv';
    case 'turbidez':
      return 'NTU';
    case 'fosfatos':
      return 'mg/k';
    default:
      return 'mg/L';
  }
};

module.exports = { registrarResultado };
