import { http } from './http';

/**
 * Verificación del email de un acudiente por código (OTP), antes de firmar.
 * El código lo genera y valida el backend; aquí solo se dispara y se confirma.
 */
export const verificacionService = {
  async enviar(email: string): Promise<void> {
    await http.post('/verificacion/enviar', { email });
  },

  async confirmar(email: string, codigo: string): Promise<void> {
    await http.post('/verificacion/confirmar', { email, codigo });
  },
};
