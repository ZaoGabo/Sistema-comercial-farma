import { ESTADOS_CONEXION, useSalud } from '../../context/SaludContext.jsx';

const COLORES_PULSO = {
  [ESTADOS_CONEXION.ACTIVO]: { punto: 'bg-emerald-500', texto: 'Conexión activa con la API y Oracle 21c' },
  [ESTADOS_CONEXION.CONECTANDO]: { punto: 'bg-amber-500', texto: 'Verificando conexión con la API' },
  [ESTADOS_CONEXION.CAIDO]: { punto: 'bg-rose-500', texto: 'Sin conexión con la API' },
};

export function MarcaKore({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1d4ed8" />
      <path
        d="M10 8v16M10 16l9-8M10 16l9 8"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Logotipo Kore corporativo con indicador sobrio de estado de conexion.
 */
export default function LogoKore({ conPulso = true, centrado = false }) {
  const { estado, latenciaMs } = useSalud();
  const visual = COLORES_PULSO[estado] || COLORES_PULSO[ESTADOS_CONEXION.CONECTANDO];

  return (
    <div className={`flex items-center gap-3 ${centrado ? 'justify-center' : ''}`}>
      <div className="relative">
        <MarcaKore />
        {conPulso && (
          <span
            className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center"
            title={`${visual.texto}${latenciaMs ? ` (${latenciaMs} ms)` : ''}`}
          >
            <span className={`relative inline-flex size-2 rounded-full ring-2 ring-white ${visual.punto}`} />
            <span className="sr-only">{visual.texto}</span>
          </span>
        )}
      </div>
      <div className={centrado ? 'text-center' : 'leading-none'}>
        <p className="text-lg font-semibold tracking-tight text-slate-900">Kore</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
          Gestión empresarial
        </p>
      </div>
    </div>
  );
}
