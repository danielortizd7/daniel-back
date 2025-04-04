
const muestrasModel = require("../../../shared/models/muestrasModel");
const { Muestra } = require("../../../shared/models/muestrasModel");
const { Resultado } = require("../../ingreso-resultados/models/resultadoModel");


const estadosValidos = [
  "Recibida",
  "En análisis",
  "Finalizada",
  "Rechazada",
];

const cambiarEstadoMuestra = async (cedula, idMuestra, estado) => {
  try {
    if (!estadosValidos.includes(estado)) {
      throw new Error("Estado inválido.");
    }

    // Buscar la muestra con el ID correcto
    let muestra = await Muestra.findOne({ id_muestra: idMuestra });

    if (!muestra) {
      console.warn(`Advertencia: La muestra con ID ${idMuestra} no existe.`);
      return null;
    }

    // Agregar el nuevo estado al historial
    muestra.historial.push({
      estado,
      cedulaLaboratorista: cedula,
      fechaCambio: new Date(),
    });

    // Si el estado es "Finalizada", verificar si hay un resultado asociado
    if (estado === "Finalizada") {
      const resultado = await Resultado.findOne({ id_muestra: idMuestra });
      if (resultado) {
        muestra.resultado = resultado;
      } else {
        console.warn(`Advertencia: La muestra ${idMuestra} fue finalizada pero no tiene resultado.`);
      }
    }

    // Guardar los cambios en la base de datos
    await muestra.save();
    console.log(`Estado de la muestra ${idMuestra} cambiado a "${estado}" correctamente.`);
    
    return muestra;
  } catch (error) {
    console.error("Error al cambiar estado:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { cambiarEstadoMuestra };
