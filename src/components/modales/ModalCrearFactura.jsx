import { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { AvisoCatalogo, Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import NumeroAnimado from '../comunes/NumeroAnimado.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';
import { useCatalogos } from '../../hooks/useCatalogos.js';
import { serviciosModulos } from '../../api/modulos.servicio.js';
import { ENTORNO } from '../../config/entorno.js';
import { aNumero, formatearEntero, redondear } from '../../utils/formato.js';

function Formulario({ catalogos, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    idCliente: '',
    idVendedor: '',
    idProducto: '',
    cantidad: '1',
    precioUnitario: '',
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const productos = useMemo(() => catalogos.productos || [], [catalogos.productos]);
  const producto = productos.find((item) => String(item.ID_PRODUCTO) === valores.idProducto);
  const stockDisponible = producto ? aNumero(producto.PRO_STOCK_ACTUAL) : null;

  const opcionesClientes = useMemo(
    () =>
      (catalogos.clientes || []).map((cliente) => ({
        valor: cliente.ID_CLIENTE,
        etiqueta: cliente.CLI_NOMBRE,
        detalle: cliente.CLI_RUC_CED,
      })),
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
      productos.map((item) => ({
        valor: item.ID_PRODUCTO,
        etiqueta: item.PRO_NOMBRE,
        detalle: `${item.PRO_CODIGO} - Stock ${formatearEntero(item.PRO_STOCK_ACTUAL)}`,
      })),
    [productos],
  );

  const totales = useMemo(() => {
    const cantidad = leerNumero(valores.cantidad);
    const precio = leerNumero(valores.precioUnitario);
    const subtotal = Number.isFinite(cantidad) && Number.isFinite(precio) ? cantidad * precio : 0;
    const iva = redondear((subtotal * ENTORNO.ivaPorcentaje) / 100);
    return { subtotal: redondear(subtotal), iva, total: redondear(subtotal + iva) };
  }, [valores.cantidad, valores.precioUnitario]);

  function actualizar(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }));
  }

  function alElegirProducto(idProducto) {
    const elegido = productos.find((item) => String(item.ID_PRODUCTO) === idProducto);
    setValores((actuales) => ({
      ...actuales,
      idProducto,
      precioUnitario:
        elegido?.PRO_PRECIO_REFERENCIAL != null ? String(elegido.PRO_PRECIO_REFERENCIAL) : '',
    }));
  }

  function validar() {
    const nuevos = {};
    const cantidad = leerNumero(valores.cantidad);
    const precio = leerNumero(valores.precioUnitario);

    if (!valores.idCliente) nuevos.idCliente = 'Seleccione un cliente activo.';
    if (!valores.idVendedor) nuevos.idVendedor = 'Seleccione al vendedor.';
    if (!valores.idProducto) nuevos.idProducto = 'Seleccione el producto a facturar.';
    if (!Number.isInteger(cantidad) || cantidad <= 0) nuevos.cantidad = 'Ingrese un entero mayor a 0.';
    else if (stockDisponible !== null && cantidad > stockDisponible) {
      nuevos.cantidad = `Stock insuficiente: disponible ${formatearEntero(stockDisponible)}.`;
    }
    if (!Number.isFinite(precio) || precio <= 0) nuevos.precioUnitario = 'El precio debe ser mayor a 0.';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setErrorServidor('');
    if (!validar()) return;
    setEnviando(true);
    try {
      await onGuardar({
        idCliente: Number(valores.idCliente),
        idVendedor: Number(valores.idVendedor),
        idProducto: Number(valores.idProducto),
        cantidad: Number(valores.cantidad),
        precioUnitario: Number(valores.precioUnitario),
      });
    } catch (fallo) {
      setErrorServidor(fallo.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} noValidate>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Cliente" htmlFor="factura-cliente" requerido error={errores.idCliente}>
            <SelectorBuscable
              id="factura-cliente"
              opciones={opcionesClientes}
              valor={valores.idCliente}
              onCambio={(valor) => actualizar('idCliente', valor)}
              placeholder="Buscar cliente"
              invalido={Boolean(errores.idCliente)}
            />
          </Campo>
          <Campo etiqueta="Vendedor" htmlFor="factura-vendedor" requerido error={errores.idVendedor}>
            <SelectorBuscable
              id="factura-vendedor"
              opciones={opcionesVendedores}
              valor={valores.idVendedor}
              onCambio={(valor) => actualizar('idVendedor', valor)}
              placeholder="Buscar vendedor"
              invalido={Boolean(errores.idVendedor)}
            />
          </Campo>
          <Campo
            etiqueta="Producto"
            htmlFor="factura-producto"
            requerido
            error={errores.idProducto}
            className="sm:col-span-2"
            ayuda={
              stockDisponible !== null ? `Stock disponible: ${formatearEntero(stockDisponible)} unidades.` : undefined
            }
          >
            <SelectorBuscable
              id="factura-producto"
              opciones={opcionesProductos}
              valor={valores.idProducto}
              onCambio={alElegirProducto}
              placeholder="Buscar producto con existencias"
              invalido={Boolean(errores.idProducto)}
            />
          </Campo>
          <Campo etiqueta="Cantidad" htmlFor="factura-cantidad" requerido error={errores.cantidad}>
            <input
              id="factura-cantidad"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className={`campo font-mono tabular-nums ${errores.cantidad ? 'campo-error' : ''}`}
              value={valores.cantidad}
              onChange={(evento) => actualizar('cantidad', evento.target.value)}
            />
          </Campo>
          <Campo etiqueta="Precio unitario" htmlFor="factura-precio" requerido error={errores.precioUnitario}>
            <input
              id="factura-precio"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={`campo font-mono tabular-nums ${errores.precioUnitario ? 'campo-error' : ''}`}
              value={valores.precioUnitario}
              onChange={(evento) => actualizar('precioUnitario', evento.target.value)}
            />
          </Campo>
        </div>

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
      descripcion="El procedimiento valida cliente activo y stock suficiente, y calcula el IVA correspondiente."
      icono={Receipt}
      ancho="max-w-2xl"
    >
      {catalogos ? (
        <Formulario catalogos={catalogos} onGuardar={onGuardar} onCancelar={onCerrar} />
      ) : (
        <AvisoCatalogo cargando={cargando} error={error} onReintentar={recargar} />
      )}
    </ModalBase>
  );
}
