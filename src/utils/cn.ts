type ValorClase = string | number | null | undefined | false | Record<string, boolean>;

/**
 * Concatena clases condicionalmente.
 * Deliberadamente minimalista: no resolvemos conflictos de Tailwind porque
 * el sistema de componentes ya controla qué clases se combinan.
 */
export function cn(...valores: ValorClase[]): string {
  const clases: string[] = [];

  for (const valor of valores) {
    if (!valor) continue;

    if (typeof valor === 'string' || typeof valor === 'number') {
      clases.push(String(valor));
      continue;
    }

    for (const [clase, activa] of Object.entries(valor)) {
      if (activa) clases.push(clase);
    }
  }

  return clases.join(' ');
}
