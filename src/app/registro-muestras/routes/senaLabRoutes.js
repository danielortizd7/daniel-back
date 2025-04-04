const express = require('express');
const router = express.Router();
const { verificarToken, verificarRolAdministrador, verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { senaLabValidators } = require('../../../shared/validators');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError } = require('../../../shared/errors/AppError');

// Importar controladores
const muestrasController = require('../controllers/muestrasController');

// Rutas de Análisis
router.get('/analisis', verificarToken, muestrasController.obtenerAnalisis);
router.get('/analisis/tipo', verificarToken, muestrasController.obtenerAnalisisPorTipoAgua);

// Rutas de Muestras
router.get('/muestras', verificarToken, muestrasController.obtenerMuestras);
router.get('/muestras/:id', verificarToken, muestrasController.obtenerMuestra);
router.post('/muestras', verificarToken, muestrasController.registrarMuestra);
router.put('/muestras/:id', verificarToken, muestrasController.actualizarMuestra);
router.delete('/muestras/:id', verificarToken, muestrasController.eliminarMuestra);

module.exports = router; 