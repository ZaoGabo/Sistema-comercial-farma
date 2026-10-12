import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CLAVE_ALMACEN = 'kore.preferencias';

const PREFERENCIAS_INICIALES = {
  mallaAmbiental: true,
  animacionesReducidas: false,
};

function leerPreferencias() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN);
    if (guardado) return { ...PREFERENCIAS_INICIALES, ...JSON.parse(guardado) };
  } catch {
    /* Preferencias corruptas o almacenamiento bloqueado: se usan los valores por defecto. */
  }
  return PREFERENCIAS_INICIALES;
}

const PreferenciasContext = createContext(null);

export function PreferenciasProvider({ children }) {
  const [preferencias, setPreferencias] = useState(leerPreferencias);

  const alternar = useCallback((clave) => {
    setPreferencias((actuales) => {
      const siguientes = { ...actuales, [clave]: !actuales[clave] };
      try {
        localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(siguientes));
      } catch {
        /* Sin persistencia disponible */
      }
      return siguientes;
    });
  }, []);

  const valor = useMemo(() => ({ preferencias, alternar }), [preferencias, alternar]);

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export function usePreferencias() {
  const contexto = useContext(PreferenciasContext);
  if (!contexto) {
    throw new Error('usePreferencias debe utilizarse dentro de un PreferenciasProvider.');
  }
  return contexto;
}
