// API and options: references/assets.md. Needs a DOM and three r152+.
import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';

export type Paint = string | readonly [top: string, bottom: string];

export interface LabelOptions {
  fontFamily?: string;
  fontWeight?: number | string;
  fontPx?: number;
  ink?: Paint;
  pill?: Paint | null;
  padX?: number;
  padY?: number;
  tracking?: number;
  box?: 'line' | 'ink';
  sizeText?: string;
  minAspect?: number;
  anisotropy?: number;
  maxTexturePx?: number;
  onResize?: (aspect: number) => void;
}

export interface LabelTexture {
  readonly texture: CanvasTexture;
  readonly canvas: HTMLCanvasElement;
  readonly aspect: number;
  readonly padFracX: number;
  repaint(text?: string): void;
  readonly ready: Promise<void>;
}

export const fontString = (weight: number | string, px: number, family: string): string =>
  `${weight} ${px}px ${family}`;

export async function loadFonts(specs: readonly string[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(specs.map(s => document.fonts.load(s)));
  await document.fonts.ready;
}

const fillFor = (ctx: CanvasRenderingContext2D, paint: Paint, h: number): string | CanvasGradient => {
  if (typeof paint === 'string') return paint;
  const g = ctx.createLinearGradient(0, 0, 0, h); // canvas top maps to plane top
  g.addColorStop(0, paint[0]);
  g.addColorStop(1, paint[1]);
  return g;
};

export function makeLabelTexture(text: string, opts: LabelOptions = {}): LabelTexture {
  const family = opts.fontFamily ?? 'system-ui, sans-serif';
  const weight = opts.fontWeight ?? 700;
  const pill = opts.pill ?? null;
  const ink = opts.ink ?? '#ffffff';
  const box = opts.box ?? 'line';
  const maxPx = opts.maxTexturePx ?? 4096;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let current = text;
  let px = opts.fontPx ?? 300;
  let padX = 0;
  let padY = 0;
  let asc = 0;
  let aspect = 1;
  let padFracX = 0;

  const setFont = () => {
    ctx.font = fontString(weight, px, family);
    ctx.letterSpacing = `${(opts.tracking ?? 0) * px}px`;
  };

  const layout = (): boolean => {
    const basePx = opts.fontPx ?? 300;
    px = basePx;
    for (let pass = 0; ; pass++) {
      setFont();
      const m = ctx.measureText(opts.sizeText ?? current);
      const k = px / basePx;
      padX = (opts.padX ?? basePx * (pill ? 0.42 : 0.14)) * k;
      padY = (opts.padY ?? basePx * (pill ? 0.33 : 0.12)) * k;
      asc = box === 'ink' ? m.actualBoundingBoxAscent : 0;
      const contentH = box === 'ink' ? m.actualBoundingBoxAscent + m.actualBoundingBoxDescent : px;
      const h = Math.ceil(contentH + padY * 2);
      let w = Math.ceil(m.width + padX * 2);
      if (pill) w = Math.max(w, Math.ceil(h * (opts.minAspect ?? 1)));
      const scale = maxPx / Math.max(w, h);
      if (scale < 1 && pass < 4 && px > 1) {
        px = Math.max(1, Math.min(px - 1, Math.floor(px * scale)));
        continue;
      }
      const changed = w !== canvas.width || h !== canvas.height;
      if (changed) {
        canvas.width = w;
        canvas.height = h;
      }
      aspect = w / h;
      padFracX = padX / w;
      return changed;
    }
  };

  const paint = () => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (pill) {
      ctx.fillStyle = fillFor(ctx, pill, h);
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, h / 2);
      ctx.fill();
    }
    setFont(); // resizing the canvas resets context state
    ctx.fillStyle = fillFor(ctx, ink, h);
    ctx.textAlign = 'center';
    if (box === 'ink') {
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(current, w / 2, padY + asc);
    } else {
      ctx.textBaseline = 'middle';
      ctx.fillText(current, w / 2, h / 2 + px * 0.04);
    }
  };

  layout();
  paint();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = opts.anisotropy ?? 8;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  const repaint = (next?: string) => {
    if (next !== undefined) current = next;
    paint();
    texture.needsUpdate = true;
  };

  const fontsLoaded: Promise<unknown> = document.fonts
    ? document.fonts.load(fontString(weight, px, family), opts.sizeText ?? text).then(() => document.fonts.ready)
    : Promise.resolve();
  const ready = fontsLoaded
    .catch((): void => undefined)
    .then(() => {
      if (layout()) {
        texture.dispose(); // GPU storage is immutable; dispose so the next upload uses the new size
        opts.onResize?.(aspect);
      }
      repaint();
    });

  return {
    texture,
    canvas,
    get aspect() {
      return aspect;
    },
    get padFracX() {
      return padFracX;
    },
    repaint,
    ready,
  };
}

export interface LabelPlaneOptions extends LabelOptions {
  layering?: 'sticker' | 'depth';
  align?: 'left' | 'center' | 'right';
  opacity?: number;
}

export interface LabelPlane {
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  material: MeshBasicMaterial;
  label: LabelTexture;
}

export function makeLabelPlane(text: string, worldHeight: number, opts: LabelPlaneOptions = {}): LabelPlane {
  const sticker = (opts.layering ?? 'sticker') === 'sticker';
  const material = new MeshBasicMaterial({
    transparent: true,
    opacity: opts.opacity ?? 1,
    depthTest: !sticker,
    depthWrite: !sticker,
    side: DoubleSide,
  });
  const mesh = new Mesh(new PlaneGeometry(1, 1), material);

  const build = (aspect: number, padFracX: number) => {
    const w = worldHeight * aspect;
    const geo = new PlaneGeometry(w, worldHeight);
    if (opts.align === 'left') geo.translate(w / 2 - w * padFracX, 0, 0);
    if (opts.align === 'right') geo.translate(-w / 2 + w * padFracX, 0, 0);
    mesh.geometry.dispose();
    mesh.geometry = geo;
  };

  const label = makeLabelTexture(text, {
    ...opts,
    onResize: aspect => {
      build(aspect, label.padFracX);
      opts.onResize?.(aspect);
    },
  });
  material.map = label.texture;
  material.needsUpdate = true;
  build(label.aspect, label.padFracX);
  return {mesh, material, label};
}
