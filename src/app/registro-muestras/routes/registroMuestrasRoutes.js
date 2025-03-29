const express = require('express');
const router = express.Router();
const { verificarDocumento } = require('../../../shared/middleware/authMiddleware');
const { validarUsuarioController } = require('../controllers/muestrasController');

// Ruta para validar usuario (requiere autenticación)
router.get('/validar-usuario', verificarDocumento, validarUsuarioController);

// Aquí puedes agregar más rutas relacionadas con el registro de muestras
// Por ejemplo:
// router.post('/muestras', authenticateToken, crearMuestraController);
// router.get('/muestras', authenticateToken, obtenerMuestrasController);
// etc.

module.exports = router; 