import { useMemo } from 'react';
import { Lock, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  CLAVE_INICIO,
  CLAVE_DBA,
  PESTANAS_NAVEGACION,
  obtenerModuloPorUsuario,
} from '../../config/modulos.js';

/**
 * Navegacion principal estilo Linear/Notion en tema claro.
 * Riel vertical en escritorio con pestaña activa en blanco y sombra sutil.
 * Segregación departamental: el módulo del usuario activo lleva el micro-tag
 * "Mi departamento"; los módulos ajenos muestran un candado sutil de advertencia.
 * Para el superusuario ZaoGabo (DBA), se despliega la pestaña exclusiva de Consola SQL.
 */
export default function Sidebar({ activo, onCambio }) {
  const { usuario } = useAuth();
  const esDba = usuario?.rol === 'DBA' || usuario?.username?.toUpperCase() === 'ZAOGABO';
  const moduloPropio = obtenerModuloPorUsuario(usuario?.modulo);

  const pestanas = useMemo(() => {
    if (!esDba) return PESTANAS_NAVEGACION;
    return [
      ...PESTANAS_NAVEGACION,
      { clave: CLAVE_DBA, etiqueta: 'Consola SQL DBA', icono: Terminal, esDba: true },
    ];
  }, [esDba]);

  function esAjeno(pestana) {
    if (esDba) return false;
    if (pestana.clave === CLAVE_INICIO || pestana.clave === CLAVE_DBA || !moduloPropio) return false;
    return pestana.clave !== moduloPropio.clave;
  }

  return (
    <>
      <nav aria-label="Módulos de negocio" className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 space-y-2">
          <p className="etiqueta-seccion px-2">Módulos</p>
          <div className="space-y-1 rounded-xl border border-slate-200/60 bg-slate-100/70 p-1.5">
            {pestanas.map((pestana) => {
              const esActivo = pestana.clave === activo;
              const Icono = pestana.icono;
              const esPropio = moduloPropio && pestana.clave === moduloPropio.clave;
              const ajeno = esAjeno(pestana);
              return (
                <button
                  key={pestana.clave}
                  type="button"
                  onClick={() => onCambio(pestana.clave)}
                  aria-current={esActivo ? 'page' : undefined}
                  aria-label={ajeno ? `${pestana.etiqueta}. Acceso restringido a su departamento` : undefined}
                  title={ajeno ? 'Acceso restringido: departamento ajeno a su área' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    esActivo
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {Icono && (
                    <Icono
                      className={`size-4 shrink-0 ${esActivo ? 'text-blue-700' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex-1 truncate">{pestana.etiqueta}</span>
                  {esPropio && (
                    <span className="rounded-full bg-blue-50 px-1.5 py-px text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      Mi departamento
                    </span>
                  )}
                  {ajeno && <Lock className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      <nav aria-label="Módulos de negocio" className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden">
        <div className="flex w-max gap-1 rounded-xl border border-slate-200/60 bg-slate-100/70 p-1.5">
          {pestanas.map((pestana) => {
            const esActivo = pestana.clave === activo;
            const Icono = pestana.icono;
            const ajeno = esAjeno(pestana);
            return (
              <button
                key={pestana.clave}
                type="button"
                onClick={() => onCambio(pestana.clave)}
                aria-current={esActivo ? 'page' : undefined}
                aria-label={ajeno ? `${pestana.etiqueta}. Acceso restringido a su departamento` : undefined}
                title={ajeno ? 'Acceso restringido: departamento ajeno a su área' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  esActivo
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {Icono && <Icono className="size-4 shrink-0" aria-hidden="true" />}
                {pestana.etiqueta}
                {ajeno && <Lock className="size-3 shrink-0 text-slate-400" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
