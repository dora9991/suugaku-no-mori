// Original vector artwork for すうがくの森. No external artwork or fonts.
// Run: node scripts/draw-art.mjs
import { mkdir, writeFile } from "node:fs/promises";
const dir = new URL("../public/art/", import.meta.url);
await mkdir(dir, { recursive: true });
const ink = "#354f42";
const shape = (body, box = "0 0 120 120") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" fill="none"><g stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const ellipse = (x, y, rx, ry, fill) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="none"/>`;
const path = (d, fill, extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, r, fill) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const circle = (x, y, r, fill) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const leaf = (x, y, s = 1, c = "#759b57") =>
  `<g transform="translate(${x} ${y}) scale(${s})">${path("M0 0Q-18-27 7-35Q24-14 0 0", c)}<path d="M0 0 6-25"/></g>`;
function face(variant) {
  const eyes =
    variant === "happy"
      ? '<path d="M43 53q4-7 8 0m18 0q4-7 8 0"/>'
      : variant === "worried"
        ? '<path d="m42 45 10 3m17 0 9-3"/>' +
          ellipse(48, 54, 2.5, 3.5, ink) +
          ellipse(73, 54, 2.5, 3.5, ink)
        : '<g class="eyes">' +
          ellipse(48, 52, 2.6, 3.8, ink) +
          ellipse(73, 52, 2.6, 3.8, ink) +
          "</g>";
  return `${ellipse(39, 61, 7, 4, "#ed9f83")}${ellipse(82, 61, 7, 4, "#ed9f83")}${eyes}${path("M57 58q3-3 6 0l-3 3Z", ink)}<path d="${variant === "worried" ? "M55 68q5-5 10 0" : variant === "happy" ? "M53 64q7 12 14 0Z" : "M54 65q6 6 12 0"}" ${variant === "happy" ? 'fill="#ae665e"' : ""}/>`;
}
function character(name, variant = "normal") {
  const fur = {
    mugi: "#c9915b",
    chikuta: "#c67648",
    ruru: "#f5e1c4",
    memo: "#9fb8ad",
    player: "#efbe8d",
  }[name];
  const cloth = {
    mugi: "#5b8775",
    chikuta: "#dab552",
    ruru: "#cf8277",
    memo: "#6d8eaf",
    player: "#dba64f",
  }[name];
  let ears = "";
  if (name === "mugi")
    ears =
      circle(33, 30, 15, fur) +
      circle(87, 30, 15, fur) +
      circle(33, 30, 7, "#e8b88b") +
      circle(87, 30, 7, "#e8b88b");
  if (name === "ruru")
    ears =
      '<ellipse cx="42" cy="25" rx="10" ry="23" fill="' +
      fur +
      '" transform="rotate(-12 42 25)"/><ellipse cx="77" cy="23" rx="10" ry="23" fill="' +
      fur +
      '" transform="rotate(10 77 23)"/><path d="m41 11 3 22m33-24-2 22" stroke="#d6a99d" stroke-width="6"/>';
  if (name === "memo")
    ears =
      path("M27 40 29 12 51 30M69 29 92 12 95 43", fur) +
      path("m33 23 3 15 10-5m30-1 10-9-1 15", "#d5c5b6", 'stroke="none"');
  if (name === "chikuta")
    ears = path("M29 38Q19 8 37 9L49 30M72 30 81 7Q98 8 91 39", fur);
  let body = ellipse(60, 110, 34, 6, "#284b3929");
  if (name === "chikuta")
    body +=
      path("M90 99C134 97 114 46 95 58c-23 12 23 23-5 29", "#d99a65") +
      '<path d="M99 92c26-7 2-19 5-25" stroke="#f0c48a" stroke-width="8"/>';
  body +=
    rect(34, 70, 52, 36, 18, fur) +
    ellipse(43, 105, 12, 6, fur) +
    ellipse(78, 105, 12, 6, fur);
  body +=
    path("M37 77q23 13 46 0l4 23q-28 15-54 0Z", cloth) +
    rect(48, 84, 24, 19, 5, cloth) +
    '<path d="m54 87 6 8 6-8" stroke="#fff4d5" stroke-width="2"/>';
  body += ears + path("M26 49q-1-27 34-27t34 27v14q0 22-34 22T26 63Z", fur);
  if (name === "mugi") body += ellipse(60, 63, 20, 14, "#f5d6a4");
  if (name === "chikuta")
    body +=
      path("M43 30q6 8 11 0m8 0q5 8 11 0", "#f8deaa", 'stroke="none"') +
      ellipse(60, 64, 22, 16, "#f4d3a2");
  if (name === "memo")
    body +=
      '<path d="m51 26 2 10m9-11v10m10-9-2 10" stroke="#668b7e" stroke-width="4"/>';
  if (name === "player")
    body +=
      path("M25 43q0-28 35-28t35 28Q71 35 25 43", "#6c6850") +
      path("M25 33q35-26 70 0l12 8q-45-7-93 5Z", "#d3ad61") +
      leaf(81, 26, 0.35);
  body += face(variant);
  if (name === "ruru")
    body +=
      path("M87 25q-16-9-16 1t16-1q15-10 15-1t-15 1", "#c87970") +
      circle(87, 25, 3, "#f4cb75");
  if (name === "memo")
    body += `<g stroke-width="2">${circle(47, 53, 11, "none")}${circle(74, 53, 11, "none")}<path d="M58 52h5m-39 0h12m49 0h11"/></g>`;
  body += ellipse(30, 86, 8, 11, fur) + ellipse(90, 86, 8, 11, fur);
  if (name === "mugi")
    body +=
      path("M22 87q8-8 16 0l-2 13H25Z", "#e3b76e") +
      '<path d="m26 89 1 6m6-7-1 6" stroke="#ad7940" stroke-width="2"/>';
  if (name === "chikuta")
    body +=
      circle(85, 90, 11, "#fff0c2") +
      '<path d="M85 83v7l5 3" stroke-width="2"/>';
  if (name === "memo")
    body +=
      rect(82, 82, 17, 23, 3, "#fff1c8") +
      '<path d="m86 88 9-1m-9 6 9-1m-9 6 7-1" stroke-width="1.5"/>';
  return shape(body).replace(
    "<g stroke=",
    "<style>.eyes{transform-box:fill-box;transform-origin:center;animation:blink 6s infinite}@keyframes blink{0%,43%,47%,100%{transform:scaleY(1)}45%{transform:scaleY(.1)}}@media(prefers-reduced-motion:reduce){.eyes{animation:none}}</style><g stroke=",
  );
}
const art = {
  maruta: shape(
    path("m26 39 52-12 18 54-52 14Z", "#b87d4d") +
      '<path d="m39 50 44-10m-39 28 43-10" stroke="#895b38"/>' +
      ellipse(33, 68, 20, 28, "#edc284") +
      '<ellipse cx="33" cy="68" rx="19" ry="27" fill="none"/>' +
      ellipse(33, 68, 10, 17, "none") +
      '<path d="m32 58 5 9-4 9"/>',
  ),
  ishi: shape(
    path("M17 82 25 48 51 25 84 35 105 69 89 92 46 98Z", "#a5b6ad") +
      path(
        "m25 48 33 9 26-22-8 42 29-8-30 18-29 11 12-41Z",
        "#c5d0c3",
        'stroke="none"',
      ) +
      '<path d="m26 49 32 8 26-21M58 57l-11 40m29-21 13 16" stroke="#839b8f"/>',
  ),
  keito: shape(
    circle(59, 60, 37, "#d58775") +
      '<path d="M27 43q39 5 62 40M33 33q39 6 62 38M24 58q28 4 50 36M45 25q-10 42 36 65M65 24q-9 32 27 45M46 94q-19 22-29 8" stroke="#f2b3a0" stroke-width="4"/>',
  ),
  hana: shape(
    '<path d="M59 101V58" stroke="#608e61" stroke-width="5"/>' +
      leaf(58, 90, 0.7, "#8eae6a") +
      leaf(59, 99, 0.5, "#628e60") +
      [0, 60, 120, 180, 240, 300]
        .map(
          (a) =>
            `<ellipse cx="59" cy="34" rx="13" ry="21" fill="#ec9b7b" transform="rotate(${a} 59 53)"/>`,
        )
        .join("") +
      circle(59, 53, 15, "#f4cf6f"),
  ),
  hirameki: shape(
    leaf(57, 34, 0.6) +
      path(
        "M57 31c-41-13-48 43-21 62q21 18 45-6c31-35 5-69-24-56Z",
        "#e9ac48",
      ) +
      path("M41 48q-10 8-8 20", "none", 'stroke="#fff0b9" stroke-width="7"') +
      path("m87 13 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z", "#fff3bd", 'stroke="none"'),
  ),
  sakana: shape(
    path("M88 46 111 29v59L87 73C48 116 7 65 18 54q29-37 70-8Z", "#81b5b2") +
      path("m53 36 12-18 13 22m-30 44 16 15 9-18", "#dda15a") +
      '<path d="M37 43q-12 15 0 33m20-29 14 11-14 11"/>' +
      circle(30, 54, 3, ink),
  ),
  kago: shape(
    '<path d="M31 51c0-47 58-47 58 0" stroke="#ac7648" stroke-width="9"/>' +
      path("m16 47 88 0-12 53H29Z", "#d8ae6b") +
      path("M16 47h88v12H16Z", "#efd198") +
      '<path d="M35 62v31m17-31v34m17-34v34m17-34v29M25 72h72M28 85h67" stroke="#a67c4c" stroke-width="2"/>',
  ),
  monosashi: shape(
    '<g transform="rotate(-32 60 60)">' +
      rect(14, 41, 94, 37, 5, "#f0cf80") +
      '<path d="M26 42v19m12-19v11m12-11v19m12-19v11m12-11v19m12-19v11m12-11v19"/></g>',
  ),
  compass: shape(
    circle(60, 25, 8, "#efcb75") +
      path("M55 32 29 101l10-5 25-62", "#7fa7a0") +
      path("m65 31 26 68-11-4-25-61", "#dc9475") +
      '<path d="M41 67q19 15 38 0m-48 35-4 8m65-9 4 9"/>' +
      circle(60, 35, 6, "#efcb75"),
  ),
  mushimegane: shape(
    '<path d="m75 77 27 29" stroke="#c48e55" stroke-width="15"/>' +
      circle(50, 50, 33, "#9bc9c2") +
      circle(50, 50, 25, "#d9f0df") +
      '<path d="M34 44q3-12 16-13" stroke="#fffcec" stroke-width="6"/>',
  ),
  isu: shape(
    rect(35, 65, 12, 37, 4, "#a96d42") +
      rect(77, 65, 12, 37, 4, "#a96d42") +
      rect(22, 52, 78, 28, 12, "#c08c57") +
      ellipse(61, 52, 39, 17, "#e5bb7a") +
      '<ellipse cx="61" cy="52" rx="25" ry="9"/><path d="m50 53 10-4 10 4"/>',
  ),
  takibi: shape(
    ellipse(60, 99, 48, 10, "#819589") +
      '<path d="m29 86 57 19m-55 0 57-20" stroke="#9a6b43" stroke-width="12"/>' +
      path(
        "M60 8c10 32 29 30 31 54 3 39-68 40-68 2 0-13 16-22 18-38 5 11 7 15 11 16Z",
        "#e69b4c",
      ) +
      path(
        "M61 41c4 14 16 18 16 31 0 22-33 23-34 1-1-11 10-19 18-32Z",
        "#f9d679",
        'stroke="none"',
      ),
  ),
  tent: shape(
    path("M13 93 47 23h29l32 70Z", "#d49359") +
      path("M13 93 47 23 83 93Z", "#e8b66d") +
      path("m34 93 14-44 17 44Z", "#546c58") +
      '<path d="m12 93-7 8m104-7 6 7m-64-74 7-10"/>' +
      path("m53 29 25 53-13-5Z", "#f5d59c", 'stroke="none"'),
  ),
  kadan: shape(
    path("m14 76 75-9 19 19-78 19Z", "#ac7a52") +
      rect(20, 73, 79, 19, 5, "#d2a772") +
      [30, 59, 85]
        .map(
          (x, i) =>
            `<g transform="translate(${x} ${i === 1 ? 42 : 51})"><path d="M0 34V0" stroke="#5f8862" stroke-width="4"/>${[-9, 9].map((dx) => ellipse(dx, 0, 10, 9, i === 1 ? "#f5d17d" : "#dd907a")).join("")}${circle(0, -8, 10, i === 1 ? "#f5d17d" : "#dd907a")}${circle(0, 1, 5, "#fff0b0")}</g>`,
        )
        .join(""),
  ),
  furin: shape(
    '<path d="M60 13v21m0 32v33"/>' +
      path("M31 66q0-37 29-37t29 37Z", "#abd1c1") +
      rect(50, 80, 22, 31, 2, "#f2d58a") +
      '<path d="m55 87 11 8m-11 0 11-8" stroke="#b88852"/>',
  ),
  tako: shape(
    path("M59 10 97 48 62 83 23 47Z", "#e9bd66") +
      path("m59 10 3 73 35-35Z", "#d98870") +
      '<path d="m23 47 74 1M62 83c-20 10 15 14-1 24m0-19 12 4m-13 7-10 1"/>',
  ),
  lantern: shape(
    '<path d="M43 27c0-24 34-24 34 0" stroke="#657c66" stroke-width="5"/>' +
      rect(33, 36, 54, 58, 9, "#f4ce70") +
      path("m31 36 13-16h32l13 16Z", "#6c9381") +
      rect(30, 92, 60, 11, 5, "#6c9381") +
      '<path d="M44 47v33m32-33v33" stroke="#fff2b7" stroke-width="5"/>' +
      ellipse(60, 67, 8, 14, "#fff5c9"),
  ),
  telescope: shape(
    '<path d="m60 64-22 43m22-43 22 43m-22-43v43" stroke="#a47a50" stroke-width="5"/><g transform="rotate(-28 60 40)">' +
      rect(24, 25, 65, 29, 6, "#82a69d") +
      rect(78, 20, 15, 39, 4, "#e2bb69") +
      rect(14, 31, 14, 16, 3, "#e2bb69") +
      "</g>",
  ),
  sofa: shape(
    rect(20, 38, 80, 52, 18, "#c77e6c") +
      rect(32, 29, 56, 41, 13, "#dc9a83") +
      rect(31, 66, 59, 27, 8, "#e1a18a") +
      rect(14, 58, 22, 35, 9, "#c77e6c") +
      rect(86, 58, 22, 35, 9, "#c77e6c") +
      '<path d="M28 94v11m63-11v11m-31-68v25"/>',
  ),
  koya: shape(
    rect(24, 49, 72, 55, 3, "#d4a46c") +
      path("M12 51 60 12l48 39Z", "#5e8973") +
      rect(51, 69, 24, 35, 2, "#89694b") +
      rect(32, 64, 12, 15, 2, "#b7d2bf") +
      '<path d="M25 85h25m26 0h19M25 95h25m26 0h19M68 86h1"/>',
  ),
  map: shape(
    path("m13 25 32-9 32 12 30-9-6 78-30 8-31-12-32 9Z", "#f1d898") +
      '<path d="m45 16-5 77m37-65-6 77" stroke="#c39d60" stroke-width="2"/><path d="M23 80c-3-45 36-34 40-20s33 12 25-10" stroke="#a77b4b" stroke-dasharray="3 7"/>' +
      path(
        "m84 41 13 13m-12 0 12-13",
        "none",
        'stroke="#bc7255" stroke-width="4"',
      ) +
      leaf(26, 40, 0.45),
  ),
  chest: shape(
    rect(20, 49, 80, 49, 6, "#c08c54") +
      path("M20 54V42c0-26 80-26 80 0v12Z", "#e5b766") +
      '<path d="M36 27v70m47-70v70" stroke="#f0d58c" stroke-width="8"/>' +
      rect(50, 50, 20, 25, 3, "#f7d577") +
      circle(60, 61, 3, ink) +
      path("m61 8 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z", "#f9d986", 'stroke="none"'),
  ),
  bag: shape(
    '<path d="M42 31c-2-22 36-22 35 0" stroke="#795f44" stroke-width="6"/>' +
      rect(23, 27, 75, 79, 20, "#c99456") +
      rect(31, 61, 58, 37, 9, "#e7b974") +
      path("M22 40q0-22 38-22t38 22l-10 24H32Z", "#b27e48") +
      rect(52, 52, 16, 20, 3, "#f5d68d") +
      leaf(55, 48, 0.38, "#b5c585"),
  ),
  settings: shape(
    '<path d="m46 22 4-12h20l4 12 13 8 13-2 10 17-9 10v15l9 10-10 17-13-2-13 7-4 12H50l-4-12-13-7-13 2-10-17 9-10V55L10 45l10-17 13 2Z" fill="#b2bb9e"/>' +
      circle(60, 62, 21, "#fcf1d4") +
      circle(60, 62, 10, "#829a7d"),
  ),
  speaker: shape(
    path("M19 47h22l27-24v74L41 75H19Z", "#e2b869") +
      '<path d="M83 42q16 18 0 36m12-48q27 30 0 60" stroke-width="5"/>',
  ),
  soundOff: shape(
    path("M15 47h22l27-24v74L37 75H15Z", "#b2bb9e") +
      '<path d="m82 49 22 24m0-24L82 73" stroke-width="5"/>',
  ),
  heart: shape(path("M60 102C-22 54 25-6 60 33c36-39 82 22 0 69Z", "#d78372")),
  heartEmpty: shape(
    path(
      "M60 102C-22 54 25-6 60 33c36-39 82 22 0 69Z",
      "#e4e2cf",
      'stroke="#a7aa91"',
    ),
  ),
  star: shape(
    path(
      "m60 10 14 29 33 5-24 24 6 34-29-16-29 16 6-34-24-24 33-5Z",
      "#edc165",
    ) + '<path d="m44 46 9-3 6-12" stroke="#fff0b8" stroke-width="4"/>',
  ),
  sparkle: shape(
    path("m60 10 12 36 36 14-36 13-12 37-13-37-37-13 37-14Z", "#efd084"),
  ),
  party: shape(
    path("M17 104 34 37l46 45Z", "#e9b864") +
      '<path d="m29 67 22 24m-17-43 35 35M56 38c-3-34 40-25 27-5m-12 20c37 2 20-35 33-34" stroke="#cd826c" stroke-width="5"/>' +
      circle(27, 19, 5, "#8fb6a0") +
      circle(98, 65, 5, "#8fb6a0") +
      path("m93 85 8 4m-55-73 4 7", "none"),
  ),
  moon: shape(
    path(
      "M83 16C26 12 10 77 51 97c27 13 50-4 55-24-34 12-64-25-23-57Z",
      "#edcb83",
    ) +
      path(
        "m86 36 4 10 11 3-11 4-4 10-4-10-10-4 10-3Z",
        "#e8c772",
        'stroke="none"',
      ),
  ),
  sun: shape(
    circle(60, 60, 27, "#f1ce75") +
      '<path d="M60 8v12m0 80v12M8 60h12m80 0h12M23 23l9 9m56 56 9 9M23 97l9-9m56-56 9-9" stroke="#d9a64f" stroke-width="5"/>',
  ),
  wave: shape(
    '<path d="M10 43q12 20 25 0 12 20 25 0 12 20 25 0 12 20 25 0M10 70q12 20 25 0 12 20 25 0 12 20 25 0 12 20 25 0" stroke="#70a6a3" stroke-width="7"/>',
  ),
  bobber: shape(
    '<path d="M60 23v-18"/>' +
      path("M39 60a21 29 0 0 1 42 0Z", "#e89476") +
      path("M39 60h42c0 38-42 38-42 0Z", "#fff1cf") +
      '<ellipse cx="60" cy="95" rx="39" ry="10" stroke="#aed6cb" stroke-width="3"/>',
  ),
  away: shape(
    rect(26, 39, 71, 60, 10, "#c6ac7d") +
      '<path d="M45 39V26h31v13M43 40v58m34-58v58"/>' +
      rect(47, 52, 29, 24, 3, "#f9e7ba") +
      leaf(59, 72, 0.45),
  ),
  lock: shape(
    '<path d="M36 53V35c0-36 48-36 48 0v18" stroke="#9b9f87" stroke-width="10"/>' +
      rect(24, 48, 72, 58, 11, "#d6c79d") +
      circle(60, 73, 7, ink) +
      '<path d="M60 79v10" stroke-width="6"/>',
  ),
  back: shape('<path d="M69 25 34 60l35 35M35 60h65" stroke-width="10"/>'),
};
art.forest = shape(
  leaf(58, 101, 2, "#8ba66a") +
    leaf(52, 105, 1.8, "#608c69") +
    '<path d="M57 106V50" stroke="#976f46" stroke-width="8"/>',
);
art.fishing = shape(
  '<path d="M20 104 59 14q46 3 42 47" stroke="#b98753" stroke-width="6"/><path d="M59 14q-5 25 16 44v24"/>' +
    path("M66 82q-4 24 10 24t11-24", "#e2ab62") +
    '<path d="M66 87h21" stroke="#fce2b0" stroke-width="6"/>',
);
art.workshop = shape(
  rect(13, 58, 94, 18, 5, "#c69860") +
    '<path d="M29 76v29m64-29v29" stroke="#a67749" stroke-width="9"/><path d="m55 57 19-29" stroke="#b38252" stroke-width="11"/>' +
    path("m58 24 14-15 31 23-12 16Z", "#97aca0"),
);
art.camp = art.tent;
for (const name of ["mugi", "chikuta", "ruru", "memo", "player"]) {
  art[name] = character(name);
  for (const v of ["happy", "worried"])
    art[`${name}-${v}`] = character(name, v);
}
for (const [name, svg] of Object.entries(art))
  await writeFile(new URL(`${name}.svg`, dir), svg + "\n");
// A single original, layered woodland. Paths are drawn to the same coordinate
// system as the interactive residents / destinations, rather than a card grid.
function tree(x, y, s, c = "#64885f", kind = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${ellipse(0, 95, 51, 12, "#49674420")}${path("M-9 98-6 23H9l8 75Z", "#a38552", 'stroke="none"')}${kind ? path("M0-85 55 9H34l31 43H37l32 35H-67l30-35h-27l32-43h-24Z", c, 'stroke="none"') : `<path d="M-62 15c-26-27-9-62 14-63-2-35 40-56 62-32 35-7 54 21 48 42 43 7 38 55 14 66 7 34-40 44-58 27-29 22-65 4-65-22Z" fill="${c}" stroke="none"/><path d="M-45-20q17-25 29-17M12-59q21 0 23 17m-65 54q14 14 32 3m33-33q14 10 23-1" stroke="#e4e9aa" stroke-opacity=".24" stroke-width="6" fill="none"/>`}</g>`;
}
function meadow() {
  let out = "";
  for (let i = 0; i < 100; i++) {
    const x = (i * 163 + 47) % 1200,
      y = 150 + ((i * 89) % 630);
    out +=
      i % 7 === 0
        ? `<g transform="translate(${x} ${y})"><path d="m0 8 3-12m-3 11-7-6m7 6 8-5" stroke="#6c995c" stroke-width="2"/>${ellipse(3, -5, 4, 3, "#f5e6aa")}</g>`
        : ellipse(x, y, 2.5, 1.3, "#72965040");
  }
  return out;
}
const scene = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" fill="none"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#c7dfc8"/><stop offset="1" stop-color="#e6e8ba"/></linearGradient><linearGradient id="land" x2="0" y2="1"><stop stop-color="#b4c88b"/><stop offset="1" stop-color="#92b476"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="#8ebeb0"/><stop offset="1" stop-color="#559c9b"/></linearGradient><pattern id="grain" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="4" r=".8" fill="#466547" opacity=".08"/></pattern></defs><path fill="url(#sky)" d="M0 0h1200v800H0z"/><circle cx="865" cy="86" r="55" fill="#fff2bc"/><path d="M0 193Q180 68 380 156T784 149 1200 130V800H0" fill="#b2c49a"/><path d="M0 251Q271 107 507 217T977 175 1200 249V800H0Z" fill="url(#land)"/>
${[-70, 30, 140, 260, 400, 535, 690, 820, 960, 1100, 1230].map((x, i) => tree(x, 140 + (i % 3) * 19, 0.6 + (i % 3) * 0.13, ["#93ad80", "#809f79", "#769871"][i % 3], i % 3 === 0)).join("")}
<path d="M665 800c-56-98-199-129-172-250s206-93 171-181-215-72-160-175" stroke="#d9c99b" stroke-width="98"/><path d="M497 541Q343 477 189 572M655 368Q830 300 1013 364M560 650Q787 701 964 579" stroke="#d9c99b" stroke-width="51"/>
<path d="M673 800c-56-98-199-129-172-250s206-93 171-181-215-72-160-175" stroke="#eee0b8" stroke-width="62"/><path d="M497 541Q343 477 189 572M655 368Q830 300 1013 364M560 650Q787 701 964 579" stroke="#eee0b8" stroke-width="32"/>
${meadow()}
<path d="M-40 565c68-82 237-119 328-38s38 223-114 222S-95 656-40 565Z" fill="#718e5e"/><path d="M-25 564c90-73 233-98 301-24s22 175-105 177S-72 650-25 564Z" fill="#bdcea0"/><path d="M-20 575c80-64 215-90 278-22s17 145-101 151S-62 649-20 575Z" fill="url(#water)"/>
<g stroke="#cee6ce" stroke-width="3" opacity=".6"><path d="M25 579q45-9 91-1m22 18q52-6 84-1M8 634q52-8 93 0m35 36q35-6 60-1m15-32h31"/></g><g fill="#719972"><ellipse cx="87" cy="655" rx="23" ry="8"/><ellipse cx="216" cy="577" rx="19" ry="7"/></g>
<g stroke="#886e4c" stroke-width="5"><path d="m292 538 6-54m-36 33 56-8m-25 3 5 25"/><path d="m899 519 134 6m-133 2 133 6m-120-19v49m103-48v50"/></g>
${tree(1160, 542, 1.75, "#5b805d")}${tree(110, 353, 1.15, "#74945f")}${tree(1140, 210, 1.3, "#6b8e62", 1)}${tree(22, 70, 1.7, "#587b59")}${tree(1173, 46, 1.6, "#5d825d")}
${tree(-38, 765, 1.5, "#527a5a")}${tree(1168, 799, 1.6, "#628650")}
<path d="M-30 769q141-47 248 11m779-2q136-43 231-3" stroke="#76975a" stroke-width="45"/>
<g fill="#efe0a2">${[45, 126, 1030, 1090, 1130].map((x, i) => `<circle cx="${x}" cy="${754 + (i % 2) * 15}" r="5"/>`).join("")}</g><path fill="url(#grain)" d="M0 0h1200v800H0z"/></svg>`;
await writeFile(new URL("woodland.svg", dir), scene);
await writeFile(
  new URL("art-catalog.json", dir),
  JSON.stringify(Object.keys(art).sort(), null, 2) + "\n",
);
await writeFile(
  new URL("../public/favicon.svg", import.meta.url),
  art.forest + "\n",
);
console.log(
  `Drew ${Object.keys(art).length} original icons / character expressions and woodland.svg`,
);
