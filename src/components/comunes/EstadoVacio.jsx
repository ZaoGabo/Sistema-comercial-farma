import { Inbox, TriangleAlert } from 'lucide-react';

export function EstadoVacio({ titulo, descripcion, icono: Icono = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200">
        <Icono className="size-5 text-slate-400" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-slate-900">{titulo}</p>
      {descripcion && <p className="max-w-sm text-xs leading-relaxed text-slate-500">{descripcion}</p>}
    </div>
  );
}

export function BannerError({ mensaje, onReintentar }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
    >
      <TriangleAlert className="size-5 shrink-0 text-rose-500" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-relaxed">{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
