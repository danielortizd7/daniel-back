const express = require('express');
const router = express.Router();
const muestrasController = require('../controllers/muestrasController');
const { verificarDocumento } = require('../../../shared/middleware/authMiddleware');

// Ruta para crear una nueva muestra
router.post('/', verificarDocumento, muestrasController.crearMuestra);

// Ruta para obtener todas las muestras
router.get('/', verificarDocumento, muestrasController.obtenerMuestras);

// Ruta para obtener muestras por tipo
router.get('/tipo/:tipo', verificarDocumento, muestrasController.obtenerMuestrasPorTipo);

// Ruta para obtener muestras por estado
router.get('/estado/:estado', verificarDocumento, muestrasController.obtenerMuestrasPorEstado);

// Ruta para obtener una muestra específica por ID
router.get('/:id', verificarDocumento, muestrasController.obtenerMuestra);

// Ruta para actualizar una muestra
router.put('/:id', verificarDocumento, muestrasController.actualizarMuestra);

// Ruta para registrar firma en una muestra
router.post('/:idMuestra/firma', verificarDocumento, muestrasController.registrarFirma);

module.exports = router; 