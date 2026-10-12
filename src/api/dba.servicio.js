import { cliente } from './cliente.js';

export const dbaServicio = {
  async ejecutarSql(sql) {
    const { data } = await cliente.post('/dba/ejecutar-sql', { sql });
    return data;
  },
};
