import { useMemo, useState } from 'react';
import { Check, LoaderCircle, RotateCcw } from 'lucide-react';
import { BannerError } from '../comunes/EstadoVacio.jsx';
import { MODULOS, ROLES, obtenerModuloPorUsuario } from '../../config/modulos.js';
import { iniciales } from '../../utils/formato.js';

const AVATAR_ROL = {
  DBA: 'bg-emerald-700 text-white',
  JEFE: 'bg-blue-900 text-white',
  AUXILIAR: 'bg-slate-700 text-white',
  OPERATIVO: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20',
};

const INSIGNIA_ROL = {
  DBA: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  JEFE: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  AUXILIAR: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  OPERATIVO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

/**
 * Selector de credenciales institucionales en estilo sobrio claro.
 * Lista ordenada por módulo y nivel jerárquico, sin efectos 3D ni resplandores.
 */
export default function SelectorCredenciales({
  usuarios,
  cargando,
  error,
  onReintentar,
  usuarioActivo,
  onElegir,
  enProceso,
  compacto = false,
}) {
  const [filtroModulo, setFiltroModulo] = useState('');
  const [moduloPestana, setModuloPestana] = useState(null);

  const modulosDisponibles = useMemo(
    () => MODULOS.filter((modulo) => usuarios.some((usuario) => usuario.modulo === modulo.claveUsuario)),
    [usuarios],
  );

  const moduloVisible =
    moduloPestana ||
    obtenerModuloPorUsuario(usuarioActivo?.modulo)?.clave ||
    modulosDisponibles[0]?.clave ||
    '';

  const usuariosOrdenados = useMemo(() => {
    const lista = filtroModulo || moduloVisible
      ? usuarios.filter((usuario) => {
          const claveModulo = MODULOS.find((item) => item.claveUsuario === usuario.modulo)?.clave;
          return claveModulo === (filtroModulo || moduloVisible);
        })
      : [...usuarios];
    return [...lista].sort(
      (a, b) => (ROLES[a.rol]?.orden ?? 9) - (ROLES[b.rol]?.orden ?? 9),
    );
  }, [usuarios, filtroModulo, moduloVisible]);

  if (error) return <BannerError mensaje={error} onReintentar={onReintentar} />;

  if (cargando && usuarios.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Cargando usuarios institucionales">
        {Array.from({ length: 3 }, (_, indice) => (
          <div key={indice} className="esqueleto h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  const moduloDe = (usuario) => MODULOS.find((item) => item.claveUsuario === usuario.modulo);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={compacto ? 'filtro-modulo-hub' : 'filtro-modulo-acceso'} className="sr-only">
          Filtrar por módulo
        </label>
        <select
          id={compacto ? 'filtro-modulo-hub' : 'filtro-modulo-acceso'}
          value={filtroModulo || moduloVisible}
          onChange={(evento) => {
            setFiltroModulo(evento.target.value);
            setModuloPestana(evento.target.value);
          }}
          className="campo max-w-xs text-sm"
        >
          {modulosDisponibles.map((modulo) => (
            <option key={modulo.clave} value={modulo.clave}>
              {modulo.nombre}
            </option>
          ))}
        </select>
        {(filtroModulo || moduloPestana) && (
          <button
            type="button"
            onClick={() => {
              setFiltroModulo('');
              setModuloPestana(null);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Ver todos
          </button>
        )}
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        {usuariosOrdenados.map((usuario) => {
          const activo = usuarioActivo?.username === usuario.username;
          const iniciando = enProceso === usuario.username;
          const modulo = moduloDe(usuario);
          return (
            <li key={usuario.username}>
              <button
                type="button"
                onClick={() => onElegir(usuario)}
                disabled={Boolean(enProceso) && !iniciando}
                aria-pressed={activo}
                aria-label={`Ingresar como ${usuario.nombre}, ${ROLES[usuario.rol]?.nombre || usuario.rol}`}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 ${
                  activo ? 'bg-blue-50/60' : ''
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                    AVATAR_ROL[usuario.rol] || AVATAR_ROL.OPERATIVO
                  }`}
                  aria-hidden="true"
                >
                  {iniciando ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    iniciales(usuario.nombre)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {usuario.nombre}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {modulo?.nombre || usuario.modulo} · {usuario.cargo} · @{usuario.username}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                    INSIGNIA_ROL[usuario.rol] || INSIGNIA_ROL.OPERATIVO
                  }`}
                >
                  {ROLES[usuario.rol]?.nombre || usuario.rol}
                </span>
                {activo && <Check className="size-4 shrink-0 text-blue-700" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      {usuariosOrdenados.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          No hay usuarios institucionales para el módulo seleccionado.
        </p>
      )}
      {!compacto && (
        <p className="text-[11px] leading-relaxed text-slate-500">
          Jefe aprueba y anula · Auxiliar crea y aprueba · Operativo crea y consulta.
        </p>
      )}
    </div>
  );
}
