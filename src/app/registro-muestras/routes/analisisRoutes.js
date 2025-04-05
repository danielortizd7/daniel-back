const express = require('express');
const router = express.Router();
const { getAnalisisSimplificado, getDetalleAnalisis } = require('../controllers/analisisController');
const { verificarToken } = require('../../../shared/middleware/authMiddleware');

// Rutas específicas para cada tipo de análisis
router.get('/fisicoquimicos', verificarToken, (req, res) => {
    req.query.tipoAnalisis = 'fisicoquimico';
    getAnalisisSimplificado(req, res);
});

router.get('/microbiologicos', verificarToken, (req, res) => {
    req.query.tipoAnalisis = 'microbiologico';
    getAnalisisSimplificado(req, res);
});

// Ruta para obtener los detalles completos de un análisis específico
router.get('/detalle', verificarToken, getDetalleAnalisis);

module.exports = router; 