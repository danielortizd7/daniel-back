const express = require('express');
const router = express.Router();
const { verificarToken, verificarRolAdministrador, verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { senaLabValidators } = require('../../../shared/validators');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError } = require('../../../shared/errors/AppError');

// Importar controladores
const muestrasController = require('../controllers/muestrasController');

// Rutas protegidas con autenticación y validación
router.get('/muestras', verificarToken, muestrasController.obtenerMuestras);
router.get('/muestras/tipo/:tipo', verificarToken, muestrasController.obtenerMuestrasPorTipo);
router.get('/muestras/estado/:estado', verificarToken, muestrasController.obtenerMuestrasPorEstado);
router.get('/muestras/:id', verificarToken, muestrasController.obtenerMuestra);

// Rutas que requieren rol de administrador
router.post('/muestras', verificarToken, verificarRolAdministrador, senaLabValidators.crearMuestra, muestrasController.crearMuestra);
router.put('/muestras/:id', verificarToken, verificarRolAdministrador, senaLabValidators.actualizarMuestra, muestrasController.actualizarMuestra);
router.delete('/muestras/:id', verificarToken, verificarRolAdministrador, muestrasController.eliminarMuestra);

module.exports = router; 