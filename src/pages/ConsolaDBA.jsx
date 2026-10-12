import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Layers,
  Play,
  RotateCcw,
  Server,
  ShieldAlert,
  Terminal,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import BotonMagnetico from '../components/comunes/BotonMagnetico.jsx';
import { CodigoAuditoria } from '../components/comunes/FormatoInstitucional.jsx';
import { dbaServicio } from '../api/dba.servicio.js';

const CONSULTAS_PREDEFINIDAS = [
  {
    titulo: 'Estado de la Instancia',
    descripcion: 'Versión del motor, nombre de instancia y estado del servicio',
    sql: 'SELECT INSTANCE_NAME, STATUS, VERSION_FULL, HOST_NAME, STARTUP_TIME FROM V$INSTANCE',
  },
  {
    titulo: 'Sesiones Activas',
    descripcion: 'Conexiones vivas de clientes y programas a Oracle',
    sql: 'SELECT SID, SERIAL#, USERNAME, STATUS, OSUSER, MACHINE, PROGRAM FROM V$SESSION WHERE USERNAME IS NOT NULL',
  },
  {
    titulo: 'Tablas de la Base de Datos',
    descripcion: 'Inventario de tablas en el esquema MODULO_COMPRAS',
    sql: 'SELECT OWNER, TABLE_NAME, NUM_ROWS, STATUS FROM ALL_TABLES WHERE OWNER = \'MODULO_COMPRAS\' ORDER BY TABLE_NAME',
  },
  {
    titulo: 'Archivos y Almacenamiento',
    descripcion: 'Espacio físico en disco de los Data Files (MB)',
    sql: 'SELECT FILE_NAME, TABLESPACE_NAME, ROUND(BYTES/1024/1024, 2) AS MEGABYTES, STATUS FROM DBA_DATA_FILES',
  },
  {
    titulo: 'Auditoría Transaccional Global',
    descripcion: 'Volumen consolidado de compras y asientos',
    sql: 'SELECT \'COMPRAS\' AS MODULO, COUNT(*) AS TOTAL FROM MODULO_COMPRAS.COMPRAS UNION ALL SELECT \'ASIENTOS\', COUNT(*) FROM MODULO_COMPRAS.ASIENTOS_CONTABLES UNION ALL SELECT \'PAGOS\', COUNT(*) FROM MODULO_COMPRAS.PAGOS',
  },
];

export default function ConsolaDBA() {
  const [consultaSql, setConsultaSql] = useState(
    'SELECT INSTANCE_NAME, STATUS, VERSION_FULL, HOST_NAME FROM V$INSTANCE'
  );
  const [ejecutando, setEjecutando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  async function ejecutar(sqlParaEjecutar = consultaSql) {
    const sentencia = (sqlParaEjecutar || '').trim();
    if (!sentencia) {
      setError('Escriba una sentencia SQL antes de ejecutar.');
      return;
    }

    setEjecutando(true);
    setError(null);
    setResultado(null);

    try {
      const respuesta = await dbaServicio.ejecutarSql(sentencia);
      setResultado(respuesta);
    } catch (fallo) {
      setError(fallo.message || 'Error al ejecutar la sentencia en Oracle Database 21c.');
    } finally {
      setEjecutando(false);
    }
  }

  function aplicarPlantilla(plantilla) {
    setConsultaSql(plantilla.sql);
    ejecutar(plantilla.sql);
  }

  function limpiar() {
    setConsultaSql('');
    setResultado(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Cabecera de la Consola */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-emerald-400 shadow-sm ring-1 ring-slate-800">
            <Terminal className="size-6" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Consola SQL DBA
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Superusuario ZaoGabo Activo
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              <Database className="size-3.5" aria-hidden="true" />
              <span>Oracle Database 21c Enterprise Engine</span>
              <span aria-hidden="true">·</span>
              <Server className="size-3.5" aria-hidden="true" />
              <span>Instancia XEPDB1</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">Acceso Universal (DQL / DML / DDL)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limpiar}
            disabled={ejecutando}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Limpiar
          </button>
          <BotonMagnetico
            variante="primario"
            icono={Play}
            cargando={ejecutando}
            onClick={() => ejecutar()}
          >
            Ejecutar en Oracle
          </BotonMagnetico>
        </div>
      </header>

      {/* Editor SQL */}
      <div className="sombra-superficie overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
          <span className="font-mono font-medium text-slate-700">Editor SQL Interactivo</span>
          <span>Presione "Ejecutar en Oracle" para enviar la instrucción directa al motor</span>
        </div>
        <div className="p-4">
          <textarea
            rows={5}
            value={consultaSql}
            onChange={(e) => setConsultaSql(e.target.value)}
            placeholder="Escriba aquí cualquier sentencia SQL (SELECT, INSERT, UPDATE, CREATE, ALTER)..."
            spellCheck={false}
            className="w-full rounded-lg border border-slate-200 bg-[#0f172a] p-4 font-mono text-sm leading-relaxed text-emerald-400 shadow-inner placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Plantillas de consultas rápidas */}
        <div className="border-t border-slate-200/80 bg-slate-50/50 p-4">
          <p className="etiqueta-seccion mb-2.5">Plantillas de Inspección Rápida (1 Clic)</p>
          <div className="flex flex-wrap gap-2">
            {CONSULTAS_PREDEFINIDAS.map((plantilla) => (
              <button
                key={plantilla.titulo}
                type="button"
                onClick={() => aplicarPlantilla(plantilla)}
                className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition hover:border-blue-500 hover:bg-blue-50/40 hover:text-blue-900"
                title={plantilla.descripcion}
              >
                <Layers className="size-3.5 text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
                <span className="font-medium">{plantilla.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerta de Error SQL */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-rose-900">Error de Ejecución en Oracle 21c</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-rose-800">{error}</p>
          </div>
        </div>
      )}

      {/* Resultados de la Ejecución */}
      {resultado && (
        <div className="sombra-superficie space-y-4 rounded-xl border border-slate-200/80 bg-white p-5">
          {/* Barra de Telemetría */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Sentencia procesada con éxito
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                <Timer className="size-3.5 text-slate-400" aria-hidden="true" />
                Tiempo de motor: <strong className="text-slate-800">{resultado.tiempoMs} ms</strong>
              </span>
              {resultado.totalFilas > 0 && (
                <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                  <Activity className="size-3.5 text-slate-400" aria-hidden="true" />
                  Filas retornadas: <strong className="text-slate-800">{resultado.totalFilas}</strong>
                </span>
              )}
              {resultado.filasAfectadas !== null && (
                <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                  <Activity className="size-3.5 text-slate-400" aria-hidden="true" />
                  Filas modificadas: <strong className="text-slate-800">{resultado.filasAfectadas}</strong>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">Oracle Database 21c (Native TNS Engine)</p>
          </div>

          {/* Mensaje descriptivo */}
          {resultado.mensaje && (
            <p className="text-xs font-medium text-slate-600">{resultado.mensaje}</p>
          )}

          {/* Grilla dinámica de resultados */}
          {resultado.filas && resultado.filas.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 text-center text-slate-400">#</th>
                    {resultado.columnas.map((columna) => (
                      <th key={columna} scope="col" className="px-3 py-2.5 font-mono">
                        {columna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                  {resultado.filas.map((fila, indice) => (
                    <tr key={indice} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-3 py-2 text-center text-slate-400">{indice + 1}</td>
                      {resultado.columnas.map((columna) => {
                        const valor = fila[columna];
                        const texto = valor === null || valor === undefined
                          ? 'NULL'
                          : typeof valor === 'object'
                            ? JSON.stringify(valor)
                            : String(valor);
                        const esNull = valor === null || valor === undefined;

                        return (
                          <td
                            key={columna}
                            className={`max-w-xs truncate px-3 py-2 ${
                              esNull ? 'italic text-slate-400' : 'text-slate-800'
                            }`}
                            title={texto}
                          >
                            {texto}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              La instrucción SQL no generó filas de consulta directa (operación DDL/DML confirmada en base de datos).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
