/**
 * Lectura centralizada y validada de las variables de entorno de Vite.
 * Ninguna otra parte de la aplicacion debe acceder directamente a import.meta.env.
 */
const env = import.meta.env;

function numero(valor, respaldo) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) && valor !== undefined && valor !== '' ? convertido : respaldo;
}

function lista(valor) {
  if (!valor) return [];
  return String(valor)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const apiUrl = (env.VITE_API_URL || '').replace(/\/+$/, '');

export const ENTORNO = Object.freeze({
  apiUrl,
  apiConfigurada: apiUrl.length > 0,
  tenantNombre: env.VITE_TENANT_NOMBRE || '',
  tenantPlan: env.VITE_TENANT_PLAN || '',
  locale: env.VITE_LOCALE || 'es-EC',
  moneda: env.VITE_MONEDA || 'USD',
  ivaPorcentaje: numero(env.VITE_IVA_PORCENTAJE, 0),
  iessPersonalPorcentaje: numero(env.VITE_IESS_PERSONAL_PORCENTAJE, 0),
  umbralAltoValor: numero(env.VITE_UMBRAL_ALTO_VALOR, Number.POSITIVE_INFINITY),
  metodosPago: lista(env.VITE_METODOS_PAGO),
  intervaloSaludMs: numero(env.VITE_INTERVALO_SALUD_SEG, 30) * 1000,
});
