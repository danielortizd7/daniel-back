const express = require('express');
const router = express.Router();
const { verificarToken } = require('../../../shared/middleware/authMiddleware');
const { verificarRolAdmin } = require('../../../shared/middleware/roles');
const {
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua
} = require('../controllers/tiposAguaController');

// Rutas públicas
router.get('/', obtenerTiposAgua);

// Rutas protegidas (solo admin)
router.post('/', [verificarToken, verificarRolAdmin], crearTipoAgua);
router.put('/:id', [verificarToken, verificarRolAdmin], actualizarTipoAgua);

module.exports = router;
