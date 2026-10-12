import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, Lock, RefreshCw, Search } from 'lucide-react';
import { ACCIONES, esModuloPropio } from '../../utils/rbac.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { FILTROS_ESTADO, coincideFiltroEstado, construirPasosAuditoria, CATEGORIAS } from '../../utils/estados.js';
import BotoneraRBAC from '../comunes/BotoneraRBAC.jsx';
import InsigniaEstado from '../comunes/InsigniaEstado.jsx';
import InspectorLateral from '../comunes/InspectorLateral.jsx';
import PasosAuditoria from '../comunes/PasosAuditoria.jsx';
import PestanasLiquidas from '../comunes/PestanasLiquidas.jsx';
import TablaOperativa from '../comunes/TablaOperativa.jsx';
import TarjetasKpi from '../comunes/TarjetasKpi.jsx';
import { SeccionDetalle } from '../comunes/ElementosDetalle.jsx';
import { BannerError } from '../comunes/EstadoVacio.jsx';
import ModalAnular from '../modales/ModalAnular.jsx';

const TAMANO_PAGINA = 10;

/**
 * Plantilla común de página de módulo en tema claro: encabezado, KPIs,
 * listado maestro con filtros, inspector lateral y modales de creación / anulación.
 */
export default function PlantillaModulo({
  modulo,
  datos,
  obtenerId,
  columnas,
  kpis,
  extras,
  barraExtra,
  filtroPrevio,
  obtenerEstado,
  obtenerLuz,
  textoBusqueda,
  tituloDetalle,
  subtituloDetalle,
  identificadorAnulacion,
  renderDetalle,
  obtenerDatosPasos,
  renderModalCrear,
}) {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalAnularAbierto, setModalAnularAbierto] = useState(false);
  const filtroInicializado = useRef(false);
  const busquedaDiferida = useDeferredValue(busqueda);

  const Icono = modulo.icono;
  const { registros, cargado, registroSeleccionado, seleccionadoId } = datos;
  const { usuario } = useAuth();
  const perteneceAlDepartamento = esModuloPropio(usuario?.modulo, modulo.clave);

  useEffect(() => {
    if (!cargado || filtroInicializado.current) return;
    filtroInicializado.current = true;
    const hayPendientes = registros.some((fila) => coincideFiltroEstado(obtenerEstado(fila), CATEGORIAS.PENDIENTE));
    if (hayPendientes) setFiltroEstado(CATEGORIAS.PENDIENTE);
  }, [cargado, registros, obtenerEstado]);

  const baseFiltrada = useMemo(
    () => (filtroPrevio ? registros.filter(filtroPrevio) : registros),
    [registros, filtroPrevio],
  );

  const contadores = useMemo(
    () =>
      Object.fromEntries(
        FILTROS_ESTADO.map(({ clave }) => [
          clave,
          baseFiltrada.filter((fila) => coincideFiltroEstado(obtenerEstado(fila), clave)).length,
        ]),
      ),
    [baseFiltrada, obtenerEstado],
  );

  const filasFiltradas = useMemo(() => {
    const termino = busquedaDiferida.trim().toLowerCase();
    return baseFiltrada.filter(
      (fila) =>
        coincideFiltroEstado(obtenerEstado(fila), filtroEstado) &&
        (termino === '' || textoBusqueda(fila).toLowerCase().includes(termino)),
    );
  }, [baseFiltrada, filtroEstado, busquedaDiferida, obtenerEstado, textoBusqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = filasFiltradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA);

  const itemsFiltro = FILTROS_ESTADO.map(({ clave, etiqueta }) => ({
    clave,
    etiqueta,
    contador: contadores[clave],
  }));

  function cambiarFiltro(clave) {
    setFiltroEstado(clave);
    setPagina(1);
  }

  function cambiarBusqueda(valor) {
    setBusqueda(valor);
    setPagina(1);
  }

  const estadoActivo = registroSeleccionado ? obtenerEstado(registroSeleccionado) : undefined;
  const pasos = registroSeleccionado
    ? construirPasosAuditoria(estadoActivo, obtenerDatosPasos?.(registroSeleccionado))
    : [];
  const hayFiltrosActivos = busqueda.trim() !== '' || filtroEstado !== 'todos';
  const textoVacio = hayFiltrosActivos
    ? { titulo: 'Sin coincidencias', descripcion: 'Ajuste el estado o el termino de busqueda para ver mas registros.' }
    : { titulo: `Sin ${modulo.entidadPlural.toLowerCase()}`, descripcion: `La vista ${modulo.vista} no devolvio registros.` };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Icono className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
              {modulo.nombre}
              {!perteneceAlDepartamento && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/80">
                  <Lock className="size-3" aria-hidden="true" />
                  Departamento de {modulo.nombre} · Acceso de consulta
                </span>
              )}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              <Database className="size-3.5" aria-hidden="true" />
              <span>{modulo.entidadPlural}</span>
              <span aria-hidden="true">/</span>
              <span className="font-mono text-slate-400">{modulo.vista}</span>
            </p>
          </div>
        </div>
        <BotoneraRBAC
          acciones={[ACCIONES.CREAR]}
          etiquetas={modulo.etiquetas}
          claveModulo={modulo.clave}
          onCrear={() => setModalCrearAbierto(true)}
          alinearDerecha
        />
      </header>

      {datos.error && <BannerError mensaje={datos.error} onReintentar={() => datos.recargar()} />}

      {kpis && <TarjetasKpi tarjetas={kpis} />}

      {extras}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" aria-label={modulo.entidadPlural}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <PestanasLiquidas
              items={itemsFiltro}
              valor={filtroEstado}
              onCambio={cambiarFiltro}
              etiquetaAccesible="Filtrar por estado"
              compacto
            />
            {barraExtra}
          </div>
          <div className="flex items-center gap-2">
            <label className="relative block">
              <span className="sr-only">Buscar en {modulo.entidadPlural}</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(evento) => cambiarBusqueda(evento.target.value)}
                placeholder="Buscar registro"
                className="campo w-52 pl-9"
              />
            </label>
            <button
              type="button"
              onClick={() => datos.recargar()}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Actualizar listado"
              title="Actualizar listado"
            >
              <RefreshCw className={`size-4 ${datos.cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        <TablaOperativa
          columnas={columnas}
          filas={filasPagina}
          obtenerId={obtenerId}
          seleccionadoId={seleccionadoId}
          onSeleccionar={datos.seleccionar}
          sincronizandoIds={datos.sincronizandoIds}
          obtenerLuz={obtenerLuz}
          cargando={datos.cargando}
          vacio={textoVacio}
        />

        {filasFiltradas.length > TAMANO_PAGINA && (
          <nav
            className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500"
            aria-label="Paginación"
          >
            <span className="tabular-nums">
              {(paginaActual - 1) * TAMANO_PAGINA + 1}-
              {Math.min(paginaActual * TAMANO_PAGINA, filasFiltradas.length)} de {filasFiltradas.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="px-2 tabular-nums">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </section>

      <InspectorLateral
        abierto={Boolean(registroSeleccionado)}
        onCerrar={datos.cerrarDetalle}
        titulo={registroSeleccionado ? tituloDetalle(registroSeleccionado) : ''}
        subtitulo={registroSeleccionado ? subtituloDetalle(registroSeleccionado) : ''}
        insignia={registroSeleccionado && <InsigniaEstado estado={estadoActivo} />}
        pie={
          registroSeleccionado && (
            <BotoneraRBAC
              acciones={[ACCIONES.APROBAR, ACCIONES.ANULAR]}
              etiquetas={modulo.etiquetas}
              claveModulo={modulo.clave}
              estado={estadoActivo}
              enProceso={datos.accionEnCurso}
              onAprobar={() => datos.aprobar(seleccionadoId)}
              onAnular={() => setModalAnularAbierto(true)}
            />
          )
        }
      >
        {registroSeleccionado && (
          <>
            {datos.cargandoDetalle && (
              <p className="flex items-center gap-2 text-[11px] font-medium text-blue-700">
                <RefreshCw className="size-3 animate-spin" aria-hidden="true" />
                Consultando detalle en Oracle 21c
              </p>
            )}
            {renderDetalle(registroSeleccionado)}
            <SeccionDetalle titulo="Auditoría de la transacción">
              <PasosAuditoria pasos={pasos} />
            </SeccionDetalle>
          </>
        )}
      </InspectorLateral>

      {renderModalCrear({
        abierto: modalCrearAbierto,
        onCerrar: () => setModalCrearAbierto(false),
        onGuardar: async (payload) => {
          await datos.crear(payload);
          setModalCrearAbierto(false);
        },
      })}

      <ModalAnular
        abierto={modalAnularAbierto && Boolean(registroSeleccionado)}
        onCerrar={() => setModalAnularAbierto(false)}
        entidad={modulo.entidad.toLowerCase()}
        identificador={registroSeleccionado ? identificadorAnulacion(registroSeleccionado) : ''}
        onConfirmar={async (motivo) => {
          await datos.anular(seleccionadoId, motivo);
          setModalAnularAbierto(false);
        }}
      />
    </div>
  );
}
