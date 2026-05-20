/** Zoom/pan helpers for in-browser photo polish (center-origin transform). */

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.12;

export interface PanOffset {
  x: number;
  y: number;
}

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

/** Map screen point on container → normalized 0–1 (inverse of translate + scale). */
export function screenToNormalized(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  pan: PanOffset,
  zoom: number
): { x: number; y: number } {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const ox = rect.width / 2;
  const oy = rect.height / 2;
  const dx = (x - ox - pan.x) / zoom + ox;
  const dy = (y - oy - pan.y) / zoom + oy;
  return {
    x: dx / rect.width,
    y: dy / rect.height,
  };
}

/** Zoom toward cursor; keeps the point under (mx, my) stable. */
export function zoomTowardPoint(
  mx: number,
  my: number,
  displayW: number,
  displayH: number,
  pan: PanOffset,
  oldZoom: number,
  newZoom: number
): PanOffset {
  if (newZoom <= 1) return { x: 0, y: 0 };
  const ox = displayW / 2;
  const oy = displayH / 2;
  const lx = (mx - ox - pan.x) / oldZoom;
  const ly = (my - oy - pan.y) / oldZoom;
  return {
    x: mx - ox - newZoom * lx,
    y: my - oy - newZoom * ly,
  };
}
