import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

const MAXIMO_VISIBLES = 40;
const ALTO_MAXIMO_LISTA = 240;

/**
 * Selector con búsqueda para catálogos extensos (miles de elementos). Muestra solo los
 * primeros resultados que coinciden con el texto escrito y soporta navegación con teclado.
 *
 * La lista de opciones se renderiza en un portal fijo anclado al campo, por lo que no se
 * recorta dentro de contenedores con desplazamiento interno (como el cuerpo de los modales).
 *
 * opciones: [{ valor, etiqueta, detalle? }]  (valor se compara como texto)
 */
export default function SelectorBuscable({
  id,
  opciones,
  valor,
  onCambio,
  placeholder = 'Seleccione una opción',
  deshabilitado = false,
  invalido = false,
  mensajeVacio = 'Sin coincidencias',
  etiquetaAccesible,
}) {
  const idGenerado = useId();
  const idCampo = id || idGenerado;
  const idLista = `${idCampo}-lista`;
  const contenedorRef = useRef(null);
  const entradaRef = useRef(null);
  const listaRef = useRef(null);
  const panelRef = useRef(null);

  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [posicion, setPosicion] = useState(null);
  const textoDiferido = useDeferredValue(texto);

  const indexadas = useMemo(
    () =>
      opciones.map((opcion) => ({
        ...opcion,
        valor: String(opcion.valor),
        clave: `${opcion.etiqueta} ${opcion.detalle || ''}`.toLowerCase(),
      })),
    [opciones],
  );

  const seleccionada = useMemo(
    () => indexadas.find((opcion) => opcion.valor === String(valor)) || null,
    [indexadas, valor],
  );

  const { visibles, totalCoincidencias } = useMemo(() => {
    const termino = textoDiferido.trim().toLowerCase();
    const resultado = [];
    let total = 0;
    for (const opcion of indexadas) {
      if (termino === '' || opcion.clave.includes(termino)) {
        total += 1;
        if (resultado.length < MAXIMO_VISIBLES) resultado.push(opcion);
      }
    }
    return { visibles: resultado, totalCoincidencias: total };
  }, [indexadas, textoDiferido]);

  function medir() {
    const ancla = contenedorRef.current;
    if (!ancla) return null;
    const rect = ancla.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;
    const haciaArriba = espacioAbajo < 180 && espacioArriba > espacioAbajo;
    return {
      izquierda: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      ancho: rect.width,
      arriba: haciaArriba ? undefined : rect.bottom + 6,
      abajo: haciaArriba ? window.innerHeight - rect.top + 6 : undefined,
      altoMaximo: Math.max(
        120,
        Math.min(ALTO_MAXIMO_LISTA, (haciaArriba ? espacioArriba : espacioAbajo) - 16),
      ),
    };
  }

  useEffect(() => {
    if (!abierto) return undefined;
    setPosicion(medir());
    function alPresionar(evento) {
      const dentroCampo = contenedorRef.current?.contains(evento.target);
      const dentroLista = panelRef.current?.contains(evento.target);
      if (!dentroCampo && !dentroLista) {
        setAbierto(false);
        setTexto('');
        setPosicion(null);
      }
    }
    function alDesplazar() {
      const siguiente = medir();
      if (siguiente) setPosicion(siguiente);
    }
    document.addEventListener('pointerdown', alPresionar);
    document.addEventListener('scroll', alDesplazar, true);
    window.addEventListener('resize', alDesplazar);
    return () => {
      document.removeEventListener('pointerdown', alPresionar);
      document.removeEventListener('scroll', alDesplazar, true);
      window.removeEventListener('resize', alDesplazar);
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    listaRef.current?.children[indiceActivo]?.scrollIntoView({ block: 'nearest' });
  }, [indiceActivo, abierto]);

  function abrir() {
    if (deshabilitado) return;
    setPosicion(medir());
    setAbierto(true);
    setIndiceActivo(0);
    requestAnimationFrame(() => entradaRef.current?.focus());
  }

  function cerrar() {
    setAbierto(false);
    setTexto('');
    setPosicion(null);
  }

  function elegir(opcion) {
    onCambio(opcion ? opcion.valor : '');
    cerrar();
  }

  function alPulsarTecla(evento) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setIndiceActivo((actual) => Math.min(actual + 1, visibles.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setIndiceActivo((actual) => Math.max(actual - 1, 0));
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      if (visibles[indiceActivo]) elegir(visibles[indiceActivo]);
    } else if (evento.key === 'Escape') {
      evento.stopPropagation();
      cerrar();
    }
  }

  return (
    <div className="relative" ref={contenedorRef}>
      {!abierto ? (
        <button
          type="button"
          id={idCampo}
          onClick={abrir}
          disabled={deshabilitado}
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label={etiquetaAccesible}
          aria-invalid={invalido || undefined}
          className={`campo flex items-center justify-between gap-2 text-left ${invalido ? 'campo-error' : ''}`}
        >
          <span className={`min-w-0 flex-1 truncate ${seleccionada ? 'text-slate-900' : 'text-slate-400'}`}>
            {seleccionada ? seleccionada.etiqueta : placeholder}
          </span>
          {seleccionada && !deshabilitado ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Quitar selección"
              onClick={(evento) => {
                evento.stopPropagation();
                onCambio('');
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-3.5" aria-hidden="true" />
            </span>
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          )}
        </button>
      ) : (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={entradaRef}
            id={idCampo}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={visibles[indiceActivo] ? `${idLista}-${indiceActivo}` : undefined}
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setIndiceActivo(0);
            }}
            onKeyDown={alPulsarTecla}
            placeholder="Escriba para buscar"
            autoComplete="off"
            spellCheck={false}
            className="campo pl-9"
          />
        </div>
      )}

      {abierto &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: posicion.izquierda,
              width: posicion.ancho,
              top: posicion.arriba,
              bottom: posicion.abajo,
              zIndex: 70,
            }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <ul
              id={idLista}
              ref={listaRef}
              role="listbox"
              className="overflow-y-auto p-1"
              style={{ maxHeight: posicion.altoMaximo }}
            >
              {visibles.length === 0 && <li className="px-3 py-3 text-xs text-slate-500">{mensajeVacio}</li>}
              {visibles.map((opcion, indice) => {
                const activa = indice === indiceActivo;
                const elegida = opcion.valor === String(valor);
                return (
                  <li
                    key={opcion.valor}
                    id={`${idLista}-${indice}`}
                    role="option"
                    aria-selected={elegida}
                    onPointerDown={(evento) => evento.preventDefault()}
                    onClick={() => elegir(opcion)}
                    onMouseEnter={() => setIndiceActivo(indice)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      activa ? 'bg-blue-50 text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{opcion.etiqueta}</span>
                      {opcion.detalle && (
                        <span className="block truncate text-[11px] text-slate-500">{opcion.detalle}</span>
                      )}
                    </span>
                    {elegida && <Check className="size-4 shrink-0 text-blue-700" aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
            {totalCoincidencias > MAXIMO_VISIBLES && (
              <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                Mostrando {MAXIMO_VISIBLES} de {totalCoincidencias}. Escriba más texto para refinar.
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
