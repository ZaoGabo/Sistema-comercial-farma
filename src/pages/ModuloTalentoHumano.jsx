import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Banknote, Building2, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import PlantillaModulo from '../components/modulos/PlantillaModulo.jsx';
import ModalCrearNomina from '../components/modales/ModalCrearNomina.jsx';
import { CuadriculaDatos, FilaTotal, SeccionDetalle } from '../components/comunes/ElementosDetalle.jsx';
import { CodigoAuditoria, ImporteEditorial } from '../components/comunes/FormatoInstitucional.jsx';
import InsigniaEstado from '../components/comunes/InsigniaEstado.jsx';
import NumeroAnimado from '../components/comunes/NumeroAnimado.jsx';
import TarjetaTilt from '../components/comunes/TarjetaTilt.jsx';
import { useModulo } from '../hooks/useModulo.js';
import { obtenerModulo } from '../config/modulos.js';
import { CATEGORIAS, categorizarEstado } from '../utils/estados.js';
import { aNumero, formatearFecha, formatearMoneda, iniciales, nombreMes } from '../utils/formato.js';

const MODULO = obtenerModulo('talento-humano');
const FICHAS_VISIBLES = 6;

const obtenerId = (nomina) => nomina.idNomina;
const obtenerEstado = (nomina) => nomina.estado;
const periodoNomina = (nomina) => `${nombreMes(nomina.mes)} ${nomina.anio}`;
const textoBusqueda = (nomina) =>
  [
    nomina.empleado?.nombre,
    nomina.empleado?.cedula,
    nomina.empleado?.cargo,
    nomina.empleado?.departamento,
    periodoNomina(nomina),
    nomina.estado,
  ]
    .filter(Boolean)
    .join(' ');

const COLUMNAS = [
  { clave: 'empleado', titulo: 'Empleado', render: (nomina) => nomina.empleado?.nombre || '—' },
  { clave: 'cargo', titulo: 'Cargo', render: (nomina) => nomina.empleado?.cargo || '—' },
  { clave: 'departamento', titulo: 'Departamento', render: (nomina) => nomina.empleado?.departamento || '—' },
  { clave: 'periodo', titulo: 'Período', render: periodoNomina },
  {
    clave: 'sueldoBase',
    titulo: 'Sueldo base',
    alinear: 'derecha',
    mono: true,
    render: (nomina) => formatearMoneda(nomina.valores?.sueldoBase),
  },
  {
    clave: 'iessPersonal',
    titulo: 'IESS personal',
    alinear: 'derecha',
    mono: true,
    render: (nomina) => formatearMoneda(nomina.valores?.iessPersonal),
  },
  {
    clave: 'netoRecibir',
    titulo: 'Neto a recibir',
    alinear: 'derecha',
    mono: true,
    render: (nomina) => formatearMoneda(nomina.valores?.netoRecibir),
  },
  { clave: 'estado', titulo: 'Estado', render: (nomina) => <InsigniaEstado estado={nomina.estado} /> },
];

function DetalleNomina({ nomina }) {
  const valores = nomina.valores || {};
  return (
    <>
      <SeccionDetalle titulo="Ficha del colaborador">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-900 text-sm font-semibold text-white">
            {iniciales(nomina.empleado?.nombre)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{nomina.empleado?.nombre}</p>
            <p className="truncate text-xs text-slate-500">
              {nomina.empleado?.cargo} - {nomina.empleado?.departamento}
            </p>
          </div>
        </div>
        <CuadriculaDatos
          items={[
            { etiqueta: 'Cédula', valor: nomina.empleado?.cedula, mono: true },
            { etiqueta: 'Período', valor: periodoNomina(nomina) },
            { etiqueta: 'Correo', valor: nomina.empleado?.correo, ancho: 'completo' },
            { etiqueta: 'Fecha de pago', valor: formatearFecha(nomina.fechaPago) },
            { etiqueta: 'Cargas familiares', valor: valores.numeroCargas, mono: true },
          ]}
        />
      </SeccionDetalle>

      <SeccionDetalle titulo="Desglose de liquidacion">
        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
          <FilaTotal etiqueta="Sueldo base" valor={valores.sueldoBase} moneda />
          <FilaTotal etiqueta="(+) Bonificaciones" valor={valores.bonificaciones} moneda />
          <FilaTotal etiqueta="(-) Descuentos" valor={valores.descuentos} moneda />
          <FilaTotal etiqueta="(-) Aporte IESS personal" valor={valores.iessPersonal} moneda />
          <FilaTotal etiqueta="Neto a recibir" valor={valores.netoRecibir} moneda destacada />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
          <span className="flex items-center gap-2 font-medium text-blue-800">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Aporte IESS patronal (costo del empleador)
          </span>
          <ImporteEditorial valor={valores.iessPatronal} />
        </div>
        {nomina.idAsiento && (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            Asiento contable vinculado: <CodigoAuditoria>{nomina.idAsiento}</CodigoAuditoria>
          </p>
        )}
      </SeccionDetalle>
    </>
  );
}

function FichasColaboradores({ nominas, onSeleccionar }) {
  const fichas = useMemo(() => {
    const prioridad = (nomina) => (categorizarEstado(nomina.estado) === CATEGORIAS.PENDIENTE ? 0 : 1);
    return [...nominas]
      .filter((nomina) => categorizarEstado(nomina.estado) !== CATEGORIAS.ANULADO)
      .sort((a, b) => prioridad(a) - prioridad(b) || b.idNomina - a.idNomina)
      .slice(0, FICHAS_VISIBLES);
  }, [nominas]);

  if (fichas.length === 0) return null;

  return (
    <section aria-labelledby="titulo-fichas" className="space-y-3">
      <h2 id="titulo-fichas" className="etiqueta-seccion">
        Fichas de colaboradores (liquidaciones por atender primero)
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fichas.map((nomina, indice) => (
          <motion.div
            key={nomina.idNomina}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: indice * 0.05, duration: 0.4 }}
          >
            <TarjetaTilt
              intensidad={8}
              colorLuz="rgba(167, 139, 250, 0.18)"
              className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
              role="button"
              tabIndex={0}
              onClick={() => onSeleccionar(nomina)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                  evento.preventDefault();
                  onSeleccionar(nomina);
                }
              }}
              aria-label={`Abrir nomina de ${nomina.empleado?.nombre}`}
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-700 text-sm font-semibold text-white">
                  {iniciales(nomina.empleado?.nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{nomina.empleado?.nombre}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <Building2 className="size-3 shrink-0" aria-hidden="true" />
                    {nomina.empleado?.departamento}
                  </p>
                </div>
                <InsigniaEstado estado={nomina.estado} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-500">{nomina.empleado?.cargo}</p>
                  <p className="text-[11px] text-slate-400">{periodoNomina(nomina)}</p>
                </div>
                <p className="text-right">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Neto</span>
                  <span className="text-lg font-semibold tabular-nums text-slate-900">
                    <NumeroAnimado valor={nomina.valores?.netoRecibir} moneda />
                  </span>
                </p>
              </div>
            </TarjetaTilt>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function ModuloTalentoHumano() {
  const datos = useModulo(MODULO.clave, { obtenerId });

  const kpis = useMemo(() => {
    const { registros } = datos;
    const vigentes = registros.filter((nomina) => categorizarEstado(nomina.estado) !== CATEGORIAS.ANULADO);
    const pendientes = registros.filter((nomina) => categorizarEstado(nomina.estado) === CATEGORIAS.PENDIENTE);
    const sumarValor = (lista, campo) =>
      lista.reduce((suma, nomina) => suma + aNumero(nomina.valores?.[campo]), 0);

    return [
      {
        clave: 'nominas',
        titulo: 'Nóminas vigentes',
        valor: vigentes.length,
        icono: Users,
        detalle: 'Liquidaciones no anuladas',
        tono: 'cian',
      },
      {
        clave: 'pendientes',
        titulo: 'Pendientes de liquidar',
        valor: pendientes.length,
        icono: UserRoundCheck,
        detalle: 'Requieren aprobación para transferirse',
        tono: 'ambar',
        critico: pendientes.length > 0,
      },
      {
        clave: 'neto',
        titulo: 'Neto total a pagar',
        valor: sumarValor(vigentes, 'netoRecibir'),
        moneda: true,
        icono: Banknote,
        detalle: 'Suma de valores netos vigentes',
        tono: 'esmeralda',
      },
      {
        clave: 'patronal',
        titulo: 'Aporte patronal IESS',
        valor: sumarValor(vigentes, 'iessPatronal'),
        moneda: true,
        icono: ShieldCheck,
        detalle: 'Costo adicional a cargo del empleador',
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
      extras={<FichasColaboradores nominas={datos.registros} onSeleccionar={datos.seleccionar} />}
      tituloDetalle={(nomina) => nomina.empleado?.nombre || 'Nómina'}
      subtituloDetalle={periodoNomina}
      identificadorAnulacion={(nomina) => `${nomina.empleado?.nombre} - ${periodoNomina(nomina)}`}
      obtenerDatosPasos={(nomina) => ({ fechaPago: nomina.fechaPago ? formatearFecha(nomina.fechaPago) : undefined })}
      renderDetalle={(nomina) => <DetalleNomina nomina={nomina} />}
      renderModalCrear={(propiedades) => <ModalCrearNomina {...propiedades} />}
    />
  );
}
