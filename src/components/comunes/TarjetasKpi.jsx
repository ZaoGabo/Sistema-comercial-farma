import { ImporteEditorial } from './FormatoInstitucional.jsx';
import NumeroAnimado from './NumeroAnimado.jsx';

const TONOS = {
  cian: { icono: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  esmeralda: { icono: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  ambar: { icono: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  carmesi: { icono: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
  violeta: { icono: 'bg-slate-100 text-slate-700 ring-slate-500/20' },
};

/**
 * Cuadricula de tarjetas de metricas estilo Tremor en tema claro.
 * Tarjetas blancas con borde fino, sombra suave y numeros tabulares nitidos.
 */
export default function TarjetasKpi({ tarjetas, columnas = 'lg:grid-cols-4' }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${columnas}`}>
      {tarjetas.map((tarjeta) => {
        const tono = TONOS[tarjeta.tono] || TONOS.cian;
        const Icono = tarjeta.icono;
        return (
          <div
            key={tarjeta.clave}
            className={`sombra-superficie rounded-xl p-5 ${
              tarjeta.critico ? 'border-amber-300' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="etiqueta-seccion">{tarjeta.titulo}</p>
              {Icono && (
                <span className={`grid size-9 place-items-center rounded-lg ring-1 ring-inset ${tono.icono}`}>
                  <Icono className="size-[18px]" aria-hidden="true" />
                </span>
              )}
            </div>
            <p className="mt-3 text-[1.75rem] leading-none text-slate-900">
              {tarjeta.moneda ? (
                <ImporteEditorial valor={tarjeta.valor} />
              ) : (
                <span className="font-semibold tracking-tight tabular-nums">
                  <NumeroAnimado
                    valor={tarjeta.valor}
                    decimales={tarjeta.decimales}
                    sufijo={tarjeta.sufijo}
                  />
                </span>
              )}
            </p>
            {tarjeta.detalle && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{tarjeta.detalle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
