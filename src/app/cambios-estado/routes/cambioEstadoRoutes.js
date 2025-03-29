const express = require("express");
const router = express.Router();
const cambioEstadoController = require("../controllers/cambioEstadoController");
const { cambioEstadoValidators } = require("../../../shared/validators");
const { verificarDocumento, verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");

// Ruta para cambiar estado (solo laboratorista)
router.post(
  "/cambiar/:idMuestra",
  verificarDocumento,
  verificarLaboratorista,
  cambioEstadoValidators.cambiarEstado,
  cambioEstadoController.cambiarEstado
);

// Ruta para actualizar estado (solo laboratorista)
router.put(
  "/actualizar/:idMuestra",
  verificarDocumento,
  verificarLaboratorista,
  cambioEstadoValidators.cambiarEstado,
  cambioEstadoController.actualizarEstado
);

module.exports = router;

