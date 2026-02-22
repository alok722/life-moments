import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

async function generate() {
  const icon192Svg = readFileSync(resolve(publicDir, "icons/icon-192.svg"));
  const icon512Svg = readFileSync(resolve(publicDir, "icons/icon-512.svg"));
  const maskableSvg = readFileSync(resolve(publicDir, "icons/icon-maskable.svg"));
  const faviconSvg = readFileSync(resolve(publicDir, "favicon.svg"));

  await sharp(icon192Svg).resize(192, 192).png().toFile(resolve(publicDir, "icons/icon-192.png"));
  console.log("Generated icon-192.png");

  await sharp(icon512Svg).resize(512, 512).png().toFile(resolve(publicDir, "icons/icon-512.png"));
  console.log("Generated icon-512.png");

  await sharp(maskableSvg).resize(512, 512).png().toFile(resolve(publicDir, "icons/icon-maskable-512.png"));
  console.log("Generated icon-maskable-512.png");

  await sharp(faviconSvg).resize(180, 180).png().toFile(resolve(publicDir, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");

  await sharp(faviconSvg).resize(32, 32).png().toFile(resolve(publicDir, "favicon-32x32.png"));
  console.log("Generated favicon-32x32.png");

  await sharp(faviconSvg).resize(16, 16).png().toFile(resolve(publicDir, "favicon-16x16.png"));
  console.log("Generated favicon-16x16.png");

  // Generate ICO-like favicon (use 32x32 PNG as favicon.ico)
  await sharp(faviconSvg).resize(32, 32).png().toFile(resolve(publicDir, "favicon.ico"));
  console.log("Generated favicon.ico");

  console.log("\nAll icons generated successfully!");
}

generate().catch(console.error);
