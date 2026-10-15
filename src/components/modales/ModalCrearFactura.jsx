import { useMemo, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { AvisoCatalogo, Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import NumeroAnimado from '../comunes/NumeroAnimado.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';
import { useCatalogos } from '../../hooks/useCatalogos.js';
import { serviciosModulos } from '../../api/modulos.servicio.js';
import { ENTORNO } from '../../config/entorno.js';
import { aOpcionesCatalogo } from '../../utils/catalogos.js';
import { aNumero, formatearEntero, formatearMoneda, redondear } from '../../utils/formato.js';

function crearLineaVacia() {
  return { idProducto: '', cantidad: '1', precioUnitario: '' };
}

function Formulario({ catalogos, onGuardar, onCancelar }) {
  const [cabecera, setCabecera] = useState({ idCliente: '', idVendedor: '' });
  const [lineas, setLineas] = useState(() => [crearLineaVacia()]);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const productos = useMemo(() => catalogos.productos || [], [catalogos.productos]);

  const opcionesClientes = useMemo(
    () =>
      aOpcionesCatalogo(catalogos.clientes || [], {
        valor: 'ID_CLIENTE',
        etiqueta: 'CLI_NOMBRE',
        detalle: 'CLI_RUC_CED',
      }),
    [catalogos.clientes],
  );
  const opcionesVendedores = useMemo(
    () =>
      (catalogos.vendedores || []).map((vendedor) => ({
        valor: vendedor.ID_EMPLEADO,
        etiqueta: vendedor.NOMBRE_COMPLETO,
      })),
    [catalogos.vendedores],
  );
  const opcionesProductos = useMemo(
    () =>
      aOpcionesCatalogo(productos, {
        valor: 'ID_PRODUCTO',
        etiqueta: 'PRO_NOMBRE',
        detalle: (producto) =>
          `${producto.PRO_CODIGO} - Stock ${formatearEntero(producto.PRO_STOCK_ACTUAL)}`,
      }),
    [productos],
  );

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((suma, linea) => {
      const cantidad = leerNumero(linea.cantidad);
      const precio = leerNumero(linea.precioUnitario);
      return Number.isFinite(cantidad) && Number.isFinite(precio) ? suma + cantidad * precio : suma;
    }, 0);
    const iva = redondear((subtotal * ENTORNO.ivaPorcentaje) / 100);
    return { subtotal: redondear(subtotal), iva, total: redondear(subtotal + iva) };
  }, [lineas]);

  function actualizarCabecera(clave, valor) {
    setCabecera((actual) => ({ ...actual, [clave]: valor }));
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
    const elegido = productos.find((item) => String(item.ID_PRODUCTO) === idProducto);
    actualizarLinea(indice, {
      idProducto,
      precioUnitario:
        elegido?.PRO_PRECIO_REFERENCIAL != null ? String(elegido.PRO_PRECIO_REFERENCIAL) : '',
    });
  }

  function validar() {
    const nuevos = { lineas: [] };
    if (!cabecera.idCliente) nuevos.idCliente = 'Seleccione un cliente activo.';
    if (!cabecera.idVendedor) nuevos.idVendedor = 'Seleccione al vendedor.';
    if (lineas.length === 0) nuevos.detalleGeneral = 'Agregue al menos un producto a la factura.';

    const vistos = new Set();
    lineas.forEach((linea, indice) => {
      const error = {};
      const cantidad = leerNumero(linea.cantidad);
      const precio = leerNumero(linea.precioUnitario);
      const producto = productos.find((item) => String(item.ID_PRODUCTO) === linea.idProducto);
      const stock = producto ? aNumero(producto.PRO_STOCK_ACTUAL) : null;

      if (!linea.idProducto) error.idProducto = 'Requerido';
      else if (vistos.has(linea.idProducto)) error.idProducto = 'Producto repetido';
      else vistos.add(linea.idProducto);
      if (!Number.isInteger(cantidad) || cantidad <= 0) error.cantidad = 'Entero mayor a 0';
      else if (stock !== null && cantidad > stock) {
        error.cantidad = `Stock insuficiente: disponible ${formatearEntero(stock)}.`;
      }
      if (!Number.isFinite(precio) || precio <= 0) error.precioUnitario = 'Mayor a 0';
      nuevos.lineas[indice] = error;
    });

    setErrores(nuevos);
    const hayErrorCabecera = ['idCliente', 'idVendedor', 'detalleGeneral'].some((clave) => nuevos[clave]);
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
    const primera = detalles[0];
    setEnviando(true);
    try {
      await onGuardar({
        idCliente: Number(cabecera.idCliente),
        idVendedor: Number(cabecera.idVendedor),
        detalles,
        idProducto: primera.idProducto,
        cantidad: primera.cantidad,
        precioUnitario: primera.precioUnitario,
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
          <Campo etiqueta="Cliente" htmlFor="factura-cliente" requerido error={errores.idCliente}>
            <SelectorBuscable
              id="factura-cliente"
              opciones={opcionesClientes}
              valor={cabecera.idCliente}
              onCambio={(valor) => actualizarCabecera('idCliente', valor)}
              placeholder="Buscar cliente activo"
              invalido={Boolean(errores.idCliente)}
            />
          </Campo>
          <Campo etiqueta="Vendedor" htmlFor="factura-vendedor" requerido error={errores.idVendedor}>
            <SelectorBuscable
              id="factura-vendedor"
              opciones={opcionesVendedores}
              valor={cabecera.idVendedor}
              onCambio={(valor) => actualizarCabecera('idVendedor', valor)}
              placeholder="Buscar vendedor"
              invalido={Boolean(errores.idVendedor)}
            />
          </Campo>
        </div>

        <section aria-labelledby="titulo-productos-factura" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="titulo-productos-factura" className="etiqueta-seccion">
              Productos de la factura ({lineas.length})
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
              const prefijo = `factura-linea-${indice}`;
              const producto = productos.find((item) => String(item.ID_PRODUCTO) === linea.idProducto);
              const stock = producto ? aNumero(producto.PRO_STOCK_ACTUAL) : null;
              const cantidad = leerNumero(linea.cantidad);
              const precio = leerNumero(linea.precioUnitario);
              const subtotalLinea =
                Number.isFinite(cantidad) && Number.isFinite(precio) ? redondear(cantidad * precio) : 0;
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
                    {stock !== null && !error.idProducto && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Stock disponible: {formatearEntero(stock)} unidades.
                      </p>
                    )}
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
        </div>

        <ErrorServidor mensaje={errorServidor} />
      </div>
      <PieFormulario onCancelar={onCancelar} enviando={enviando} etiquetaEnviar="Crear factura" icono={Receipt} />
    </form>
  );
}

export default function ModalCrearFactura({ abierto, onCerrar, onGuardar }) {
  const { catalogos, cargando, error, recargar } = useCatalogos(serviciosModulos.ventas, abierto);

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva factura de venta"
      descripcion="Seleccione el cliente y agregue libremente las lineas de productos con cantidad y precio referencial."
      icono={Receipt}
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
