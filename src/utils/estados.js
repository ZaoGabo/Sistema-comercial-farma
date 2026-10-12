import { capitalizar } from './formato.js';

/**
 * Categorías funcionales de estado. Oracle entrega códigos propios de cada módulo
 * (PEN, APR, ABI, ANU, CONFORME, ACT, PAG, ...). Solo se clasifican como categoría concreta
 * los códigos cuya semántica es inequívoca; el resto queda como DESCONOCIDO ("vigente, sin
 * transición conocida") y la interfaz permite operar sobre ellos, siendo el backend la
 * autoridad final de las transiciones válidas.
 */
export const CATEGORIAS = {
  PENDIENTE: 'pendiente',
  APROBADO: 'aprobado',
  COMPLETADO: 'completado',
  ANULADO: 'anulado',
  DESCONOCIDO: 'desconocido',
};

const GRUPOS = [
  { categoria: CATEGORIAS.ANULADO, exactos: ['ANU'], prefijos: ['ANULAD', 'CANCELAD', 'RECHAZAD'] },
  { categoria: CATEGORIAS.COMPLETADO, exactos: ['REC', 'PAG', 'LIQ'], prefijos: ['RECIBID', 'PAGAD', 'LIQUIDAD'] },
  { categoria: CATEGORIAS.APROBADO, exactos: ['APR'], prefijos: ['APROBAD', 'AUTORIZAD'] },
  { categoria: CATEGORIAS.PENDIENTE, exactos: ['PEN', 'ABI'], prefijos: ['PENDIENT', 'ABIERT'] },
];

const ETIQUETAS_CODIGO = {
  PEN: 'Pendiente',
  APR: 'Aprobada',
  ABI: 'Abierta',
  ANU: 'Anulada',
  ACT: 'Activa',
  PAG: 'Pagada',
  REC: 'Recibida',
  LIQ: 'Liquidada',
};

function normalizar(estado) {
  return String(estado || '')
    .trim()
    .toUpperCase();
}

export function categorizarEstado(estado) {
  const codigo = normalizar(estado);
  if (!codigo) return CATEGORIAS.DESCONOCIDO;

  for (const { categoria, exactos, prefijos } of GRUPOS) {
    if (exactos.includes(codigo) || prefijos.some((prefijo) => codigo.startsWith(prefijo))) {
      return categoria;
    }
  }
  return CATEGORIAS.DESCONOCIDO;
}

export function etiquetaEstado(estado) {
  const codigo = normalizar(estado);
  if (!codigo) return 'Sin estado';
  return ETIQUETAS_CODIGO[codigo] || capitalizar(codigo);
}

/**
 * Una transacción puede aprobarse mientras no esté aprobada, completada ni anulada.
 */
export function puedeAprobarse(estado) {
  const categoria = categorizarEstado(estado);
  return categoria === CATEGORIAS.PENDIENTE || categoria === CATEGORIAS.DESCONOCIDO;
}

export function puedeAnularse(estado) {
  return categorizarEstado(estado) !== CATEGORIAS.ANULADO;
}

export function esPendiente(estado) {
  return categorizarEstado(estado) === CATEGORIAS.PENDIENTE;
}

/**
 * Registro con efecto vigente: ni pendiente de autorización ni anulado.
 */
export function esVigente(estado) {
  const categoria = categorizarEstado(estado);
  return categoria !== CATEGORIAS.PENDIENTE && categoria !== CATEGORIAS.ANULADO;
}

export const FILTROS_ESTADO = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'pendiente', etiqueta: 'Pendientes' },
  { clave: 'vigente', etiqueta: 'Vigentes' },
  { clave: 'anulado', etiqueta: 'Anulados' },
];

export function coincideFiltroEstado(estado, filtro) {
  switch (filtro) {
    case 'pendiente':
      return esPendiente(estado);
    case 'vigente':
      return esVigente(estado);
    case 'anulado':
      return categorizarEstado(estado) === CATEGORIAS.ANULADO;
    default:
      return true;
  }
}

/**
 * Construye los pasos del stepper de auditoría según el estado actual del registro.
 */
export function construirPasosAuditoria(estado, { fechaRegistro, fechaPago } = {}) {
  const categoria = categorizarEstado(estado);
  const pasos = [
    { clave: 'registro', titulo: 'Registro', detalle: fechaRegistro || 'Transacción registrada', estado: 'hecho' },
  ];

  if (categoria === CATEGORIAS.ANULADO) {
    pasos.push({
      clave: 'anulacion',
      titulo: 'Anulación',
      detalle: 'Transacción anulada por Jefatura',
      estado: 'error',
    });
    return pasos;
  }

  if (categoria === CATEGORIAS.DESCONOCIDO) {
    pasos.push({
      clave: 'vigencia',
      titulo: `Estado ${etiquetaEstado(estado).toLowerCase()}`,
      detalle: 'Estado vigente reportado por Oracle 21c',
      estado: 'actual',
    });
    return pasos;
  }

  const aprobado = categoria === CATEGORIAS.APROBADO || categoria === CATEGORIAS.COMPLETADO;
  pasos.push({
    clave: 'aprobacion',
    titulo: 'Aprobación',
    detalle: aprobado ? 'Autorizada con el nivel jerárquico requerido' : 'En espera de autorización',
    estado: aprobado ? 'hecho' : 'actual',
  });

  pasos.push({
    clave: 'cierre',
    titulo: 'Consolidación',
    detalle:
      categoria === CATEGORIAS.COMPLETADO
        ? fechaPago || 'Efectos consolidados en Oracle 21c'
        : 'Efectos pendientes de consolidar',
    estado: categoria === CATEGORIAS.COMPLETADO ? 'hecho' : aprobado ? 'actual' : 'pendiente',
  });

  return pasos;
}
