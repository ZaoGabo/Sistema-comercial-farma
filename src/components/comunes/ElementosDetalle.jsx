/**
 * Piezas de presentacion reutilizables para el desglose maestro-detalle del inspector lateral.
 */
import { CodigoAuditoria, ImporteEditorial } from './FormatoInstitucional.jsx';

export function SeccionDetalle({ titulo, accion, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="etiqueta-seccion">{titulo}</h3>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function CuadriculaDatos({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {items.map((item) => (
        <div key={item.etiqueta} className={item.ancho === 'completo' ? 'col-span-2' : ''}>
          <dt className="text-[11px] font-medium text-slate-500">{item.etiqueta}</dt>
          <dd className="mt-1 break-words text-sm text-slate-900">
            {item.mono ? <CodigoAuditoria>{item.valor ?? '—'}</CodigoAuditoria> : (item.valor ?? '—')}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Tabla compacta para las lineas de detalle.
 * columnas: [{ clave, titulo, render?, mono?, alinear? }]
 */
export function TablaMini({ columnas, filas, obtenerId, pie }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
      <table className="w-full min-w-[24rem] border-collapse bg-white text-xs">
        <thead>
          <tr className="bg-slate-50">
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                className={`px-3 py-2 font-semibold text-slate-500 ${
                  columna.alinear === 'derecha' ? 'text-right' : 'text-left'
                }`}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((fila, indice) => (
            <tr key={obtenerId ? obtenerId(fila) : indice}>
              {columnas.map((columna) => (
                <td
                  key={columna.clave}
                  className={`px-3 py-2 ${columna.alinear === 'derecha' ? 'text-right' : 'text-left'} ${
                    columna.mono ? 'font-mono tabular-nums text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {columna.render ? columna.render(fila) : fila[columna.clave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {pie && <tfoot>{pie}</tfoot>}
      </table>
    </div>
  );
}

export function FilaTotal({ etiqueta, valor, destacada = false, moneda = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        destacada
          ? 'border-t border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900'
          : 'text-xs text-slate-500'
      }`}
    >
      <span>{etiqueta}</span>
      {moneda ? (
        <ImporteEditorial valor={valor} className={destacada ? 'text-base' : 'text-xs'} />
      ) : (
        <span className="font-mono tabular-nums">{valor}</span>
      )}
    </div>
  );
}
