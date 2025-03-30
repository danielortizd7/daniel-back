/**
 * @swagger
 * /api/auditoria/registros:
 *   get:
 *     summary: Obtener registros de auditoría
 *     description: Obtiene una lista paginada de registros de auditoría con opciones de filtrado
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio para filtrar registros
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin para filtrar registros
 *       - in: query
 *         name: usuario
 *         schema:
 *           type: string
 *         description: Documento del usuario para filtrar registros
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [administrador, laboratorista, cliente]
 *         description: Rol del usuario para filtrar registros
 *       - in: query
 *         name: accion
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE]
 *         description: Tipo de acción para filtrar registros
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [exitoso, fallido]
 *         description: Estado de la acción para filtrar registros
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página para la paginación
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Número de registros por página
 *     responses:
 *       200:
 *         description: Lista de registros de auditoría obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     registros:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RegistroAuditoria'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para ver auditoría
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/auditoria/exportar:
 *   get:
 *     summary: Exportar registros de auditoría
 *     description: Exporta los registros de auditoría en formato JSON
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio para filtrar registros
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin para filtrar registros
 *       - in: query
 *         name: usuario
 *         schema:
 *           type: string
 *         description: Documento del usuario para filtrar registros
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [administrador, laboratorista, cliente]
 *         description: Rol del usuario para filtrar registros
 *       - in: query
 *         name: accion
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE]
 *         description: Tipo de acción para filtrar registros
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [exitoso, fallido]
 *         description: Estado de la acción para filtrar registros
 *     responses:
 *       200:
 *         description: Registros exportados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RegistroAuditoria'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para exportar auditoría
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/auditoria/filtrar:
 *   get:
 *     summary: Filtrar registros de auditoría
 *     description: Filtra registros de auditoría por diferentes criterios
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio para filtrar registros
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin para filtrar registros
 *       - in: query
 *         name: usuario
 *         schema:
 *           type: string
 *         description: Documento del usuario para filtrar registros
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [administrador, laboratorista, cliente]
 *         description: Rol del usuario para filtrar registros
 *       - in: query
 *         name: accion
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE]
 *         description: Tipo de acción para filtrar registros
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [exitoso, fallido]
 *         description: Estado de la acción para filtrar registros
 *       - in: query
 *         name: idMuestra
 *         schema:
 *           type: string
 *         description: ID de la muestra para filtrar registros
 *     responses:
 *       200:
 *         description: Registros filtrados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RegistroAuditoria'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para filtrar auditoría
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegistroAuditoria:
 *       type: object
 *       properties:
 *         usuario:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nombre:
 *               type: string
 *             rol:
 *               type: string
 *             documento:
 *               type: string
 *             permisos:
 *               type: array
 *               items:
 *                 type: string
 *         accion:
 *           type: object
 *           properties:
 *             tipo:
 *               type: string
 *               enum: [GET, POST, PUT, DELETE]
 *             ruta:
 *               type: string
 *             descripcion:
 *               type: string
 *             permisosRequeridos:
 *               type: array
 *               items:
 *                 type: string
 *         detalles:
 *           type: object
 *           properties:
 *             idMuestra:
 *               type: string
 *             cambios:
 *               type: object
 *               properties:
 *                 antes:
 *                   type: object
 *                 despues:
 *                   type: object
 *             ip:
 *               type: string
 *             userAgent:
 *               type: string
 *             parametros:
 *               type: object
 *             query:
 *               type: object
 *         fecha:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [exitoso, fallido]
 *         mensaje:
 *           type: string
 *         duracion:
 *           type: number
 *         error:
 *           type: object
 *           properties:
 *             codigo:
 *               type: string
 *             mensaje:
 *               type: string
 *             stack:
 *               type: string
 */ 