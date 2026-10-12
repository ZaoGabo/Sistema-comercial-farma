import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authServicio } from '../api/auth.servicio.js';
import { almacenToken, EVENTO_SESION_EXPIRADA } from '../api/cliente.js';
import { PERMISOS_VACIOS } from '../utils/rbac.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [restaurando, setRestaurando] = useState(() => Boolean(almacenToken.leer()));
  const [usuariosDemo, setUsuariosDemo] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState(null);
  const [avisoSesion, setAvisoSesion] = useState(null);

  const cargarUsuariosDemo = useCallback(async () => {
    setCargandoUsuarios(true);
    setErrorUsuarios(null);
    try {
      const lista = await authServicio.obtenerUsuariosDemo();
      setUsuariosDemo(lista);
    } catch (error) {
      setErrorUsuarios(error.message);
    } finally {
      setCargandoUsuarios(false);
    }
  }, []);

  // Restauración de la sesión al recargar la pestaña: el token vive en sessionStorage.
  useEffect(() => {
    if (!almacenToken.leer()) return undefined;
    let cancelado = false;
    authServicio
      .obtenerPerfil()
      .then((perfil) => {
        if (!cancelado) setUsuario(perfil);
      })
      .catch(() => {
        almacenToken.borrar();
      })
      .finally(() => {
        if (!cancelado) setRestaurando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    cargarUsuariosDemo();
  }, [cargarUsuariosDemo]);

  useEffect(() => {
    function alExpirar(evento) {
      setUsuario(null);
      setAvisoSesion(evento.detail?.mensaje || 'La sesión ha expirado. Inicie sesión nuevamente.');
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const iniciarSesion = useCallback(async ({ username, password }) => {
    const resultado = await authServicio.iniciarSesion({ username, password });
    almacenToken.guardar(resultado.token);
    setAvisoSesion(null);
    setUsuario(resultado.usuario);
    return resultado;
  }, []);

  const cerrarSesion = useCallback(() => {
    almacenToken.borrar();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      rol: usuario?.rol || null,
      permisos: usuario?.permisos || PERMISOS_VACIOS,
      autenticado: Boolean(usuario),
      restaurando,
      usuariosDemo,
      cargandoUsuarios,
      errorUsuarios,
      avisoSesion,
      iniciarSesion,
      cerrarSesion,
      recargarUsuarios: cargarUsuariosDemo,
    }),
    [
      usuario,
      restaurando,
      usuariosDemo,
      cargandoUsuarios,
      errorUsuarios,
      avisoSesion,
      iniciarSesion,
      cerrarSesion,
      cargarUsuariosDemo,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return contexto;
}
