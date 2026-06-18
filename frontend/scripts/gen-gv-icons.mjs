/**
 * Generates the gradeVITian PWA icons — a graduation cap (mortarboard) on the
 * brand accent background. Run from the frontend dir so sharp resolves:
 *   node scripts/gen-gv-icons.mjs
 *
 * Outputs to public/gradevitian/: the source SVG plus PNGs for the manifest
 * (any + maskable) and the iOS apple-touch-icon. Content stays inside the
 * maskable safe zone so it never clips when a platform rounds/masks the icon.
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "gradevitian");

const BG = "#4f46e5"; // --accent
const FG = "#ffffff";

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g>
    <!-- cap / cup (drawn first so the board overlaps its top edge) -->
    <path d="M188 226 L188 300 Q188 340 256 340 Q324 340 324 300 L324 226 Z" fill="${FG}"/>
    <!-- mortarboard (top board, in perspective) -->
    <path d="M256 156 L420 214 L256 272 L92 214 Z" fill="${FG}"/>
    <!-- tassel cord (drawn before the button so the button stays a clean stud) -->
    <path d="M256 212 L420 214 L420 300" fill="none" stroke="${FG}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- tassel knot + tuft -->
    <circle cx="420" cy="300" r="11" fill="${FG}"/>
    <rect x="410" y="304" width="20" height="44" rx="10" fill="${FG}"/>
    <!-- centre button -->
    <circle cx="256" cy="212" r="13" fill="${BG}"/>
  </g>
</svg>`;

async function png(name, size) {
  await sharp(Buffer.from(svg(size))).png().toFile(join(OUT, name));
  console.log("wrote", name, `(${size}x${size})`);
}

writeFileSync(join(OUT, "gv-icon.svg"), svg(512));
console.log("wrote gv-icon.svg");
await png("gv-icon-192.png", 192);
await png("gv-icon-512.png", 512);
await png("gv-icon-maskable.png", 512);
await png("apple-touch-icon.png", 180);
