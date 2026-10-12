import { useMemo } from 'react';
import { FileCheck2, Hourglass, Landmark, Receipt } from 'lucide-react';
import PlantillaModulo from '../components/modulos/PlantillaModulo.jsx';
import ModalCrearFactura from '../components/modales/ModalCrearFactura.jsx';
import { CuadriculaDatos, FilaTotal, SeccionDetalle, TablaMini } from '../components/comunes/ElementosDetalle.jsx';
import { CodigoAuditoria } from '../components/comunes/FormatoInstitucional.jsx';
import InsigniaEstado from '../components/comunes/InsigniaEstado.jsx';
import { useModulo } from '../hooks/useModulo.js';
import { obtenerModulo } from '../config/modulos.js';
import { CATEGORIAS, categorizarEstado, esPendiente, esVigente } from '../utils/estados.js';
import { aNumero, formatearEntero, formatearFecha, formatearFechaHora, formatearMoneda } from '../utils/formato.js';

const MODULO = obtenerModulo('ventas');

const obtenerId = (factura) => factura.idFactura;
const obtenerEstado = (factura) => factura.estado;
const referenciaFactura = (factura) => `#${String(factura.idFactura).padStart(6, '0')}`;
const textoBusqueda = (factura) =>
  [
    referenciaFactura(factura),
    factura.cliente?.nombre,
    factura.cliente?.identificacion,
    factura.vendedor?.nombre,
    factura.estado,
  ]
    .filter(Boolean)
    .join(' ');

const COLUMNAS = [
  { clave: 'idFactura', titulo: 'Factura', render: (factura) => <CodigoAuditoria>{referenciaFactura(factura)}</CodigoAuditoria> },
  { clave: 'cliente', titulo: 'Cliente', render: (factura) => factura.cliente?.nombre || '—' },
  { clave: 'vendedor', titulo: 'Vendedor', render: (factura) => factura.vendedor?.nombre || '—' },
  { clave: 'fecha', titulo: 'Fecha', render: (factura) => formatearFecha(factura.fecha) },
  {
    clave: 'lineas',
    titulo: 'Líneas',
    alinear: 'derecha',
    mono: true,
    render: (factura) => formatearEntero(factura.detalles?.length || 0),
  },
  {
    clave: 'total',
    titulo: 'Total',
    alinear: 'derecha',
    mono: true,
    render: (factura) => formatearMoneda(factura.total),
  },
  { clave: 'estado', titulo: 'Estado', render: (factura) => <InsigniaEstado estado={factura.estado} /> },
];

const COLUMNAS_LINEAS = [
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
    titulo: 'Precio',
    alinear: 'derecha',
    mono: true,
    render: (linea) => formatearMoneda(linea.precioUnitario),
  },
  { clave: 'subtotal', titulo: 'Subtotal', alinear: 'derecha', mono: true, render: (linea) => formatearMoneda(linea.subtotal) },
];

function DetalleFactura({ factura }) {
  return (
    <>
      <SeccionDetalle titulo="Datos de la factura">
        <CuadriculaDatos
          items={[
            { etiqueta: 'Factura', valor: referenciaFactura(factura), mono: true },
            { etiqueta: 'Fecha', valor: formatearFechaHora(factura.fecha) },
            { etiqueta: 'Cliente', valor: factura.cliente?.nombre, ancho: 'completo' },
            { etiqueta: 'Identificación', valor: factura.cliente?.identificacion, mono: true },
            { etiqueta: 'Teléfono', valor: factura.cliente?.telefono, mono: true },
            { etiqueta: 'Correo', valor: factura.cliente?.correo, ancho: 'completo' },
            { etiqueta: 'Vendedor', valor: factura.vendedor?.nombre, ancho: 'completo' },
          ]}
        />
      </SeccionDetalle>

      <SeccionDetalle titulo={`Líneas facturadas (${factura.detalles?.length || 0})`}>
        <TablaMini
          columnas={COLUMNAS_LINEAS}
          filas={factura.detalles || []}
          obtenerId={(linea) => `${linea.linea}-${linea.idProducto}`}
        />
        <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
          <FilaTotal etiqueta="Subtotal" valor={factura.subtotal} moneda />
          <FilaTotal etiqueta="IVA" valor={factura.iva} moneda />
          <FilaTotal etiqueta="Total" valor={factura.total} moneda destacada />
        </div>
      </SeccionDetalle>
    </>
  );
}

export default function ModuloVentas() {
  const datos = useModulo(MODULO.clave, { obtenerId });

  const kpis = useMemo(() => {
    const { registros } = datos;
    const vigentes = registros.filter((factura) => categorizarEstado(factura.estado) !== CATEGORIAS.ANULADO);
    const pendientes = registros.filter((factura) => esPendiente(factura.estado));
    const emitidas = registros.filter((factura) => esVigente(factura.estado));
    const sumar = (lista, campo) => lista.reduce((suma, factura) => suma + aNumero(factura[campo]), 0);

    return [
      {
        clave: 'facturado',
        titulo: 'Total facturado',
        valor: sumar(vigentes, 'total'),
        moneda: true,
        icono: Receipt,
        detalle: 'Facturas vigentes, excluye anuladas',
        tono: 'cian',
      },
      {
        clave: 'emitidas',
        titulo: 'Facturas vigentes',
        valor: emitidas.length,
        icono: FileCheck2,
        detalle: 'Activas o aprobadas, sin anuladas',
        tono: 'esmeralda',
      },
      {
        clave: 'pendientes',
        titulo: 'Pendientes de emisión',
        valor: pendientes.length,
        icono: Hourglass,
        detalle: `${formatearMoneda(sumar(pendientes, 'total'))} por emitir`,
        tono: 'ambar',
      },
      {
        clave: 'iva',
        titulo: 'IVA generado',
        valor: sumar(vigentes, 'iva'),
        moneda: true,
        icono: Landmark,
        detalle: 'Impuesto de facturas vigentes',
        tono: 'violeta',
      },
    ];
  }, [datos]);

  return (
    <PlantillaModulo
      modulo={MODULO}
      datos={datos}
      obtenerId={obtenerId}
      obtenerEstado={obtenerEstado}
      textoBusqueda={textoBusqueda}
      columnas={COLUMNAS}
      kpis={kpis}
      tituloDetalle={(factura) => `Factura ${referenciaFactura(factura)}`}
      subtituloDetalle={(factura) => factura.cliente?.nombre}
      identificadorAnulacion={referenciaFactura}
      obtenerDatosPasos={(factura) => ({ fechaRegistro: formatearFechaHora(factura.fecha) })}
      renderDetalle={(factura) => <DetalleFactura factura={factura} />}
      renderModalCrear={(propiedades) => <ModalCrearFactura {...propiedades} />}
    />
  );
}
