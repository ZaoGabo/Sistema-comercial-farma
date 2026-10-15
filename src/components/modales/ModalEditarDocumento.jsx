import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import ModalBase from './ModalBase.jsx';
import { Campo, ErrorServidor, PieFormulario, leerNumero } from './ElementosFormulario.jsx';
import { ENTORNO } from '../../config/entorno.js';

function valoresIniciales(claveModulo, registro) {
  switch (claveModulo) {
    case 'compras': {
      const primera = registro?.detalles?.[0];
      return {
        fechaEntrega: registro?.fechaEntregaEsperada || '',
        observaciones: registro?.observaciones || '',
        idProducto: primera?.idProducto ? String(primera.idProducto) : '',
        nuevaCantidad: primera?.cantidad ? String(primera.cantidad) : '',
        nuevoPrecio: primera?.precioUnitario ? String(primera.precioUnitario) : '',
      };
    }
    case 'ventas': {
      const primera = registro?.detalles?.[0];
      return {
        idProducto: primera?.idProducto ? String(primera.idProducto) : '',
        nuevaCantidad: primera?.cantidad ? String(primera.cantidad) : '',
        nuevoPrecio: primera?.precioUnitario ? String(primera.precioUnitario) : '',
      };
    }
    case 'bodega':
      return {
        nuevaGuia: registro?.guiaRemision || '',
        idProducto: registro?.detalles?.[0]?.idProducto ? String(registro.detalles[0].idProducto) : '',
        nuevaCantidad: registro?.detalles?.[0]?.cantidadRecibida
          ? String(registro.detalles[0].cantidadRecibida)
          : '',
        nuevaObservacion: registro?.detalles?.[0]?.observacion || '',
      };
    case 'contabilidad':
      return {
        nuevoMonto: registro?.monto ? String(registro.monto) : '',
        nuevoMetodo: registro?.metodo || '',
        nuevaReferencia: registro?.referenciaBancaria || '',
        nuevoDescuento: registro?.descuentoProntoPago ? String(registro.descuentoProntoPago) : '0',
      };
    case 'talento-humano':
      return {
        bonificaciones: registro?.valores?.bonificaciones ? String(registro.valores.bonificaciones) : '0',
        descuentos: registro?.valores?.descuentos ? String(registro.valores.descuentos) : '0',
      };
    default:
      return {};
  }
}

function construirPayload(claveModulo, valores) {
  switch (claveModulo) {
    case 'compras': {
      const payload = {};
      if (valores.fechaEntrega) payload.fechaEntrega = valores.fechaEntrega;
      if (valores.observaciones.trim()) payload.observaciones = valores.observaciones.trim();
      if (valores.idProducto) {
        payload.idProducto = Number(valores.idProducto);
        if (valores.nuevaCantidad !== '') payload.nuevaCantidad = Number(valores.nuevaCantidad);
        if (valores.nuevoPrecio !== '') payload.nuevoPrecio = Number(valores.nuevoPrecio);
      }
      return payload;
    }
    case 'ventas':
      return {
        idProducto: Number(valores.idProducto),
        nuevaCantidad: Number(valores.nuevaCantidad),
        ...(valores.nuevoPrecio !== '' ? { nuevoPrecio: Number(valores.nuevoPrecio) } : {}),
      };
    case 'bodega': {
      const payload = {};
      if (valores.nuevaGuia.trim()) payload.nuevaGuia = valores.nuevaGuia.trim();
      if (valores.idProducto && valores.nuevaCantidad !== '') {
        payload.idProducto = Number(valores.idProducto);
        payload.nuevaCantidad = Number(valores.nuevaCantidad);
      }
      if (valores.nuevaObservacion.trim()) payload.nuevaObservacion = valores.nuevaObservacion.trim();
      return payload;
    }
    case 'contabilidad': {
      const payload = {};
      if (valores.nuevoMonto !== '') payload.nuevoMonto = Number(valores.nuevoMonto);
      if (valores.nuevoMetodo) payload.nuevoMetodo = valores.nuevoMetodo;
      if (valores.nuevaReferencia.trim()) payload.nuevaReferencia = valores.nuevaReferencia.trim();
      if (valores.nuevoDescuento !== '') payload.nuevoDescuento = Number(valores.nuevoDescuento);
      return payload;
    }
    case 'talento-humano':
      return {
        bonificaciones: Number(valores.bonificaciones || 0),
        descuentos: Number(valores.descuentos || 0),
      };
    default:
      return {};
  }
}

function validar(claveModulo, valores) {
  const nuevos = {};
  if (claveModulo === 'compras') {
    if (!valores.fechaEntrega && !valores.observaciones.trim() && !valores.idProducto) {
      nuevos.general = 'Indique al menos fecha de entrega, observaciones o una linea a ajustar.';
    }
    if (valores.idProducto && valores.nuevaCantidad !== '' && (!Number.isInteger(leerNumero(valores.nuevaCantidad)) || leerNumero(valores.nuevaCantidad) <= 0)) {
      nuevos.nuevaCantidad = 'Ingrese un entero mayor a 0.';
    }
    if (valores.idProducto && valores.nuevoPrecio !== '' && (!Number.isFinite(leerNumero(valores.nuevoPrecio)) || leerNumero(valores.nuevoPrecio) <= 0)) {
      nuevos.nuevoPrecio = 'El precio debe ser mayor a 0.';
    }
  }
  if (claveModulo === 'ventas') {
    if (!valores.idProducto) nuevos.idProducto = 'Seleccione el producto de la linea a modificar.';
    const cantidad = leerNumero(valores.nuevaCantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) nuevos.nuevaCantidad = 'Ingrese un entero mayor a 0.';
    if (valores.nuevoPrecio !== '' && (!Number.isFinite(leerNumero(valores.nuevoPrecio)) || leerNumero(valores.nuevoPrecio) <= 0)) {
      nuevos.nuevoPrecio = 'El precio debe ser mayor a 0.';
    }
  }
  if (claveModulo === 'bodega') {
    if (!valores.nuevaGuia.trim() && !(valores.idProducto && valores.nuevaCantidad !== '')) {
      nuevos.general = 'Indique la nueva guia o bien el producto con su nueva cantidad.';
    }
    if (valores.idProducto && valores.nuevaCantidad !== '' && (!Number.isInteger(leerNumero(valores.nuevaCantidad)) || leerNumero(valores.nuevaCantidad) <= 0)) {
      nuevos.nuevaCantidad = 'Ingrese un entero mayor a 0.';
    }
  }
  if (claveModulo === 'contabilidad') {
    if (valores.nuevoMonto === '' && !valores.nuevoMetodo && !valores.nuevaReferencia.trim() && valores.nuevoDescuento === '') {
      nuevos.general = 'Indique al menos monto, metodo, referencia o descuento.';
    }
    if (valores.nuevoMonto !== '' && (!Number.isFinite(leerNumero(valores.nuevoMonto)) || leerNumero(valores.nuevoMonto) <= 0)) {
      nuevos.nuevoMonto = 'El monto debe ser mayor a 0.';
    }
    if (valores.nuevoDescuento !== '' && (!Number.isFinite(leerNumero(valores.nuevoDescuento)) || leerNumero(valores.nuevoDescuento) < 0)) {
      nuevos.nuevoDescuento = 'Debe ser 0 o mayor.';
    }
  }
  if (claveModulo === 'talento-humano') {
    if (!Number.isFinite(leerNumero(valores.bonificaciones)) || leerNumero(valores.bonificaciones) < 0) {
      nuevos.bonificaciones = 'Debe ser 0 o mayor.';
    }
    if (!Number.isFinite(leerNumero(valores.descuentos)) || leerNumero(valores.descuentos) < 0) {
      nuevos.descuentos = 'Debe ser 0 o mayor.';
    }
  }
  return nuevos;
}

function Formulario({ claveModulo, registro, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(() => valoresIniciales(claveModulo, registro));
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setValores(valoresIniciales(claveModulo, registro));
    setErrores({});
    setErrorServidor('');
  }, [claveModulo, registro]);

  function actualizar(clave, valor) {
    setValores((actuales) => ({ ...actuales, [clave]: valor }));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const fallos = validar(claveModulo, valores);
    setErrores(fallos);
    if (Object.keys(fallos).length > 0) return;
    setEnviando(true);
    try {
      await onGuardar(construirPayload(claveModulo, valores));
    } catch (fallo) {
      setErrorServidor(fallo.message);
      setEnviando(false);
    }
  }

  const metodos = ENTORNO.metodosPago || [];

  return (
    <form onSubmit={alEnviar} noValidate>
      <div className="space-y-5 pb-8">
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
          Solo se pueden modificar documentos en estado Borrador / Pendiente. Los cambios se aplican
          mediante PUT /api/{claveModulo}/:id.
        </p>
        {errores.general && <p className="text-xs text-rose-600">{errores.general}</p>}

        {claveModulo === 'compras' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Fecha de entrega" htmlFor="editar-fecha">
              <input id="editar-fecha" type="date" className="campo" value={valores.fechaEntrega} onChange={(evento) => actualizar('fechaEntrega', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Observaciones" htmlFor="editar-observaciones">
              <input id="editar-observaciones" type="text" maxLength={200} className="campo" value={valores.observaciones} onChange={(evento) => actualizar('observaciones', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Producto de la linea" htmlFor="editar-id-producto">
              <input id="editar-id-producto" type="number" min="1" step="1" className="campo font-mono" value={valores.idProducto} onChange={(evento) => actualizar('idProducto', evento.target.value)} placeholder="Identificador del producto" />
            </Campo>
            <Campo etiqueta="Nueva cantidad" htmlFor="editar-cantidad" error={errores.nuevaCantidad}>
              <input id="editar-cantidad" type="number" min="1" step="1" className={`campo font-mono ${errores.nuevaCantidad ? 'campo-error' : ''}`} value={valores.nuevaCantidad} onChange={(evento) => actualizar('nuevaCantidad', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nuevo precio" htmlFor="editar-precio" error={errores.nuevoPrecio}>
              <input id="editar-precio" type="number" min="0" step="0.01" className={`campo font-mono ${errores.nuevoPrecio ? 'campo-error' : ''}`} value={valores.nuevoPrecio} onChange={(evento) => actualizar('nuevoPrecio', evento.target.value)} />
            </Campo>
          </div>
        )}

        {claveModulo === 'ventas' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Producto de la linea" htmlFor="editar-id-producto" requerido error={errores.idProducto}>
              <input id="editar-id-producto" type="number" min="1" step="1" className={`campo font-mono ${errores.idProducto ? 'campo-error' : ''}`} value={valores.idProducto} onChange={(evento) => actualizar('idProducto', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nueva cantidad" htmlFor="editar-cantidad" requerido error={errores.nuevaCantidad}>
              <input id="editar-cantidad" type="number" min="1" step="1" className={`campo font-mono ${errores.nuevaCantidad ? 'campo-error' : ''}`} value={valores.nuevaCantidad} onChange={(evento) => actualizar('nuevaCantidad', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nuevo precio" htmlFor="editar-precio" error={errores.nuevoPrecio} className="sm:col-span-2">
              <input id="editar-precio" type="number" min="0" step="0.01" className={`campo font-mono ${errores.nuevoPrecio ? 'campo-error' : ''}`} value={valores.nuevoPrecio} onChange={(evento) => actualizar('nuevoPrecio', evento.target.value)} placeholder="Opcional" />
            </Campo>
          </div>
        )}

        {claveModulo === 'bodega' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nueva guia de remision" htmlFor="editar-guia" className="sm:col-span-2">
              <input id="editar-guia" type="text" maxLength={40} className="campo font-mono" value={valores.nuevaGuia} onChange={(evento) => actualizar('nuevaGuia', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Producto" htmlFor="editar-id-producto">
              <input id="editar-id-producto" type="number" min="1" step="1" className="campo font-mono" value={valores.idProducto} onChange={(evento) => actualizar('idProducto', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nueva cantidad" htmlFor="editar-cantidad" error={errores.nuevaCantidad}>
              <input id="editar-cantidad" type="number" min="1" step="1" className={`campo font-mono ${errores.nuevaCantidad ? 'campo-error' : ''}`} value={valores.nuevaCantidad} onChange={(evento) => actualizar('nuevaCantidad', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nueva observacion" htmlFor="editar-observacion" className="sm:col-span-2">
              <input id="editar-observacion" type="text" maxLength={200} className="campo" value={valores.nuevaObservacion} onChange={(evento) => actualizar('nuevaObservacion', evento.target.value)} />
            </Campo>
          </div>
        )}

        {claveModulo === 'contabilidad' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nuevo monto" htmlFor="editar-monto" error={errores.nuevoMonto}>
              <input id="editar-monto" type="number" min="0" step="0.01" className={`campo font-mono ${errores.nuevoMonto ? 'campo-error' : ''}`} value={valores.nuevoMonto} onChange={(evento) => actualizar('nuevoMonto', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nuevo metodo" htmlFor="editar-metodo">
              <select id="editar-metodo" className="campo" value={valores.nuevoMetodo} onChange={(evento) => actualizar('nuevoMetodo', evento.target.value)}>
                <option value="">Sin cambio</option>
                {metodos.map((metodo) => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Nueva referencia" htmlFor="editar-referencia">
              <input id="editar-referencia" type="text" maxLength={60} className="campo font-mono" value={valores.nuevaReferencia} onChange={(evento) => actualizar('nuevaReferencia', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Nuevo descuento" htmlFor="editar-descuento" error={errores.nuevoDescuento}>
              <input id="editar-descuento" type="number" min="0" step="0.01" className={`campo font-mono ${errores.nuevoDescuento ? 'campo-error' : ''}`} value={valores.nuevoDescuento} onChange={(evento) => actualizar('nuevoDescuento', evento.target.value)} />
            </Campo>
          </div>
        )}

        {claveModulo === 'talento-humano' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Bonificaciones" htmlFor="editar-bonificaciones" error={errores.bonificaciones}>
              <input id="editar-bonificaciones" type="number" min="0" step="0.01" className={`campo font-mono ${errores.bonificaciones ? 'campo-error' : ''}`} value={valores.bonificaciones} onChange={(evento) => actualizar('bonificaciones', evento.target.value)} />
            </Campo>
            <Campo etiqueta="Descuentos" htmlFor="editar-descuentos" error={errores.descuentos}>
              <input id="editar-descuentos" type="number" min="0" step="0.01" className={`campo font-mono ${errores.descuentos ? 'campo-error' : ''}`} value={valores.descuentos} onChange={(evento) => actualizar('descuentos', evento.target.value)} />
            </Campo>
          </div>
        )}

        <ErrorServidor mensaje={errorServidor} />
      </div>
      <PieFormulario onCancelar={onCancelar} enviando={enviando} etiquetaEnviar="Guardar cambios" icono={Pencil} />
    </form>
  );
}

/**
 * Ventana modal de edicion para documentos en estado Borrador / Pendiente.
 * Consume PUT /api/{modulo}/:id con los campos propios de cada modulo.
 */
export default function ModalEditarDocumento({ abierto, onCerrar, onGuardar, claveModulo, registro, titulo }) {
  return (
    <ModalBase
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo || 'Modificar documento en borrador'}
      descripcion="Ajuste cantidades y datos de cabecera. Aprobados o anulados no admiten cambios."
      icono={Pencil}
      ancho="max-w-2xl"
    >
      {registro ? (
        <Formulario claveModulo={claveModulo} registro={registro} onGuardar={onGuardar} onCancelar={onCerrar} />
      ) : null}
    </ModalBase>
  );
}
