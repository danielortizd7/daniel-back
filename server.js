require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/database.js");
const { ResponseHandler } = require('./src/shared/utils/responseHandler');
const { registrarAccion } = require('./src/shared/middleware/auditMiddleware');

// Importar rutas
const muestrasRoutes = require("./src/app/registro-muestras/routes/muestrasRoutes");
const analisisRoutes = require("./src/app/registro-muestras/routes/analisisRoutes");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes");
const resultadosRoutes = require("./src/app/ingreso-resultados/routes/resultadoRoutes.js");
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes.js");
const auditoriaRoutes = require("./src/app/auditoria/routes/auditoriaRoutes.js");

const { verificarToken, login } = require('./src/shared/middleware/authMiddleware');

const app = express();

// Conectar a la base de datos
connectDB();

// Configuración de CORS
const whitelist = [
    'http://localhost:5173',  // Frontend en desarrollo local
    'http://localhost:5174',  // Frontend en desarrollo local (puerto alternativo)
    'https://laboratorio-sena.vercel.app', // Frontend en producción
    'https://web-sena-lab.vercel.app' // Frontend en Vercel
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origin (como las aplicaciones móviles o postman)
        if (!origin) return callback(null, true);
        
        if (whitelist.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Origen bloqueado por CORS:', origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Usuario-Documento',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-User-Role'
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Cache preflight request for 24 hours
}));

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar headers de usuario
app.use((req, res, next) => {
    const documento = req.headers['x-usuario-documento'];
    const rol = req.headers['x-user-role'];
    
    if (documento) {
        req.usuarioDocumento = documento;
    }
    if (rol) {
        req.usuarioRol = rol;
    }
    next();
});

// Middleware para manejar preflight requests
app.options('*', cors());

// Agregar middleware para manejar errores CORS
app.use((err, req, res, next) => {
    if (err.message === 'No permitido por CORS') {
        return res.status(403).json({
            error: 'CORS no permitido para este origen',
            origin: req.headers.origin
        });
    }
    next(err);
});

// Rutas no protegidas
app.post("/api/auth/login", login);

// Middleware para verificar token en rutas protegidas
app.use([
    "/api/muestras",
    "/api/registro-muestras",
    "/api/cambios-estado",
    "/api/ingreso-resultados",
    "/api/firma-digital",
    "/api/auditoria",
    "/api/analisis"
], verificarToken, registrarAccion);

// Rutas protegidas
app.use("/api/muestras", muestrasRoutes);
app.use("/api/registro-muestras", muestrasRoutes);
app.use("/api/analisis", analisisRoutes);
app.use("/api/cambios-estado", cambiosEstadoRoutes);
app.use("/api/ingreso-resultados", resultadosRoutes);
app.use("/api/firma-digital", firmaRoutes);
app.use("/api/auditoria", auditoriaRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({ message: "API funcionando correctamente" });
});

// Middleware unificado para manejo de errores
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return ResponseHandler.error(res, {
            statusCode: 401,
            message: 'Token inválido o expirado',
            requiresAuth: true
        });
    }

    ResponseHandler.error(res, err);
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 