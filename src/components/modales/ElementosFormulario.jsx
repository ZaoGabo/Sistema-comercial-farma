import { TriangleAlert } from 'lucide-react';
import BotonMagnetico from '../comunes/BotonMagnetico.jsx';

export function Campo({ etiqueta, htmlFor, error, ayuda, requerido = false, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-700">
        {etiqueta}
        {requerido && (
          <span className="text-blue-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-[11px] text-rose-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1 text-[11px] text-slate-500">{ayuda}</p>
      )}
    </div>
  );
}

export function ErrorServidor({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800"
    >
      <TriangleAlert className="mt-px size-4 shrink-0 text-rose-500" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}

export function PieFormulario({
  onCancelar,
  enviando,
  etiquetaEnviar,
  icono,
  variante = 'primario',
  deshabilitado = false,
}) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onCancelar}
        disabled={enviando}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
      >
        Cancelar
      </button>
      <BotonMagnetico
        type="submit"
        variante={variante}
        icono={icono}
        cargando={enviando}
        disabled={deshabilitado}
      >
        {etiquetaEnviar}
      </BotonMagnetico>
    </div>
  );
}

export function AvisoCatalogo({ cargando, error, onReintentar }) {
  if (cargando) {
    return (
      <div className="space-y-3 py-2" aria-busy="true" aria-label="Cargando catálogos">
        <div className="esqueleto h-10 rounded-lg" />
        <div className="esqueleto h-10 rounded-lg" />
        <div className="esqueleto h-24 rounded-lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-3 py-2">
        <ErrorServidor mensaje={error} />
        <button
          type="button"
          onClick={onReintentar}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Reintentar carga de catálogos
        </button>
      </div>
    );
  }
  return null;
}

/**
 * Convierte el texto de un campo numérico en número. Devuelve NaN si está vacío o es inválido.
 */
export function leerNumero(texto) {
  if (texto === '' || texto === null || texto === undefined) return Number.NaN;
  return Number(texto);
}
