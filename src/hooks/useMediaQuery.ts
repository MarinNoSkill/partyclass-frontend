import { useEffect, useState } from 'react';

/** Suscribe un componente a una media query CSS. */
export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(consulta).matches,
  );

  useEffect(() => {
    const lista = window.matchMedia(consulta);
    const alCambiar = (evento: MediaQueryListEvent) => setCoincide(evento.matches);

    setCoincide(lista.matches);
    lista.addEventListener('change', alCambiar);

    return () => lista.removeEventListener('change', alCambiar);
  }, [consulta]);

  return coincide;
}

/** Breakpoint `lg` de Tailwind: a partir de aquí el sidebar es fijo. */
export const useEsEscritorio = (): boolean => useMediaQuery('(min-width: 1024px)');
