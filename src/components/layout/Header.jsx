import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronsUpDown, LogOut, RefreshCw } from 'lucide-react';
import LogoKore from './LogoKore.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ESTADOS_CONEXION, useSalud } from '../../context/SaludContext.jsx';
import { ENTORNO } from '../../config/entorno.js';
import { nombreRol } from '../../config/modulos.js';
import { iniciales } from '../../utils/formato.js';

const COLORES_ROL = {
  JEFE: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  AUXILIAR: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  OPERATIVO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const AVATAR_ROL = {
  JEFE: 'bg-blue-900 text-white',
  AUXILIAR: 'bg-slate-700 text-white',
  OPERATIVO: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20',
};

function usePanelFlotante() {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    function alPresionar(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) setAbierto(false);
    }
    function alPulsarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('pointerdown', alPresionar);
    window.addEventListener('keydown', alPulsarTecla);
    return () => {
      document.removeEventListener('pointerdown', alPresionar);
      window.removeEventListener('keydown', alPulsarTecla);
    };
  }, [abierto]);

  return { abierto, setAbierto, contenedorRef };
}

function FilaDato({ etiqueta, valor, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-xs">
      <dt className="text-slate-500">{etiqueta}</dt>
      <dd className={`truncate text-right text-slate-700 ${mono ? 'font-mono tabular-nums' : ''}`}>{valor ?? '—'}</dd>
    </div>
  );
}

function SelectorTenant() {
  const { abierto, setAbierto, contenedorRef } = usePanelFlotante();
  const { estado, datos, latenciaMs, mensajeError, verificar } = useSalud();
  const conectado = estado === ESTADOS_CONEXION.ACTIVO;

  let servidor = ENTORNO.apiUrl;
  try {
    servidor = new URL(ENTORNO.apiUrl).host;
  } catch {
    /* URL relativa: se muestra tal cual */
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
          <Building2 className="size-4" aria-hidden="true" />
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[11rem] truncate text-xs font-semibold text-slate-900">{ENTORNO.tenantNombre}</span>
          <span className="block text-[11px] text-slate-500">{ENTORNO.tenantPlan}</span>
        </span>
        <ChevronsUpDown className="size-3.5 text-slate-400" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Inquilino y conexion"
          className="absolute left-0 top-full z-50 mt-2 w-80 origin-top-left rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <p className="etiqueta-seccion">Inquilino activo</p>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white">
              <Building2 className="size-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{ENTORNO.tenantNombre}</p>
              <p className="text-xs text-slate-500">{ENTORNO.tenantPlan}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="etiqueta-seccion">Conexión en vivo</p>
            <button
              type="button"
              onClick={verificar}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              Verificar
            </button>
          </div>
          <dl className="mt-1 divide-y divide-slate-100">
            <FilaDato etiqueta="Estado" valor={conectado ? 'Activo' : estado === ESTADOS_CONEXION.CAIDO ? 'Sin conexión' : 'Verificando'} />
            <FilaDato etiqueta="Servidor API" valor={servidor} mono />
            <FilaDato etiqueta="Latencia" valor={latenciaMs !== null ? `${latenciaMs} ms` : null} mono />
            <FilaDato etiqueta="Motor de datos" valor={datos?.motorBD} />
            <FilaDato etiqueta="Esquema" valor={datos?.esquema} mono />
            <FilaDato etiqueta="Versión del sistema" valor={datos?.version} mono />
          </dl>
          {mensajeError && <p className="mt-2 text-[11px] leading-relaxed text-rose-600">{mensajeError}</p>}
        </div>
      )}
    </div>
  );
}

function MenuUsuario() {
  const { usuario, cerrarSesion } = useAuth();
  const { abierto, setAbierto, contenedorRef } = usePanelFlotante();

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white py-1.5 pl-1.5 pr-3 text-left shadow-sm transition-colors hover:bg-slate-50"
      >
        <span
          className={`grid size-8 place-items-center rounded-lg text-xs font-semibold ${
            AVATAR_ROL[usuario.rol] || AVATAR_ROL.OPERATIVO
          }`}
        >
          {iniciales(usuario.nombre)}
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-[10rem] truncate text-xs font-semibold text-slate-900">{usuario.nombre}</span>
          <span className="block truncate text-[11px] text-slate-500">{usuario.cargo}</span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
            COLORES_ROL[usuario.rol] || COLORES_ROL.OPERATIVO
          }`}
        >
          {nombreRol(usuario.rol)}
        </span>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Perfil de usuario"
          className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-xl border border-slate-200/80 bg-white p-4 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span
              className={`grid size-10 place-items-center rounded-xl text-sm font-semibold ${
                AVATAR_ROL[usuario.rol] || AVATAR_ROL.OPERATIVO
              }`}
            >
              {iniciales(usuario.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{usuario.nombre}</p>
              <p className="truncate text-xs text-slate-500">{usuario.cargo}</p>
              <span
                className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
                  COLORES_ROL[usuario.rol] || COLORES_ROL.OPERATIVO
                }`}
              >
                {nombreRol(usuario.rol)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 py-3 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Usuario</span>
              <span className="font-mono text-slate-700">{usuario.username}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Departamento</span>
              <span className="font-medium text-slate-700">{usuario.modulo}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <LogoKore />
          <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <SelectorTenant />
        </div>
        <MenuUsuario />
      </div>
    </header>
  );
}
