import { useEffect, useMemo, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { ENTORNO } from '../../config/entorno.js';
import { aNumero } from '../../utils/formato.js';

const TEMPORIZACION_RODILLO = { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };

/**
 * Contador numerico tipo tambor mecanico (Rolling Ticker). Al montarse parte de cero y rueda
 * verticalmente hasta el valor real; en cada actualizacion posterior solo rueda lo que cambia.
 */
export default function NumeroAnimado({
  valor,
  moneda = false,
  decimales = 0,
  prefijo,
  sufijo,
  className = '',
}) {
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMostrado(aNumero(valor)));
    return () => cancelAnimationFrame(id);
  }, [valor]);

  const formato = useMemo(
    () =>
      moneda
        ? {
            style: 'currency',
            currency: ENTORNO.moneda,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        : { minimumFractionDigits: decimales, maximumFractionDigits: decimales },
    [moneda, decimales],
  );

  return (
    <NumberFlow
      value={mostrado}
      locales={ENTORNO.locale}
      format={formato}
      prefix={prefijo}
      suffix={sufijo}
      transformTiming={TEMPORIZACION_RODILLO}
      spinTiming={TEMPORIZACION_RODILLO}
      className={`tabular-nums ${className}`}
    />
  );
}
