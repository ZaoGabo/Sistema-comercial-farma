import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Timer, X } from 'lucide-react';
import { BannerError } from './EstadoVacio.jsx';
import { useInactividadModal } from '../../hooks/useInactividadModal.js';

/**
 * Inspector lateral en blanco puro con sombra de elevación suave.
 * Conserva cierre con Escape y botón de cierre. Sin arrastre gestual.
 * Incluye temporizador de inactividad transaccional diferencial por rol.
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
  const { segundosRestantes, totalPermitido, fraccionRestante } = useInactividadModal({
    abierto,
    onCerrar,
    pausado: cargando,
  });
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

        {abierto && !cargando && (
          <div
            className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-5 py-2"
            role="status"
            aria-label={`El panel se cerrará por inactividad en ${segundosRestantes} segundos`}
          >
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Timer className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="tabular-nums">
                Cierre automático en {segundosRestantes} de {totalPermitido} segundos
              </span>
              <span className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.round(fraccionRestante * 100)}%` }}
                />
              </span>
            </div>
          </div>
        )}

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
