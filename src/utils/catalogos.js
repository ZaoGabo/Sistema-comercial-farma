/**
 * Utilidades para filtrado visual de catalogos segun estado de la entidad.
 * Previenen errores de integridad ORA-20011 a ORA-20018 al impedir la seleccion
 * de proveedores, clientes, productos, cuentas o rubros inactivos.
 */

const CAMPOS_ESTADO = [
  'PRV_ESTADO',
  'CLI_ESTADO',
  'PRO_ESTADO',
  'CTA_ESTADO',
  'RUB_ESTADO',
  'EMP_ESTADO',
  'BOD_ESTADO',
  'ESTADO',
  'estado',
];

const VALORES_ACTIVOS = new Set(['ACTIVO', 'ACT']);

export function obtenerEstadoEntidad(entidad) {
  if (!entidad || typeof entidad !== 'object') return '';
  for (const campo of CAMPOS_ESTADO) {
    if (entidad[campo] !== undefined && entidad[campo] !== null) {
      return String(entidad[campo]).trim().toUpperCase();
    }
  }
  return '';
}

export function esEntidadActiva(entidad) {
  const estado = obtenerEstadoEntidad(entidad);
  if (estado === '') return true;
  return VALORES_ACTIVOS.has(estado);
}

export function esOpcionActiva(opcion) {
  if (!opcion || typeof opcion !== 'object') return true;
  if (opcion.deshabilitada) return false;
  if (opcion.origen && typeof opcion.origen === 'object') return esEntidadActiva(opcion.origen);
  return true;
}

/**
 * Convierte una lista cruda de catalogo en opciones para SelectorBuscable,
 * marcando como deshabilitadas aquellas entidades sin estado ACTIVO.
 */
export function aOpcionesCatalogo(lista, { valor, etiqueta, detalle }) {
  return (lista || []).map((entidad) => {
    const activa = esEntidadActiva(entidad);
    return {
      valor: entidad[valor],
      etiqueta: typeof etiqueta === 'function' ? etiqueta(entidad) : entidad[etiqueta],
      detalle: typeof detalle === 'function' ? detalle(entidad) : entidad[detalle],
      deshabilitada: !activa,
      insignia: activa ? null : 'Inactivo',
      origen: entidad,
    };
  });
}
