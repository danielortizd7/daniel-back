const auditoriaService = require("../services/auditoriaService");

class AuditoriaController {
  async obtenerRegistros(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado,
        pagina = 1,
        limite = 10
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado
      };

      const resultado = await auditoriaService.obtenerRegistroAuditoria(
        filtros,
        parseInt(pagina),
        parseInt(limite)
      );

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportarRegistros(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado
      };

      const registros = await auditoriaService.exportarRegistros(filtros);

      // Configurar headers para descarga de archivo
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=registros-auditoria.json');

      res.json({
        success: true,
        data: registros
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async filtrarRegistros(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado,
        idMuestra
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado,
        idMuestra
      };

      const resultado = await auditoriaService.obtenerRegistroAuditoria(filtros);

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuditoriaController(); 