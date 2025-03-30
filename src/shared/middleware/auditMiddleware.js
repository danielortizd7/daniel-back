const auditoriaService = require('../../app/auditoria/services/auditoriaService');

const registrarAccion = async (req, res, next) => {
    try {
        // Guardar la función original de res.json
        const originalJson = res.json;
        
        // Sobrescribir res.json para capturar la respuesta
        res.json = function(data) {
            // Registrar la acción después de que se complete
            const datosAuditoria = {
                usuario: {
                    id: req.usuario?.id,
                    nombre: req.usuario?.nombre,
                    rol: req.usuario?.rol,
                    documento: req.usuario?.documento,
                    permisos: req.usuario?.permisos || []
                },
                accion: {
                    tipo: req.method,
                    ruta: req.originalUrl,
                    descripcion: `${req.method} ${req.originalUrl}`,
                    permisosRequeridos: req.usuario?.permisos || []
                },
                detalles: {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    parametros: req.body,
                    query: req.query
                },
                fecha: new Date(),
                estado: res.statusCode < 400 ? 'exitoso' : 'fallido',
                mensaje: data?.message || 'Operación completada',
                duracion: Date.now() - req._startTime
            };

            // Registrar la acción de forma asíncrona
            auditoriaService.registrarAccion(datosAuditoria).catch(error => {
                console.error('Error al registrar acción en auditoría:', error);
            });

            // Llamar a la función original de res.json
            return originalJson.call(this, data);
        };

        // Guardar el tiempo de inicio de la petición
        req._startTime = Date.now();

        next();
    } catch (error) {
        console.error('Error en middleware de auditoría:', error);
        next(error);
    }
};

module.exports = {
    registrarAccion
}; 