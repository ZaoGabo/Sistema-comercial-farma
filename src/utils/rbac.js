/**
 * Políticas institucionales de la matriz RBAC de la pizarra.
 *
 *   Rol        Crear   Ver   Aprobar   Anular
 *   Jefe         X      OK     OK        OK
 *   Auxiliar    OK      OK     OK         X
 *   Operativo   OK      OK      X         X
 *
 * Los permisos efectivos siempre provienen de la API (campo "permisos" del usuario);
 * este módulo solo aporta los textos de política mostrados cuando una acción está bloqueada.
 *
 * Segunda dimensión (segregación departamental): ningún usuario puede ejecutar acciones
 * mutacionales fuera de su departamento asignado (campo "modulo" del usuario, valores
 * "COMPRAS", "BODEGA", "CONTABILIDAD", "VENTAS", "TALENTO_HUMANO"). El backend rechaza
 * estos intentos con HTTP 403 y código ERROR_RBAC_MODULO_NO_AUTORIZADO; la interfaz los
 * inhabilita de forma preventiva.
 */
import { obtenerModulo } from '../config/modulos.js';
export const ACCIONES = {
  CREAR: 'crear',
  VER: 'ver',
  APROBAR: 'aprobar',
  ANULAR: 'anular',
};

export const POLITICAS_BLOQUEO = {
  [ACCIONES.CREAR]: 'Acceso restringido: Jefatura no emite transacciones directas',
  [ACCIONES.APROBAR]: 'Acceso restringido: Aprobación reservada a Jefatura y Auxiliar',
  [ACCIONES.ANULAR]: 'Acceso restringido: Anulación reservada a Jefatura',
};

export function tienePermiso(permisos, accion) {
  return Boolean(permisos && permisos[accion]);
}

/**
 * Identidad del superusuario institucional (fuente centralizada, sin literales
 * quemados en los componentes). Canónico con la Capa 2 (`rbac.middleware.js`):
 * rol DBA, usuario raíz ZaoGabo o módulo SISTEMA.
 */
export const ROL_SUPERUSUARIO = 'DBA';
export const USUARIO_RAIZ = 'ZAOGABO';
export const MODULO_SISTEMA = 'SISTEMA';

export function esSuperusuario(usuario) {
  if (!usuario) return false;
  return (
    usuario.rol === ROL_SUPERUSUARIO ||
    String(usuario.username || '').toUpperCase() === USUARIO_RAIZ ||
    String(usuario.modulo || '').toUpperCase() === MODULO_SISTEMA
  );
}

/**
 * Código de error que emite la Capa 2 cuando el usuario intenta operar fuera de su
 * departamento (middleware verificarModulo, HTTP 403 Forbidden).
 */
export const CODIGO_MODULO_NO_AUTORIZADO = 'ERROR_RBAC_MODULO_NO_AUTORIZADO';

/**
 * Indica si el departamento del usuario coincide con el módulo consultado.
 * La comparación se deriva de la configuración centralizada (claveUsuario de cada
 * módulo) e insensible a mayúsculas; con datos ausentes responde falso (denegar).
 */
export function esModuloPropio(moduloUsuario, claveModulo) {
  if (moduloUsuario?.toUpperCase() === 'SISTEMA') return true;
  const esperado = obtenerModulo(claveModulo)?.claveUsuario;
  if (!moduloUsuario || !esperado) return false;
  return String(moduloUsuario).toUpperCase() === String(esperado).toUpperCase();
}

/**
 * Texto institucional del tooltip para acciones mutacionales fuera del departamento.
 */
export function mensajeModuloAjeno(nombreModulo) {
  return `Acceso restringido: Acción reservada al personal del departamento de ${nombreModulo}`;
}

export const PERMISOS_VACIOS = Object.freeze({
  crear: false,
  ver: false,
  aprobar: false,
  anular: false,
});
