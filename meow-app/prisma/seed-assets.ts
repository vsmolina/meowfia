/**
 * Generates placeholder artwork (PNG via sharp) and printable template PDFs
 * (US Letter + A4 via pdf-lib) so a fresh clone looks fully populated.
 * Replace with real photos/PDFs through the admin dashboard.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage, type PDFFont } from "pdf-lib";

const ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR ?? "storage");

export type Vehicle = "TANK" | "PLANE" | "BOAT" | "OTHER";

const PAL = {
  sand: "#efe6d2",
  paper: "#f8f2e4",
  kraft: "#b88a57",
  kraftLight: "#c99c69",
  kraftDark: "#8a6239",
  olive: "#4b5320",
  oliveDark: "#2f3514",
  khaki: "#c3b091",
  stamp: "#b3261e",
  ink: "#1f2113",
};

const CAT_COLORS = ["#e08a3c", "#2b2b2b", "#8d8d8d", "#f2e6d0", "#6b4a2b", "#d9a066", "#444"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function noise(id: string, freq = ".8", alpha = ".18") {
  return `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .25 0 0 0 0 .17 0 0 0 0 .08 0 0 0 ${alpha} 0"/></filter>`;
}

function catHead(x: number, y: number, r: number, color: string, wink = false) {
  const eye = PAL.ink;
  return `<g>
    <path d="M${x - r * 0.95} ${y - r * 0.2} L${x - r * 0.75} ${y - r * 1.35} L${x - r * 0.2} ${y - r * 0.85} Z" fill="${color}" stroke="${PAL.ink}" stroke-width="${r * 0.06}"/>
    <path d="M${x + r * 0.95} ${y - r * 0.2} L${x + r * 0.75} ${y - r * 1.35} L${x + r * 0.2} ${y - r * 0.85} Z" fill="${color}" stroke="${PAL.ink}" stroke-width="${r * 0.06}"/>
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.88}" fill="${color}" stroke="${PAL.ink}" stroke-width="${r * 0.06}"/>
    ${wink ? `<path d="M${x - r * 0.5} ${y - r * 0.05} q${r * 0.15} ${-r * 0.15} ${r * 0.3} 0" stroke="${eye}" stroke-width="${r * 0.08}" fill="none"/>` : `<ellipse cx="${x - r * 0.35}" cy="${y - r * 0.08}" rx="${r * 0.11}" ry="${r * 0.16}" fill="${eye}"/>`}
    <ellipse cx="${x + r * 0.35}" cy="${y - r * 0.08}" rx="${r * 0.11}" ry="${r * 0.16}" fill="${eye}"/>
    <path d="M${x - r * 0.1} ${y + r * 0.2} L${x + r * 0.1} ${y + r * 0.2} L${x} ${y + r * 0.32} Z" fill="#d97a7a"/>
    <path d="M${x} ${y + r * 0.32} q${-r * 0.15} ${r * 0.2} ${-r * 0.3} ${r * 0.05} M${x} ${y + r * 0.32} q${r * 0.15} ${r * 0.2} ${r * 0.3} ${r * 0.05}" stroke="${PAL.ink}" stroke-width="${r * 0.05}" fill="none"/>
    <path d="M${x - r * 0.45} ${y + r * 0.22} l${-r * 0.7} ${-r * 0.1} M${x - r * 0.45} ${y + r * 0.32} l${-r * 0.7} ${r * 0.08} M${x + r * 0.45} ${y + r * 0.22} l${r * 0.7} ${-r * 0.1} M${x + r * 0.45} ${y + r * 0.32} l${r * 0.7} ${r * 0.08}" stroke="${PAL.ink}" stroke-width="${r * 0.03}"/>
  </g>`;
}

/** Vehicle drawn in a 600x400 box, with a cat in the hatch/cockpit */
function vehicle(type: Vehicle, body: string, catColor: string) {
  const stroke = `stroke="${PAL.ink}" stroke-width="6" stroke-linejoin="round"`;
  switch (type) {
    case "TANK":
      return `<g>
        ${catHead(270, 120, 48, catColor)}
        <rect x="190" y="130" width="190" height="80" rx="22" fill="${body}" ${stroke}/>
        <rect x="370" y="155" width="200" height="26" rx="8" fill="${body}" ${stroke}/>
        <path d="M70 215 H530 L495 280 H105 Z" fill="${body}" ${stroke}/>
        <rect x="60" y="280" width="480" height="80" rx="40" fill="${PAL.oliveDark}" ${stroke}/>
        ${[110, 185, 260, 335, 410, 485].map((cx) => `<circle cx="${cx}" cy="320" r="24" fill="${PAL.khaki}" ${stroke}/>`).join("")}
        <text x="300" y="258" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="28" fill="${PAL.paper}" opacity=".85">★ MEOW ★</text>
      </g>`;
    case "PLANE":
      return `<g>
        <path d="M60 210 Q60 160 140 160 H470 Q560 170 570 210 Q560 250 470 255 H140 Q60 255 60 210 Z" fill="${body}" ${stroke}/>
        <path d="M230 230 L330 380 L390 380 L340 230 Z" fill="${body}" ${stroke}/>
        <path d="M230 185 L310 60 L360 60 L330 185 Z" fill="${body}" ${stroke}/>
        <path d="M70 200 L40 120 L95 120 L130 190 Z" fill="${body}" ${stroke}/>
        <circle cx="575" cy="210" r="14" fill="${PAL.ink}"/>
        <rect x="568" y="120" width="14" height="180" rx="7" fill="${PAL.khaki}" ${stroke}/>
        ${catHead(420, 150, 40, catColor)}
        <path d="M370 165 Q420 95 475 165" fill="#cfe3e8" fill-opacity=".55" ${stroke}/>
        <circle cx="250" cy="210" r="26" fill="#2f4a6b" ${stroke}/><path d="M250 190 l6 14 h15 l-12 9 5 15 -14 -9 -14 9 5 -15 -12 -9 h15 z" fill="${PAL.paper}"/>
      </g>`;
    case "BOAT":
      return `<g>
        <path d="M30 250 H570 L520 340 H90 Z" fill="${body}" ${stroke}/>
        <rect x="200" y="175" width="190" height="75" fill="${body}" ${stroke}/>
        <rect x="250" y="120" width="80" height="55" fill="${body}" ${stroke}/>
        <rect x="282" y="60" width="14" height="60" fill="${PAL.ink}"/>
        <rect x="90" y="215" width="80" height="35" rx="8" fill="${body}" ${stroke}/>
        <rect x="20" y="222" width="80" height="12" rx="4" fill="${body}" ${stroke}/>
        <rect x="420" y="215" width="80" height="35" rx="8" fill="${body}" ${stroke}/>
        <rect x="490" y="222" width="80" height="12" rx="4" fill="${body}" ${stroke}/>
        ${catHead(290, 150, 34, catColor, true)}
        <path d="M0 350 q50 -20 100 0 t100 0 t100 0 t100 0 t100 0 t100 0" stroke="#3d6b78" stroke-width="10" fill="none"/>
      </g>`;
    default:
      return `<g>
        <rect x="110" y="170" width="380" height="110" rx="18" fill="${body}" ${stroke}/>
        <path d="M200 170 L240 100 H380 L410 170 Z" fill="#cfe3e8" fill-opacity=".5" ${stroke}/>
        ${catHead(320, 140, 42, catColor)}
        <circle cx="185" cy="295" r="46" fill="${PAL.oliveDark}" ${stroke}/><circle cx="185" cy="295" r="18" fill="${PAL.khaki}"/>
        <circle cx="415" cy="295" r="46" fill="${PAL.oliveDark}" ${stroke}/><circle cx="415" cy="295" r="18" fill="${PAL.khaki}"/>
        <rect x="470" y="190" width="40" height="22" rx="6" fill="${PAL.khaki}" ${stroke}/>
        <text x="300" y="250" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="26" fill="${PAL.paper}" opacity=".85">K-9? NO. K-AT.</text>
      </g>`;
  }
}

async function writePng(key: string, svg: string, width: number, height: number) {
  const full = path.join(ROOT, key);
  // Rendering SVG noise is slow; reuse existing art unless SEED_REGENERATE=1
  if (process.env.SEED_REGENERATE !== "1") {
    try {
      await fs.access(full);
      return key;
    } catch {}
  }
  await fs.mkdir(path.dirname(full), { recursive: true });
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(full);
  return key;
}

function frame(w: number, h: number, inner: string, opts: { bg?: string; label?: string; fileNo?: string; stamp?: string } = {}) {
  const bg = opts.bg ?? PAL.kraft;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${noise("n", ".02 .5", ".22")}${noise("g", ".9", ".08")}</defs>
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect width="100%" height="100%" filter="url(#n)"/>
    <rect width="100%" height="100%" filter="url(#g)"/>
    ${inner}
    ${opts.fileNo ? `<text x="${w - 30}" y="50" text-anchor="end" font-family="Courier New, monospace" font-size="${Math.round(w / 45)}" letter-spacing="4" fill="${PAL.ink}" opacity=".7">FILE NO. ${esc(opts.fileNo)}</text>` : ""}
    ${opts.label ? `<rect x="0" y="${h - h * 0.16}" width="${w}" height="${h * 0.16}" fill="${PAL.ink}" opacity=".85"/><text x="40" y="${h - h * 0.055}" font-family="Arial Black, Impact, sans-serif" font-size="${Math.round(Math.min(h * 0.075, (w - 80) / (opts.label.length * 0.78)))}" letter-spacing="3" fill="${PAL.paper}">${esc(opts.label.toUpperCase())}</text>` : ""}
    ${opts.stamp ? `<g transform="translate(${w * 0.08} ${h * 0.14}) rotate(-12)"><rect x="0" y="-${h * 0.07}" width="${opts.stamp.length * h * 0.05 + 40}" height="${h * 0.1}" fill="none" stroke="${PAL.stamp}" stroke-width="6" rx="6" opacity=".85"/><text x="20" y="${h * 0.01}" font-family="Arial Black, Impact, sans-serif" font-size="${Math.round(h * 0.065)}" fill="${PAL.stamp}" opacity=".85" letter-spacing="4">${esc(opts.stamp)}</text></g>` : ""}
  </svg>`;
}

export async function templateImages(slug: string, name: string, type: Vehicle, seed: number) {
  const body = [PAL.olive, "#5b6630", "#6b7536", "#556b2f", "#7a6a3a"][seed % 5];
  const cat = CAT_COLORS[seed % CAT_COLORS.length];
  const cover = await writePng(
    `seed/templates/${slug}/cover.png`,
    frame(1200, 900, `<g transform="translate(210 90) scale(1.3)">${vehicle(type, body, cat)}</g>`, { label: name, fileNo: String(100 + seed).padStart(4, "0"), stamp: "CLASSIFIED" }),
    1200,
    900,
  );
  const extra: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const c2 = CAT_COLORS[(seed + i) % CAT_COLORS.length];
    const bg = [PAL.kraftLight, PAL.khaki, PAL.sand][i - 1];
    const scale = [1.2, 0.9, 1.0][i - 1];
    extra.push(
      await writePng(
        `seed/templates/${slug}/photo-${i}.png`,
        frame(1200, 900, `<g transform="translate(${600 - 300 * scale} ${460 - 200 * scale}) scale(${scale})">${vehicle(type, body, c2)}</g>`, {
          bg,
          fileNo: `${100 + seed}-${i}`,
          label: ["Field test", "Assembly", "Deployed"][i - 1],
        }),
        1200,
        900,
      ),
    );
  }
  return { cover, images: [cover, ...extra] };
}

export async function galleryImage(id: string, type: Vehicle, seed: number, catName: string) {
  const body = [PAL.olive, "#5b6630", "#7a6a3a", "#3f4a2a"][seed % 4];
  const cat = CAT_COLORS[(seed * 3) % CAT_COLORS.length];
  const bgs = ["#d9cdb3", "#c9b8a0", "#e8dcc6", "#bfae8f", "#d4c4a8"];
  const key = await writePng(
    `seed/gallery/${id}.png`,
    frame(1080, 1350, `<rect x="0" y="900" width="1080" height="450" fill="#a07a53" opacity=".55"/><g transform="translate(90 420) scale(1.5)">${vehicle(type, body, cat)}</g>`, {
      bg: bgs[seed % bgs.length],
      label: `Recruit ${catName}`,
    }),
    1080,
    1350,
  );
  return { key, width: 1080, height: 1350 };
}

export async function catPortrait(slug: string, name: string, rank: string, seed: number) {
  const color = CAT_COLORS[seed % CAT_COLORS.length];
  return writePng(
    `seed/crew/${slug}.png`,
    frame(
      900,
      900,
      `<circle cx="450" cy="420" r="300" fill="${PAL.olive}" opacity=".9"/>
       <rect x="300" y="540" width="300" height="200" rx="40" fill="${PAL.oliveDark}"/>
       ${catHead(450, 420, 190, color, seed % 2 === 1)}
       <path d="M300 300 Q450 170 600 300 L620 330 H280 Z" fill="${PAL.olive}" stroke="${PAL.ink}" stroke-width="10"/>
       <circle cx="450" cy="290" r="22" fill="#e7d27c" stroke="${PAL.ink}" stroke-width="6"/>`,
      { label: `${rank} ${name}`, bg: PAL.khaki },
    ),
    900,
    900,
  );
}

export async function creatorPortrait() {
  return writePng(
    "seed/crew/creator.png",
    frame(
      900,
      900,
      `<circle cx="450" cy="330" r="130" fill="#e3b58f" stroke="${PAL.ink}" stroke-width="10"/>
       <path d="M310 300 Q450 120 590 300 L600 250 Q450 130 300 250 Z" fill="#5a3b25" stroke="${PAL.ink}" stroke-width="10"/>
       <path d="M300 250 Q450 110 600 250 L610 280 H290 Z" fill="${PAL.olive}" stroke="${PAL.ink}" stroke-width="10"/>
       <circle cx="405" cy="335" r="12" fill="${PAL.ink}"/><circle cx="495" cy="335" r="12" fill="${PAL.ink}"/>
       <path d="M410 390 Q450 420 490 390" stroke="${PAL.ink}" stroke-width="8" fill="none"/>
       <path d="M250 760 Q260 520 450 500 Q640 520 650 760 Z" fill="${PAL.olive}" stroke="${PAL.ink}" stroke-width="10"/>
       <rect x="520" y="560" width="130" height="90" rx="6" fill="${PAL.kraft}" stroke="${PAL.ink}" stroke-width="6" transform="rotate(-10 585 605)"/>
       ${catHead(700, 560, 60, "#e08a3c")}`,
      { label: "Chief Engineer", bg: PAL.khaki },
    ),
    900,
    900,
  );
}

export async function productImage(slug: string, name: string, kind: "kit" | "shirt" | "hoodie" | "sticker" | "patch" | "tag" | "poster" | "giftcard", seed: number, type: Vehicle = "TANK") {
  let inner = "";
  const body = [PAL.olive, "#5b6630", "#7a6a3a"][seed % 3];
  switch (kind) {
    case "kit":
      inner = `<rect x="170" y="230" width="660" height="520" rx="10" fill="${PAL.kraftDark}" stroke="${PAL.ink}" stroke-width="10"/>
        <rect x="170" y="230" width="660" height="90" fill="${PAL.kraft}" stroke="${PAL.ink}" stroke-width="10"/>
        <g transform="translate(250 360) scale(.85)">${vehicle(type, body, CAT_COLORS[seed % 7])}</g>
        <text x="500" y="292" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="44" fill="${PAL.ink}">PRE-CUT KIT</text>`;
      break;
    case "shirt":
    case "hoodie":
      inner = `<path d="M330 220 L420 190 Q500 250 580 190 L670 220 L800 330 L730 420 L670 380 L670 800 H330 L330 380 L270 420 L200 330 Z" fill="${kind === "shirt" ? PAL.olive : PAL.khaki}" stroke="${PAL.ink}" stroke-width="10"/>
        ${kind === "hoodie" ? `<path d="M420 190 Q500 120 580 190 Q500 280 420 190" fill="${PAL.khaki}" stroke="${PAL.ink}" stroke-width="10"/>` : ""}
        <g transform="translate(380 420) scale(.4)">${vehicle("TANK", kind === "shirt" ? PAL.khaki : PAL.olive, "#e08a3c")}</g>`;
      break;
    case "sticker":
      inner = [0, 1, 2, 3].map((i) => `<g transform="translate(${180 + (i % 2) * 340} ${200 + Math.floor(i / 2) * 330}) rotate(${i * 7 - 10})"><rect width="290" height="260" rx="40" fill="${PAL.paper}" stroke="${PAL.ink}" stroke-width="8"/><g transform="translate(25 40) scale(.4)">${vehicle((["TANK", "PLANE", "BOAT", "OTHER"] as Vehicle[])[i], body, CAT_COLORS[i])}</g></g>`).join("");
      break;
    case "patch":
      inner = `<path d="M500 160 L760 300 V620 L500 820 L240 620 V300 Z" fill="${PAL.olive}" stroke="${PAL.khaki}" stroke-width="24"/>
        ${catHead(500, 470, 130, "#e08a3c")}
        <text x="500" y="720" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="56" fill="#e7d27c">MEOWFIA</text>`;
      break;
    case "tag":
      inner = `<circle cx="500" cy="500" r="260" fill="#c9c9c9" stroke="${PAL.ink}" stroke-width="10"/><circle cx="500" cy="270" r="22" fill="${PAL.kraft}" stroke="${PAL.ink}" stroke-width="6"/>
        <text x="500" y="470" text-anchor="middle" font-family="Courier New, monospace" font-size="54" font-weight="bold" fill="${PAL.ink}">PVT. WHISKERS</text>
        <text x="500" y="550" text-anchor="middle" font-family="Courier New, monospace" font-size="40" fill="${PAL.ink}">IF FOUND: TREATS</text>`;
      break;
    case "poster":
      inner = `<rect x="220" y="120" width="560" height="760" fill="${PAL.paper}" stroke="${PAL.ink}" stroke-width="10"/>
        <text x="500" y="230" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="62" fill="${PAL.stamp}">I WANT YOU</text>
        ${catHead(500, 470, 150, "#e08a3c")}
        <text x="500" y="760" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="44" fill="${PAL.olive}">TO BUILD MORE BOXES</text>`;
      break;
    case "giftcard":
      inner = `<rect x="140" y="270" width="720" height="440" rx="30" fill="${PAL.olive}" stroke="${PAL.ink}" stroke-width="10"/>
        <text x="200" y="380" font-family="Arial Black, Impact, sans-serif" font-size="58" fill="${PAL.paper}">SUPPLY VOUCHER</text>
        <text x="200" y="640" font-family="Courier New, monospace" font-size="36" fill="#e7d27c">REDEEMABLE AT HQ</text>
        <g transform="translate(560 400) scale(.42)">${vehicle("TANK", PAL.khaki, "#e08a3c")}</g>`;
      break;
  }
  return writePng(`seed/products/${slug}.png`, frame(1000, 1000, inner, { bg: PAL.sand, fileNo: `SKU-${100 + seed}` }), 1000, 1000);
}

export async function genericCover(key: string, title: string, type: Vehicle, seed: number) {
  return writePng(
    key,
    frame(1200, 675, `<g transform="translate(560 160) scale(.9)">${vehicle(type, PAL.olive, CAT_COLORS[seed % 7])}</g><text x="60" y="140" font-family="Courier New, monospace" font-size="28" letter-spacing="5" fill="${PAL.ink}">FIELD MANUAL</text>`, {
      label: title,
      bg: [PAL.khaki, PAL.kraftLight, PAL.sand][seed % 3],
    }),
    1200,
    675,
  );
}

export async function placeholderPng() {
  const dir = path.resolve(process.cwd(), "public");
  await fs.mkdir(dir, { recursive: true });
  await sharp(Buffer.from(frame(800, 600, `<g transform="translate(100 100)">${vehicle("TANK", PAL.olive, "#e08a3c")}</g>`, { stamp: "REDACTED" })))
    .png({ palette: true })
    .toFile(path.join(dir, "placeholder.png"));
}

// ───────────── PDFs ─────────────

const SIZES = { letter: [612, 792] as [number, number], a4: [595.28, 841.89] as [number, number] };

function dashedRect(page: PDFPage, x: number, y: number, w: number, h: number) {
  const opts = { thickness: 1.2, color: rgb(0.12, 0.13, 0.07), dashArray: [6, 4] };
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, ...opts });
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, ...opts });
  page.drawLine({ start: { x: x + w, y: y + h }, end: { x, y: y + h }, ...opts });
  page.drawLine({ start: { x, y: y + h }, end: { x, y }, ...opts });
}

function header(page: PDFPage, bold: PDFFont, mono: PDFFont, title: string, sub: string, w: number, h: number) {
  page.drawRectangle({ x: 0, y: h - 70, width: w, height: 70, color: rgb(0.29, 0.33, 0.13) });
  page.drawText(title.toUpperCase(), { x: 36, y: h - 40, size: 22, font: bold, color: rgb(0.97, 0.95, 0.89) });
  page.drawText(sub, { x: 36, y: h - 58, size: 9, font: mono, color: rgb(0.9, 0.82, 0.49) });
}

export async function templatePdfs(slug: string, name: string, materials: string[], minutes: number) {
  const out: { letter: string; a4: string } = { letter: "", a4: "" };
  for (const fmt of ["letter", "a4"] as const) {
    const [w, h] = SIZES[fmt];
    const doc = await PDFDocument.create();
    doc.setTitle(`${name} Template (${fmt === "letter" ? "US Letter" : "A4"})`);
    doc.setAuthor("Meowfia Motor Pool");
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const reg = await doc.embedFont(StandardFonts.Helvetica);
    const mono = await doc.embedFont(StandardFonts.Courier);

    // Cover / briefing
    const cover = doc.addPage([w, h]);
    header(cover, bold, mono, name, `MISSION BRIEFING · ${fmt === "letter" ? "US LETTER" : "A4"} · PRINT AT 100% (NO SCALING)`, w, h);
    let y = h - 120;
    cover.drawText("CLASSIFIED", { x: w - 190, y: h - 130, size: 26, font: bold, color: rgb(0.7, 0.15, 0.12), rotate: degrees(-8), opacity: 0.8 });
    cover.drawText("Materials", { x: 36, y, size: 16, font: bold });
    y -= 22;
    for (const m of materials) {
      cover.drawText(`[ ]  ${m}`, { x: 44, y, size: 11, font: reg });
      y -= 17;
    }
    y -= 12;
    cover.drawText(`Estimated build time: ${minutes} minutes`, { x: 36, y, size: 11, font: reg });
    y -= 30;
    cover.drawText("Cat Safety", { x: 36, y, size: 16, font: bold });
    y -= 20;
    for (const line of [
      "- No staples, pins, or exposed tape edges inside the vehicle.",
      "- Use non-toxic, low-temp glue or water-activated kraft tape. Let it fully dry.",
      "- Supervise play. Remove any small detachable parts for kittens.",
      "- Check the cat-size rating: the floor panel must support the full loaf.",
    ]) {
      cover.drawText(line, { x: 44, y, size: 10.5, font: reg });
      y -= 16;
    }
    // Scale check box
    dashedRect(cover, 36, 60, 72, 72);
    cover.drawText("1 in / 2.54 cm scale check: this square should measure exactly 1 inch inside.", { x: 118, y: 92, size: 8.5, font: mono });

    // Parts pages
    const parts = ["Hull panels A–D", "Turret / cockpit E–H", "Tracks, wheels & details I–N"];
    parts.forEach((label, i) => {
      const p = doc.addPage([w, h]);
      header(p, bold, mono, `${name}: Sheet ${i + 2}`, label.toUpperCase(), w, h);
      const cols = 2;
      const pw = (w - 36 * 2 - 18) / cols;
      const ph = (h - 70 - 36 * 2 - 18 * 2) / 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < cols; c++) {
          const x = 36 + c * (pw + 18);
          const yy = 36 + r * (ph + 18);
          dashedRect(p, x, yy, pw, ph);
          p.drawLine({ start: { x: x + pw / 2, y: yy + 8 }, end: { x: x + pw / 2, y: yy + ph - 8 }, thickness: 0.8, color: rgb(0.45, 0.5, 0.2), dashArray: [2, 3] });
          p.drawText(`${String.fromCharCode(65 + i * 6 + r * 2 + c)}`, { x: x + 10, y: yy + ph - 24, size: 18, font: bold, color: rgb(0.29, 0.33, 0.13) });
          p.drawText("cut ---  fold . . .", { x: x + 10, y: yy + 10, size: 7, font: mono, color: rgb(0.4, 0.4, 0.3) });
        }
      }
    });

    const bytes = await doc.save();
    const key = `private/templates/${slug}/${slug}-${fmt}.pdf`;
    const full = path.join(ROOT, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
    out[fmt] = key;
  }
  return out;
}
