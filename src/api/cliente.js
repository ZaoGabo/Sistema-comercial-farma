import axios from 'axios';
import { ENTORNO } from '../config/entorno.js';

const CLAVE_TOKEN = 'kore.token';
export const EVENTO_SESION_EXPIRADA = 'kore:sesion-expirada';

export const almacenToken = {
  leer() {
    try {
      return sessionStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(token) {
    try {
      sessionStorage.setItem(CLAVE_TOKEN, token);
    } catch {
      /* El almacenamiento de sesion no esta disponible; la sesion vive solo en memoria. */
    }
  },
  borrar() {
    try {
      sessionStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* Sin accion */
    }
  },
};

/**
 * Error normalizado de la capa HTTP. Expone siempre textos en espanol aptos para la interfaz.
 */
export class ErrorApi extends Error {
  constructor({ mensaje, codigo = 'ERROR_DESCONOCIDO', estado = 0, detalles = null }) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
    this.estado = estado;
    this.detalles = detalles;
  }

  get esAccesoDenegado() {
    return this.estado === 403;
  }

  get esErrorDeRed() {
    return this.estado === 0;
  }
}

function normalizarError(error) {
  if (error instanceof ErrorApi) return error;

  if (error.response) {
    const { status, data } = error.response;
    return new ErrorApi({
      mensaje: data?.mensaje || `La API respondió con el estado HTTP ${status}.`,
      codigo: data?.codigo || `HTTP_${status}`,
      estado: status,
      detalles: data?.detalles ?? null,
    });
  }

  if (error.code === 'ECONNABORTED') {
    return new ErrorApi({
      mensaje: 'La solicitud superó el tiempo de espera. Verifique la carga del servidor.',
      codigo: 'ERROR_TIEMPO_AGOTADO',
    });
  }

  return new ErrorApi({
    mensaje:
      'No fue posible comunicarse con la API REST (Capa 2). Verifique la red local y que el servicio esté activo.',
    codigo: 'ERROR_RED',
  });
}

export const cliente = axios.create({
  baseURL: ENTORNO.apiUrl,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

cliente.interceptors.request.use((configuracion) => {
  const token = almacenToken.leer();
  if (token) {
    configuracion.headers.Authorization = `Bearer ${token}`;
  }
  return configuracion;
});

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const normalizado = normalizarError(error);
    const esLogin = error.config?.url?.includes('/auth/login');

    if (normalizado.estado === 401 && !esLogin && almacenToken.leer()) {
      almacenToken.borrar();
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA, { detail: normalizado }));
    }

    return Promise.reject(normalizado);
  },
);
