import { cliente } from './cliente.js';

export const dbaServicio = {
  async ejecutarSql(sql) {
    const { data } = await cliente.post('/dba/ejecutar-sql', { sql });
    return data;
  },

  async obtenerLogs(filtros = {}) {
    try {
      const { data } = await cliente.get('/dba/logs', { params: filtros });
      if (data && data.exito && Array.isArray(data.logs)) {
        return data.logs;
      }
    } catch {
      // Fallback transparente a ejecucion directa por si el proceso remoto no reinicio
    }

    const limite = filtros.limite || 100;
    let sql = `
      SELECT 
        ID_LOG, 
        LOG_TABLA, 
        LOG_OPERACION, 
        LOG_ID_REGISTRO, 
        LOG_USUARIO, 
        TO_CHAR(LOG_FECHA, 'YYYY-MM-DD HH24:MI:SS') AS LOG_FECHA, 
        LOG_IP_CLIENTE, 
        DBMS_LOB.SUBSTR(LOG_VALOR_ANTERIOR, 4000, 1) AS LOG_VALOR_ANTERIOR, 
        DBMS_LOB.SUBSTR(LOG_VALOR_NUEVO, 4000, 1) AS LOG_VALOR_NUEVO 
      FROM MODULO_COMPRAS.AUDITORIA_LOGS 
      WHERE 1 = 1
    `;
    if (filtros.tabla) {
      sql += ` AND LOG_TABLA = '${filtros.tabla.replace(/'/g, "''")}'`;
    }
    if (filtros.operacion) {
      sql += ` AND LOG_OPERACION = '${filtros.operacion.replace(/'/g, "''")}'`;
    }
    sql += ` ORDER BY ID_LOG DESC FETCH FIRST ${Number(limite)} ROWS ONLY`;

    const res = await dbaServicio.ejecutarSql(sql);
    return res.filas || [];
  },
};
