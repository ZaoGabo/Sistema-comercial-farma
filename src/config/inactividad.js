/**
 * Tiempos maximos de inactividad dentro de ventanas modales transaccionales.
 * El temporizador rige sobre la ventana modal de captura o mutacion abierta y no
 * expulsa al usuario del sistema ni cierra su sesion general. Su proposito es
 * evitar que una estacion retenga bloqueos pesimistas o formularios desatendidos.
 */
export const TIEMPOS_INACTIVIDAD_MODAL_SEG = Object.freeze({
  JEFE: 15,
  AUXILIAR: 30,
  OPERATIVO: 60,
  DBA: 120,
  DBA_TECNICO: 120,
});

export const TIEMPO_INACTIVIDAD_MODAL_POR_DEFECTO_SEG = 60;

export function obtenerTiempoInactividadModalSeg(rol) {
  const clave = String(rol || '').toUpperCase();
  return (
    TIEMPOS_INACTIVIDAD_MODAL_SEG[clave] ?? TIEMPO_INACTIVIDAD_MODAL_POR_DEFECTO_SEG
  );
}

export function mensajeCierrePorInactividad(rol, segundos) {
  const etiqueta = String(rol || 'USUARIO').toUpperCase();
  return (
    `Ventana cerrada por inactividad: Tu perfil de ${etiqueta} permite un maximo de ` +
    `${segundos} segundos de inactividad en formularios transaccionales para evitar ` +
    `bloqueos en el motor de base de datos.`
  );
}
