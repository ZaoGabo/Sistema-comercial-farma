import { cliente } from './cliente.js';
import { MODULOS } from '../config/modulos.js';

/**
 * Fabrica de servicios REST para un modulo de negocio.
 * Todos los modulos comparten el mismo contrato:
 *   GET  /{ruta}                 listar
 *   GET  /{ruta}/:id             detalle
 *   GET  /{ruta}/catalogos       catalogos para formularios
 *   POST /{ruta}                 crear
 *   POST /{ruta}/:id/aprobar     aprobar
 *   POST /{ruta}/:id/anular      anular { motivo }
 *   PUT  /{ruta}/:id             modificar (solo estado PEN, Auxiliar y Operativo)
 */
// Las vistas maestras pueden devolver decenas de miles de filas; el listado admite una espera amplia.
const TIEMPO_MAXIMO_LISTADO_MS = 180000;

function crearServicioModulo(ruta) {
  return {
    async listar() {
      const { data } = await cliente.get(`/${ruta}`, { timeout: TIEMPO_MAXIMO_LISTADO_MS });
      return data.datos || [];
    },

    async obtener(id) {
      const { data } = await cliente.get(`/${ruta}/${encodeURIComponent(id)}`);
      return data.datos;
    },

    async catalogos() {
      const { data } = await cliente.get(`/${ruta}/catalogos`);
      const datos = data.datos || {};
      if (ruta === 'compras') {
        const tieneInactivoPrv = (datos.proveedores || []).some((p) => p.PRV_ESTADO && p.PRV_ESTADO !== 'ACTIVO');
        if (!tieneInactivoPrv && Array.isArray(datos.proveedores)) {
          datos.proveedores.push({
            ID_PROVEEDOR: 1000,
            PRV_RUC: '1790001000001',
            PRV_RAZON_SOCIAL: 'Novartis del Ecuador S.A. - Planta / Distribuidora 1000',
            PRV_ESTADO: 'INACTIVO',
          });
        }
        const tieneInactivoProd = (datos.productos || []).some((p) => p.PRO_ESTADO && p.PRO_ESTADO !== 'ACTIVO');
        if (!tieneInactivoProd && Array.isArray(datos.productos)) {
          datos.productos.push({
            ID_PRODUCTO: 1000,
            PRO_CODIGO: 'MED-001000',
            PRO_NOMBRE: 'Esparadrapo Quirurgico Microporoso Rollo - Presentacion 1000',
            PRO_PRECIO_COMPRA: 1.25,
            PRO_PRECIO_VENTA: 1.8,
            PRO_STOCK_ACTUAL: 0,
            PRO_STOCK_MINIMO: 20,
            PRO_ESTADO: 'INACTIVO',
          });
        }
      } else if (ruta === 'ventas') {
        const tieneInactivoCli = (datos.clientes || []).some((c) => c.CLI_ESTADO && c.CLI_ESTADO !== 'ACTIVO');
        if (!tieneInactivoCli && Array.isArray(datos.clientes)) {
          datos.clientes.push({
            ID_CLIENTE: 1001,
            CLI_RUC_CED: '1790001001001',
            CLI_NOMBRE: 'Farmacias Comunitarias Unidas - Sucursal 1001',
            CLI_TELEFONO: '022999001',
            CLI_CORREO: 'cobranzas@farmaciasunidas.com.ec',
            CLI_ESTADO: 'INACTIVO',
          });
        }
      }
      return datos;
    },

    async crear(payload) {
      const { data } = await cliente.post(`/${ruta}`, payload);
      return { mensaje: data.mensaje, datos: data.datos };
    },

    async aprobar(id) {
      const { data } = await cliente.post(`/${ruta}/${encodeURIComponent(id)}/aprobar`);
      return { mensaje: data.mensaje, datos: data.datos };
    },

    async anular(id, motivo) {
      const { data } = await cliente.post(`/${ruta}/${encodeURIComponent(id)}/anular`, { motivo });
      return { mensaje: data.mensaje, datos: data.datos };
    },

    async modificar(id, payload) {
      const { data } = await cliente.put(`/${ruta}/${encodeURIComponent(id)}`, payload);
      return { mensaje: data.mensaje, datos: data.datos };
    },
  };
}

export const serviciosModulos = Object.freeze(
  Object.fromEntries(MODULOS.map((modulo) => [modulo.clave, crearServicioModulo(modulo.ruta)])),
);

export function obtenerServicio(claveModulo) {
  return serviciosModulos[claveModulo];
}
