import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import PantallaAcceso from './components/layout/PantallaAcceso.jsx';
import { MarcaKore } from './components/layout/LogoKore.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DatosModulosProvider } from './context/DatosModulosContext.jsx';
import { NotificacionesProvider } from './context/NotificacionesContext.jsx';
import { PreferenciasProvider, usePreferencias } from './context/PreferenciasContext.jsx';
import { SaludProvider } from './context/SaludContext.jsx';
import { BannerError } from './components/comunes/EstadoVacio.jsx';
import { CLAVE_DBA, CLAVE_INICIO, obtenerModuloPorUsuario } from './config/modulos.js';
import { esSuperusuario } from './utils/rbac.js';
import { ENTORNO } from './config/entorno.js';

class LimiteErrores extends Component {
  constructor(props) {
    super(props);
    this.state = { tieneError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { tieneError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado en módulo:', error, info);
  }

  render() {
    if (this.state.tieneError) {
      return (
        <div className="py-8">
          <BannerError
            mensaje={`No se pudo renderizar la sección: ${this.state.error?.message || 'Error inesperado'}`}
            onReintentar={() => this.setState({ tieneError: false, error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

const PaginaInicio = lazy(() => import('./pages/PaginaInicio.jsx'));

const PAGINAS = {
  compras: lazy(() => import('./pages/ModuloCompras.jsx')),
  bodega: lazy(() => import('./pages/ModuloBodega.jsx')),
  contabilidad: lazy(() => import('./pages/ModuloContabilidad.jsx')),
  ventas: lazy(() => import('./pages/ModuloVentas.jsx')),
  'talento-humano': lazy(() => import('./pages/ModuloTalentoHumano.jsx')),
  dba: lazy(() => import('./pages/ConsolaDBA.jsx')),
};

function CargandoSeccion() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando sección">
      <div className="esqueleto h-14 w-72 rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className="esqueleto h-28 rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

function Escritorio() {
  const { usuario } = useAuth();
  const [seccion, setSeccion] = useState(CLAVE_INICIO);
  const moduloAnterior = useRef(usuario.modulo);

  // Al alternar perfiles con el Credential Hub se conserva la pantalla actual para observar la
  // reacción de la botonera RBAC; solo si el nuevo perfil pertenece a otro módulo se navega a él.
  useEffect(() => {
    if (moduloAnterior.current === usuario.modulo) return;
    moduloAnterior.current = usuario.modulo;
    setSeccion(obtenerModuloPorUsuario(usuario.modulo)?.clave || CLAVE_INICIO);
  }, [usuario.modulo]);

  const Pagina = PAGINAS[seccion];
  const accesoDbaBloqueado = seccion === CLAVE_DBA && !esSuperusuario(usuario);

  return (
    <div className="min-h-screen bg-[#fbfcfd]">
      <Header />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
        <Sidebar activo={seccion} onCambio={setSeccion} />
        <main className="min-w-0 flex-1" id="contenido-principal">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${seccion}-${usuario.username}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <LimiteErrores key={seccion}>
                <Suspense fallback={<CargandoSeccion />}>
                  {accesoDbaBloqueado ? (
                    <BannerError mensaje="Acceso restringido: la Consola SQL DBA requiere privilegios de superusuario." />
                  ) : Pagina ? (
                    <Pagina />
                  ) : (
                    <PaginaInicio onNavegar={setSeccion} />
                  )}
                </Suspense>
              </LimiteErrores>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function PantallaCarga() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#fbfcfd]" role="status" aria-label="Restaurando sesión">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MarcaKore className="size-12" />
      </motion.div>
    </div>
  );
}

function ContenidoAplicacion() {
  const { autenticado, restaurando } = useAuth();

  if (!ENTORNO.apiConfigurada) {
    return (
      <div className="mx-auto grid min-h-screen max-w-xl place-items-center bg-[#fbfcfd] px-5">
        <BannerError mensaje="Falta configurar la variable de entorno VITE_API_URL. Cree el archivo .env a partir de .env.example y reinicie el servidor de desarrollo." />
      </div>
    );
  }

  if (restaurando) return <PantallaCarga />;
  return autenticado ? (
    <DatosModulosProvider>
      <Escritorio />
    </DatosModulosProvider>
  ) : (
    <PantallaAcceso />
  );
}

function Raiz() {
  const { preferencias } = usePreferencias();

  useEffect(() => {
    document.documentElement.dataset.animaciones = preferencias.animacionesReducidas ? 'reducidas' : 'completas';
  }, [preferencias.animacionesReducidas]);

  return (
    <MotionConfig reducedMotion={preferencias.animacionesReducidas ? 'always' : 'user'}>
      <NotificacionesProvider>
        <SaludProvider>
          <AuthProvider>
            <ContenidoAplicacion />
          </AuthProvider>
        </SaludProvider>
      </NotificacionesProvider>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <PreferenciasProvider>
      <Raiz />
    </PreferenciasProvider>
  );
}
