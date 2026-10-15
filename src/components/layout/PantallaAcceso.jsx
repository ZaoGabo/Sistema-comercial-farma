import { useState } from 'react';
import { Building2, KeyRound, LogIn, UserRound } from 'lucide-react';
import LogoKore from './LogoKore.jsx';
import { BannerError } from '../comunes/EstadoVacio.jsx';
import { Campo } from '../modales/ElementosFormulario.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ESTADOS_CONEXION, useSalud } from '../../context/SaludContext.jsx';
import { ENTORNO } from '../../config/entorno.js';

/**
 * Pantalla de acceso corporativo con inicio de sesion manual estricto.
 * Exige nombre de usuario y contrasena, validados contra POST /api/auth/login.
 * No incluye selector rapido de usuarios demostrativos.
 */
export default function PantallaAcceso() {
  const { iniciarSesion, avisoSesion } = useAuth();
  const { estado } = useSalud();
  const [enProceso, setEnProceso] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState(null);
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [errores, setErrores] = useState({});

  function traducirErrorCredenciales(fallo) {
    if (fallo?.codigo === 'ERROR_CREDENCIALES_INVALIDAS') {
      return 'Usuario no registrado en el sistema institucional. Verifique el nombre de usuario.';
    }
    if (fallo?.codigo === 'ERROR_CONTRASENA_INCORRECTA') {
      return 'Contrasena incorrecta para el usuario indicado. Verifique e intente nuevamente.';
    }
    if (fallo?.codigo === 'ERROR_PARAMETROS_FALTANTES') {
      return 'Debe ingresar el nombre de usuario y la contrasena institucional.';
    }
    return fallo?.message || 'No se pudo iniciar la sesion. Verifique sus credenciales.';
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const nuevos = {};
    const usuario = credenciales.username.trim();
    if (!usuario) {
      nuevos.username = 'Ingrese el nombre de usuario institucional.';
    }
    if (!credenciales.password) {
      nuevos.password = 'Ingrese la contrasena institucional.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnProceso(true);
    setErrorAcceso(null);
    try {
      await iniciarSesion({ username: usuario, password: credenciales.password });
    } catch (fallo) {
      setErrorAcceso(traducirErrorCredenciales(fallo));
      setEnProceso(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoKore conPulso={false} centrado />
          <div>
            <p className="text-sm font-semibold text-slate-900">{ENTORNO.tenantNombre || 'Kore'}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500">
              <Building2 className="size-3" aria-hidden="true" />
              {ENTORNO.tenantPlan || 'Gestion empresarial'}
            </p>
          </div>
        </div>

        <section
          aria-labelledby="titulo-acceso"
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          <h1 id="titulo-acceso" className="text-xl font-semibold tracking-tight text-slate-900">
            Acceso institucional
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Ingrese sus credenciales institucionales. Cada perfil opera bajo la matriz de autorizacion
            vigente.
          </p>

          <div className="mt-5 space-y-3">
            {avisoSesion && <BannerError mensaje={avisoSesion} />}
            {estado === ESTADOS_CONEXION.CAIDO && (
              <BannerError mensaje="La API REST no responde. Verifique que el servicio de la Capa 2 este activo en la red local." />
            )}
            {errorAcceso && <BannerError mensaje={errorAcceso} />}
          </div>

          <form onSubmit={alEnviar} noValidate className="mt-5 space-y-4">
            <Campo etiqueta="Nombre de usuario" htmlFor="acceso-usuario" requerido error={errores.username}>
              <span className="relative block">
                <UserRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="acceso-usuario"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  className={`campo pl-9 ${errores.username ? 'campo-error' : ''}`}
                  value={credenciales.username}
                  onChange={(evento) =>
                    setCredenciales((actual) => ({ ...actual, username: evento.target.value }))
                  }
                  placeholder="Ejemplo: USR_AUXILIAR_COMPRAS"
                />
              </span>
            </Campo>
            <Campo etiqueta="Contrasena" htmlFor="acceso-clave" requerido error={errores.password}>
              <span className="relative block">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="acceso-clave"
                  type="password"
                  autoComplete="current-password"
                  className={`campo pl-9 ${errores.password ? 'campo-error' : ''}`}
                  value={credenciales.password}
                  onChange={(evento) =>
                    setCredenciales((actual) => ({ ...actual, password: evento.target.value }))
                  }
                  placeholder="Contrasena institucional"
                />
              </span>
            </Campo>
            <button
              type="submit"
              disabled={enProceso}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {enProceso ? 'Verificando credenciales...' : 'Ingresar al sistema'}
            </button>
          </form>

          <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
            Jefe aprueba y anula. Auxiliar crea y aprueba. Operativo crea y consulta. El acceso requiere
            usuario y contrasena.
          </p>
        </section>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
          Acceso restringido al personal autorizado. Las acciones se registran con fines de auditoria.
        </p>
      </div>
    </main>
  );
}
