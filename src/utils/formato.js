import { ENTORNO } from '../config/entorno.js';

const formateadorMoneda = new Intl.NumberFormat(ENTORNO.locale, {
  style: 'currency',
  currency: ENTORNO.moneda,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formateadorEntero = new Intl.NumberFormat(ENTORNO.locale, { maximumFractionDigits: 0 });
const formateadorDecimal = new Intl.NumberFormat(ENTORNO.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function aNumero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export function formatearMoneda(valor) {
  return formateadorMoneda.format(aNumero(valor));
}

export function formatearEntero(valor) {
  return formateadorEntero.format(aNumero(valor));
}

export function formatearDecimal(valor) {
  return formateadorDecimal.format(aNumero(valor));
}

/**
 * Convierte cadenas del backend ("YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS") en Date local.
 */
export function aFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const texto = String(valor).trim();
  const coincidencia = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (coincidencia) {
    const [, anio, mes, dia, hora = '0', minuto = '0', segundo = '0'] = coincidencia;
    return new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(minuto),
      Number(segundo),
    );
  }
  const generica = new Date(texto);
  return Number.isNaN(generica.getTime()) ? null : generica;
}

export function formatearFecha(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return new Intl.DateTimeFormat(ENTORNO.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fecha);
}

export function formatearFechaHora(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return new Intl.DateTimeFormat(ENTORNO.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function nombreMes(numeroMes) {
  const fecha = new Date(2000, aNumero(numeroMes) - 1, 1);
  const nombre = new Intl.DateTimeFormat(ENTORNO.locale, { month: 'long' }).format(fecha);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export function iniciales(nombre) {
  if (!nombre) return '';
  return String(nombre)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export function capitalizar(texto) {
  if (!texto) return '';
  const limpio = String(texto).replace(/_/g, ' ').toLowerCase();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export function fechaHoyIso() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export function redondear(valor, decimales = 2) {
  const factor = 10 ** decimales;
  return Math.round((aNumero(valor) + Number.EPSILON) * factor) / factor;
}
