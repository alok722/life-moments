/**
 * Generates every icon/logo asset from a single source mark.
 *
 * Mark: a calendar page with a heart on it (a moment that matters) and a
 * sparkle (AI-written wishes), on the brand violet→blue gradient.
 * Paths only — no <text> — so it renders identically everywhere.
 *
 * Run: npm run generate-icons
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

// Keep in sync with src/components/ui/logo.tsx
const BRAND = { from: "#7c5cfc", to: "#5b8def" };
const HEART = { from: "#f472b6", to: "#7c5cfc" };
const SPARKLE = "#fcd34d";

/** Mark artwork in a 32×32 coordinate space (no background). */
const markArtwork = `
  <rect x="7" y="9" width="18" height="16" rx="3.5" fill="#ffffff"/>
  <rect x="10.5" y="6.5" width="2.4" height="5" rx="1.2" fill="#ffffff" stroke="url(#lm-bg)" stroke-width="0.9"/>
  <rect x="19.1" y="6.5" width="2.4" height="5" rx="1.2" fill="#ffffff" stroke="url(#lm-bg)" stroke-width="0.9"/>
  <path d="M16 23.2C16 23.2 10.6 20 10.6 16.4C10.6 14.7 11.9 13.5 13.4 13.5C14.5 13.5 15.4 14.1 16 15.1C16.6 14.1 17.5 13.5 18.6 13.5C20.1 13.5 21.4 14.7 21.4 16.4C21.4 20 16 23.2 16 23.2Z" fill="url(#lm-heart)"/>
  <path d="M26.5 2.6Q27.05 4.95 29.4 5.5Q27.05 6.05 26.5 8.4Q25.95 6.05 23.6 5.5Q25.95 4.95 26.5 2.6Z" fill="${SPARKLE}"/>`;

const defs = `
  <defs>
    <linearGradient id="lm-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${BRAND.from}"/>
      <stop offset="1" stop-color="${BRAND.to}"/>
    </linearGradient>
    <linearGradient id="lm-heart" x1="10.6" y1="13.5" x2="21.4" y2="23.2" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${HEART.from}"/>
      <stop offset="1" stop-color="${HEART.to}"/>
    </linearGradient>
  </defs>`;

/** Rounded-square app icon (favicon, PWA "any" icons). */
const roundedIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${defs}
  <rect width="32" height="32" rx="7" fill="url(#lm-bg)"/>${markArtwork}
</svg>
`;

/**
 * Full-bleed icon whose artwork is scaled into the centre so the OS mask
 * (Android maskable safe zone = inner 80%, iOS squircle) never clips it.
 */
const fullBleedIcon = (size, scale) => {
  const offset = (32 - 32 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${defs}
  <rect width="32" height="32" fill="url(#lm-bg)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${markArtwork}
  </g>
</svg>
`;
};

/** Horizontal lockup for README / social use. */
const lockup = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="96" viewBox="0 0 440 96">
  <g transform="translate(8 8) scale(2.5)">${defs}
    <rect width="32" height="32" rx="7" fill="url(#lm-bg)"/>${markArtwork}
  </g>
  <text x="104" y="62" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="40" font-weight="700" letter-spacing="-1" fill="${BRAND.from}">Life Moments</text>
</svg>
`;

/** Builds a .ico container holding PNG images (supported by all modern browsers). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// SVGs are authored at their target pixel size; render at 2× then downsample for crisp edges.
const png = (svg, size) => sharp(Buffer.from(svg), { density: 144 }).resize(size, size).png().toBuffer();

async function generate() {
  const write = (rel, data) => {
    writeFileSync(resolve(publicDir, rel), data);
    console.log(`Generated ${rel}`);
  };

  // Source SVGs
  write("favicon.svg", roundedIcon(32));
  write("icons/icon-192.svg", roundedIcon(192));
  write("icons/icon-512.svg", roundedIcon(512));
  write("icons/icon-maskable.svg", fullBleedIcon(512, 0.72));
  write("logo.svg", lockup);

  // Rasterised
  write("icons/icon-192.png", await png(roundedIcon(192), 192));
  write("icons/icon-512.png", await png(roundedIcon(512), 512));
  write("icons/icon-maskable-512.png", await png(fullBleedIcon(512, 0.72), 512));
  // iOS applies its own rounded mask and shows transparency as black.
  write("apple-touch-icon.png", await png(fullBleedIcon(180, 0.82), 180));
  write("favicon-32x32.png", await png(roundedIcon(32), 32));
  write("favicon-16x16.png", await png(roundedIcon(16), 16));

  const icoSizes = [16, 32, 48];
  const icoPngs = await Promise.all(
    icoSizes.map(async (size) => ({ size, data: await png(roundedIcon(size), size) }))
  );
  write("favicon.ico", buildIco(icoPngs));

  console.log("\nAll icons generated successfully!");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
