import { useMemo } from 'react';
import { CircleDollarSign, ClipboardList, Clock3, PackageCheck } from 'lucide-react';
import PlantillaModulo from '../components/modulos/PlantillaModulo.jsx';
import ModalCrearCompra from '../components/modales/ModalCrearCompra.jsx';
import { CuadriculaDatos, FilaTotal, SeccionDetalle, TablaMini } from '../components/comunes/ElementosDetalle.jsx';
import { CodigoAuditoria } from '../components/comunes/FormatoInstitucional.jsx';
import InsigniaEstado from '../components/comunes/InsigniaEstado.jsx';
import { useModulo } from '../hooks/useModulo.js';
import { obtenerModulo } from '../config/modulos.js';
import { ENTORNO } from '../config/entorno.js';
import { esPendiente, esVigente } from '../utils/estados.js';
import { aNumero, formatearEntero, formatearFecha, formatearFechaHora, formatearMoneda } from '../utils/formato.js';

const MODULO = obtenerModulo('compras');

const obtenerId = (orden) => orden.idCompra;
const obtenerEstado = (orden) => orden.estado;
const textoBusqueda = (orden) =>
  [orden.numeroOrden, orden.proveedor?.razonSocial, orden.proveedor?.ruc, orden.comprador?.nombre, orden.estado]
    .filter(Boolean)
    .join(' ');

const esAltoValorPendiente = (orden) => esPendiente(orden.estado) && aNumero(orden.total) >= ENTORNO.umbralAltoValor;

const obtenerLuz = (orden) => (esAltoValorPendiente(orden) ? 'ambar' : null);

const COLUMNAS = [
  { clave: 'numeroOrden', titulo: 'Orden', render: (orden) => <CodigoAuditoria>{orden.numeroOrden}</CodigoAuditoria> },
  { clave: 'proveedor', titulo: 'Proveedor', render: (orden) => orden.proveedor?.razonSocial || '—' },
  { clave: 'comprador', titulo: 'Comprador', render: (orden) => orden.comprador?.nombre || '—' },
  { clave: 'fechaEmision', titulo: 'Emisión', render: (orden) => formatearFecha(orden.fechaEmision) },
  { clave: 'fechaEntrega', titulo: 'Entrega', render: (orden) => formatearFecha(orden.fechaEntregaEsperada) },
  {
    clave: 'total',
    titulo: 'Total',
    alinear: 'derecha',
    mono: true,
    render: (orden) => formatearMoneda(orden.total),
  },
  { clave: 'estado', titulo: 'Estado', render: (orden) => <InsigniaEstado estado={orden.estado} /> },
];

const COLUMNAS_PRODUCTOS = [
  {
    clave: 'nombreProducto',
    titulo: 'Producto',
    render: (linea) => (
      <>
        <span className="block text-slate-900">{linea.nombreProducto}</span>
        <CodigoAuditoria>{linea.codigoProducto}</CodigoAuditoria>
      </>
    ),
  },
  { clave: 'cantidad', titulo: 'Cant.', alinear: 'derecha', mono: true, render: (linea) => formatearEntero(linea.cantidad) },
  {
    clave: 'precioUnitario',
    titulo: 'P. unitario',
    alinear: 'derecha',
    mono: true,
    render: (linea) => formatearMoneda(linea.precioUnitario),
  },
  { clave: 'subtotal', titulo: 'Subtotal', alinear: 'derecha', mono: true, render: (linea) => formatearMoneda(linea.subtotal) },
];

function DetalleOrden({ orden }) {
  return (
    <>
      <SeccionDetalle titulo="Datos generales">
        <CuadriculaDatos
          items={[
            { etiqueta: 'Orden', valor: orden.numeroOrden, mono: true },
            { etiqueta: 'Emisión', valor: formatearFechaHora(orden.fechaEmision) },
            { etiqueta: 'Entrega esperada', valor: formatearFecha(orden.fechaEntregaEsperada) },
            { etiqueta: 'Comprador', valor: orden.comprador?.nombre },
            { etiqueta: 'Proveedor', valor: orden.proveedor?.razonSocial, ancho: 'completo' },
            { etiqueta: 'RUC', valor: orden.proveedor?.ruc, mono: true },
            { etiqueta: 'Teléfono', valor: orden.proveedor?.telefono, mono: true },
            { etiqueta: 'Observaciones', valor: orden.observaciones, ancho: 'completo' },
          ]}
        />
      </SeccionDetalle>

      <SeccionDetalle titulo={`Productos de la orden (${orden.detalles?.length || 0})`}>
        <TablaMini columnas={COLUMNAS_PRODUCTOS} filas={orden.detalles || []} obtenerId={(linea) => linea.idDetalle} />
        <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
          <FilaTotal etiqueta="Subtotal" valor={orden.subtotal} moneda />
          <FilaTotal etiqueta="IVA" valor={orden.iva} moneda />
          <FilaTotal etiqueta="Total" valor={orden.total} moneda destacada />
        </div>
      </SeccionDetalle>
    </>
  );
}

export default function ModuloCompras() {
  const datos = useModulo(MODULO.clave, { obtenerId });

  const kpis = useMemo(() => {
    const { registros } = datos;
    const pendientes = registros.filter((orden) => esPendiente(orden.estado));
    const adquiridas = registros.filter((orden) => esVigente(orden.estado));
    const sumar = (lista) => lista.reduce((suma, orden) => suma + aNumero(orden.total), 0);

    return [
      {
        clave: 'total',
        titulo: 'Órdenes registradas',
        valor: registros.length,
        icono: ClipboardList,
        detalle: 'Total de órdenes en la vista maestra',
        tono: 'cian',
      },
      {
        clave: 'pendientes',
        titulo: 'Pendientes de aprobación',
        valor: pendientes.length,
        icono: Clock3,
        detalle: 'Abiertas o pendientes de autorización',
        tono: 'ambar',
      },
      {
        clave: 'monto-pendiente',
        titulo: 'Monto por autorizar',
        valor: sumar(pendientes),
        moneda: true,
        icono: CircleDollarSign,
        detalle: pendientes.some(esAltoValorPendiente)
          ? 'Incluye órdenes de alto valor'
          : 'Sin órdenes de alto valor pendientes',
        tono: 'ambar',
        critico: pendientes.some(esAltoValorPendiente),
      },
      {
        clave: 'adquirido',
        titulo: 'Total adquirido',
        valor: sumar(adquiridas),
        moneda: true,
        icono: PackageCheck,
        detalle: 'Órdenes aprobadas y recibidas',
        tono: 'esmeralda',
      },
    ];
  }, [datos]);

  return (
    <PlantillaModulo
      modulo={MODULO}
      datos={datos}
      obtenerId={obtenerId}
      obtenerEstado={obtenerEstado}
      obtenerLuz={obtenerLuz}
      textoBusqueda={textoBusqueda}
      columnas={COLUMNAS}
      kpis={kpis}
      tituloDetalle={(orden) => orden.numeroOrden}
      subtituloDetalle={(orden) => orden.proveedor?.razonSocial}
      identificadorAnulacion={(orden) => orden.numeroOrden}
      obtenerDatosPasos={(orden) => ({ fechaRegistro: formatearFechaHora(orden.fechaEmision) })}
      renderDetalle={(orden) => <DetalleOrden orden={orden} />}
      renderModalCrear={(propiedades) => <ModalCrearCompra {...propiedades} />}
    />
  );
}
