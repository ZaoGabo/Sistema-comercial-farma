import { useMemo, useState } from 'react';
import { Building2, ChevronDown, KeyRound, LogIn, UserRound } from 'lucide-react';
import LogoKore from './LogoKore.jsx';
import { BannerError } from '../comunes/EstadoVacio.jsx';
import { Campo } from '../modales/ElementosFormulario.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ESTADOS_CONEXION, useSalud } from '../../context/SaludContext.jsx';
import { ENTORNO } from '../../config/entorno.js';
import { MODULOS, ROLES } from '../../config/modulos.js';

/**
 * Pantalla de acceso estilo Stripe / Clerk Enterprise.
 * Tarjeta central blanca con formulario limpio y selector desplegable discreto
 * del usuario institucional demo, ordenado por módulo y nivel jerárquico.
 */
export default function PantallaAcceso() {
  const { usuariosDemo, cargandoUsuarios, errorUsuarios, recargarUsuarios, iniciarSesion, avisoSesion } = useAuth();
  const { estado } = useSalud();
  const [enProceso, setEnProceso] = useState(null);
  const [errorAcceso, setErrorAcceso] = useState(null);
  const [usuarioElegido, setUsuarioElegido] = useState('');
  const [manualAbierto, setManualAbierto] = useState(false);
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [errorCampo, setErrorCampo] = useState('');

  const opcionesOrdenadas = useMemo(() => {
    const ordenModulo = Object.fromEntries(MODULOS.map((modulo, indice) => [modulo.claveUsuario, indice]));
    return [...usuariosDemo].sort((a, b) => {
      const porModulo = (ordenModulo[a.modulo] ?? 99) - (ordenModulo[b.modulo] ?? 99);
      if (porModulo !== 0) return porModulo;
      return (ROLES[a.rol]?.orden ?? 9) - (ROLES[b.rol]?.orden ?? 9);
    });
  }, [usuariosDemo]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    opcionesOrdenadas.forEach((usuario) => {
      const modulo = MODULOS.find((item) => item.claveUsuario === usuario.modulo);
      const clave = modulo?.nombre || usuario.modulo;
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(usuario);
    });
    return [...mapa.entries()];
  }, [opcionesOrdenadas]);

  async function acceder(datos, identificador) {
    setEnProceso(identificador);
    setErrorAcceso(null);
    try {
      await iniciarSesion(datos);
    } catch (fallo) {
      setErrorAcceso(fallo.message);
      setEnProceso(null);
    }
  }

  function alIngresarDemo(evento) {
    evento.preventDefault();
    if (!usuarioElegido) {
      setErrorAcceso('Seleccione un usuario institucional para continuar.');
      return;
    }
    acceder({ username: usuarioElegido }, usuarioElegido);
  }

  function alEnviarManual(evento) {
    evento.preventDefault();
    if (!credenciales.username.trim()) {
      setErrorCampo('Ingrese el nombre de usuario institucional.');
      return;
    }
    setErrorCampo('');
    acceder(
      { username: credenciales.username.trim(), password: credenciales.password || undefined },
      '__manual__',
    );
  }

  const ocupada = enProceso !== null;
  const usuarioSeleccionado = opcionesOrdenadas.find((usuario) => usuario.username === usuarioElegido) || null;
  const moduloSeleccionado = MODULOS.find((item) => item.claveUsuario === usuarioSeleccionado?.modulo) || null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoKore conPulso={false} centrado />
          <div>
            <p className="text-sm font-semibold text-slate-900">{ENTORNO.tenantNombre || 'Kore'}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500">
              <Building2 className="size-3" aria-hidden="true" />
              {ENTORNO.tenantPlan || 'Gestión empresarial'}
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
            Seleccione su usuario institucional. Cada perfil opera bajo la matriz de autorización
            vigente.
          </p>

          <div className="mt-5 space-y-3">
            {avisoSesion && <BannerError mensaje={avisoSesion} />}
            {estado === ESTADOS_CONEXION.CAIDO && !errorUsuarios && (
              <BannerError mensaje="La API REST no responde. Verifique que el servicio de la Capa 2 esté activo en la red local." />
            )}
            {errorUsuarios && <BannerError mensaje={errorUsuarios} onReintentar={recargarUsuarios} />}
            {errorAcceso && <BannerError mensaje={errorAcceso} />}
          </div>

          <form onSubmit={alIngresarDemo} className="mt-5 space-y-3">
            <div>
              <label htmlFor="acceso-demo" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <UserRound className="size-3.5 text-slate-400" aria-hidden="true" />
                Usuario institucional demo
              </label>
              <div className="relative">
                <select
                  id="acceso-demo"
                  value={usuarioElegido}
                  onChange={(evento) => setUsuarioElegido(evento.target.value)}
                  disabled={cargandoUsuarios || ocupada || opcionesOrdenadas.length === 0}
                  className="campo appearance-none pr-9"
                >
                  <option value="">
                    {cargandoUsuarios ? 'Cargando usuarios...' : 'Seleccione modulo, rol y usuario'}
                  </option>
                  {grupos.map(([nombreModulo, lista]) => (
                    <optgroup key={nombreModulo} label={nombreModulo}>
                      {lista.map((usuario) => (
                        <option key={usuario.username} value={usuario.username}>
                          {ROLES[usuario.rol]?.nombre || usuario.rol} — {usuario.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </div>
              {usuarioSeleccionado && (
                <div className="mt-2.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5">
                  <p className="break-words text-sm font-medium text-slate-900">
                    {usuarioSeleccionado.nombre}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-slate-500">
                    {ROLES[usuarioSeleccionado.rol]?.nombre || usuarioSeleccionado.rol}
                    {' · '}
                    {usuarioSeleccionado.cargo}
                    {' · '}
                    {moduloSeleccionado?.nombre || usuarioSeleccionado.modulo}
                    {' · @'}
                    {usuarioSeleccionado.username}
                  </p>
                </div>
              )}
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Jefe aprueba y anula · Auxiliar crea y aprueba · Operativo crea y consulta.
              </p>
            </div>
            <button
              type="submit"
              disabled={ocupada || !usuarioElegido}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {enProceso && enProceso !== '__manual__' ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">o</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => setManualAbierto((abierto) => !abierto)}
            aria-expanded={manualAbierto}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <KeyRound className="size-4 text-slate-400" aria-hidden="true" />
            Ingresar con usuario y contraseña
            <ChevronDown
              className={`size-4 text-slate-400 transition-transform ${manualAbierto ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {manualAbierto && (
            <form onSubmit={alEnviarManual} noValidate className="mt-4 space-y-3">
              <Campo etiqueta="Usuario" htmlFor="acceso-usuario" requerido error={errorCampo}>
                <input
                  id="acceso-usuario"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  className="campo"
                  value={credenciales.username}
                  onChange={(evento) => setCredenciales((actual) => ({ ...actual, username: evento.target.value }))}
                />
              </Campo>
              <Campo etiqueta="Contraseña" htmlFor="acceso-clave">
                <input
                  id="acceso-clave"
                  type="password"
                  autoComplete="current-password"
                  className="campo"
                  value={credenciales.password}
                  onChange={(evento) => setCredenciales((actual) => ({ ...actual, password: evento.target.value }))}
                />
              </Campo>
              <button
                type="submit"
                disabled={ocupada}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {enProceso === '__manual__' ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
          )}
        </section>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
          Acceso restringido al personal autorizado. Las acciones se registran con fines de auditoría.
        </p>
      </div>
    </main>
  );
}
