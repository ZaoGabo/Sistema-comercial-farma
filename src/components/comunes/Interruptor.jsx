import { Lock } from 'lucide-react';

/**
 * Interruptor sobrio en tema claro. En modo solo lectura refleja un estado
 * (por ejemplo un permiso RBAC) sin permitir cambiarlo.
 */
export default function Interruptor({ activo, onCambio, etiqueta, descripcion, soloLectura = false }) {
  const bloqueado = soloLectura;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${activo ? 'text-slate-900' : 'text-slate-500'}`}>{etiqueta}</p>
        {descripcion && <p className="text-[11px] leading-snug text-slate-500">{descripcion}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        aria-readonly={soloLectura || undefined}
        onClick={bloqueado ? undefined : onCambio}
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ring-1 ring-inset transition-colors ${
          activo ? 'bg-blue-600 ring-blue-700' : 'bg-slate-200 ring-slate-300'
        } ${bloqueado ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <span
          className={`grid size-5 place-items-center rounded-full bg-white shadow ${
            activo ? 'ml-auto' : ''
          }`}
        >
          {!activo && soloLectura && <Lock className="size-2.5 text-slate-400" aria-hidden="true" />}
        </span>
      </button>
    </div>
  );
}
