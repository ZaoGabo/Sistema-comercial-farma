import { useCallback, useEffect, useState } from 'react';

/**
 * Carga los catalogos dinamicos de un modulo (GET /api/{modulo}/catalogos) cuando el
 * formulario esta activo. Los datos nunca se incluyen en el codigo fuente.
 */
export function useCatalogos(servicio, activo) {
  const [catalogos, setCatalogos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setCatalogos(await servicio.catalogos());
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [servicio]);

  useEffect(() => {
    if (activo) cargar();
  }, [activo, cargar]);

  return { catalogos, cargando, error, recargar: cargar };
}
