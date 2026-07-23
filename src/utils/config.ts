/**
 * Lectura y validación de las variables de entorno del cliente.
 *
 * IMPORTANTE: este módulo NO lanza excepciones. Si lanzara al importarse, el
 * fallo ocurriría antes de que React monte y el usuario vería una página en
 * blanco sin ninguna pista. En su lugar acumula los problemas en
 * `erroresConfig` y App.tsx muestra una pantalla explicativa.
 */

const erroresAcumulados: string[] = [];

function leer(clave: keyof ImportMetaEnv, ejemplo: string): string {
  const valor = import.meta.env[clave];

  if (!valor || valor.trim() === '') {
    erroresAcumulados.push(`Falta ${clave} (ejemplo: ${ejemplo})`);
    return '';
  }

  if (valor.startsWith('cambia-esta-clave')) {
    erroresAcumulados.push(`${clave} sigue con el valor de ejemplo. Ponle un valor real.`);
    return valor;
  }

  return valor.trim();
}

const apiUrl = leer('VITE_API_URL', 'http://localhost:4000/api/v1').replace(/\/+$/, '');
const apiKey = leer('VITE_API_KEY', 'una clave aleatoria de 64 caracteres');

export const config = {
  apiUrl,
  apiKey,
  appName: import.meta.env.VITE_APP_NAME || 'PartyClass',
} as const;

/** Vacío cuando la configuración es correcta. */
export const erroresConfig: readonly string[] = erroresAcumulados;

/** Límites de archivo. Deben coincidir con los del backend. */
export const LIMITES = {
  DOCUMENTO_BYTES: 10 * 1024 * 1024,
  FIRMA_BYTES: 2 * 1024 * 1024,
  MIME_PERMITIDOS: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const,
  EXTENSIONES_VISIBLES: '.pdf,.jpg,.jpeg,.png,.webp',
} as const;
