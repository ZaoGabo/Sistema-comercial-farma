import { useCallback, useMemo, useState } from 'react';
import { Scale, Percent, Wallet, Clock3, CircleCheck, TriangleAlert } from 'lucide-react';
import PlantillaModulo from '../components/modulos/PlantillaModulo.jsx';
import ModalCrearPago from '../components/modales/ModalCrearPago.jsx';
import { CuadriculaDatos, SeccionDetalle, TablaMini } from '../components/comunes/ElementosDetalle.jsx';
import { CodigoAuditoria, ImporteEditorial } from '../components/comunes/FormatoInstitucional.jsx';
import InsigniaEstado from '../components/comunes/InsigniaEstado.jsx';
import { useModulo } from '../hooks/useModulo.js';
import { obtenerModulo } from '../config/modulos.js';
import { esPendiente, esVigente } from '../utils/estados.js';
import { aFecha, aNumero, formatearFecha, formatearFechaHora, formatearMoneda, redondear } from '../utils/formato.js';

const MODULO = obtenerModulo('contabilidad');

const PERIODOS = [
  { clave: 'diario', etiqueta: 'Diario' },
  { clave: 'semanal', etiqueta: 'Semanal' },
  { clave: 'mensual', etiqueta: 'Mensual' },
  { clave: 'fiscal', etiqueta: 'Cierre fiscal' },
  { clave: 'historico', etiqueta: 'Histórico' },
];

function dentroDelPeriodo(fechaTexto, periodo) {
  if (periodo === 'historico') return true;
  const fecha = aFecha(fechaTexto);
  if (!fecha) return false;
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  switch (periodo) {
    case 'diario':
      return fecha >= inicioHoy;
    case 'semanal':
      return fecha >= new Date(inicioHoy.getTime() - 6 * 24 * 60 * 60 * 1000);
    case 'mensual':
      return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
    case 'fiscal':
      return fecha.getFullYear() === ahora.getFullYear();
    default:
      return true;
  }
}

const obtenerId = (pago) => pago.idPago;
const obtenerEstado = (pago) => pago.estado;
const textoBusqueda = (pago) =>
  [
    pago.numeroPago,
    pago.ordenCompra?.numeroOrden,
    pago.proveedor?.razonSocial,
    pago.proveedor?.ruc,
    pago.metodo,
    pago.referenciaBancaria,
    pago.estado,
  ]
    .filter(Boolean)
    .join(' ');

const COLUMNAS = [
  { clave: 'numeroPago', titulo: 'Pago', render: (pago) => <CodigoAuditoria>{pago.numeroPago}</CodigoAuditoria> },
  { clave: 'orden', titulo: 'Orden', render: (pago) => <CodigoAuditoria>{pago.ordenCompra?.numeroOrden || '—'}</CodigoAuditoria> },
  { clave: 'proveedor', titulo: 'Proveedor', render: (pago) => pago.proveedor?.razonSocial || '—' },
  { clave: 'metodo', titulo: 'Método' },
  { clave: 'fecha', titulo: 'Fecha', render: (pago) => formatearFecha(pago.fecha) },
  { clave: 'monto', titulo: 'Monto', alinear: 'derecha', mono: true, render: (pago) => formatearMoneda(pago.monto) },
  { clave: 'estado', titulo: 'Estado', render: (pago) => <InsigniaEstado estado={pago.estado} /> },
];

const COLUMNAS_ASIENTO = [
  { clave: 'nombreCuenta', titulo: 'Cuenta', render: (linea) => linea.nombreCuenta },
  { clave: 'debe', titulo: 'Debe', alinear: 'derecha', mono: true, render: (linea) => formatearMoneda(linea.debe) },
  { clave: 'haber', titulo: 'Haber', alinear: 'derecha', mono: true, render: (linea) => formatearMoneda(linea.haber) },
];

function DetallePago({ pago }) {
  const lineas = pago.lineasAsiento || [];
  const totalDebe = redondear(lineas.reduce((suma, linea) => suma + aNumero(linea.debe), 0));
  const totalHaber = redondear(lineas.reduce((suma, linea) => suma + aNumero(linea.haber), 0));
  const balanceado = lineas.length > 0 && totalDebe === totalHaber;

  return (
    <>
      <SeccionDetalle titulo="Datos del pago">
        <CuadriculaDatos
          items={[
            { etiqueta: 'Pago', valor: pago.numeroPago, mono: true },
            { etiqueta: 'Fecha', valor: formatearFechaHora(pago.fecha) },
            { etiqueta: 'Monto', valor: formatearMoneda(pago.monto), mono: true },
            { etiqueta: 'Descuento pronto pago', valor: formatearMoneda(pago.descuentoProntoPago), mono: true },
            { etiqueta: 'Método', valor: pago.metodo },
            { etiqueta: 'Referencia bancaria', valor: pago.referenciaBancaria, mono: true },
            { etiqueta: 'Proveedor', valor: pago.proveedor?.razonSocial, ancho: 'completo' },
            { etiqueta: 'Orden de compra', valor: pago.ordenCompra?.numeroOrden, mono: true },
            { etiqueta: 'Total de la orden', valor: formatearMoneda(pago.ordenCompra?.totalCompra), mono: true },
          ]}
        />
      </SeccionDetalle>

      <SeccionDetalle
        titulo={pago.asiento?.numeroAsiento ? `Asiento ${pago.asiento.numeroAsiento}` : 'Asiento contable'}
        accion={
          lineas.length > 0 && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
                balanceado
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-rose-50 text-rose-700 ring-rose-600/20'
              }`}
            >
              {balanceado ? (
                <CircleCheck className="size-3.5" aria-hidden="true" />
              ) : (
                <TriangleAlert className="size-3.5" aria-hidden="true" />
              )}
              {balanceado ? 'Debe = Haber' : 'Asiento descuadrado'}
            </span>
          )
        }
      >
        {lineas.length === 0 ? (
          <p className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
            El asiento contable con partida doble se genera cuando el pago es aprobado.
          </p>
        ) : (
          <>
            {pago.asiento?.concepto && <p className="text-xs text-slate-500">{pago.asiento.concepto}</p>}
            <TablaMini
              columnas={COLUMNAS_ASIENTO}
              filas={lineas}
              obtenerId={(linea) => linea.idDetalleAsiento}
              pie={
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-3 py-2 text-slate-700">Totales</td>
                  <td className="px-3 py-2 text-right text-xs">
                    <ImporteEditorial valor={totalDebe} />
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <ImporteEditorial valor={totalHaber} />
                  </td>
                </tr>
              }
            />
          </>
        )}
      </SeccionDetalle>
    </>
  );
}

export default function ModuloContabilidad() {
  const datos = useModulo(MODULO.clave, { obtenerId });
  const [periodo, setPeriodo] = useState('historico');

  const filtroPrevio = useCallback((pago) => dentroDelPeriodo(pago.fecha, periodo), [periodo]);

  const metodosConocidos = useMemo(
    () => Array.from(new Set(datos.registros.map((pago) => pago.metodo).filter(Boolean))),
    [datos.registros],
  );

  const kpis = useMemo(() => {
    const delPeriodo = datos.registros.filter(filtroPrevio);
    const pendientes = delPeriodo.filter((pago) => esPendiente(pago.estado));
    const efectivos = delPeriodo.filter((pago) => esVigente(pago.estado));
    const sumar = (lista, campo) => lista.reduce((suma, pago) => suma + aNumero(pago[campo]), 0);

    return [
      {
        clave: 'pagos',
        titulo: 'Pagos del período',
        valor: delPeriodo.length,
        icono: Wallet,
        detalle: 'Registros dentro del filtro temporal',
        tono: 'cian',
      },
      {
        clave: 'pagado',
        titulo: 'Total pagado',
        valor: sumar(efectivos, 'monto'),
        moneda: true,
        icono: Scale,
        detalle: 'Pagos aprobados con asiento contable',
        tono: 'esmeralda',
      },
      {
        clave: 'por-aprobar',
        titulo: 'Por aprobar',
        valor: sumar(pendientes, 'monto'),
        moneda: true,
        icono: Clock3,
        detalle: `${pendientes.length} pago(s) en espera de autorización`,
        tono: 'ambar',
        critico: pendientes.length > 0,
      },
      {
        clave: 'descuentos',
        titulo: 'Descuentos por pronto pago',
        valor: sumar(efectivos, 'descuentoProntoPago'),
        moneda: true,
        icono: Percent,
        detalle: 'Ahorro obtenido en pagos aprobados',
        tono: 'violeta',
      },
    ];
  }, [datos.registros, filtroPrevio]);

  return (
    <PlantillaModulo
      modulo={MODULO}
      datos={datos}
      obtenerId={obtenerId}
      obtenerEstado={obtenerEstado}
      textoBusqueda={textoBusqueda}
      filtroPrevio={filtroPrevio}
      columnas={COLUMNAS}
      kpis={kpis}
      barraExtra={
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">Período</span>
          <select
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value)}
            aria-label="Período contable"
            className="campo w-auto py-1.5 text-xs"
          >
            {PERIODOS.map((opcion) => (
              <option key={opcion.clave} value={opcion.clave}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </label>
      }
      tituloDetalle={(pago) => pago.numeroPago}
      subtituloDetalle={(pago) => pago.proveedor?.razonSocial}
      identificadorAnulacion={(pago) => pago.numeroPago}
      obtenerDatosPasos={(pago) => ({ fechaRegistro: formatearFechaHora(pago.fecha) })}
      renderDetalle={(pago) => <DetallePago pago={pago} />}
      renderModalCrear={(propiedades) => <ModalCrearPago {...propiedades} metodosConocidos={metodosConocidos} />}
    />
  );
}
