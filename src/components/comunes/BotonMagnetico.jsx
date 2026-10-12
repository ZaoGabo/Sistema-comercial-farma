import { LoaderCircle } from 'lucide-react';

const VARIANTES = {
  primario: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-600/30',
  exito: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-600/30',
  peligro: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus:ring-rose-600/30',
  destructivo:
    'border border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:border-rose-300 hover:bg-rose-100 focus:ring-rose-600/20',
  secundario:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-slate-400/30',
};

const ESTILO_BLOQUEADO =
  'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none';

/**
 * Boton corporativo sobrio. Conserva la API del boton magnetico anterior
 * (variante, icono, cargando, bloqueado) sin magnetismo ni aura luminosa.
 */
export default function BotonMagnetico({
  variante = 'primario',
  icono: Icono,
  cargando = false,
  disabled = false,
  bloqueado = false,
  children,
  className = '',
  type = 'button',
  ...resto
}) {
  const inactivo = disabled || bloqueado || cargando;
  const estilo = VARIANTES[variante] || VARIANTES.primario;

  return (
    <button
      type={type}
      disabled={disabled || bloqueado || cargando}
      aria-disabled={inactivo}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 active:scale-[0.98] ${
        inactivo ? ESTILO_BLOQUEADO : estilo
      } ${className}`}
      {...resto}
    >
      {cargando ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icono && <Icono className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
