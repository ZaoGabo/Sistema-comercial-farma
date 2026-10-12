/**
 * Compatibilidad: el borde de luz cinetico queda desactivado en el tema claro.
 * Un registro critico recibe un anillo sutil ambar o rose sin animacion.
 */
const ANILLOS = {
  ambar: 'ring-1 ring-amber-500/30',
  carmesi: 'ring-1 ring-rose-500/30',
  esmeralda: 'ring-1 ring-emerald-500/30',
  cian: 'ring-1 ring-blue-600/20',
};

export default function BordeLuz({ activo = true, color = 'cian', className = '', children, ...resto }) {
  const anillo = activo ? ANILLOS[color] || '' : '';
  return (
    <div className={`${anillo} ${className}`} {...resto}>
      {children}
    </div>
  );
}
