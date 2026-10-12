import { Check, Circle, X } from 'lucide-react';

const ESTILOS = {
  hecho: { nodo: 'bg-emerald-600 text-white', linea: 'bg-emerald-200', texto: 'text-slate-900' },
  actual: { nodo: 'bg-blue-600 text-white', linea: 'bg-slate-200', texto: 'text-slate-900' },
  pendiente: { nodo: 'bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200', linea: 'bg-slate-200', texto: 'text-slate-500' },
  error: { nodo: 'bg-rose-600 text-white', linea: 'bg-rose-200', texto: 'text-rose-800' },
};

/**
 * Stepper vertical de auditoría del ciclo de vida de una transacción.
 */
export default function PasosAuditoria({ pasos }) {
  return (
    <ol className="space-y-0" aria-label="Línea de auditoría">
      {pasos.map((paso, indice) => {
        const estilo = ESTILOS[paso.estado] || ESTILOS.pendiente;
        const ultimo = indice === pasos.length - 1;
        return (
          <li key={paso.clave} className="relative flex gap-3 pb-4 last:pb-0">
            {!ultimo && (
              <span
                className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${estilo.linea}`}
                aria-hidden="true"
              />
            )}
            <span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full ${estilo.nodo}`}>
              {paso.estado === 'hecho' && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
              {paso.estado === 'error' && <X className="size-3.5" strokeWidth={3} aria-hidden="true" />}
              {(paso.estado === 'actual' || paso.estado === 'pendiente') && (
                <Circle className="size-2.5 fill-current" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`text-sm font-medium ${estilo.texto}`}>{paso.titulo}</p>
              <p className="text-xs leading-relaxed text-slate-500">{paso.detalle}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
