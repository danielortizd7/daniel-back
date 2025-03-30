const Auditoria = require("../models/auditoriaModel");

class AuditoriaService {
  async registrarAccion(datos) {
    try {
      // Agregar duración de la acción
      datos.duracion = Date.now() - datos.fecha.getTime();

      const auditoria = new Auditoria(datos);
      await auditoria.save();
      return auditoria;
    } catch (error) {
      console.error('Error al registrar acción:', error);
      throw new Error(`Error al registrar acción: ${error.message}`);
    }
  }

  async obtenerRegistroAuditoria(filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      // Construir filtros de búsqueda
      const query = {};
      
      if (filtros.fechaInicio && filtros.fechaFin) {
        query.fecha = {
          $gte: new Date(filtros.fechaInicio),
          $lte: new Date(filtros.fechaFin)
        };
      }
      
      if (filtros.usuario) {
        query['usuario.documento'] = filtros.usuario;
      }
      
      if (filtros.rol) {
        query['usuario.rol'] = filtros.rol;
      }
      
      if (filtros.accion) {
        query['accion.tipo'] = filtros.accion;
      }
      
      if (filtros.estado) {
        query.estado = filtros.estado;
      }

      if (filtros.idMuestra) {
        query['detalles.idMuestra'] = filtros.idMuestra;
      }

      // Ejecutar consulta con paginación
      const [registros, total] = await Promise.all([
        Auditoria.find(query)
          .sort({ fecha: -1 })
          .skip(skip)
          .limit(limite),
        Auditoria.countDocuments(query)
      ]);

      return {
        registros,
        total,
        pagina,
        totalPaginas: Math.ceil(total / limite)
      };
    } catch (error) {
      throw new Error(`Error al obtener registros de auditoría: ${error.message}`);
    }
  }

  async exportarRegistros(filtros = {}) {
    try {
      const query = this.construirQueryFiltros(filtros);
      return await Auditoria.find(query).sort({ fecha: -1 });
    } catch (error) {
      throw new Error(`Error al exportar registros: ${error.message}`);
    }
  }

  async obtenerEstadisticas(fechaInicio, fechaFin) {
    try {
      return await Auditoria.obtenerEstadisticas(
        new Date(fechaInicio),
        new Date(fechaFin)
      );
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  async limpiarRegistrosAntiguos(diasAntiguedad = 30) {
    try {
      const resultado = await Auditoria.limpiarRegistrosAntiguos(diasAntiguedad);
      return {
        mensaje: `Se eliminaron ${resultado.deletedCount} registros antiguos`,
        registrosEliminados: resultado.deletedCount
      };
    } catch (error) {
      throw new Error(`Error al limpiar registros antiguos: ${error.message}`);
    }
  }

  // Método privado para construir la query de filtros
  construirQueryFiltros(filtros) {
    const query = {};
    
    if (filtros.fechaInicio && filtros.fechaFin) {
      query.fecha = {
        $gte: new Date(filtros.fechaInicio),
        $lte: new Date(filtros.fechaFin)
      };
    }
    
    if (filtros.usuario) {
      query['usuario.documento'] = filtros.usuario;
    }
    
    if (filtros.rol) {
      query['usuario.rol'] = filtros.rol;
    }
    
    if (filtros.accion) {
      query['accion.tipo'] = filtros.accion;
    }
    
    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    if (filtros.idMuestra) {
      query['detalles.idMuestra'] = filtros.idMuestra;
    }

    return query;
  }
}

module.exports = new AuditoriaService(); 