import { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { AvisoCatalogo, Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';
import { useCatalogos } from '../../hooks/useCatalogos.js';
import { useOrdenesDisponibles } from '../../hooks/useOrdenesDisponibles.js';
import { serviciosModulos } from '../../api/modulos.servicio.js';
import { ENTORNO } from '../../config/entorno.js';
import { aNumero, formatearMoneda } from '../../utils/formato.js';

function Formulario({ catalogos, metodosConocidos, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    idCompra: '',
    monto: '',
    metodo: '',
    referenciaBancaria: '',
    descuentoProntoPago: '0',
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { ordenes, cargando: cargandoOrdenes, error: errorOrdenes } = useOrdenesDisponibles(
    catalogos.ordenesDisponibles,
  );

  const opcionesOrdenes = useMemo(
    () =>
      ordenes.map((orden) => ({
        valor: orden.id,
        etiqueta: `${orden.numero} - ${formatearMoneda(orden.total)}`,
        detalle: orden.estado,
      })),
    [ordenes],
  );

  const ordenSeleccionada = ordenes.find((orden) => String(orden.id) === valores.idCompra);
  const totalOrden = ordenSeleccionada ? aNumero(ordenSeleccionada.total) : null;

  const metodos = useMemo(() => {
    const conjunto = new Set([...ENTORNO.metodosPago, ...metodosConocidos]);
    return Array.from(conjunto);
  }, [metodosConocidos]);

  function actualizar(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }));
  }

  function validar() {
    const nuevos = {};
    const monto = leerNumero(valores.monto);
    const descuento = leerNumero(valores.descuentoProntoPago);

    if (!valores.idCompra) nuevos.idCompra = 'Seleccione la orden de compra a pagar.';
    if (!Number.isFinite(monto) || monto <= 0) nuevos.monto = 'El monto debe ser mayor a 0.';
    else if (totalOrden !== null && monto > totalOrden) {
      nuevos.monto = `No puede superar el total de la orden (${formatearMoneda(totalOrden)}).`;
    }
    if (!valores.metodo) nuevos.metodo = 'Seleccione el método de pago.';
    if (!valores.referenciaBancaria.trim()) nuevos.referenciaBancaria = 'Ingrese la referencia bancaria.';
    if (!Number.isFinite(descuento) || descuento < 0) nuevos.descuentoProntoPago = 'Debe ser 0 o mayor.';
    else if (Number.isFinite(monto) && descuento > monto) {
      nuevos.descuentoProntoPago = 'No puede superar el monto del pago.';
    }

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
        idCompra: Number(valores.idCompra),
        monto: Number(valores.monto),
        metodo: valores.metodo,
        referenciaBancaria: valores.referenciaBancaria.trim(),
        descuentoProntoPago: Number(valores.descuentoProntoPago || 0),
      });
    } catch (fallo) {
      setErrorServidor(fallo.message);
      setEnviando(false);
    }
  }

  let ayudaOrden;
  if (cargandoOrdenes) ayudaOrden = 'Consultando órdenes aprobadas...';
  else if (errorOrdenes) ayudaOrden = errorOrdenes;
  else if (totalOrden !== null) {
    ayudaOrden = `Total de la orden: ${formatearMoneda(totalOrden)}. El saldo pendiente lo valida Oracle.`;
  } else if (ordenes.length === 0) ayudaOrden = 'No existen órdenes aprobadas o recibidas disponibles para pago.';

  return (
    <form onSubmit={alEnviar} noValidate>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Orden de compra"
            htmlFor="pago-orden"
            requerido
            error={errores.idCompra}
            className="sm:col-span-2"
            ayuda={ayudaOrden}
          >
            <SelectorBuscable
              id="pago-orden"
              opciones={opcionesOrdenes}
              valor={valores.idCompra}
              onCambio={(valor) => actualizar('idCompra', valor)}
              placeholder="Buscar orden aprobada"
              invalido={Boolean(errores.idCompra)}
              deshabilitado={cargandoOrdenes}
            />
          </Campo>
          <Campo etiqueta="Monto a pagar" htmlFor="pago-monto" requerido error={errores.monto}>
            <input
              id="pago-monto"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={`campo font-mono tabular-nums ${errores.monto ? 'campo-error' : ''}`}
              value={valores.monto}
              onChange={(evento) => actualizar('monto', evento.target.value)}
            />
          </Campo>
          <Campo etiqueta="Método de pago" htmlFor="pago-metodo" requerido error={errores.metodo}>
            <select
              id="pago-metodo"
              className={`campo ${errores.metodo ? 'campo-error' : ''}`}
              value={valores.metodo}
              onChange={(evento) => actualizar('metodo', evento.target.value)}
            >
              <option value="">Seleccione un método</option>
              {metodos.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            etiqueta="Referencia bancaria"
            htmlFor="pago-referencia"
            requerido
            error={errores.referenciaBancaria}
          >
            <input
              id="pago-referencia"
              type="text"
              maxLength={60}
              className={`campo font-mono ${errores.referenciaBancaria ? 'campo-error' : ''}`}
              value={valores.referenciaBancaria}
              onChange={(evento) => actualizar('referenciaBancaria', evento.target.value)}
            />
          </Campo>
          <Campo
            etiqueta="Descuento por pronto pago"
            htmlFor="pago-descuento"
            error={errores.descuentoProntoPago}
          >
            <input
              id="pago-descuento"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={`campo font-mono tabular-nums ${errores.descuentoProntoPago ? 'campo-error' : ''}`}
              value={valores.descuentoProntoPago}
              onChange={(evento) => actualizar('descuentoProntoPago', evento.target.value)}
            />
          </Campo>
        </div>
        <ErrorServidor mensaje={errorServidor} />
      </div>
      <PieFormulario onCancelar={onCancelar} enviando={enviando} etiquetaEnviar="Registrar pago" icono={Landmark} />
    </form>
  );
}

export default function ModalCrearPago({ abierto, onCerrar, onGuardar, metodosConocidos = [] }) {
  const { catalogos, cargando, error, recargar } = useCatalogos(serviciosModulos.contabilidad, abierto);

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nuevo pago a proveedor"
      descripcion="El monto debe ser mayor a cero y no puede exceder el saldo pendiente de la orden."
      icono={Landmark}
      ancho="max-w-2xl"
    >
      {catalogos ? (
        <Formulario
          catalogos={catalogos}
          metodosConocidos={metodosConocidos}
          onGuardar={onGuardar}
          onCancelar={onCerrar}
        />
      ) : (
        <AvisoCatalogo cargando={cargando} error={error} onReintentar={recargar} />
      )}
    </ModalBase>
  );
}
