import { useEffect, useMemo } from 'react';
import { estadoModulo, useDatosModulos } from '../context/DatosModulosContext.jsx';
import { CATEGORIAS, categorizarEstado } from '../utils/estados.js';

/**
 * Ordenes de compra que pueden recibirse en bodega o pagarse en contabilidad (aprobadas o
 * recibidas). Se usan las que entrega el catalogo del modulo (campos ID_COMPRA,
 * COM_NUMERO_ORDEN, COM_TOTAL); si el catalogo no devuelve ninguna se recurre al listado de
 * Compras en cache. Esto cubre el caso en que el filtro de estado del catalogo del backend no
 * coincida con los codigos de la vista (APR / REC).
 */
export function useOrdenesDisponibles(ordenesCatalogo) {
  const { modulos, cargarModulo } = useDatosModulos();
  const compras = estadoModulo(modulos, 'compras');
  const catalogoVacio = !ordenesCatalogo || ordenesCatalogo.length === 0;

  useEffect(() => {
    if (catalogoVacio && !compras.cargado && !compras.cargando) cargarModulo('compras');
    // Solo debe evaluarse cuando se conoce el resultado del catalogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoVacio]);

  const ordenes = useMemo(() => {
    if (!catalogoVacio) {
      return ordenesCatalogo.map((orden) => ({
        id: orden.ID_COMPRA,
        numero: orden.COM_NUMERO_ORDEN,
        total: orden.COM_TOTAL,
        estado: orden.ESTADO_CABECERA,
      }));
    }
    return compras.registros
      .filter((orden) => {
        const categoria = categorizarEstado(orden.estado);
        return categoria === CATEGORIAS.APROBADO || categoria === CATEGORIAS.COMPLETADO;
      })
      .map((orden) => ({
        id: orden.idCompra,
        numero: orden.numeroOrden,
        total: orden.total,
        estado: orden.estado,
      }));
  }, [catalogoVacio, ordenesCatalogo, compras.registros]);

  return { ordenes, cargando: catalogoVacio && compras.cargando, error: catalogoVacio ? compras.error : null };
}
