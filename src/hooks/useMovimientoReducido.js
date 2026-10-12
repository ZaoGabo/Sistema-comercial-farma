import { useReducedMotion } from 'motion/react';
import { usePreferencias } from '../context/PreferenciasContext.jsx';

/**
 * Devuelve true cuando el usuario (sistema operativo o preferencia de Kore) solicita
 * reducir el movimiento. Los componentes cineticos deben desactivar sus efectos de puntero.
 */
export function useMovimientoReducido() {
  const { preferencias } = usePreferencias();
  const sistema = useReducedMotion();
  return Boolean(sistema) || preferencias.animacionesReducidas;
}
