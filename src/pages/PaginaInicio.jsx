import { useEffect, useMemo } from 'react';
import { ArrowRight, ArrowUpRight, CircleCheck, FileSignature, RefreshCw, ShieldCheck } from 'lucide-react';
import BotonMagnetico from '../components/comunes/BotonMagnetico.jsx';
import { ImporteEditorial } from '../components/comunes/FormatoInstitucional.jsx';
import Interruptor from '../components/comunes/Interruptor.jsx';
import NumeroAnimado from '../components/comunes/NumeroAnimado.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferencias } from '../context/PreferenciasContext.jsx';
import { ESTADOS_CONEXION, useSalud } from '../context/SaludContext.jsx';
import { estadoModulo, useDatosModulos } from '../context/DatosModulosContext.jsx';
import { ENTORNO } from '../config/entorno.js';
import { MODULOS, nombreRol, obtenerModuloPorUsuario } from '../config/modulos.js';
import { esPendiente, esVigente } from '../utils/estados.js';
import { ACCIONES, POLITICAS_BLOQUEO } from '../utils/rbac.js';
import { aNumero } from '../utils/formato.js';

const PERMISOS_VISIBLES = [
  { clave: ACCIONES.CREAR, etiqueta: 'Crear transacciones', descripcion: 'Registrar nuevas operaciones' },
  { clave: ACCIONES.VER, etiqueta: 'Consultar y ver', descripcion: 'Acceso al inspector de detalle' },
  { clave: ACCIONES.MODIFICAR, etiqueta: 'Modificar borradores', descripcion: 'Ajustar documentos en estado pendiente' },
  { clave: ACCIONES.APROBAR, etiqueta: 'Aprobar', descripcion: 'Autorizar operaciones pendientes' },
  { clave: ACCIONES.ANULAR, etiqueta: 'Anular', descripcion: 'Revertir operaciones con motivo' },
];

function Bloque({ className = '', children, ...resto }) {
  return (
    <div className={`sombra-superficie rounded-xl p-5 sm:p-6 ${className}`} {...resto}>
      {children}
    </div>
  );
}

function useResumenModulos() {
  const { modulos } = useDatosModulos();

  return useMemo(() => {
    const resumen = {};
    MODULOS.forEach(({ clave }) => {
      const estado = estadoModulo(modulos, clave);
      if (estado.cargado) {
        resumen[clave] = {
          total: estado.registros.length,
          pendientes: estado.registros.filter((fila) => esPendiente(fila.estado)).length,
        };
      } else if (estado.cargando) {
        resumen[clave] = { cargando: true };
      } else if (estado.error) {
        resumen[clave] = { error: estado.error };
      }
    });
    return resumen;
  }, [modulos]);
}

/**
 * Cifras ejecutivas del departamento propio a partir de su vista real.
 * Cada módulo expone total de registros, pendientes de firma y su importe principal.
 */
function resumenEjecutivo(clave, registros) {
  const pendientes = registros.filter((fila) => esPendiente(fila.estado));
  const sumar = (lista, lector) => lista.reduce((acumulado, fila) => acumulado + aNumero(lector(fila)), 0);
  switch (clave) {
    case 'compras':
      return {
        total: registros.length,
        etiquetaTotal: 'Órdenes en curso',
        pendientes: pendientes.length,
        monto: sumar(pendientes, (orden) => orden.total),
        etiquetaMonto: 'Monto por autorizar',
      };
    case 'bodega':
      return {
        total: registros.length,
        etiquetaTotal: 'Recepciones',
        pendientes: pendientes.length,
        monto: null,
        etiquetaMonto: null,
      };
    case 'contabilidad':
      return {
        total: registros.length,
        etiquetaTotal: 'Pagos registrados',
        pendientes: pendientes.length,
        monto: sumar(pendientes, (pago) => pago.monto),
        etiquetaMonto: 'Compromisos por aprobar',
      };
    case 'ventas': {
      const vigentes = registros.filter((factura) => esVigente(factura.estado));
      return {
        total: vigentes.length,
        etiquetaTotal: 'Facturas vigentes',
        pendientes: pendientes.length,
        monto: sumar(vigentes, (factura) => factura.total),
        etiquetaMonto: 'Total facturado',
      };
    }
    case 'talento-humano':
      return {
        total: registros.length,
        etiquetaTotal: 'Nóminas',
        pendientes: pendientes.length,
        monto: sumar(pendientes, (nomina) => nomina.valores?.netoRecibir),
        etiquetaMonto: 'Neto por liquidar',
      };
    default:
      return { total: registros.length, etiquetaTotal: 'Registros', pendientes: 0, monto: null, etiquetaMonto: null };
  }
}

function BarraEstado() {
  const { estado, datos } = useSalud();
  const { preferencias, alternar } = usePreferencias();
  const conectado = estado === ESTADOS_CONEXION.ACTIVO;

  return (
    <footer
      aria-label="Estado del sistema"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-slate-200/60 bg-white px-4 py-2.5 shadow-sm"
    >
      <p className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
        <span className="relative flex size-2 shrink-0">
          <span className={`size-2 rounded-full ${conectado ? 'bg-emerald-500' : 'bg-rose-500'}`} aria-hidden="true" />
        </span>
        <span className="truncate">
          {conectado
            ? `Oracle 21c · Conexión activa${datos?.esquema ? ` · ${datos.esquema}` : ''}`
            : 'Sin conexión con la Capa 2'}
        </span>
        <span className="hidden text-slate-300 sm:inline" aria-hidden="true">|</span>
        <span className="hidden sm:inline">{ENTORNO.tenantPlan}</span>
      </p>
      <div className="flex items-center gap-2">
        <Interruptor
          activo={preferencias.animacionesReducidas}
          onCambio={() => alternar('animacionesReducidas')}
          etiqueta="Reducir movimiento"
        />
      </div>
    </footer>
  );
}

export default function PaginaInicio({ onNavegar }) {
  const { usuario, permisos } = useAuth();
  const { cargarModulo, modulos } = useDatosModulos();
  const resumen = useResumenModulos();
  const moduloPropio = obtenerModuloPorUsuario(usuario.modulo);
  const modulosSecundarios = MODULOS.filter((modulo) => modulo.clave !== moduloPropio?.clave);

  // Precarga del departamento propio: sus cifras ejecutivas viven en el Centro de Mando
  // sin esperar a abrir el módulo. El resto de departamentos cargan al consultarlos.
  useEffect(() => {
    if (!moduloPropio) return;
    const estado = estadoModulo(modulos, moduloPropio.clave);
    if (!estado.cargado && !estado.cargando && !estado.error) {
      cargarModulo(moduloPropio.clave);
    }
  }, [moduloPropio, modulos, cargarModulo]);

  const politicasActivas = useMemo(
    () => PERMISOS_VISIBLES.filter(({ clave }) => !permisos[clave]).map(({ clave }) => POLITICAS_BLOQUEO[clave]),
    [permisos],
  );

  const estadoPropio = moduloPropio ? estadoModulo(modulos, moduloPropio.clave) : null;
  const ejecutivo =
    moduloPropio && estadoPropio?.cargado ? resumenEjecutivo(moduloPropio.clave, estadoPropio.registros) : null;
  const puedeFirmar = Boolean(permisos[ACCIONES.APROBAR]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-6">
        <div className="lg:col-span-4">
          <Bloque className="h-full">
            <p className="etiqueta-seccion">
              Centro de Mando · {ENTORNO.tenantNombre}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Bienvenido, {usuario.nombre}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              {usuario.cargo} · Perfil <span className="font-medium text-slate-900">{nombreRol(usuario.rol)}</span>
              {moduloPropio && (
                <>
                  {' '}· Departamento de <span className="font-medium text-slate-900">{moduloPropio.nombre}</span>
                </>
              )}
            </p>

            {moduloPropio && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="etiqueta-seccion">Atención inmediata</p>
                {estadoPropio?.cargando && !estadoPropio?.cargado ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3" aria-busy="true" aria-label="Cargando cifras del departamento">
                    {Array.from({ length: 3 }, (_, indice) => (
                      <div key={indice} className="esqueleto h-16 rounded-lg" />
                    ))}
                  </div>
                ) : estadoPropio?.error ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="text-xs text-rose-600">No se pudieron cargar las cifras del departamento.</p>
                    <button
                      type="button"
                      onClick={() => cargarModulo(moduloPropio.clave)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      <RefreshCw className="size-3" aria-hidden="true" />
                      Reintentar
                    </button>
                  </div>
                ) : (
                  ejecutivo && (
                    <>
                      <div className="mt-3 grid gap-5 sm:grid-cols-3">
                        <div>
                          <p className="text-2xl font-semibold leading-none tabular-nums text-slate-900">
                            <NumeroAnimado valor={ejecutivo.total} />
                          </p>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            {ejecutivo.etiquetaTotal}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-2xl font-semibold leading-none tabular-nums ${
                              ejecutivo.pendientes > 0 ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          >
                            <NumeroAnimado valor={ejecutivo.pendientes} />
                          </p>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Pendientes de firma
                          </p>
                        </div>
                        {ejecutivo.monto !== null && (
                          <div>
                            <p className="text-2xl leading-none text-slate-900">
                              <ImporteEditorial valor={ejecutivo.monto} />
                            </p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              {ejecutivo.etiquetaMonto}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        {puedeFirmar && ejecutivo.pendientes > 0 ? (
                          <BotonMagnetico icono={FileSignature} onClick={() => onNavegar(moduloPropio.clave)}>
                            Revisar {ejecutivo.pendientes} firma{ejecutivo.pendientes === 1 ? '' : 's'} pendiente
                            {ejecutivo.pendientes === 1 ? '' : 's'}
                          </BotonMagnetico>
                        ) : puedeFirmar ? (
                          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CircleCheck className="size-4" aria-hidden="true" />
                            Sin firmas pendientes. Todo al día.
                          </p>
                        ) : (
                          <BotonMagnetico icono={moduloPropio.icono} onClick={() => onNavegar(moduloPropio.clave)}>
                            Ir a {moduloPropio.nombre}
                          </BotonMagnetico>
                        )}
                      </div>
                    </>
                  )
                )}
              </div>
            )}
          </Bloque>
        </div>

        <div className="lg:col-span-2 lg:row-span-2">
          <Bloque className="h-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">Matriz de autorización</h2>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Permisos efectivos de su sesión, emitidos por la API.</p>
            <div className="mt-5 space-y-4">
              {PERMISOS_VISIBLES.map(({ clave, etiqueta, descripcion }) => (
                <Interruptor
                  key={clave}
                  soloLectura
                  activo={Boolean(permisos[clave])}
                  etiqueta={etiqueta}
                  descripcion={descripcion}
                />
              ))}
            </div>
            {politicasActivas.length > 0 && (
              <ul className="mt-5 space-y-1.5 border-t border-slate-200 pt-4">
                {politicasActivas.map((politica) => (
                  <li key={politica} className="text-[11px] leading-snug text-slate-500">
                    {politica}
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </div>

        {moduloPropio && (
          <PrincipalDepartamento
            modulo={moduloPropio}
            estado={estadoPropio}
            ejecutivo={ejecutivo}
            onAbrir={() => onNavegar(moduloPropio.clave)}
            onReintentar={() => cargarModulo(moduloPropio.clave)}
          />
        )}
      </div>

      <section aria-labelledby="titulo-modulos" className="space-y-3 pt-2">
        <h2 id="titulo-modulos" className="etiqueta-seccion">
          Departamentos de consulta institucional
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {modulosSecundarios.map((modulo) => {
            const datosModulo = resumen[modulo.clave];
            const Icono = modulo.icono;
            const conPendientes = (datosModulo?.pendientes || 0) > 0;
            return (
              <div
                key={modulo.clave}
                className="sombra-superficie flex items-center gap-4 rounded-xl p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{modulo.nombre}</p>
                  <p className="truncate text-[11px] text-slate-500">{modulo.entidadPlural}</p>
                  {datosModulo && !datosModulo.error && !datosModulo.cargando && (
                    <p className="mt-1 text-[11px] tabular-nums text-slate-500">
                      {datosModulo.total} registros
                      {conPendientes && (
                        <span className="font-semibold text-amber-600"> · {datosModulo.pendientes} pendientes</span>
                      )}
                    </p>
                  )}
                  {datosModulo?.error && (
                    <button
                      type="button"
                      onClick={() => cargarModulo(modulo.clave)}
                      className="mt-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800"
                    >
                      Reintentar carga
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onNavegar(modulo.clave)}
                  aria-label={`Consultar ${modulo.nombre}`}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  Consultar
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <BarraEstado />
    </div>
  );
}

function PrincipalDepartamento({ modulo, estado, ejecutivo, onAbrir, onReintentar }) {
  const Icono = modulo.icono;
  return (
    <div className="lg:col-span-4">
      <div className="sombra-superficie sombra-interactiva h-full rounded-xl p-5 sm:p-6">
        <div className="grid h-full gap-6 sm:grid-cols-2">
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Icono className="size-5" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Mi departamento
              </span>
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">{modulo.nombre}</p>
            <p className="text-[11px] text-slate-500">{modulo.entidadPlural}</p>
            <button
              type="button"
              onClick={onAbrir}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:mt-auto sm:w-auto sm:justify-start sm:px-5"
            >
              Abrir {modulo.nombre}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            {estado?.cargando && !estado?.cargado ? (
              <div className="space-y-2" aria-busy="true" aria-label={`Cargando ${modulo.nombre}`}>
                <div className="esqueleto h-8 rounded-lg" />
                <div className="esqueleto h-8 rounded-lg" />
              </div>
            ) : estado?.error ? (
              <div className="space-y-2">
                <p className="text-xs text-rose-600">No se pudo consultar este departamento.</p>
                <button
                  type="button"
                  onClick={onReintentar}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <RefreshCw className="size-3" aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            ) : (
              ejecutivo && (
                <dl className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] text-slate-500">{ejecutivo.etiquetaTotal}</dt>
                    <dd className="text-xl font-semibold tabular-nums text-slate-900">
                      <NumeroAnimado valor={ejecutivo.total} />
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] text-slate-500">Pendientes de firma</dt>
                    <dd
                      className={`text-xl font-semibold tabular-nums ${
                        ejecutivo.pendientes > 0 ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    >
                      <NumeroAnimado valor={ejecutivo.pendientes} />
                    </dd>
                  </div>
                  {ejecutivo.monto !== null && (
                    <div className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
                      <dt className="text-[11px] text-slate-500">{ejecutivo.etiquetaMonto}</dt>
                      <dd className="text-xl text-slate-900">
                        <ImporteEditorial valor={ejecutivo.monto} />
                      </dd>
                    </div>
                  )}
                </dl>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
