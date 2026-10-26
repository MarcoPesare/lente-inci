// Genera le icone della PWA (eseguito una volta, le PNG sono nel repository).
import sharp from "sharp";
const svg = (pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#2347c5"/>
<g transform="translate(${pad ? 76 : 56} ${pad ? 76 : 56}) scale(${pad ? 0.7 : 0.78})">
<circle cx="220" cy="220" r="150" fill="none" stroke="#ffffff" stroke-width="44"/>
<line x1="330" y1="330" x2="460" y2="460" stroke="#ffffff" stroke-width="56" stroke-linecap="round"/>
<path d="M150 260 C 180 170, 260 170, 290 260" fill="none" stroke="#9fb4ff" stroke-width="26" stroke-linecap="round"/>
<circle cx="220" cy="170" r="20" fill="#9fb4ff"/>
</g></svg>`);
await sharp(svg(false)).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(svg(false)).resize(512).png().toFile("public/icons/icon-512.png");
await sharp(svg(true)).resize(512).png().toFile("public/icons/icon-maskable-512.png");
await sharp(svg(true)).resize(180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(svg(false)).resize(48).png().toFile("public/favicon.png");
console.log("icone create");
