import { useMemo } from 'react';
import { ENTORNO } from '../../config/entorno.js';
import { aNumero } from '../../utils/formato.js';

/**
 * Importe con tipografía editorial de banca moderna (estilo Stripe / Mercury):
 * enteros con peso rotundo y símbolo de moneda más decimales atenuados en tamaño
 * relativo, de modo que la cifra escala con el contexto que la contiene.
 */
export function ImporteEditorial({ valor, className = '' }) {
  const partes = useMemo(() => {
    const formateador = new Intl.NumberFormat(ENTORNO.locale, {
      style: 'currency',
      currency: ENTORNO.moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const desglose = formateador.formatToParts(aNumero(valor));
    const signo = desglose
      .filter((parte) => parte.type === 'minusSign')
      .map((parte) => parte.value)
      .join('');
    const simbolo = desglose
      .filter((parte) => parte.type === 'currency' || parte.type === 'literal')
      .map((parte) => parte.value)
      .join('')
      .trim();
    const enteros = desglose
      .filter((parte) => parte.type === 'integer' || parte.type === 'group')
      .map((parte) => parte.value)
      .join('');
    const decimales = desglose
      .filter((parte) => parte.type === 'decimal' || parte.type === 'fraction')
      .map((parte) => parte.value)
      .join('');
    return { signo, simbolo, enteros, decimales };
  }, [valor]);

  return (
    <span className={`tabular-nums ${className}`}>
      {partes.signo && <span className="font-semibold text-slate-900">{partes.signo}</span>}
      <span className="mr-0.5 align-baseline text-[0.6em] font-normal text-slate-500">{partes.simbolo}</span>
      <span className="font-bold tracking-tight text-slate-900">{partes.enteros}</span>
      {partes.decimales && (
        <span className="align-baseline text-[0.6em] font-normal tabular-nums text-slate-500">
          {partes.decimales}
        </span>
      )}
    </span>
  );
}

/**
 * Pastilla monoespaciada de precisión contable para identificadores de auditoría:
 * órdenes de compra, asientos, RUC, referencias bancarias y códigos de producto.
 */
export function CodigoAuditoria({ children, className = '' }) {
  return (
    <code
      className={`inline-block max-w-full truncate rounded-md border border-slate-200/80 bg-[#f6f8fa] px-1.5 py-0.5 font-mono text-xs tabular-nums text-slate-700 ${className}`}
    >
      {children}
    </code>
  );
}
