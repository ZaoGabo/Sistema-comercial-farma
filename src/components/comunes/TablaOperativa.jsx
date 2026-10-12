import { Eye } from 'lucide-react';
import { EstadoVacio } from './EstadoVacio.jsx';

const ALINEACION = { izquierda: 'text-left', derecha: 'text-right', centro: 'text-center' };

/**
 * Tabla operativa estilo Tremor en tema claro.
 * Cabecera en gris perla y hover suave. Conserva paginacion y seleccion por fila.
 */
export default function TablaOperativa({
  columnas,
  filas,
  obtenerId,
  seleccionadoId = null,
  onSeleccionar,
  sincronizandoIds,
  obtenerLuz,
  cargando = false,
  vacio = { titulo: 'Sin registros', descripcion: 'No hay datos para los filtros actuales.' },
}) {
  if (cargando && filas.length === 0) {
    return (
      <div className="space-y-2 p-4" aria-busy="true" aria-label="Cargando registros">
        {Array.from({ length: 6 }, (_, indice) => (
          <div key={indice} className="esqueleto h-11 rounded-lg" />
        ))}
        <p className="pt-2 text-center text-xs text-slate-500">
          Consultando la vista de Oracle 21c. Con volúmenes altos la primera descarga puede tardar varios segundos.
        </p>
      </div>
    );
  }

  if (filas.length === 0) {
    return <EstadoVacio titulo={vacio.titulo} descripcion={vacio.descripcion} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                style={columna.ancho ? { width: columna.ancho } : undefined}
                className={`etiqueta-seccion border-y border-slate-200/80 px-4 py-3 font-semibold ${
                  ALINEACION[columna.alinear || 'izquierda']
                }`}
              >
                {columna.titulo}
              </th>
            ))}
            {onSeleccionar && (
              <th scope="col" className="w-14 border-y border-slate-200/80 bg-slate-50 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filas.map((fila) => {
            const id = obtenerId(fila);
            const seleccionada = id === seleccionadoId;
            const sincronizando = sincronizandoIds?.has(id);

            return (
              <tr
                key={id}
                aria-selected={seleccionada}
                tabIndex={onSeleccionar ? 0 : undefined}
                onClick={onSeleccionar ? () => onSeleccionar(fila) : undefined}
                onKeyDown={
                  onSeleccionar
                    ? (evento) => {
                        if (evento.key === 'Enter' || evento.key === ' ') {
                          evento.preventDefault();
                          onSeleccionar(fila);
                        }
                      }
                    : undefined
                }
              className={`${onSeleccionar ? 'cursor-pointer' : ''} transition-colors ${
                seleccionada ? 'bg-blue-50/70' : 'even:bg-slate-50/40 hover:bg-slate-50/70'
              } ${sincronizando ? 'opacity-70' : ''}`}
              >
                {columnas.map((columna) => (
                  <td
                    key={columna.clave}
                    className={`px-4 py-3 align-middle ${ALINEACION[columna.alinear || 'izquierda']} ${
                      columna.mono
                        ? 'font-mono tabular-nums text-slate-900'
                        : 'text-slate-600'
                    }`}
                  >
                    {columna.render ? columna.render(fila) : fila[columna.clave]}
                  </td>
                ))}
                {onSeleccionar && (
                  <td className="px-4 py-3 text-right align-middle">
                    <span
                      className="inline-grid size-8 place-items-center rounded-lg text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-600/20"
                      title="Ver detalle"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      <span className="sr-only">Ver detalle</span>
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
