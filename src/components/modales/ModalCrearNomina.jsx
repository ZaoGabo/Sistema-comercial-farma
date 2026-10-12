import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { AvisoCatalogo, Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import NumeroAnimado from '../comunes/NumeroAnimado.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';
import { useCatalogos } from '../../hooks/useCatalogos.js';
import { serviciosModulos } from '../../api/modulos.servicio.js';
import { ENTORNO } from '../../config/entorno.js';
import { aNumero, nombreMes, redondear } from '../../utils/formato.js';

const MESES = Array.from({ length: 12 }, (_, indice) => indice + 1);

function Formulario({ catalogos, onGuardar, onCancelar }) {
  const hoy = new Date();
  const [valores, setValores] = useState({
    idEmpleado: '',
    anio: String(hoy.getFullYear()),
    mes: String(hoy.getMonth() + 1),
    bonificaciones: '0',
    descuentos: '0',
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const empleados = useMemo(() => catalogos.empleados || [], [catalogos.empleados]);
  const empleado = empleados.find((item) => String(item.ID_EMPLEADO) === valores.idEmpleado);

  const opcionesEmpleados = useMemo(
    () =>
      empleados.map((item) => ({
        valor: item.ID_EMPLEADO,
        etiqueta: item.NOMBRE_COMPLETO,
        detalle: `${item.EMP_CEDULA} - ${item.CARGO}`,
      })),
    [empleados],
  );

  const estimacion = useMemo(() => {
    const sueldo = empleado ? aNumero(empleado.EMP_SUELDO) : 0;
    const bonificaciones = aNumero(leerNumero(valores.bonificaciones));
    const descuentos = aNumero(leerNumero(valores.descuentos));
    const iess = redondear((sueldo * ENTORNO.iessPersonalPorcentaje) / 100);
    const neto = redondear(sueldo + bonificaciones - descuentos - iess);
    return { sueldo, iess, neto };
  }, [empleado, valores.bonificaciones, valores.descuentos]);

  function actualizar(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }));
  }

  function validar() {
    const nuevos = {};
    const anio = leerNumero(valores.anio);
    const bonificaciones = leerNumero(valores.bonificaciones);
    const descuentos = leerNumero(valores.descuentos);

    if (!valores.idEmpleado) nuevos.idEmpleado = 'Seleccione un empleado activo.';
    if (!Number.isInteger(anio) || anio < 2000 || anio > hoy.getFullYear() + 1) {
      nuevos.anio = 'Ingrese un año válido.';
    }
    if (!valores.mes) nuevos.mes = 'Seleccione el mes.';
    if (!Number.isFinite(bonificaciones) || bonificaciones < 0) nuevos.bonificaciones = 'Debe ser 0 o mayor.';
    if (!Number.isFinite(descuentos) || descuentos < 0) nuevos.descuentos = 'Debe ser 0 o mayor.';

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
        idEmpleado: Number(valores.idEmpleado),
        anio: Number(valores.anio),
        mes: Number(valores.mes),
        bonificaciones: Number(valores.bonificaciones || 0),
        descuentos: Number(valores.descuentos || 0),
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
          <Campo
            etiqueta="Empleado"
            htmlFor="nomina-empleado"
            requerido
            error={errores.idEmpleado}
            className="sm:col-span-2"
            ayuda={empleado ? `${empleado.CARGO} - ${empleado.DEPARTAMENTO}` : undefined}
          >
            <SelectorBuscable
              id="nomina-empleado"
              opciones={opcionesEmpleados}
              valor={valores.idEmpleado}
              onCambio={(valor) => actualizar('idEmpleado', valor)}
              placeholder="Buscar por nombre, cédula o cargo"
              invalido={Boolean(errores.idEmpleado)}
            />
          </Campo>
          <Campo etiqueta="Año" htmlFor="nomina-anio" requerido error={errores.anio}>
            <input
              id="nomina-anio"
              type="number"
              step="1"
              inputMode="numeric"
              className={`campo font-mono tabular-nums ${errores.anio ? 'campo-error' : ''}`}
              value={valores.anio}
              onChange={(evento) => actualizar('anio', evento.target.value)}
            />
          </Campo>
          <Campo etiqueta="Mes" htmlFor="nomina-mes" requerido error={errores.mes}>
            <select
              id="nomina-mes"
              className={`campo ${errores.mes ? 'campo-error' : ''}`}
              value={valores.mes}
              onChange={(evento) => actualizar('mes', evento.target.value)}
            >
              {MESES.map((mes) => (
                <option key={mes} value={mes}>
                  {nombreMes(mes)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Bonificaciones" htmlFor="nomina-bonificaciones" error={errores.bonificaciones}>
            <input
              id="nomina-bonificaciones"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={`campo font-mono tabular-nums ${errores.bonificaciones ? 'campo-error' : ''}`}
              value={valores.bonificaciones}
              onChange={(evento) => actualizar('bonificaciones', evento.target.value)}
            />
          </Campo>
          <Campo etiqueta="Descuentos" htmlFor="nomina-descuentos" error={errores.descuentos}>
            <input
              id="nomina-descuentos"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={`campo font-mono tabular-nums ${errores.descuentos ? 'campo-error' : ''}`}
              value={valores.descuentos}
              onChange={(evento) => actualizar('descuentos', evento.target.value)}
            />
          </Campo>
        </div>

        <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Sueldo base</span>
            <NumeroAnimado valor={estimacion.sueldo} moneda className="font-mono text-slate-900" />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>IESS personal ({ENTORNO.iessPersonalPorcentaje}%)</span>
            <NumeroAnimado valor={estimacion.iess} moneda className="font-mono text-slate-900" />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
            <span>Neto estimado</span>
            <NumeroAnimado valor={estimacion.neto} moneda className="font-mono" />
          </div>
          <p className="pt-1 text-[10px] leading-snug text-slate-400">
            Estimación sobre el sueldo base. La liquidación definitiva y el aporte patronal los calcula Oracle.
          </p>
        </div>

        <ErrorServidor mensaje={errorServidor} />
      </div>
      <PieFormulario onCancelar={onCancelar} enviando={enviando} etiquetaEnviar="Generar nómina" icono={Users} />
    </form>
  );
}

export default function ModalCrearNomina({ abierto, onCerrar, onGuardar }) {
  const { catalogos, cargando, error, recargar } = useCatalogos(serviciosModulos['talento-humano'], abierto);

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva nómina de empleado"
      descripcion="No se permite duplicar la nómina de un mismo empleado en el mismo período."
      icono={Users}
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
