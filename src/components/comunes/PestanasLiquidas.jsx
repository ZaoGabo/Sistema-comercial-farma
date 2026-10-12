/**
 * Pestañas sobrias estilo Linear/Notion en tema claro.
 * Conserva la API anterior (items, valor, onCambio, orientacion, compacto).
 * La pestaña activa es blanca con borde fino y sombra sutil.
 */
export default function PestanasLiquidas({
  items,
  valor,
  onCambio,
  orientacion = 'horizontal',
  etiquetaAccesible,
  compacto = false,
  className = '',
}) {
  const vertical = orientacion === 'vertical';

  function alPulsarTecla(evento, indice) {
    const avance = vertical ? 'ArrowDown' : 'ArrowRight';
    const retroceso = vertical ? 'ArrowUp' : 'ArrowLeft';
    let destino = null;
    if (evento.key === avance) destino = (indice + 1) % items.length;
    if (evento.key === retroceso) destino = (indice - 1 + items.length) % items.length;
    if (destino === null) return;
    evento.preventDefault();
    onCambio(items[destino].clave);
    const hermanos = evento.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
    hermanos?.[destino]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-orientation={orientacion}
      aria-label={etiquetaAccesible}
      className={`flex gap-1 rounded-xl border border-slate-200/60 bg-slate-100/80 p-1 ${
        vertical ? 'flex-col' : 'flex-row flex-wrap items-center'
      } ${className}`}
    >
      {items.map((item, indice) => {
        const activo = item.clave === valor;
        const Icono = item.icono;
        return (
          <button
            key={item.clave}
            type="button"
            role="tab"
            aria-selected={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onCambio(item.clave)}
            onKeyDown={(evento) => alPulsarTecla(evento, indice)}
            className={`flex items-center gap-2 rounded-lg text-left font-medium transition-colors ${
              compacto ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
            } ${
              activo
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
            }`}
          >
            {Icono && (
              <Icono
                className={`size-[1.1em] shrink-0 ${activo ? 'text-blue-700' : 'text-slate-400'}`}
                aria-hidden="true"
              />
            )}
            <span className="flex-1 whitespace-nowrap">{item.etiqueta}</span>
            {item.contador !== undefined && item.contador !== null && (
              <span
                className={`rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ring-1 ring-inset ${
                  activo
                    ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                    : 'bg-white text-slate-500 ring-slate-200'
                }`}
              >
                {item.contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
