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
      return data.datos || {};
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
  };
}

export const serviciosModulos = Object.freeze(
  Object.fromEntries(MODULOS.map((modulo) => [modulo.clave, crearServicioModulo(modulo.ruta)])),
);

export function obtenerServicio(claveModulo) {
  return serviciosModulos[claveModulo];
}
