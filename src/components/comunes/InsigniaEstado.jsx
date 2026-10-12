import { CATEGORIAS, categorizarEstado, etiquetaEstado } from '../../utils/estados.js';

const ESTILOS = {
  [CATEGORIAS.PENDIENTE]: {
    contenedor: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    punto: 'bg-amber-500',
  },
  [CATEGORIAS.APROBADO]: {
    contenedor: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    punto: 'bg-emerald-500',
  },
  [CATEGORIAS.COMPLETADO]: {
    contenedor: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    punto: 'bg-blue-600',
  },
  [CATEGORIAS.ANULADO]: {
    contenedor: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    punto: 'bg-rose-500',
  },
  [CATEGORIAS.DESCONOCIDO]: {
    contenedor: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    punto: 'bg-slate-400',
  },
};

/**
 * Insignia de estado en tonos pastel profesionales con anillo fino.
 */
export default function InsigniaEstado({ estado, className = '' }) {
  const categoria = categorizarEstado(estado);
  const estilo = ESTILOS[categoria];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${estilo.contenedor} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${estilo.punto}`} aria-hidden="true" />
      {etiquetaEstado(estado)}
    </span>
  );
}
