/**
 * Canvas-based image processing for delivery photo polish.
 * Subtle dealership-focused enhancements (not heavy social filters).
 */

export interface EnhancementParams {
  brightness: number;
  contrast: number;
  saturation: number;
  /** 0 = neutral; higher values add a warm sepia tint */
  warmth: number;
  /** 1 = none; >1 applies light clarity / local contrast */
  clarity?: number;
}

export type FilterPresetId =
  | "naturalPlus"
  | "showroom"
  | "sunnyDelivery"
  | "crisp"
  | "warm";

export interface FilterPreset {
  id: FilterPresetId;
  label: string;
  params: EnhancementParams;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "naturalPlus",
    label: "Natural+",
    params: {
      brightness: 1.02,
      contrast: 1.03,
      saturation: 1.02,
      warmth: 0,
    },
  },
  {
    id: "showroom",
    label: "Showroom",
    params: {
      brightness: 1.04,
      contrast: 1.08,
      saturation: 1.04,
      warmth: 0,
      clarity: 1.08,
    },
  },
  {
    id: "sunnyDelivery",
    label: "Sunny Delivery",
    params: {
      brightness: 1.05,
      contrast: 1.04,
      saturation: 1.03,
      warmth: 0.05,
    },
  },
  {
    id: "crisp",
    label: "Crisp",
    params: {
      brightness: 1.01,
      contrast: 1.1,
      saturation: 1.02,
      warmth: 0,
      clarity: 1.12,
    },
  },
  {
    id: "warm",
    label: "Warm",
    params: {
      brightness: 1.03,
      contrast: 1.04,
      saturation: 1.04,
      warmth: 0.08,
    },
  },
];

const DEFAULT_PARAMS: EnhancementParams = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  warmth: 0,
  clarity: 1,
};

export function buildCssFilter(params: EnhancementParams): string {
  const parts = [
    `brightness(${params.brightness})`,
    `contrast(${params.contrast})`,
    `saturate(${params.saturation})`,
  ];
  if (params.warmth > 0) {
    parts.push(`sepia(${params.warmth})`);
  }
  return parts.join(" ");
}

export interface ImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Normalized selection 0–1 relative to display container. */
export interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function createCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  return { canvas, ctx };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Draw source image onto canvas (optional CSS filter on draw). */
export function drawImageOnCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  cssFilter = "none"
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.filter = cssFilter;
  ctx.drawImage(img, 0, 0);
  ctx.filter = "none";
  return ctx;
}

/** Light unsharp-style clarity pass; strength scales with clarity above 1. */
export function applyClarityPass(
  ctx: CanvasRenderingContext2D,
  clarity: number
): void {
  if (!clarity || clarity <= 1.001) return;

  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const strength = Math.min(0.28, (clarity - 1) * 0.22);

  const original = ctx.getImageData(0, 0, w, h);
  const { canvas: blurCanvas, ctx: blurCtx } = createCanvas(w, h);
  blurCtx.filter = "blur(0.6px)";
  blurCtx.drawImage(canvas, 0, 0);
  blurCtx.filter = "none";
  const blurred = blurCtx.getImageData(0, 0, w, h);

  const out = original.data;
  const blur = blurred.data;
  for (let i = 0; i < out.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const delta = out[i + c] - blur[i + c];
      out[i + c] = clamp(
        Math.round(out[i + c] + delta * strength),
        0,
        255
      );
    }
  }
  ctx.putImageData(original, 0, 0);
}

/** Apply enhancement params to a loaded image; returns data URL. */
export async function applyEnhancement(
  sourceUrl: string,
  params: EnhancementParams
): Promise<string> {
  const img = await loadImage(sourceUrl);
  const { canvas, ctx } = createCanvas(img.naturalWidth, img.naturalHeight);
  drawImageOnCanvas(canvas, img, buildCssFilter(params));
  if (params.clarity && params.clarity > 1) {
    applyClarityPass(ctx, params.clarity);
  }
  return exportCanvasAsDataUrl(canvas);
}

/** Sample average luminance (0–255) from a downscaled copy. */
export async function analyzeAverageBrightness(
  sourceUrl: string
): Promise<number> {
  const img = await loadImage(sourceUrl);
  const sampleW = Math.min(200, img.naturalWidth);
  const sampleH = Math.min(200, img.naturalHeight);
  const { canvas, ctx } = createCanvas(sampleW, sampleH);
  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
  let sum = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / pixels;
}

/**
 * Compute subtle auto-enhance params from image brightness.
 * Favors professional polish over heavy stylization.
 */
export function computeAutoEnhanceParams(
  avgBrightness: number
): EnhancementParams {
  const target = 118;
  const delta = (target - avgBrightness) / 255;

  let brightness = 1.01 + delta * 0.12;
  let contrast = 1.03;
  let saturation = 1.02;
  let clarity = 1.04;
  let warmth = 0.015;

  if (avgBrightness < 85) {
    brightness += 0.025;
    contrast += 0.015;
    clarity += 0.02;
  } else if (avgBrightness < 105) {
    brightness += 0.012;
    contrast += 0.008;
  } else if (avgBrightness > 175) {
    brightness -= 0.012;
    contrast -= 0.006;
    saturation -= 0.006;
    clarity -= 0.01;
    warmth = 0.008;
  } else if (avgBrightness > 155) {
    brightness -= 0.006;
    saturation -= 0.004;
  }

  return {
    brightness: clamp(brightness, 1.005, 1.055),
    contrast: clamp(contrast, 1.02, 1.07),
    saturation: clamp(saturation, 1.01, 1.035),
    warmth: clamp(warmth, 0, 0.025),
    clarity: clamp(clarity, 1.02, 1.06),
  };
}

/** Auto enhance: brightness-aware, capped adjustments. */
export async function applyAutoEnhance(sourceUrl: string): Promise<string> {
  const avg = await analyzeAverageBrightness(sourceUrl);
  const params = computeAutoEnhanceParams(avg);
  return applyEnhancement(sourceUrl, params);
}

/** Map normalized drag rect on letterboxed image to pixel coordinates. */
export function normalizedRectToImagePixels(
  norm: NormalizedRect,
  imgW: number,
  imgH: number,
  displayW: number,
  displayH: number
): ImageRect {
  const scale = Math.min(displayW / imgW, displayH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const offsetX = (displayW - drawW) / 2;
  const offsetY = (displayH - drawH) / 2;

  const x = ((norm.x * displayW - offsetX) / drawW) * imgW;
  const y = ((norm.y * displayH - offsetY) / drawH) * imgH;
  const width = ((norm.w * displayW) / drawW) * imgW;
  const height = ((norm.h * displayH) / drawH) * imgH;

  return {
    x: Math.max(0, Math.min(imgW - 1, x)),
    y: Math.max(0, Math.min(imgH - 1, y)),
    width: Math.max(8, Math.min(imgW - x, width)),
    height: Math.max(8, Math.min(imgH - y, height)),
  };
}

/** Strong pixelation inside rectangle (license plate blur MVP). */
export function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  rect: ImageRect,
  blockSize = 14
): void {
  const ix = Math.floor(rect.x);
  const iy = Math.floor(rect.y);
  const iw = Math.floor(rect.width);
  const ih = Math.floor(rect.height);
  if (iw < 4 || ih < 4) return;

  const patch = ctx.getImageData(ix, iy, iw, ih);
  const { data, width: pw, height: ph } = patch;

  for (let by = 0; by < ph; by += blockSize) {
    for (let bx = 0; bx < pw; bx += blockSize) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      const bw = Math.min(blockSize, pw - bx);
      const bh = Math.min(blockSize, ph - by);

      for (let dy = 0; dy < bh; dy++) {
        for (let dx = 0; dx < bw; dx++) {
          const i = ((by + dy) * pw + (bx + dx)) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
      }

      r = Math.round(r / n);
      g = Math.round(g / n);
      b = Math.round(b / n);

      for (let dy = 0; dy < bh; dy++) {
        for (let dx = 0; dx < bw; dx++) {
          const i = ((by + dy) * pw + (bx + dx)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }
    }
  }

  ctx.putImageData(patch, ix, iy);
}

/** Load image, draw to canvas, return canvas + context. */
export async function imageToCanvas(
  sourceUrl: string
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; img: HTMLImageElement }> {
  const img = await loadImage(sourceUrl);
  const { canvas, ctx } = createCanvas(img.naturalWidth, img.naturalHeight);
  drawImageOnCanvas(canvas, img);
  return { canvas, ctx, img };
}

/** Plate blur uses larger blocks for stronger pixelation. */
const PLATE_PIXEL_BLOCK = 20;

/** Apply pixel blur to one rectangle on a source image; returns new data URL. */
export async function applyBlurToRegion(
  sourceUrl: string,
  pixelRect: ImageRect,
  blockSize = 14
): Promise<string> {
  const { canvas, ctx } = await imageToCanvas(sourceUrl);
  pixelateRegion(ctx, pixelRect, blockSize);
  return exportCanvasAsDataUrl(canvas);
}

/** Strong pixelation for license plates. */
export async function applyPlateBlurToRegion(
  sourceUrl: string,
  pixelRect: ImageRect
): Promise<string> {
  return applyBlurToRegion(sourceUrl, pixelRect, PLATE_PIXEL_BLOCK);
}

export type CropAspectPreset = "4:3" | "1:1" | "16:9";

function aspectRatioValue(preset: CropAspectPreset): number {
  switch (preset) {
    case "1:1":
      return 1;
    case "16:9":
      return 16 / 9;
    default:
      return 4 / 3;
  }
}

/** Center crop to aspect ratio (dealership-friendly framing). */
export async function applyCenterCrop(
  sourceUrl: string,
  preset: CropAspectPreset
): Promise<string> {
  const img = await loadImage(sourceUrl);
  const target = aspectRatioValue(preset);
  const imgAspect = img.naturalWidth / img.naturalHeight;

  let cropW: number;
  let cropH: number;
  let cropX: number;
  let cropY: number;

  if (imgAspect > target) {
    cropH = img.naturalHeight;
    cropW = Math.round(cropH * target);
    cropX = Math.round((img.naturalWidth - cropW) / 2);
    cropY = 0;
  } else {
    cropW = img.naturalWidth;
    cropH = Math.round(cropW / target);
    cropX = 0;
    cropY = Math.round((img.naturalHeight - cropH) / 2);
  }

  const { canvas, ctx } = createCanvas(cropW, cropH);
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return exportCanvasAsDataUrl(canvas);
}

/** Apply enhancement preset to full image. */
export async function applyFilter(
  sourceUrl: string,
  presetId: FilterPresetId
): Promise<string> {
  const preset =
    FILTER_PRESETS.find((f) => f.id === presetId) ?? FILTER_PRESETS[0];
  return applyEnhancement(sourceUrl, preset.params);
}

/** Blur region from source URL using normalized selection on display. */
export async function applyBlurFromNormalizedRect(
  sourceUrl: string,
  norm: NormalizedRect,
  imgW: number,
  imgH: number,
  displayW: number,
  displayH: number,
  forPlate = false
): Promise<string> {
  const rect = normalizedRectToImagePixels(norm, imgW, imgH, displayW, displayH);
  return forPlate
    ? applyPlateBlurToRegion(sourceUrl, rect)
    : applyBlurToRegion(sourceUrl, rect);
}

export function exportCanvasAsDataUrl(
  canvas: HTMLCanvasElement,
  mime: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.9
): string {
  return canvas.toDataURL(mime, quality);
}

export function exportCanvasAsBlob(
  canvas: HTMLCanvasElement,
  mime: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Blob export failed"))),
      mime,
      quality
    );
  });
}

/** Full pipeline: load → optional enhancement → optional blur rects → export. */
export async function processImage(options: {
  sourceUrl: string;
  filterId?: FilterPresetId;
  blurRects?: ImageRect[];
}): Promise<{ dataUrl: string; blob: Blob }> {
  const preset = options.filterId
    ? FILTER_PRESETS.find((f) => f.id === options.filterId)
    : null;
  const params = preset?.params ?? DEFAULT_PARAMS;

  const img = await loadImage(options.sourceUrl);
  const { canvas, ctx } = createCanvas(img.naturalWidth, img.naturalHeight);
  drawImageOnCanvas(canvas, img, buildCssFilter(params));
  if (params.clarity && params.clarity > 1) {
    applyClarityPass(ctx, params.clarity);
  }

  for (const rect of options.blurRects ?? []) {
    pixelateRegion(ctx, rect);
  }

  const dataUrl = exportCanvasAsDataUrl(canvas);
  const blob = await exportCanvasAsBlob(canvas);
  return { dataUrl, blob };
}
