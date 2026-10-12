import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, ClipboardCheck, PackageSearch, TriangleAlert } from 'lucide-react';
import PlantillaModulo from '../components/modulos/PlantillaModulo.jsx';
import ModalCrearRecepcion from '../components/modales/ModalCrearRecepcion.jsx';
import { CuadriculaDatos, SeccionDetalle, TablaMini } from '../components/comunes/ElementosDetalle.jsx';
import { CodigoAuditoria } from '../components/comunes/FormatoInstitucional.jsx';
import InsigniaEstado from '../components/comunes/InsigniaEstado.jsx';
import { BannerError } from '../components/comunes/EstadoVacio.jsx';
import { useModulo } from '../hooks/useModulo.js';
import { serviciosModulos } from '../api/modulos.servicio.js';
import { obtenerModulo } from '../config/modulos.js';
import { esPendiente, esVigente } from '../utils/estados.js';
import { aNumero, formatearEntero, formatearFecha, formatearFechaHora } from '../utils/formato.js';

const MODULO = obtenerModulo('bodega');
const PRODUCTOS_VISIBLES_INVENTARIO = 8;

const obtenerId = (recepcion) => recepcion.idRecepcion;
const obtenerEstado = (recepcion) => recepcion.estado;
const unidadesRecibidas = (recepcion) =>
  (recepcion.detalles || []).reduce((suma, linea) => suma + aNumero(linea.cantidadRecibida), 0);
const textoBusqueda = (recepcion) =>
  [
    recepcion.numeroRecepcion,
    recepcion.guiaRemision,
    recepcion.ordenCompra?.numeroOrden,
    recepcion.bodega?.nombre,
    recepcion.empleado?.nombre,
    recepcion.estado,
  ]
    .filter(Boolean)
    .join(' ');

const COLUMNAS = [
  { clave: 'numeroRecepcion', titulo: 'Recepción', render: (recepcion) => <CodigoAuditoria>{recepcion.numeroRecepcion}</CodigoAuditoria> },
  { clave: 'orden', titulo: 'Orden de compra', render: (recepcion) => <CodigoAuditoria>{recepcion.ordenCompra?.numeroOrden || '—'}</CodigoAuditoria> },
  { clave: 'bodega', titulo: 'Bodega', render: (recepcion) => recepcion.bodega?.nombre || '—' },
  { clave: 'empleado', titulo: 'Responsable', render: (recepcion) => recepcion.empleado?.nombre || '—' },
  { clave: 'guiaRemision', titulo: 'Guía', render: (recepcion) => <CodigoAuditoria>{recepcion.guiaRemision}</CodigoAuditoria> },
  { clave: 'fecha', titulo: 'Fecha', render: (recepcion) => formatearFecha(recepcion.fecha) },
  {
    clave: 'unidades',
    titulo: 'Unidades',
    alinear: 'derecha',
    mono: true,
    render: (recepcion) => formatearEntero(unidadesRecibidas(recepcion)),
  },
  { clave: 'estado', titulo: 'Estado', render: (recepcion) => <InsigniaEstado estado={recepcion.estado} /> },
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
  {
    clave: 'cantidadRecibida',
    titulo: 'Recibido',
    alinear: 'derecha',
    mono: true,
    render: (linea) => formatearEntero(linea.cantidadRecibida),
  },
  {
    clave: 'stockActual',
    titulo: 'Stock actual',
    alinear: 'derecha',
    mono: true,
    render: (linea) => formatearEntero(linea.stockActual),
  },
];

function DetalleRecepcion({ recepcion }) {
  return (
    <>
      <SeccionDetalle titulo="Datos de la recepción">
        <CuadriculaDatos
          items={[
            { etiqueta: 'Recepción', valor: recepcion.numeroRecepcion, mono: true },
            { etiqueta: 'Fecha', valor: formatearFechaHora(recepcion.fecha) },
            { etiqueta: 'Orden de compra', valor: recepcion.ordenCompra?.numeroOrden, mono: true },
            { etiqueta: 'Estado de la orden', valor: recepcion.ordenCompra?.estadoCompra },
            { etiqueta: 'Bodega', valor: recepcion.bodega?.nombre },
            { etiqueta: 'Responsable', valor: recepcion.empleado?.nombre },
            { etiqueta: 'Guía de remisión', valor: recepcion.guiaRemision, mono: true, ancho: 'completo' },
          ]}
        />
      </SeccionDetalle>
      <SeccionDetalle titulo={`Productos recibidos (${recepcion.detalles?.length || 0})`}>
        <TablaMini
          columnas={COLUMNAS_PRODUCTOS}
          filas={recepcion.detalles || []}
          obtenerId={(linea) => linea.idDetalleRec}
        />
        {(recepcion.detalles || []).some((linea) => linea.observacion) && (
          <ul className="space-y-1 text-xs text-slate-500">
            {recepcion.detalles
              .filter((linea) => linea.observacion)
              .map((linea) => (
                <li key={linea.idDetalleRec}>
                  <span className="text-slate-600">{linea.nombreProducto}:</span> {linea.observacion}
                </li>
              ))}
          </ul>
        )}
      </SeccionDetalle>
    </>
  );
}

function nivelCobertura(actual, minimo) {
  if (minimo <= 0) return 'optimo';
  if (actual <= minimo) return 'critico';
  if (actual <= minimo * 1.5) return 'preventivo';
  return 'optimo';
}

const ESTILOS_NIVEL = {
  critico: { etiqueta: 'Crítico', pastilla: 'bg-rose-50 text-rose-700 ring-rose-600/20', barra: 'bg-rose-500' },
  preventivo: { etiqueta: 'Preventivo', pastilla: 'bg-amber-50 text-amber-700 ring-amber-600/20', barra: 'bg-amber-500' },
  optimo: { etiqueta: 'Óptimo', pastilla: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', barra: 'bg-emerald-500' },
};

const COLUMNAS_COBERTURA = [
  {
    clave: 'producto',
    titulo: 'Producto',
    render: (producto) => (
      <>
        <span className="block font-medium text-slate-900">{producto.PRO_NOMBRE}</span>
        <CodigoAuditoria>{producto.PRO_CODIGO}</CodigoAuditoria>
      </>
    ),
  },
  {
    clave: 'stock',
    titulo: 'Stock',
    alinear: 'derecha',
    mono: true,
    render: (producto) => `${formatearEntero(producto.PRO_STOCK_ACTUAL)} uds.`,
  },
  {
    clave: 'minimo',
    titulo: 'Mínimo',
    alinear: 'derecha',
    mono: true,
    render: (producto) => formatearEntero(producto.PRO_STOCK_MINIMO),
  },
  {
    clave: 'cobertura',
    titulo: 'Cobertura',
    render: (producto) => {
      const actual = aNumero(producto.PRO_STOCK_ACTUAL);
      const minimo = aNumero(producto.PRO_STOCK_MINIMO);
      const porcentaje = minimo > 0 ? Math.min((actual / (minimo * 2)) * 100, 100) : 100;
      const nivel = ESTILOS_NIVEL[nivelCobertura(actual, minimo)];
      return (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
            <span className={`block h-full rounded-full ${nivel.barra}`} style={{ width: `${porcentaje}%` }} />
          </span>
          <span className="font-mono tabular-nums text-slate-700">{Math.round(porcentaje)} %</span>
        </span>
      );
    },
  },
  {
    clave: 'nivel',
    titulo: 'Nivel',
    render: (producto) => {
      const nivel = ESTILOS_NIVEL[nivelCobertura(aNumero(producto.PRO_STOCK_ACTUAL), aNumero(producto.PRO_STOCK_MINIMO))];
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${nivel.pastilla}`}
        >
          {nivel.etiqueta === 'Crítico' && <TriangleAlert className="size-3" aria-hidden="true" />}
          {nivel.etiqueta}
        </span>
      );
    },
  },
];

function useInventario() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const catalogos = await serviciosModulos.compras.catalogos();
      setProductos(catalogos.productos || []);
      setError(null);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { productos, error, cargando, recargar: cargar };
}

function PanelInventario({ inventario }) {
  const ordenados = useMemo(
    () =>
      [...inventario.productos]
        .sort((a, b) => {
          const coberturaA = aNumero(a.PRO_STOCK_MINIMO) > 0
            ? aNumero(a.PRO_STOCK_ACTUAL) / aNumero(a.PRO_STOCK_MINIMO)
            : Number.POSITIVE_INFINITY;
          const coberturaB = aNumero(b.PRO_STOCK_MINIMO) > 0
            ? aNumero(b.PRO_STOCK_ACTUAL) / aNumero(b.PRO_STOCK_MINIMO)
            : Number.POSITIVE_INFINITY;
          return coberturaA - coberturaB;
        })
        .slice(0, PRODUCTOS_VISIBLES_INVENTARIO),
    [inventario.productos],
  );

  if (inventario.error) return <BannerError mensaje={inventario.error} onReintentar={inventario.recargar} />;
  if (inventario.cargando && ordenados.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Cargando cobertura de inventario">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className="esqueleto h-11 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <section aria-labelledby="titulo-inventario" className="space-y-3">
      <h2 id="titulo-inventario" className="etiqueta-seccion">
        Cobertura de existencias (menor cobertura primero)
      </h2>
      <TablaMini
        columnas={COLUMNAS_COBERTURA}
        filas={ordenados}
        obtenerId={(producto) => producto.ID_PRODUCTO}
      />
    </section>
  );
}

export default function ModuloBodega() {
  const datos = useModulo(MODULO.clave, { obtenerId });
  const inventario = useInventario();

  const kpis = useMemo(() => {
    const { registros } = datos;
    const pendientes = registros.filter((recepcion) => esPendiente(recepcion.estado));
    const consolidadas = registros.filter((recepcion) => esVigente(recepcion.estado));
    const criticos = inventario.productos.filter(
      (producto) => nivelCobertura(aNumero(producto.PRO_STOCK_ACTUAL), aNumero(producto.PRO_STOCK_MINIMO)) === 'critico',
    ).length;

    return [
      {
        clave: 'recepciones',
        titulo: 'Recepciones registradas',
        valor: registros.length,
        icono: PackageSearch,
        detalle: 'Total en la vista de recepciones',
        tono: 'cian',
      },
      {
        clave: 'pendientes',
        titulo: 'Pendientes de aprobar',
        valor: pendientes.length,
        icono: ClipboardCheck,
        detalle: 'Recepciones por consolidar en inventario',
        tono: 'ambar',
      },
      {
        clave: 'unidades',
        titulo: 'Unidades recibidas',
        valor: consolidadas.reduce((suma, recepcion) => suma + unidadesRecibidas(recepcion), 0),
        icono: Boxes,
        detalle: 'Recepciones vigentes, sin anuladas',
        tono: 'esmeralda',
      },
      {
        clave: 'criticos',
        titulo: 'Productos en stock crítico',
        valor: criticos,
        icono: TriangleAlert,
        detalle: criticos > 0 ? 'Existencias en o bajo el mínimo' : 'Todos sobre el mínimo requerido',
        tono: 'carmesi',
        critico: criticos > 0,
      },
    ];
  }, [datos, inventario.productos]);

  return (
    <PlantillaModulo
      modulo={MODULO}
      datos={datos}
      obtenerId={obtenerId}
      obtenerEstado={obtenerEstado}
      textoBusqueda={textoBusqueda}
      columnas={COLUMNAS}
      kpis={kpis}
      extras={<PanelInventario inventario={inventario} />}
      tituloDetalle={(recepcion) => recepcion.numeroRecepcion}
      subtituloDetalle={(recepcion) => `Orden ${recepcion.ordenCompra?.numeroOrden || '—'}`}
      identificadorAnulacion={(recepcion) => recepcion.numeroRecepcion}
      obtenerDatosPasos={(recepcion) => ({ fechaRegistro: formatearFechaHora(recepcion.fecha) })}
      renderDetalle={(recepcion) => <DetalleRecepcion recepcion={recepcion} />}
      renderModalCrear={(propiedades) => (
        <ModalCrearRecepcion
          {...propiedades}
          onGuardar={async (payload) => {
            await propiedades.onGuardar(payload);
            inventario.recargar();
          }}
        />
      )}
    />
  );
}
