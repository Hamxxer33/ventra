import { type Countdown, pad2 } from "./countdown";
import { WL_HOST } from "./drop";
import { drawPixelText } from "./pixel-font";

export const CARD_W = 1080;
export const CARD_H = 1350;

const C = {
  bg: "#061433",
  surface: "#0b1c48",
  plate: "#10245c",
  fg: "#ffffff",
  muted: "#b8c6e6",
  accent: "#2b6bff",
  dim: "#1639c4",
  border: "#1a3a7a",
};

export type CardRenderState = {
  ticket: string;
  handle: string;
  face: CanvasImageSource;
  countdown: Countdown;
};

function fillRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function strokePixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  t: number,
) {
  fillRect(ctx, x, y, w, t, color);
  fillRect(ctx, x, y + h - t, w, t, color);
  fillRect(ctx, x, y, t, h, color);
  fillRect(ctx, x + w - t, y, t, h, color);
}

export function renderCard(ctx: CanvasRenderingContext2D, state: CardRenderState): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = w / CARD_W;

  ctx.imageSmoothingEnabled = false;
  fillRect(ctx, 0, 0, w, h, C.bg);

  const outer = Math.max(4, Math.round(12 * s));
  strokePixel(ctx, 0, 0, w, h, C.accent, outer);
  strokePixel(ctx, outer, outer, w - outer * 2, h - outer * 2, C.dim, Math.max(2, Math.round(4 * s)));

  const pad = Math.round(48 * s);
  drawPixelText(ctx, "VENTRA", pad, Math.round(40 * s), Math.max(3, Math.round(6 * s)), C.accent, "left");
  drawPixelText(
    ctx,
    "10K MINT",
    w - pad,
    Math.round(48 * s),
    Math.max(2, Math.round(3 * s)),
    C.muted,
    "right",
  );
  drawPixelText(
    ctx,
    "WHITELIST CARD",
    pad,
    Math.round(100 * s),
    Math.max(2, Math.round(3 * s)),
    C.muted,
    "left",
  );

  const faceSize = Math.round(720 * s);
  const faceX = Math.round((w - faceSize) / 2);
  const faceY = Math.round(148 * s);
  fillRect(ctx, faceX - 8, faceY - 8, faceSize + 16, faceSize + 16, C.dim);
  strokePixel(ctx, faceX - 8, faceY - 8, faceSize + 16, faceSize + 16, C.accent, Math.max(3, Math.round(6 * s)));
  fillRect(ctx, faceX, faceY, faceSize, faceSize, C.plate);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(state.face, faceX, faceY, faceSize, faceSize);

  const ticketLabel = `TICKET`;
  const ticketValue = `#${state.ticket}`;
  const afterFace = faceY + faceSize + Math.round(36 * s);
  drawPixelText(ctx, ticketLabel, w / 2, afterFace, Math.max(2, Math.round(3 * s)), C.muted, "center");
  const ticketScale = Math.max(4, Math.round(8 * s));
  drawPixelText(ctx, ticketValue, w / 2, afterFace + Math.round(28 * s), ticketScale, C.accent, "center");

  const cdY = afterFace + Math.round(110 * s);
  drawPixelText(ctx, "MINT IN", w / 2, cdY, Math.max(2, Math.round(3 * s)), C.muted, "center");

  if (state.countdown.done) {
    drawPixelText(
      ctx,
      "LIVE",
      w / 2,
      cdY + Math.round(36 * s),
      Math.max(4, Math.round(7 * s)),
      C.accent,
      "center",
    );
  } else {
    const units: Array<{ v: string; l: string }> = [
      { v: pad2(state.countdown.days), l: "DD" },
      { v: pad2(state.countdown.hours), l: "HH" },
      { v: pad2(state.countdown.minutes), l: "MM" },
      { v: pad2(state.countdown.seconds), l: "SS" },
    ];
    const boxW = Math.round(180 * s);
    const boxH = Math.round(88 * s);
    const gap = Math.round(16 * s);
    const total = units.length * boxW + (units.length - 1) * gap;
    let bx = Math.round((w - total) / 2);
    const by = cdY + Math.round(28 * s);
    const numScale = Math.max(3, Math.round(5 * s));
    const labScale = Math.max(2, Math.round(2 * s));
    for (const u of units) {
      fillRect(ctx, bx, by, boxW, boxH, C.surface);
      strokePixel(ctx, bx, by, boxW, boxH, C.border, Math.max(2, Math.round(3 * s)));
      drawPixelText(ctx, u.v, bx + boxW / 2, by + Math.round(16 * s), numScale, C.fg, "center");
      drawPixelText(ctx, u.l, bx + boxW / 2, by + boxH - Math.round(22 * s), labScale, C.muted, "center");
      bx += boxW + gap;
    }
  }

  const handle = `@${state.handle}`.slice(0, 16);
  const footY = h - Math.round(78 * s);
  drawPixelText(ctx, handle, pad, footY, Math.max(2, Math.round(3 * s)), C.fg, "left");
  drawPixelText(ctx, WL_HOST, w - pad, footY, Math.max(2, Math.round(3 * s)), C.accent, "right");

  // Scanlines — baked into the export so the PNG matches the page.
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  const step = Math.max(2, Math.round(3 * s));
  for (let y = 0; y < h; y += step) {
    ctx.fillRect(0, y, w, 1);
  }
}

export function renderLockedCard(ctx: CanvasRenderingContext2D, caption = "GET A TICKET"): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = w / CARD_W;
  ctx.imageSmoothingEnabled = false;
  fillRect(ctx, 0, 0, w, h, C.bg);
  const outer = Math.max(4, Math.round(12 * s));
  strokePixel(ctx, 0, 0, w, h, C.dim, outer);
  drawPixelText(ctx, "VENTRA", w / 2, Math.round(520 * s), Math.max(4, Math.round(8 * s)), C.dim, "center");
  drawPixelText(
    ctx,
    "LOCKED",
    w / 2,
    Math.round(640 * s),
    Math.max(3, Math.round(6 * s)),
    C.muted,
    "center",
  );
  drawPixelText(
    ctx,
    caption,
    w / 2,
    Math.round(740 * s),
    Math.max(2, Math.round(3 * s)),
    C.dim,
    "center",
  );
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export card"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
