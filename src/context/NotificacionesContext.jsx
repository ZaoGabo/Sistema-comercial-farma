import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, ShieldAlert, TriangleAlert, X } from 'lucide-react';

const NotificacionesContext = createContext(null);

const ESTILOS = {
  exito: { icono: CheckCircle2, anillo: 'border-emerald-200', color: 'text-emerald-600' },
  error: { icono: TriangleAlert, anillo: 'border-rose-200', color: 'text-rose-600' },
  politica: { icono: ShieldAlert, anillo: 'border-amber-200', color: 'text-amber-600' },
  info: { icono: Info, anillo: 'border-blue-200', color: 'text-blue-700' },
};

const DURACION_MS = 5200;

export function NotificacionesProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const contador = useRef(0);

  const descartar = useCallback((id) => {
    setNotificaciones((actuales) => actuales.filter((item) => item.id !== id));
  }, []);

  const notificar = useCallback(
    ({ tipo = 'info', titulo, mensaje }) => {
      contador.current += 1;
      const id = contador.current;
      setNotificaciones((actuales) => [...actuales.slice(-3), { id, tipo, titulo, mensaje }]);
      window.setTimeout(() => descartar(id), DURACION_MS);
      return id;
    },
    [descartar],
  );

  const valor = useMemo(() => ({ notificar }), [notificar]);

  return (
    <NotificacionesContext.Provider value={valor}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {notificaciones.map((item) => {
            const estilo = ESTILOS[item.tipo] || ESTILOS.info;
            const Icono = estilo.icono;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg ${estilo.anillo}`}
                role="status"
              >
                <Icono className={`mt-0.5 size-5 shrink-0 ${estilo.color}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.titulo}</p>
                  {item.mensaje && (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.mensaje}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => descartar(item.id)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Cerrar notificacion"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const contexto = useContext(NotificacionesContext);
  if (!contexto) {
    throw new Error('useNotificaciones debe utilizarse dentro de un NotificacionesProvider.');
  }
  return contexto;
}
