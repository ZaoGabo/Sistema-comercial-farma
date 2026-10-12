import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { serviciosModulos } from '../api/modulos.servicio.js';
import { estadoModulo, useDatosModulos } from '../context/DatosModulosContext.jsx';
import { useNotificaciones } from '../context/NotificacionesContext.jsx';

/**
 * Estado y operaciones de un modulo de negocio. El listado maestro (vista de Oracle) se
 * descarga una vez y se conserva en cache; tras crear / aprobar / anular solo se consulta el
 * registro afectado. Los errores RBAC (HTTP 403) del backend se presentan como avisos de
 * política institucional.
 */
export function useModulo(claveModulo, { obtenerId }) {
  const servicio = serviciosModulos[claveModulo];
  const { notificar } = useNotificaciones();
  const { modulos, cargarModulo, actualizarRegistro } = useDatosModulos();
  const { registros, cargando, cargado, error } = estadoModulo(modulos, claveModulo);

  const [sincronizandoIds, setSincronizandoIds] = useState(() => new Set());
  const [accionEnCurso, setAccionEnCurso] = useState(null);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const solicitudDetalle = useRef(0);

  useEffect(() => {
    if (!cargado) cargarModulo(claveModulo);
    // La carga inicial solo debe dispararse al montar el modulo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveModulo]);

  const recargar = useCallback(() => cargarModulo(claveModulo), [cargarModulo, claveModulo]);

  const refrescarRegistro = useCallback(
    async (id) => {
      const registro = await servicio.obtener(id);
      if (registro) actualizarRegistro(claveModulo, registro, obtenerId);
      return registro;
    },
    [servicio, actualizarRegistro, claveModulo, obtenerId],
  );

  const consultarDetalle = useCallback(
    async (id) => {
      const numeroSolicitud = solicitudDetalle.current + 1;
      solicitudDetalle.current = numeroSolicitud;
      setCargandoDetalle(true);
      try {
        await refrescarRegistro(id);
      } catch {
        /* Se conserva la información del listado si el detalle no pudo consultarse. */
      } finally {
        if (solicitudDetalle.current === numeroSolicitud) setCargandoDetalle(false);
      }
    },
    [refrescarRegistro],
  );

  const cerrarDetalle = useCallback(() => {
    solicitudDetalle.current += 1;
    setSeleccionadoId(null);
    setCargandoDetalle(false);
  }, []);

  const seleccionar = useCallback(
    (fila) => {
      const id = obtenerId(fila);
      if (id === seleccionadoId) {
        cerrarDetalle();
        return;
      }
      setSeleccionadoId(id);
      consultarDetalle(id);
    },
    [obtenerId, seleccionadoId, cerrarDetalle, consultarDetalle],
  );

  const registroSeleccionado = useMemo(() => {
    if (seleccionadoId === null) return null;
    return registros.find((fila) => obtenerId(fila) === seleccionadoId) || null;
  }, [registros, seleccionadoId, obtenerId]);

  const marcarSincronizacion = useCallback((id, activo) => {
    setSincronizandoIds((actuales) => {
      const siguientes = new Set(actuales);
      if (activo) siguientes.add(id);
      else siguientes.delete(id);
      return siguientes;
    });
  }, []);

  const notificarFallo = useCallback(
    (titulo, fallo) => {
      notificar({
        tipo: fallo.esAccesoDenegado ? 'politica' : 'error',
        titulo: fallo.esAccesoDenegado ? 'Acción no autorizada' : titulo,
        mensaje: fallo.message,
      });
    },
    [notificar],
  );

  const ejecutarTransaccion = useCallback(
    async (id, nombreAccion, operacion, { lanzarError = false } = {}) => {
      marcarSincronizacion(id, true);
      setAccionEnCurso(nombreAccion);
      try {
        const resultado = await operacion();
        notificar({ tipo: 'exito', titulo: 'Operación completada', mensaje: resultado.mensaje });
        try {
          await refrescarRegistro(id);
        } catch {
          /* La operación ya se confirmó; el registro se resincroniza en la próxima consulta. */
        }
        return resultado;
      } catch (fallo) {
        if (lanzarError) throw fallo;
        notificarFallo('No se pudo completar la operación', fallo);
        return null;
      } finally {
        marcarSincronizacion(id, false);
        setAccionEnCurso(null);
      }
    },
    [marcarSincronizacion, notificar, refrescarRegistro, notificarFallo],
  );

  const aprobar = useCallback(
    (id) => ejecutarTransaccion(id, 'aprobar', () => servicio.aprobar(id)),
    [ejecutarTransaccion, servicio],
  );

  const anular = useCallback(
    (id, motivo) =>
      ejecutarTransaccion(id, 'anular', () => servicio.anular(id, motivo), { lanzarError: true }),
    [ejecutarTransaccion, servicio],
  );

  const crear = useCallback(
    async (payload) => {
      let resultado;
      try {
        resultado = await servicio.crear(payload);
      } catch (fallo) {
        if (fallo.esAccesoDenegado) notificarFallo('No se pudo crear el registro', fallo);
        throw fallo;
      }

      notificar({ tipo: 'exito', titulo: 'Registro creado', mensaje: resultado.mensaje });
      const idNuevo = resultado.datos ? Object.values(resultado.datos)[0] : null;
      if (idNuevo) {
        try {
          await refrescarRegistro(idNuevo);
        } catch {
          cargarModulo(claveModulo);
        }
      } else {
        cargarModulo(claveModulo);
      }
      return resultado;
    },
    [servicio, notificar, notificarFallo, refrescarRegistro, cargarModulo, claveModulo],
  );

  return {
    registros,
    cargando,
    cargado,
    error,
    recargar,
    sincronizandoIds,
    accionEnCurso,
    seleccionadoId,
    registroSeleccionado,
    cargandoDetalle,
    seleccionar,
    cerrarDetalle,
    aprobar,
    anular,
    crear,
  };
}
