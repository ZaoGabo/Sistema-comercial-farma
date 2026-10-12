import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authServicio } from '../api/auth.servicio.js';
import { ENTORNO } from '../config/entorno.js';
import { EVENTO_PULSO_API } from '../components/comunes/FondoSonar.jsx';

const SaludContext = createContext(null);

export const ESTADOS_CONEXION = {
  CONECTANDO: 'conectando',
  ACTIVO: 'activo',
  CAIDO: 'caido',
};

/**
 * Sondeo periodico de GET /api/salud para reflejar la conexion en vivo
 * con la Capa 2 y Oracle 21c en el indicador del encabezado.
 */
export function SaludProvider({ children }) {
  const [estado, setEstado] = useState(ESTADOS_CONEXION.CONECTANDO);
  const [datos, setDatos] = useState(null);
  const [latenciaMs, setLatenciaMs] = useState(null);
  const [mensajeError, setMensajeError] = useState(null);

  const verificar = useCallback(async () => {
    try {
      const respuesta = await authServicio.verificarSalud();
      setDatos(respuesta);
      setLatenciaMs(respuesta.latenciaMs);
      setMensajeError(null);
      setEstado(respuesta.estado === 'ACTIVO' ? ESTADOS_CONEXION.ACTIVO : ESTADOS_CONEXION.CAIDO);
      window.dispatchEvent(new CustomEvent(EVENTO_PULSO_API, { detail: { x: 84, y: 36 } }));
    } catch (fallo) {
      setEstado(ESTADOS_CONEXION.CAIDO);
      setMensajeError(fallo.message);
    }
  }, []);

  useEffect(() => {
    verificar();
    const id = window.setInterval(() => {
      if (!document.hidden) verificar();
    }, ENTORNO.intervaloSaludMs);
    return () => window.clearInterval(id);
  }, [verificar]);

  const valor = useMemo(
    () => ({ estado, datos, latenciaMs, mensajeError, verificar }),
    [estado, datos, latenciaMs, mensajeError, verificar],
  );

  return <SaludContext.Provider value={valor}>{children}</SaludContext.Provider>;
}

export function useSalud() {
  const contexto = useContext(SaludContext);
  if (!contexto) {
    throw new Error('useSalud debe utilizarse dentro de un SaludProvider.');
  }
  return contexto;
}
