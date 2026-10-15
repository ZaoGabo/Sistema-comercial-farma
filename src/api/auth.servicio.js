import { cliente } from './cliente.js';

export const authServicio = {
  async obtenerUsuariosDemo() {
    const { data } = await cliente.get('/auth/usuarios-demo');
    return data.usuarios || [];
  },

  async iniciarSesion({ username, password }) {
    const cuerpo = { username, password };
    const { data } = await cliente.post('/auth/login', cuerpo);
    return { token: data.token, usuario: data.usuario, mensaje: data.mensaje };
  },

  async obtenerPerfil() {
    const { data } = await cliente.get('/auth/perfil');
    return data.usuario;
  },

  async verificarSalud() {
    const inicio = performance.now();
    const { data } = await cliente.get('/salud', { timeout: 8000 });
    return { ...data, latenciaMs: Math.round(performance.now() - inicio) };
  },
};
