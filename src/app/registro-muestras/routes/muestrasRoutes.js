const express = require('express');
const router = express.Router();
const { verificarDocumento, verificarToken, verificarRolAdministrador, verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { senaLabValidators } = require('../../../shared/validators');
const muestrasController = require('../controllers/muestrasController');

// ===== RUTAS PÚBLICAS (verificarDocumento) =====
// Ruta para validar usuario
router.get('/public/validar-usuario', verificarDocumento, muestrasController.validarUsuarioController);

// ===== RUTAS PROTEGIDAS (verificarToken) =====
// Rutas de Tipos de Agua (solo administradores)
router.get('/tipos-agua', verificarToken, verificarRolAdministrador, muestrasController.obtenerTiposAgua);
router.post('/tipos-agua', verificarToken, verificarRolAdministrador, muestrasController.crearTipoAgua);
router.put('/tipos-agua/:id', verificarToken, verificarRolAdministrador, muestrasController.actualizarTipoAgua);

// Rutas de Muestras
router.post('/', verificarToken, muestrasController.registrarMuestra);
router.get('/', verificarToken, muestrasController.obtenerMuestras);
router.get('/:id', verificarToken, muestrasController.obtenerMuestra);
router.put('/:id', verificarToken, muestrasController.actualizarMuestra);
router.delete('/:id', verificarToken, verificarRolAdministrador, muestrasController.eliminarMuestra);

// ===== RUTAS DE LABORATORIO (verificarLaboratorista) =====
// Rutas específicas para laboratoristas
router.get('/lab', verificarToken, verificarLaboratorista, muestrasController.obtenerMuestras);
router.get('/lab/:id', verificarToken, verificarLaboratorista, muestrasController.obtenerMuestra);

module.exports = router; 