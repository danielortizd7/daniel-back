const express = require('express');
const router = express.Router();
const { verificarDocumento } = require('../../../shared/middleware/authMiddleware');
const muestrasController = require('../controllers/muestrasController');

// Rutas de Análisis
router.get('/analisis', verificarDocumento, muestrasController.obtenerAnalisis);
router.get('/analisis/tipo', verificarDocumento, muestrasController.obtenerAnalisisPorTipoAgua);

// Rutas de Muestras
router.post('/muestras', verificarDocumento, muestrasController.registrarMuestra);
router.get('/muestras', verificarDocumento, muestrasController.obtenerMuestras);
router.get('/muestras/:id', verificarDocumento, muestrasController.obtenerMuestra);
router.put('/muestras/:id', verificarDocumento, muestrasController.actualizarMuestra);
router.delete('/muestras/:id', verificarDocumento, muestrasController.eliminarMuestra);

// Ruta para validar usuario
router.get('/validar-usuario', verificarDocumento, muestrasController.validarUsuarioController);

// Aquí puedes agregar más rutas relacionadas con el registro de muestras
// Por ejemplo:
// router.post('/muestras', authenticateToken, crearMuestraController);
// router.get('/muestras', authenticateToken, obtenerMuestrasController);
// etc.

module.exports = router; 