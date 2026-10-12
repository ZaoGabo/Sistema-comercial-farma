import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { BannerError } from './EstadoVacio.jsx';

/**
 * Inspector lateral en blanco puro con sombra de elevación suave.
 * Conserva cierre con Escape y botón de cierre. Sin arrastre gestual.
 */
export default function InspectorLateral({
  abierto,
  onCerrar,
  titulo,
  subtitulo,
  insignia,
  cargando = false,
  error = null,
  onReintentar,
  pie,
  children,
}) {
  useEffect(() => {
    if (!abierto) return undefined;
    function alPulsarTecla(evento) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alPulsarTecla);
    return () => window.removeEventListener('keydown', alPulsarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-slate-900/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        onClick={onCerrar}
      />
      <motion.aside
        role="dialog"
        aria-modal="false"
        aria-label={titulo}
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[30rem] flex-col border-l border-slate-200 bg-white shadow-xl"
      >
        <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-900">{titulo}</h2>
              {insignia}
            </div>
            {subtitulo && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar inspector"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-white px-5 py-5">
          {error && <BannerError mensaje={error} onReintentar={onReintentar} />}
          {cargando && !error ? (
            <div className="space-y-3" aria-busy="true">
              <div className="esqueleto h-16 rounded-lg" />
              <div className="esqueleto h-32 rounded-lg" />
              <div className="esqueleto h-24 rounded-lg" />
            </div>
          ) : (
            !error && children
          )}
        </div>

        {pie && <footer className="border-t border-slate-200 bg-slate-50/60 px-5 py-4">{pie}</footer>}
      </motion.aside>
    </>
  );
}
