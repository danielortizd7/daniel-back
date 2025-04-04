const express = require('express');
const router = express.Router();
const muestrasController = require('../controllers/muestrasController');
const { verificarDocumento } = require('../../../shared/middleware/authMiddleware');

// Rutas de Tipos de Agua
router.get('/tipos-agua', verificarDocumento, muestrasController.obtenerTiposAgua);
router.post('/tipos-agua', verificarDocumento, muestrasController.crearTipoAgua);
router.put('/tipos-agua/:id', verificarDocumento, muestrasController.actualizarTipoAgua);

// Rutas de Análisis
router.get('/analisis', verificarDocumento, muestrasController.obtenerAnalisis);
router.get('/analisis/tipo', verificarDocumento, muestrasController.obtenerAnalisisPorTipoAgua);

// Rutas de Muestras
router.post('/', verificarDocumento, muestrasController.registrarMuestra);
router.get('/', verificarDocumento, muestrasController.obtenerMuestras);
router.get('/:id', verificarDocumento, muestrasController.obtenerMuestra);
router.put('/:id', verificarDocumento, muestrasController.actualizarMuestra);
router.delete('/:id', verificarDocumento, muestrasController.eliminarMuestra);

// Ruta para registrar firmas
router.post('/:id/firmas', verificarDocumento, muestrasController.registrarFirma);

module.exports = router; 