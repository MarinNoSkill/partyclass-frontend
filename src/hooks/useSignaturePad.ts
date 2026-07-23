import { useCallback, useEffect, useRef, useState } from 'react';

interface Punto {
  x: number;
  y: number;
}

interface OpcionesSignaturePad {
  grosorLinea?: number;
  color?: string;
  /** Margen en píxeles que se deja alrededor del trazo al recortar. */
  margenRecorte?: number;
}

interface ResultadoSignaturePad {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  contenedorRef: React.RefObject<HTMLDivElement | null>;
  estaVacio: boolean;
  limpiar: () => void;
  exportarPng: () => string | null;
  manejadores: {
    onPointerDown: (evento: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (evento: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: (evento: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerLeave: (evento: React.PointerEvent<HTMLCanvasElement>) => void;
  };
}

/**
 * Lógica de captura de firma sobre <canvas>.
 *
 * Decisiones clave:
 * - Pointer Events: un solo camino para ratón, dedo y lápiz.
 * - devicePixelRatio: el bitmap se dibuja a resolución real, así la firma no
 *   sale pixelada al ampliarla dentro del PDF.
 * - Recorte automático: se exporta solo el área realmente firmada. Sin esto,
 *   el PDF recibe un PNG con mucho vacío y la firma se ve diminuta.
 */
export function useSignaturePad(opciones: OpcionesSignaturePad = {}): ResultadoSignaturePad {
  const { grosorLinea = 2.4, color = '#0f172a', margenRecorte = 8 } = opciones;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const dibujando = useRef(false);
  const ultimoPunto = useRef<Punto | null>(null);
  const hayTrazo = useRef(false);

  const [estaVacio, setEstaVacio] = useState(true);

  const configurarContexto = useCallback(
    (ctx: CanvasRenderingContext2D, ratio: number) => {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = grosorLinea;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
    },
    [grosorLinea, color],
  );

  /** Ajusta el bitmap al tamaño CSS del contenedor. Preserva el trazo actual. */
  const redimensionar = useCallback(() => {
    const canvas = canvasRef.current;
    const contenedor = contenedorRef.current;
    if (!canvas || !contenedor) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const { width, height } = contenedor.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const anchoDeseado = Math.round(width * ratio);
    const altoDeseado = Math.round(height * ratio);
    if (canvas.width === anchoDeseado && canvas.height === altoDeseado) return;

    // Se conserva lo dibujado antes de cambiar el tamaño del bitmap.
    const respaldo = hayTrazo.current ? canvas.toDataURL('image/png') : null;

    canvas.width = anchoDeseado;
    canvas.height = altoDeseado;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    configurarContexto(ctx, ratio);

    if (respaldo) {
      const imagen = new Image();
      imagen.onload = () => ctx.drawImage(imagen, 0, 0, width, height);
      imagen.src = respaldo;
    }
  }, [configurarContexto]);

  useEffect(() => {
    redimensionar();

    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    const observador = new ResizeObserver(() => redimensionar());
    observador.observe(contenedor);

    return () => observador.disconnect();
  }, [redimensionar]);

  const puntoDesdeEvento = (evento: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const rect = evento.currentTarget.getBoundingClientRect();
    return { x: evento.clientX - rect.left, y: evento.clientY - rect.top };
  };

  const onPointerDown = useCallback((evento: React.PointerEvent<HTMLCanvasElement>) => {
    evento.preventDefault();
    evento.currentTarget.setPointerCapture(evento.pointerId);

    dibujando.current = true;
    ultimoPunto.current = puntoDesdeEvento(evento);
  }, []);

  const onPointerMove = useCallback((evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    evento.preventDefault();

    const ctx = canvasRef.current?.getContext('2d');
    const anterior = ultimoPunto.current;
    if (!ctx || !anterior) return;

    const actual = puntoDesdeEvento(evento);

    ctx.beginPath();
    ctx.moveTo(anterior.x, anterior.y);
    ctx.lineTo(actual.x, actual.y);
    ctx.stroke();

    ultimoPunto.current = actual;

    if (!hayTrazo.current) {
      hayTrazo.current = true;
      setEstaVacio(false);
    }
  }, []);

  const terminarTrazo = useCallback((evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;

    // Un toque sin desplazamiento debe dejar marca (punto sobre la i, tilde).
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && !hayTrazo.current && ultimoPunto.current) {
      const { x, y } = ultimoPunto.current;
      ctx.beginPath();
      ctx.arc(x, y, grosorLinea / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.fill();
      hayTrazo.current = true;
      setEstaVacio(false);
    }

    dibujando.current = false;
    ultimoPunto.current = null;

    if (evento.currentTarget.hasPointerCapture(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    }
  }, [grosorLinea]);

  const limpiar = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    hayTrazo.current = false;
    ultimoPunto.current = null;
    setEstaVacio(true);
  }, []);

  /**
   * Exporta la firma recortada a su contenido real, como data URL PNG
   * con fondo transparente.
   */
  const exportarPng = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !hayTrazo.current) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { width, height } = canvas;
    const datos = ctx.getImageData(0, 0, width, height).data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alfa = datos[(y * width + x) * 4 + 3];
        if (alfa === undefined || alfa < 12) continue;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < 0 || maxY < 0) return null;

    minX = Math.max(0, minX - margenRecorte);
    minY = Math.max(0, minY - margenRecorte);
    maxX = Math.min(width - 1, maxX + margenRecorte);
    maxY = Math.min(height - 1, maxY + margenRecorte);

    const anchoRecorte = maxX - minX + 1;
    const altoRecorte = maxY - minY + 1;

    const recorte = document.createElement('canvas');
    recorte.width = anchoRecorte;
    recorte.height = altoRecorte;

    const ctxRecorte = recorte.getContext('2d');
    if (!ctxRecorte) return null;

    ctxRecorte.drawImage(
      canvas,
      minX,
      minY,
      anchoRecorte,
      altoRecorte,
      0,
      0,
      anchoRecorte,
      altoRecorte,
    );

    return recorte.toDataURL('image/png');
  }, [margenRecorte]);

  return {
    canvasRef,
    contenedorRef,
    estaVacio,
    limpiar,
    exportarPng,
    manejadores: {
      onPointerDown,
      onPointerMove,
      onPointerUp: terminarTrazo,
      onPointerLeave: terminarTrazo,
    },
  };
}
