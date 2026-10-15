import { Ban, CheckCheck, Lock, Pencil, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { obtenerModulo } from '../../config/modulos.js';
import {
  ACCIONES,
  MENSAJE_SOLO_BORRADOR,
  POLITICAS_BLOQUEO,
  esModuloPropio,
  esSuperusuario,
  mensajeModuloAjeno,
  tienePermiso,
} from '../../utils/rbac.js';
import { esPendiente, puedeAnularse, puedeAprobarse } from '../../utils/estados.js';
import BotonMagnetico from './BotonMagnetico.jsx';

const MOTIVO_ESTADO = {
  [ACCIONES.APROBAR]: 'La transacción ya no admite aprobación en su estado actual.',
  [ACCIONES.ANULAR]: 'La transacción ya se encuentra anulada.',
  [ACCIONES.MODIFICAR]: MENSAJE_SOLO_BORRADOR,
};

/**
 * Botonera contextual condicionada por la matriz RBAC de la pizarra y la segregación
 * departamental. Los permisos efectivos provienen de la API (usuario.permisos):
 *   Jefe      -> Ver, Aprobar, Anular   (Crear bloqueado)
 *   Auxiliar  -> Crear, Ver, Aprobar    (Anular bloqueado)
 *   Operativo -> Crear, Ver             (Aprobar y Anular bloqueados)
 *
 * Cuando se informa claveModulo y el departamento del usuario no coincide, las acciones
 * mutacionales (Crear, Aprobar, Anular) se inhabilitan preventivamente antes de que la
 * Capa 2 responda HTTP 403 (ERROR_RBAC_MODULO_NO_AUTORIZADO).
 *
 * Armonía cromática: Aprobar es la acción primaria (azul corporativo) y Anular una
 * acción destructiva secundaria atenuada, sin verdes y rojos saturados compitiendo.
 */
export default function BotoneraRBAC({
  acciones = [ACCIONES.APROBAR, ACCIONES.ANULAR],
  etiquetas,
  estado,
  enProceso = null,
  onCrear,
  onAprobar,
  onAnular,
  onModificar,
  mostrarPoliticas = true,
  alinearDerecha = false,
  claveModulo = null,
}) {
  const { permisos, usuario } = useAuth();
  const esDba = esSuperusuario(usuario);
  const nombreModulo = claveModulo ? obtenerModulo(claveModulo)?.nombre || claveModulo : null;
  const ajenoAlDepartamento = esDba ? false : (claveModulo ? !esModuloPropio(usuario?.modulo, claveModulo) : false);
  const mensajeDepartamento = ajenoAlDepartamento ? mensajeModuloAjeno(nombreModulo) : null;

  const definiciones = {
    [ACCIONES.CREAR]: {
      variante: 'primario',
      icono: Plus,
      etiqueta: etiquetas.crear,
      accion: onCrear,
      estadoValido: true,
    },
    [ACCIONES.APROBAR]: {
      variante: 'primario',
      icono: CheckCheck,
      etiqueta: etiquetas.aprobar,
      accion: onAprobar,
      estadoValido: puedeAprobarse(estado),
    },
    [ACCIONES.ANULAR]: {
      variante: 'destructivo',
      icono: Ban,
      etiqueta: etiquetas.anular,
      accion: onAnular,
      estadoValido: puedeAnularse(estado),
    },
    [ACCIONES.MODIFICAR]: {
      variante: 'secundario',
      icono: Pencil,
      etiqueta: etiquetas.modificar || 'Modificar',
      accion: onModificar,
      estadoValido: estado === undefined ? true : esPendiente(estado),
    },
  };

  const politicasActivas = [];

  const botones = acciones.map((clave) => {
    const definicion = definiciones[clave];
    const permitido = esDba ? true : tienePermiso(permisos, clave);
    const bloqueadoPorDepartamento = ajenoAlDepartamento;
    const bloqueadoPorPolitica = !bloqueadoPorDepartamento && !permitido;
    const bloqueadoPorEstado = !bloqueadoPorDepartamento && permitido && !definicion.estadoValido;

    if (bloqueadoPorDepartamento) {
      politicasActivas.push({ clave, texto: mensajeDepartamento });
    } else if (bloqueadoPorPolitica) {
      politicasActivas.push({ clave, texto: POLITICAS_BLOQUEO[clave] });
    }

    const titulo = bloqueadoPorDepartamento
      ? mensajeDepartamento
      : bloqueadoPorPolitica
        ? POLITICAS_BLOQUEO[clave]
        : bloqueadoPorEstado
          ? MOTIVO_ESTADO[clave]
          : definicion.etiqueta;

    return (
      <BotonMagnetico
        key={clave}
        variante={definicion.variante}
        icono={bloqueadoPorDepartamento || bloqueadoPorPolitica ? Lock : definicion.icono}
        bloqueado={bloqueadoPorDepartamento || bloqueadoPorPolitica || bloqueadoPorEstado}
        cargando={enProceso === clave}
        onClick={definicion.accion}
        title={titulo}
        aria-label={
          bloqueadoPorDepartamento || bloqueadoPorPolitica
            ? `${definicion.etiqueta}. ${titulo}`
            : undefined
        }
      >
        {definicion.etiqueta}
      </BotonMagnetico>
    );
  });

  // Las políticas con idéntico texto se consolidan en una única indicación
  // institucional (p. ej. bloqueo departamental de varias acciones a la vez).
  const politicasUnicas = politicasActivas.filter(
    (politica, indice, lista) => lista.findIndex((otra) => otra.texto === politica.texto) === indice,
  );

  return (
    <div className={`space-y-2.5 ${alinearDerecha ? 'sm:text-right' : ''}`}>
      <div className={`flex flex-wrap items-center gap-2.5 ${alinearDerecha ? 'sm:justify-end' : ''}`}>
        {botones}
      </div>
      {mostrarPoliticas && politicasUnicas.length > 0 && (
        <ul className="space-y-1" aria-label="Políticas institucionales aplicadas">
          {politicasUnicas.map((politica) => (
            <li
              key={politica.clave}
              className={`flex items-center gap-1.5 text-[11px] leading-snug text-slate-500 ${
                alinearDerecha ? 'sm:justify-end' : ''
              }`}
            >
              <Lock className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
              {politica.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
