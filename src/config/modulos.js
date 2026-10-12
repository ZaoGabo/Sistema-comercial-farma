import {
  ShoppingCart,
  Warehouse,
  Landmark,
  Receipt,
  Users,
  LayoutDashboard,
  Terminal,
} from 'lucide-react';

export const CLAVE_DBA = 'dba';

/**
 * Definición declarativa de los 5 módulos de negocio de Kore.
 * - clave: identificador interno y segmento de ruta de la API (/api/{ruta}).
 * - claveUsuario: valor del campo "modulo" que retorna /auth/usuarios-demo.
 * - vista: vista relacional de Oracle 21c que alimenta el listado maestro.
 * - etiquetas: textos de la botonera según la transacción propia del módulo.
 */
export const MODULOS = [
  {
    clave: 'compras',
    ruta: 'compras',
    claveUsuario: 'COMPRAS',
    nombre: 'Compras',
    icono: ShoppingCart,
    vista: 'V_ORDEN_COMPRA_CABECERA_DETALLE',
    entidad: 'Orden de compra',
    entidadPlural: 'Órdenes de compra',
    etiquetas: {
      crear: 'Crear Orden',
      aprobar: 'Aprobar Orden',
      anular: 'Anular Orden',
    },
  },
  {
    clave: 'bodega',
    ruta: 'bodega',
    claveUsuario: 'BODEGA',
    nombre: 'Bodega',
    icono: Warehouse,
    vista: 'V_BOD_RECEPCION_DETALLE',
    entidad: 'Recepción',
    entidadPlural: 'Recepciones de bodega',
    etiquetas: {
      crear: 'Registrar Recepción',
      aprobar: 'Aprobar Recepción',
      anular: 'Anular Recepción',
    },
  },
  {
    clave: 'contabilidad',
    ruta: 'contabilidad',
    claveUsuario: 'CONTABILIDAD',
    nombre: 'Contabilidad',
    icono: Landmark,
    vista: 'V_CON_PAGOS_ASIENTOS',
    entidad: 'Pago',
    entidadPlural: 'Pagos y asientos contables',
    etiquetas: {
      crear: 'Registrar Pago',
      aprobar: 'Aprobar Pago',
      anular: 'Anular Pago',
    },
  },
  {
    clave: 'ventas',
    ruta: 'ventas',
    claveUsuario: 'VENTAS',
    nombre: 'Ventas',
    icono: Receipt,
    vista: 'V_VEN_FACTURA_DETALLE',
    entidad: 'Factura',
    entidadPlural: 'Facturas de venta',
    etiquetas: {
      crear: 'Crear Factura',
      aprobar: 'Emitir Factura',
      anular: 'Anular Factura',
    },
  },
  {
    clave: 'talento-humano',
    ruta: 'talento-humano',
    claveUsuario: 'TALENTO_HUMANO',
    nombre: 'Talento Humano',
    icono: Users,
    vista: 'V_TH_NOMINA_EMPLEADOS',
    entidad: 'Nómina',
    entidadPlural: 'Nóminas de empleados',
    etiquetas: {
      crear: 'Crear Nómina',
      aprobar: 'Liquidar Nómina',
      anular: 'Anular Nómina',
    },
  },
];

export const CLAVE_INICIO = 'inicio';

export const PESTANAS_NAVEGACION = [
  { clave: CLAVE_INICIO, etiqueta: 'Centro de Mando', icono: LayoutDashboard },
  ...MODULOS.map((modulo) => ({
    clave: modulo.clave,
    etiqueta: modulo.nombre,
    icono: modulo.icono,
  })),
];

export function obtenerModulo(clave) {
  return MODULOS.find((modulo) => modulo.clave === clave) || null;
}

export function obtenerModuloPorUsuario(claveUsuario) {
  return MODULOS.find((modulo) => modulo.claveUsuario === claveUsuario) || null;
}

/**
 * Niveles jerárquicos reconocidos por el backend con su descripción institucional.
 */
export const ROLES = {
  DBA: { clave: 'DBA', nombre: 'Administrador Global DBA', orden: -1 },
  JEFE: { clave: 'JEFE', nombre: 'Jefe', orden: 0 },
  AUXILIAR: { clave: 'AUXILIAR', nombre: 'Auxiliar', orden: 1 },
  OPERATIVO: { clave: 'OPERATIVO', nombre: 'Operativo', orden: 2 },
};

export function nombreRol(clave) {
  return ROLES[clave]?.nombre || clave || '';
}
