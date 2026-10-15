import { useState } from 'react';
import { motion } from 'motion/react';
import { Ban, Timer, TriangleAlert, X } from 'lucide-react';
import BotonMagnetico from '../comunes/BotonMagnetico.jsx';
import { useInactividadModal } from '../../hooks/useInactividadModal.js';

export default function ModalAnular({
  abierto,
  onCerrar,
  onConfirmar,
  titulo = 'Anular Transacción',
  entidad = 'registro',
  identificador = '',
  cargando = false,
}) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const ocupado = Boolean(cargando || enviando);
  const { segundosRestantes, totalPermitido, fraccionRestante } = useInactividadModal({
    abierto,
    onCerrar,
    pausado: ocupado,
  });

  if (!abierto) return null;

  async function alEnviar(evento) {
    evento.preventDefault();
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      setError('Debe especificar un motivo formal para la anulación institucional.');
      return;
    }
    if (motivoLimpio.length < 5) {
      setError('El motivo debe contener al menos 5 caracteres descriptivos.');
      return;
    }
    setError('');
    // La confirmación puede ser rechazada por la Capa 2 (p. ej. HTTP 403 por matriz o por
    // segregación departamental). Se captura aquí para mostrarla en el propio modal sin
    // provocar rechazos sin capturar en consola ni pantallas en blanco.
    setEnviando(true);
    try {
      await onConfirmar(motivoLimpio);
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo completar la anulación.');
    } finally {
      setEnviando(false);
    }
  }

  function alCerrar() {
    setMotivo('');
    setError('');
    setEnviando(false);
    onCerrar();
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <motion.div
        className="relative z-10 my-auto flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-anular-titulo"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-600/20">
              <Ban className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="modal-anular-titulo" className="text-base font-semibold text-slate-900">
                {titulo}
              </h2>
              {identificador && (
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  Referencia: {identificador}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar ventana modal"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {!ocupado && (
          <div
            className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-6 py-2"
            role="status"
            aria-label={`La ventana se cerrara por inactividad en ${segundosRestantes} segundos`}
          >
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Timer className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="tabular-nums">
                Cierre automatico por inactividad en {segundosRestantes} de {totalPermitido} segundos
              </span>
              <span className="ml-auto h-1.5 w-32 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.round(fraccionRestante * 100)}%` }}
                />
              </span>
            </div>
          </div>
        )}

        <form onSubmit={alEnviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="max-h-[62vh] min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed">
              Atención: Esta acción anulará formalmente la {entidad.toLowerCase()}. Los efectos
              transaccionales se revertirán en el repositorio central de Oracle Database 21c según
              las reglas del procedimiento almacenado.
            </p>
          </div>

          <div>
            <label htmlFor="motivo-anulacion" className="block text-xs font-medium text-slate-700">
              Motivo de anulación <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="motivo-anulacion"
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError('');
              }}
              placeholder="Especifique la justificación institucional de la anulación..."
              className={`campo mt-1.5 ${error ? 'campo-error' : ''}`}
              disabled={cargando || enviando}
              autoFocus
            />
            {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
          </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={alCerrar}
              disabled={cargando || enviando}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <BotonMagnetico
              type="submit"
              variante="peligro"
              icono={Ban}
              cargando={cargando || enviando}
            >
              Confirmar Anulación
            </BotonMagnetico>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
