import { useEffect, useMemo, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { AvisoCatalogo, Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';
import { useCatalogos } from '../../hooks/useCatalogos.js';
import { useOrdenesDisponibles } from '../../hooks/useOrdenesDisponibles.js';
import { serviciosModulos } from '../../api/modulos.servicio.js';
import { aNumero, formatearEntero, formatearMoneda } from '../../utils/formato.js';
import { aOpcionesCatalogo, esEntidadActiva } from '../../utils/catalogos.js';

function Formulario({ catalogos, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    idCompra: '',
    idEmpleadoBodega: '',
    idBodega: '',
    guiaRemision: '',
    idProducto: '',
    cantidad: '',
    observacion: '',
  });
  const [orden, setOrden] = useState(null);
  const [cargandoOrden, setCargandoOrden] = useState(false);
  const [errorOrden, setErrorOrden] = useState('');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const bodegas = catalogos.bodegas || [];

  const { ordenes, cargando: cargandoOrdenes, error: errorOrdenes } = useOrdenesDisponibles(
    catalogos.ordenesAprobadas,
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
  const opcionesEmpleados = useMemo(
    () =>
      aOpcionesCatalogo(catalogos.empleados || [], {
        valor: 'ID_EMPLEADO',
        etiqueta: 'NOMBRE_COMPLETO',
        detalle: 'CARGO',
      }),
    [catalogos.empleados],
  );

  // El detalle de la orden seleccionada determina los productos recibibles y sus saldos.
  useEffect(() => {
    if (!valores.idCompra) {
      setOrden(null);
      return undefined;
    }
    let cancelado = false;
    setCargandoOrden(true);
    setErrorOrden('');
    serviciosModulos.compras
      .obtener(valores.idCompra)
      .then((detalle) => {
        if (!cancelado) setOrden(detalle);
      })
      .catch((fallo) => {
        if (!cancelado) {
          setOrden(null);
          setErrorOrden(fallo.message);
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoOrden(false);
      });
    return () => {
      cancelado = true;
    };
  }, [valores.idCompra]);

  const lineasOrden = useMemo(() => orden?.detalles || [], [orden]);
  const lineaSeleccionada = lineasOrden.find((linea) => String(linea.idProducto) === valores.idProducto);
  const saldoPendiente = lineaSeleccionada
    ? Math.max(aNumero(lineaSeleccionada.cantidad) - aNumero(lineaSeleccionada.cantidadRecibida), 0)
    : null;

  function actualizar(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }));
  }

  function alCambiarOrden(idCompra) {
    setValores((actuales) => ({ ...actuales, idCompra, idProducto: '', cantidad: '' }));
  }

  function validar() {
    const nuevos = {};
    const cantidad = leerNumero(valores.cantidad);
    if (!valores.idCompra) nuevos.idCompra = 'Seleccione una orden aprobada.';
    if (!valores.idEmpleadoBodega) nuevos.idEmpleadoBodega = 'Seleccione al responsable de bodega.';
    if (!valores.idBodega) nuevos.idBodega = 'Seleccione la bodega de destino.';
    if (!valores.guiaRemision.trim()) nuevos.guiaRemision = 'Ingrese el número de guía de remisión.';
    if (!valores.idProducto) nuevos.idProducto = 'Seleccione el producto recibido.';
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      nuevos.cantidad = 'Ingrese un entero mayor a 0.';
    } else if (saldoPendiente !== null && cantidad > saldoPendiente) {
      nuevos.cantidad = `No puede superar el saldo pendiente (${formatearEntero(saldoPendiente)}).`;
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
        idEmpleadoBodega: Number(valores.idEmpleadoBodega),
        idBodega: Number(valores.idBodega),
        guiaRemision: valores.guiaRemision.trim(),
        idProducto: Number(valores.idProducto),
        cantidad: Number(valores.cantidad),
        observacion: valores.observacion.trim() || undefined,
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
          <Campo
            etiqueta="Orden de compra aprobada"
            htmlFor="recepcion-orden"
            requerido
            error={errores.idCompra}
            ayuda={
              cargandoOrdenes
                ? 'Consultando órdenes aprobadas...'
                : errorOrdenes || (ordenes.length === 0 ? 'No existen órdenes en estado aprobado.' : undefined)
            }
          >
            <SelectorBuscable
              id="recepcion-orden"
              opciones={opcionesOrdenes}
              valor={valores.idCompra}
              onCambio={alCambiarOrden}
              placeholder="Buscar orden aprobada"
              invalido={Boolean(errores.idCompra)}
              deshabilitado={cargandoOrdenes}
            />
          </Campo>
          <Campo etiqueta="Bodega de destino" htmlFor="recepcion-bodega" requerido error={errores.idBodega}>
            <select
              id="recepcion-bodega"
              className={`campo ${errores.idBodega ? 'campo-error' : ''}`}
              value={valores.idBodega}
              onChange={(evento) => actualizar('idBodega', evento.target.value)}
            >
              <option value="">Seleccione una bodega activa</option>
              {bodegas.map((bodega) => {
                const activa = esEntidadActiva(bodega);
                return (
                  <option key={bodega.ID_BODEGA} value={bodega.ID_BODEGA} disabled={!activa}>
                    {bodega.BOD_NOMBRE}{activa ? '' : ' (Inactivo)'}
                  </option>
                );
              })}
            </select>
          </Campo>
          <Campo
            etiqueta="Responsable de bodega"
            htmlFor="recepcion-empleado"
            requerido
            error={errores.idEmpleadoBodega}
          >
            <SelectorBuscable
              id="recepcion-empleado"
              opciones={opcionesEmpleados}
              valor={valores.idEmpleadoBodega}
              onCambio={(valor) => actualizar('idEmpleadoBodega', valor)}
              placeholder="Buscar empleado"
              invalido={Boolean(errores.idEmpleadoBodega)}
            />
          </Campo>
          <Campo etiqueta="Guía de remisión" htmlFor="recepcion-guia" requerido error={errores.guiaRemision}>
            <input
              id="recepcion-guia"
              type="text"
              maxLength={40}
              className={`campo font-mono ${errores.guiaRemision ? 'campo-error' : ''}`}
              value={valores.guiaRemision}
              onChange={(evento) => actualizar('guiaRemision', evento.target.value)}
              placeholder="Número de guía"
            />
          </Campo>
          <Campo
            etiqueta="Producto recibido"
            htmlFor="recepcion-producto"
            requerido
            error={errores.idProducto || errorOrden}
            ayuda={cargandoOrden ? 'Consultando detalle de la orden...' : undefined}
          >
            <select
              id="recepcion-producto"
              className={`campo ${errores.idProducto ? 'campo-error' : ''}`}
              value={valores.idProducto}
              disabled={!valores.idCompra || cargandoOrden}
              onChange={(evento) => actualizar('idProducto', evento.target.value)}
            >
              <option value="">
                {valores.idCompra ? 'Seleccione un producto de la orden' : 'Primero seleccione una orden'}
              </option>
              {lineasOrden.map((linea) => (
                <option key={linea.idDetalle} value={linea.idProducto}>
                  {linea.nombreProducto}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            etiqueta="Cantidad recibida"
            htmlFor="recepcion-cantidad"
            requerido
            error={errores.cantidad}
            ayuda={
              lineaSeleccionada
                ? `Ordenado: ${formatearEntero(lineaSeleccionada.cantidad)} - Recibido: ${formatearEntero(
                    lineaSeleccionada.cantidadRecibida,
                  )} - Saldo: ${formatearEntero(saldoPendiente)}`
                : undefined
            }
          >
            <input
              id="recepcion-cantidad"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className={`campo font-mono tabular-nums ${errores.cantidad ? 'campo-error' : ''}`}
              value={valores.cantidad}
              onChange={(evento) => actualizar('cantidad', evento.target.value)}
            />
          </Campo>
        </div>
        <Campo etiqueta="Observación" htmlFor="recepcion-observacion">
          <input
            id="recepcion-observacion"
            type="text"
            maxLength={200}
            className="campo"
            value={valores.observacion}
            onChange={(evento) => actualizar('observacion', evento.target.value)}
            placeholder="Opcional"
          />
        </Campo>
        <ErrorServidor mensaje={errorServidor} />
      </div>
      <PieFormulario onCancelar={onCancelar} enviando={enviando} etiquetaEnviar="Registrar recepción" icono={PackagePlus} />
    </form>
  );
}

export default function ModalCrearRecepcion({ abierto, onCerrar, onGuardar }) {
  const { catalogos, cargando, error, recargar } = useCatalogos(serviciosModulos.bodega, abierto);

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva recepción de mercadería"
      descripcion="Solo pueden recibirse órdenes de compra en estado aprobado."
      icono={PackagePlus}
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
