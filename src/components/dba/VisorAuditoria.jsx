import { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  Eye,
  X,
  Shield,
  Clock,
  Layers,
  Database,
  User,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { dbaServicio } from '../../api/dba.servicio.js';

export default function VisorAuditoria() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroOperacion, setFiltroOperacion] = useState('TODAS');
  const [filtroTabla, setFiltroTabla] = useState('TODAS');
  const [limite, setLimite] = useState(50);

  // Detalle seleccionado para el modal
  const [logSeleccionado, setLogSeleccionado] = useState(null);

  async function cargarLogs() {
    setCargando(true);
    setError(null);
    try {
      const data = await dbaServicio.obtenerLogs({
        limite,
        tabla: filtroTabla === 'TODAS' ? undefined : filtroTabla,
        operacion: filtroOperacion === 'TODAS' ? undefined : filtroOperacion,
      });
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Error al obtener la bitacora de auditoria desde Oracle.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarLogs();
  }, [filtroTabla, filtroOperacion, limite]);

  // Filtrado reactivo en memoria por texto de busqueda
  const logsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return logs;
    const termino = busqueda.toLowerCase();
    return logs.filter((log) => {
      const usuario = (log.LOG_USUARIO || '').toLowerCase();
      const tabla = (log.LOG_TABLA || '').toLowerCase();
      const idReg = String(log.LOG_ID_REGISTRO || '').toLowerCase();
      const valorNuevo = (log.LOG_VALOR_NUEVO || '').toLowerCase();
      const valorAnt = (log.LOG_VALOR_ANTERIOR || '').toLowerCase();
      return (
        usuario.includes(termino) ||
        tabla.includes(termino) ||
        idReg.includes(termino) ||
        valorNuevo.includes(termino) ||
        valorAnt.includes(termino)
      );
    });
  }, [logs, busqueda]);

  // Metricas rapidas
  const metricas = useMemo(() => {
    const total = logs.length;
    let inserts = 0;
    let updates = 0;
    let deletes = 0;
    for (const l of logs) {
      if (l.LOG_OPERACION === 'INSERT') inserts++;
      else if (l.LOG_OPERACION === 'UPDATE') updates++;
      else if (l.LOG_OPERACION === 'DELETE') deletes++;
    }
    return { total, inserts, updates, deletes };
  }, [logs]);

  function obtenerColorOperacion(op) {
    switch (op) {
      case 'INSERT':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 ring-rose-600/20 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20 border-slate-200';
    }
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas KPI de Auditoria */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sombra-superficie rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Registros
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Database className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {metricas.total}
          </p>
          <p className="mt-1 text-xs text-slate-400">Eventos en memoria actual</p>
        </div>

        <div className="sombra-superficie rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Inserciones (INSERT)
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 font-mono">
            {metricas.inserts}
          </p>
          <p className="mt-1 text-xs text-slate-400">Nuevos registros creados</p>
        </div>

        <div className="sombra-superficie rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Modificaciones (UPDATE)
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700 font-mono">
            {metricas.updates}
          </p>
          <p className="mt-1 text-xs text-slate-400">Actualizaciones de estado</p>
        </div>

        <div className="sombra-superficie rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Eliminaciones (DELETE)
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
              <Shield className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700 font-mono">
            {metricas.deletes}
          </p>
          <p className="mt-1 text-xs text-slate-400">Bajas o anulaciones físicas</p>
        </div>
      </div>

      {/* Barra de Filtros y Controles */}
      <div className="sombra-superficie rounded-xl border border-slate-200/80 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            {/* Buscador de texto */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por usuario, tabla, ID de registro o cambios..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filtro Operacion */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="size-3.5 text-slate-400" aria-hidden="true" />
              <select
                value={filtroOperacion}
                onChange={(e) => setFiltroOperacion(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="TODAS">Todas las Operaciones</option>
                <option value="INSERT">INSERT (Creación)</option>
                <option value="UPDATE">UPDATE (Modificación)</option>
                <option value="DELETE">DELETE (Eliminación)</option>
              </select>
            </div>

            {/* Filtro Tabla */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <select
                value={filtroTabla}
                onChange={(e) => setFiltroTabla(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="TODAS">Todas las Tablas</option>
                <option value="COMPRAS">COMPRAS</option>
                <option value="PRODUCTOS">PRODUCTOS</option>
                <option value="PROVEEDORES">PROVEEDORES</option>
                <option value="EMPLEADOS">EMPLEADOS</option>
                <option value="ASIENTOS_CONTABLES">ASIENTOS_CONTABLES</option>
                <option value="FACTURAS">FACTURAS</option>
              </select>
            </div>

            {/* Limite */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Límite:</span>
              <select
                value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>

          {/* Boton Recargar */}
          <button
            type="button"
            onClick={cargarLogs}
            disabled={cargando}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
          >
            <RotateCcw className={`size-3.5 text-slate-500 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{cargando ? 'Consultando Oracle...' : 'Actualizar Bitácora'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <p className="font-semibold">Error al cargar la bitácora</p>
          <p className="mt-1 font-mono">{error}</p>
        </div>
      )}

      {/* Tabla de Logs de Auditoria */}
      <div className="sombra-superficie overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-slate-600" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Eventos Forenses Inmutables (Trigger Engine Oracle 21c)
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500">
            Mostrando {logsFiltrados.length} de {logs.length} registros
          </span>
        </div>

        {logsFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-center font-mono text-slate-400"># ID</th>
                  <th scope="col" className="px-3 py-2.5 font-mono">Operación</th>
                  <th scope="col" className="px-3 py-2.5 font-mono">Tabla</th>
                  <th scope="col" className="px-3 py-2.5 font-mono">ID Registro</th>
                  <th scope="col" className="px-3 py-2.5 font-mono">Usuario / Rol</th>
                  <th scope="col" className="px-3 py-2.5 font-mono">Fecha / Hora</th>
                  <th scope="col" className="px-3 py-2.5 font-mono">IP Origen</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-mono">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {logsFiltrados.map((log) => (
                  <tr
                    key={log.ID_LOG}
                    className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                    onClick={() => setLogSeleccionado(log)}
                  >
                    <td className="px-3 py-2.5 text-center text-slate-400 font-semibold">
                      {log.ID_LOG}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${obtenerColorOperacion(
                          log.LOG_OPERACION
                        )}`}
                      >
                        {log.LOG_OPERACION}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {log.LOG_TABLA}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {log.LOG_ID_REGISTRO}
                    </td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-700">
                      {log.LOG_USUARIO || 'MODULO_COMPRAS'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {log.LOG_FECHA}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                      {log.LOG_IP_CLIENTE || 'LOCAL_HOST'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogSeleccionado(log);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-sans font-medium text-blue-600 shadow-sm transition hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="size-3" aria-hidden="true" />
                        <span>Inspeccionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            {cargando
              ? 'Consultando la tabla AUDITORIA_LOGS en Oracle Database 21c...'
              : 'No se encontraron eventos de auditoría para los filtros seleccionados.'}
          </div>
        )}
      </div>

      {/* Modal de Inspeccion Detallada (Comparativa de Cambios) */}
      {logSeleccionado && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setLogSeleccionado(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-slate-900 text-emerald-400">
                  <Shield className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Inspección Forense de Transacción #{logSeleccionado.ID_LOG}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tabla: <strong className="text-slate-800">{logSeleccionado.LOG_TABLA}</strong> | Registro: <strong className="text-slate-800">{logSeleccionado.LOG_ID_REGISTRO}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogSeleccionado(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
              {/* Metadatos del evento */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:grid-cols-4 text-xs">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Operación</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${obtenerColorOperacion(
                        logSeleccionado.LOG_OPERACION
                      )}`}
                    >
                      {logSeleccionado.LOG_OPERACION}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Usuario Responsable</span>
                  <p className="mt-1 font-semibold text-slate-800">{logSeleccionado.LOG_USUARIO || 'SISTEMA'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Fecha y Hora Exacta</span>
                  <p className="mt-1 font-mono text-slate-700">{logSeleccionado.LOG_FECHA}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">IP del Cliente</span>
                  <p className="mt-1 font-mono text-slate-700">{logSeleccionado.LOG_IP_CLIENTE || 'LOCAL_HOST'}</p>
                </div>
              </div>

              {/* Comparativa: Estado Anterior vs Estado Nuevo */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Desglose de Datos (Captura de Trigger Oracle)
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Estado Anterior */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Estado Anterior (:OLD)</span>
                      <span className="text-[11px] text-slate-400 font-mono">Antes de la acción</span>
                    </div>
                    {logSeleccionado.LOG_VALOR_ANTERIOR ? (
                      <pre className="rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap overflow-x-auto shadow-inner">
                        {logSeleccionado.LOG_VALOR_ANTERIOR}
                      </pre>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center font-mono text-xs text-slate-400">
                        No aplica (Registro nuevo generado por INSERT)
                      </div>
                    )}
                  </div>

                  {/* Estado Nuevo */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-800">Estado Resultante (:NEW)</span>
                      <span className="text-[11px] text-slate-400 font-mono">Después de la acción</span>
                    </div>
                    {logSeleccionado.LOG_VALOR_NUEVO ? (
                      <pre className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-3 font-mono text-xs leading-relaxed text-emerald-950 whitespace-pre-wrap overflow-x-auto shadow-inner">
                        {logSeleccionado.LOG_VALOR_NUEVO}
                      </pre>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center font-mono text-xs text-slate-400">
                        Registro suprimido por operación DELETE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setLogSeleccionado(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
