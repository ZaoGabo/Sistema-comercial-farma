import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

/**
 * Marco comun de los modales de Kore en tema claro.
 * Ventana blanca con borde fino y sombra suave.
 */
export default function ModalBase({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  icono: Icono,
  ancho = 'max-w-2xl',
  ocupado = false,
  tono = 'cian',
  children,
}) {
  useEffect(() => {
    if (!abierto) return undefined;
    function alPulsarTecla(evento) {
      if (evento.key === 'Escape' && !ocupado) onCerrar();
    }
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPulsarTecla);
    return () => {
      document.body.style.overflow = desbordeAnterior;
      window.removeEventListener('keydown', alPulsarTecla);
    };
  }, [abierto, onCerrar, ocupado]);

  if (!abierto) return null;

  const colorIcono =
    tono === 'carmesi'
      ? 'bg-rose-50 text-rose-600 ring-rose-600/20'
      : 'bg-blue-50 text-blue-700 ring-blue-600/20';

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-900/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !ocupado) onCerrar();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={`my-auto flex max-h-[85vh] w-full ${ancho} flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl`}
      >
        <header className="flex shrink-0 items-start gap-3.5 border-b border-slate-200 px-6 py-5">
          {Icono && (
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${colorIcono}`}>
              <Icono className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={ocupado}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            aria-label="Cerrar ventana"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="max-h-[62vh] min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
