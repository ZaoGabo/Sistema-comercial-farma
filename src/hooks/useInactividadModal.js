import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotificaciones } from '../context/NotificacionesContext.jsx';
import {
  mensajeCierrePorInactividad,
  obtenerTiempoInactividadModalSeg,
} from '../config/inactividad.js';

const EVENTOS_ACTIVIDAD = ['keydown', 'mousedown', 'input', 'scroll', 'touchstart'];

/**
 * Temporizador de inactividad para ventanas modales transaccionales.
 * No cierra la sesion general; solo cierra la ventana modal abierta para liberar
 * bloqueos pesimistas y borradores desatendidos en bases de datos concurrentes.
 *
 * Tiempos por rol: Jefe 15s, Auxiliar 30s, Operativo 60s, DBA 120s.
 */
export function useInactividadModal({ abierto, onCerrar, pausado = false }) {
  const { usuario } = useAuth();
  const { notificar } = useNotificaciones();
  const rol = String(usuario?.rol || 'OPERATIVO').toUpperCase();
  const totalPermitido = obtenerTiempoInactividadModalSeg(rol);
  const [segundosRestantes, setSegundosRestantes] = useState(totalPermitido);
  const referenciaCierre = useRef(onCerrar);
  const referenciaNotificar = useRef(notificar);

  referenciaCierre.current = onCerrar;
  referenciaNotificar.current = notificar;

  const reiniciar = useCallback(() => {
    setSegundosRestantes(obtenerTiempoInactividadModalSeg(String(usuario?.rol || 'OPERATIVO').toUpperCase()));
  }, [usuario?.rol]);

  useEffect(() => {
    if (!abierto) {
      setSegundosRestantes(totalPermitido);
      return undefined;
    }
    setSegundosRestantes(totalPermitido);

    if (pausado) return undefined;

    const intervalo = window.setInterval(() => {
      setSegundosRestantes((actual) => {
        if (actual <= 1) {
          window.clearInterval(intervalo);
          referenciaNotificar.current({
            tipo: 'politica',
            titulo: 'Ventana cerrada por inactividad',
            mensaje: mensajeCierrePorInactividad(rol, totalPermitido),
          });
          referenciaCierre.current?.();
          return 0;
        }
        return actual - 1;
      });
    }, 1000);

    function alRegistrarActividad() {
      setSegundosRestantes(totalPermitido);
    }

    EVENTOS_ACTIVIDAD.forEach((evento) => {
      window.addEventListener(evento, alRegistrarActividad, { passive: true });
    });

    return () => {
      window.clearInterval(intervalo);
      EVENTOS_ACTIVIDAD.forEach((evento) => {
        window.removeEventListener(evento, alRegistrarActividad);
      });
    };
  }, [abierto, pausado, totalPermitido, rol]);

  const fraccionRestante = totalPermitido > 0 ? Math.max(segundosRestantes, 0) / totalPermitido : 0;

  return { segundosRestantes: Math.max(segundosRestantes, 0), totalPermitido, rol, fraccionRestante, reiniciar };
}
