import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/photo.svg", "utf8");
// The raster is embedded as a data URI in an xlink:href inside the <pattern>.
const match = svg.match(/xlink:href="data:image\/(png|jpe?g|webp);base64,([^"]+)"/);
if (!match) {
  console.error("No embedded base64 raster found in public/photo.svg");
  process.exit(1);
}
const buffer = Buffer.from(match[2], "base64");
const meta = await sharp(buffer).metadata();
console.log(`Embedded raster: ${meta.format} ${meta.width}x${meta.height}, ${buffer.length} bytes`);

// Display max is ~400px; export 800px (2x retina), square cover, as WebP.
await sharp(buffer)
  .resize(800, 800, { fit: "cover", position: "attention" })
  .webp({ quality: 80 })
  .toFile("public/photo.webp");

console.log("Wrote public/photo.webp");
