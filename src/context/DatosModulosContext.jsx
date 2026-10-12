import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { serviciosModulos } from '../api/modulos.servicio.js';

const DatosModulosContext = createContext(null);

const ESTADO_INICIAL = Object.freeze({ registros: [], cargando: false, cargado: false, error: null });

/**
 * Cache en memoria de los listados maestros. Las vistas de Oracle pueden contener decenas de
 * miles de filas, por lo que cada listado se descarga una sola vez por sesión de trabajo y,
 * tras crear / aprobar / anular, solo se actualiza el registro afectado (GET /{modulo}/:id).
 * Los datos de las vistas no dependen del perfil, por lo que el cache sobrevive al cambio de
 * usuario con el Credential Hub y se descarta al cerrar sesión.
 */
export function DatosModulosProvider({ children }) {
  const [modulos, setModulos] = useState({});
  const solicitudes = useRef(new Map());

  const parchear = useCallback((clave, cambios) => {
    setModulos((actuales) => ({
      ...actuales,
      [clave]: { ...ESTADO_INICIAL, ...actuales[clave], ...cambios },
    }));
  }, []);

  const cargarModulo = useCallback(
    (clave) => {
      if (solicitudes.current.has(clave)) return solicitudes.current.get(clave);

      const solicitud = (async () => {
        parchear(clave, { cargando: true, error: null });
        try {
          const registros = await serviciosModulos[clave].listar();
          parchear(clave, { registros, cargado: true, cargando: false });
          return registros;
        } catch (fallo) {
          parchear(clave, { cargando: false, error: fallo.message });
          return null;
        } finally {
          solicitudes.current.delete(clave);
        }
      })();

      solicitudes.current.set(clave, solicitud);
      return solicitud;
    },
    [parchear],
  );

  const actualizarRegistro = useCallback((clave, registro, obtenerId) => {
    const id = obtenerId(registro);
    setModulos((actuales) => {
      const actual = { ...ESTADO_INICIAL, ...actuales[clave] };
      const existe = actual.registros.some((fila) => obtenerId(fila) === id);
      const registros = existe
        ? actual.registros.map((fila) => (obtenerId(fila) === id ? registro : fila))
        : [registro, ...actual.registros];
      return { ...actuales, [clave]: { ...actual, registros } };
    });
  }, []);

  const valor = useMemo(
    () => ({ modulos, cargarModulo, actualizarRegistro }),
    [modulos, cargarModulo, actualizarRegistro],
  );

  return <DatosModulosContext.Provider value={valor}>{children}</DatosModulosContext.Provider>;
}

export function useDatosModulos() {
  const contexto = useContext(DatosModulosContext);
  if (!contexto) {
    throw new Error('useDatosModulos debe utilizarse dentro de un DatosModulosProvider.');
  }
  return contexto;
}

export function estadoModulo(modulos, clave) {
  return modulos[clave] || ESTADO_INICIAL;
}
