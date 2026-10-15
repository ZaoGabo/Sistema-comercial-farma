import { useMemo, useState } from 'react';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { AvisoCatalogo, Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import NumeroAnimado from '../comunes/NumeroAnimado.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';
import { useCatalogos } from '../../hooks/useCatalogos.js';
import { serviciosModulos } from '../../api/modulos.servicio.js';
import { ENTORNO } from '../../config/entorno.js';
import { aOpcionesCatalogo } from '../../utils/catalogos.js';
import { fechaHoyIso, formatearMoneda, redondear } from '../../utils/formato.js';

function crearLineaVacia() {
  return { idProducto: '', cantidad: '1', precioUnitario: '' };
}

function Formulario({ catalogos, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    idProveedor: '',
    idEmpleado: '',
    fechaEntrega: '',
    observaciones: '',
  });
  const [lineas, setLineas] = useState(() => [crearLineaVacia()]);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const productos = useMemo(() => catalogos.productos || [], [catalogos.productos]);

  const opcionesProveedores = useMemo(() => {
    const lista = catalogos.proveedores || [];
    const ordenados = [...lista].sort((a, b) => (Number(a.ID_PROVEEDOR) || 0) - (Number(b.ID_PROVEEDOR) || 0));
    return aOpcionesCatalogo(ordenados, {
      valor: 'ID_PROVEEDOR',
      etiqueta: 'PRV_RAZON_SOCIAL',
      detalle: 'PRV_RUC',
    });
  }, [catalogos.proveedores]);

  const opcionesCompradores = useMemo(() => {
    const lista = catalogos.compradores || [];
    const ordenados = [...lista].sort((a, b) => {
      const aEsCompras = String(a.CARGO || '').toUpperCase().includes('COMPRAS') ? 0 : 1;
      const bEsCompras = String(b.CARGO || '').toUpperCase().includes('COMPRAS') ? 0 : 1;
      if (aEsCompras !== bEsCompras) return aEsCompras - bEsCompras;
      return (Number(a.ID_EMPLEADO) || 0) - (Number(b.ID_EMPLEADO) || 0);
    });
    return aOpcionesCatalogo(ordenados, {
      valor: 'ID_EMPLEADO',
      etiqueta: 'NOMBRE_COMPLETO',
      detalle: 'CARGO',
    });
  }, [catalogos.compradores]);

  const opcionesProductos = useMemo(() => {
    const lista = productos || [];
    const ordenados = [...lista].sort((a, b) => (Number(a.ID_PRODUCTO) || 0) - (Number(b.ID_PRODUCTO) || 0));
    return aOpcionesCatalogo(ordenados, {
      valor: 'ID_PRODUCTO',
      etiqueta: 'PRO_NOMBRE',
      detalle: 'PRO_CODIGO',
    });
  }, [productos]);

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((suma, linea) => {
      const cantidad = leerNumero(linea.cantidad);
      const precio = leerNumero(linea.precioUnitario);
      return Number.isFinite(cantidad) && Number.isFinite(precio) ? suma + cantidad * precio : suma;
    }, 0);
    const iva = redondear((subtotal * ENTORNO.ivaPorcentaje) / 100);
    return { subtotal: redondear(subtotal), iva, total: redondear(subtotal + iva) };
  }, [lineas]);

  function actualizarCampo(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }));
  }

  function actualizarLinea(indice, cambios) {
    setLineas((actuales) =>
      actuales.map((linea, posicion) => (posicion === indice ? { ...linea, ...cambios } : linea)),
    );
  }

  function agregarLinea() {
    setLineas((actuales) => [...actuales, crearLineaVacia()]);
  }

  function eliminarLinea(indice) {
    setLineas((actuales) => (actuales.length <= 1 ? actuales : actuales.filter((_, posicion) => posicion !== indice)));
  }

  function alElegirProducto(indice, idProducto) {
    const producto = productos.find((item) => String(item.ID_PRODUCTO) === idProducto);
    actualizarLinea(indice, {
      idProducto,
      precioUnitario: producto?.PRO_PRECIO_COMPRA != null ? String(producto.PRO_PRECIO_COMPRA) : '',
    });
  }

  function validar() {
    const nuevos = { lineas: [] };
    if (!valores.idProveedor) nuevos.idProveedor = 'Seleccione un proveedor activo.';
    if (!valores.idEmpleado) nuevos.idEmpleado = 'Seleccione el comprador responsable.';
    if (!valores.fechaEntrega) nuevos.fechaEntrega = 'Indique la fecha de entrega esperada.';
    else if (valores.fechaEntrega < fechaHoyIso()) {
      nuevos.fechaEntrega = 'La fecha de entrega no puede ser anterior a hoy.';
    }
    if (lineas.length === 0) nuevos.detalleGeneral = 'Agregue al menos un producto a la orden.';

    const vistos = new Set();
    lineas.forEach((linea, indice) => {
      const error = {};
      const cantidad = leerNumero(linea.cantidad);
      const precio = leerNumero(linea.precioUnitario);
      if (!linea.idProducto) error.idProducto = 'Requerido';
      else if (vistos.has(linea.idProducto)) error.idProducto = 'Producto repetido';
      else vistos.add(linea.idProducto);
      if (!Number.isInteger(cantidad) || cantidad <= 0) error.cantidad = 'Entero mayor a 0';
      if (!Number.isFinite(precio) || precio <= 0) error.precioUnitario = 'Mayor a 0';
      nuevos.lineas[indice] = error;
    });

    setErrores(nuevos);
    const hayErrorCabecera = ['idProveedor', 'idEmpleado', 'fechaEntrega', 'detalleGeneral'].some(
      (clave) => nuevos[clave],
    );
    const hayErrorLineas = nuevos.lineas.some((error) => Object.keys(error).length > 0);
    return !hayErrorCabecera && !hayErrorLineas;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setErrorServidor('');
    if (!validar()) return;

    const detalles = lineas.map((linea) => ({
      idProducto: Number(linea.idProducto),
      cantidad: Number(linea.cantidad),
      precioUnitario: Number(linea.precioUnitario),
    }));

    setEnviando(true);
    try {
      await onGuardar({
        idProveedor: Number(valores.idProveedor),
        idEmpleado: Number(valores.idEmpleado),
        observaciones: valores.observaciones.trim() || undefined,
        fechaEntrega: valores.fechaEntrega,
        detalles,
        productos: detalles,
      });
    } catch (fallo) {
      setErrorServidor(fallo.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} noValidate>
      <div className="space-y-5 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Proveedor" htmlFor="compra-proveedor" requerido error={errores.idProveedor}>
            <SelectorBuscable
              id="compra-proveedor"
              opciones={opcionesProveedores}
              valor={valores.idProveedor}
              onCambio={(valor) => actualizarCampo('idProveedor', valor)}
              placeholder="Buscar proveedor activo"
              invalido={Boolean(errores.idProveedor)}
            />
          </Campo>
          <Campo etiqueta="Comprador responsable" htmlFor="compra-comprador" requerido error={errores.idEmpleado}>
            <SelectorBuscable
              id="compra-comprador"
              opciones={opcionesCompradores}
              valor={valores.idEmpleado}
              onCambio={(valor) => actualizarCampo('idEmpleado', valor)}
              placeholder="Buscar empleado"
              invalido={Boolean(errores.idEmpleado)}
            />
          </Campo>
          <Campo etiqueta="Fecha de entrega esperada" htmlFor="compra-fecha" requerido error={errores.fechaEntrega}>
            <input
              id="compra-fecha"
              type="date"
              min={fechaHoyIso()}
              className={`campo ${errores.fechaEntrega ? 'campo-error' : ''}`}
              value={valores.fechaEntrega}
              onChange={(evento) => actualizarCampo('fechaEntrega', evento.target.value)}
            />
          </Campo>
          <Campo etiqueta="Observaciones" htmlFor="compra-observaciones">
            <input
              id="compra-observaciones"
              type="text"
              maxLength={200}
              className="campo"
              value={valores.observaciones}
              onChange={(evento) => actualizarCampo('observaciones', evento.target.value)}
              placeholder="Opcional"
            />
          </Campo>
        </div>

        <section aria-labelledby="titulo-productos-compra" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="titulo-productos-compra" className="etiqueta-seccion">
              Productos de la orden ({lineas.length})
            </h3>
            <button
              type="button"
              onClick={agregarLinea}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Agregar producto
            </button>
          </div>
          {errores.detalleGeneral && <p className="text-[11px] text-rose-600">{errores.detalleGeneral}</p>}
          <div className="space-y-2">
            {lineas.map((linea, indice) => {
              const error = errores.lineas?.[indice] || {};
              const prefijo = `compra-linea-${indice}`;
              const cantidad = leerNumero(linea.cantidad);
              const precio = leerNumero(linea.precioUnitario);
              const subtotalLinea =
                Number.isFinite(cantidad) && Number.isFinite(precio)
                  ? redondear(cantidad * precio)
                  : 0;
              return (
                <div
                  key={prefijo}
                  className="grid grid-cols-[1.5rem_1fr] items-start gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_7rem_auto]"
                >
                  <span className="mt-2 text-center font-mono text-xs text-slate-400">{indice + 1}</span>
                  <div className="min-w-0">
                    <SelectorBuscable
                      id={`${prefijo}-producto`}
                      etiquetaAccesible={`Producto ${indice + 1}`}
                      opciones={opcionesProductos}
                      valor={linea.idProducto}
                      onCambio={(valor) => alElegirProducto(indice, valor)}
                      placeholder={`Buscar producto ${indice + 1}`}
                      invalido={Boolean(error.idProducto)}
                    />
                    {error.idProducto && <p className="mt-1 text-[11px] text-rose-600">{error.idProducto}</p>}
                  </div>
                  <div className="col-start-2 sm:col-start-auto">
                    <label htmlFor={`${prefijo}-cantidad`} className="sr-only">
                      Cantidad del producto {indice + 1}
                    </label>
                    <input
                      id={`${prefijo}-cantidad`}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="Cant."
                      className={`campo font-mono tabular-nums ${error.cantidad ? 'campo-error' : ''}`}
                      value={linea.cantidad}
                      onChange={(evento) => actualizarLinea(indice, { cantidad: evento.target.value })}
                    />
                    {error.cantidad && <p className="mt-1 text-[11px] text-rose-600">{error.cantidad}</p>}
                  </div>
                  <div className="col-start-2 sm:col-start-auto">
                    <label htmlFor={`${prefijo}-precio`} className="sr-only">
                      Precio unitario del producto {indice + 1}
                    </label>
                    <input
                      id={`${prefijo}-precio`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Precio"
                      className={`campo font-mono tabular-nums ${error.precioUnitario ? 'campo-error' : ''}`}
                      value={linea.precioUnitario}
                      onChange={(evento) => actualizarLinea(indice, { precioUnitario: evento.target.value })}
                    />
                    {error.precioUnitario && (
                      <p className="mt-1 text-[11px] text-rose-600">{error.precioUnitario}</p>
                    )}
                  </div>
                  <div className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                    <span className="font-mono text-xs tabular-nums text-slate-600" aria-label={`Subtotal linea ${indice + 1}`}>
                      {formatearMoneda(subtotalLinea)}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarLinea(indice)}
                      disabled={lineas.length <= 1}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      aria-label={`Eliminar producto ${indice + 1}`}
                      title="Eliminar linea"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <NumeroAnimado valor={totales.subtotal} moneda className="font-mono text-slate-900" />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>IVA estimado ({ENTORNO.ivaPorcentaje}%)</span>
            <NumeroAnimado valor={totales.iva} moneda className="font-mono text-slate-900" />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
            <span>Total estimado</span>
            <NumeroAnimado valor={totales.total} moneda className="font-mono" />
          </div>
          <p className="pt-1 text-[10px] leading-snug text-slate-400">
            Estimación referencial ({formatearMoneda(totales.total)}). El total definitivo lo calcula el procedimiento
            almacenado en Oracle.
          </p>
        </div>

        <ErrorServidor mensaje={errorServidor} />
      </div>
      <PieFormulario onCancelar={onCancelar} enviando={enviando} etiquetaEnviar="Emitir orden de compra" icono={ShoppingCart} />
    </form>
  );
}

export default function ModalCrearCompra({ abierto, onCerrar, onGuardar }) {
  const { catalogos, cargando, error, recargar } = useCatalogos(serviciosModulos.compras, abierto);

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva orden de compra"
      descripcion="Capture la cabecera y agregue libremente las lineas de productos con cantidad y precio referencial."
      icono={ShoppingCart}
      ancho="max-w-4xl"
    >
      {catalogos ? (
        <Formulario catalogos={catalogos} onGuardar={onGuardar} onCancelar={onCerrar} />
      ) : (
        <AvisoCatalogo cargando={cargando} error={error} onReintentar={recargar} />
      )}
    </ModalBase>
  );
}
