/**
 * Compatibilidad: la inclinacion 3D y el spotlight quedan desactivados en el tema claro.
 * El componente conserva su API y renderiza un contenedor neutro.
 */
export default function TarjetaTilt({ children, className = '', ...resto }) {
  return (
    <div className={`h-full ${className}`} {...resto}>
      {children}
    </div>
  );
}
