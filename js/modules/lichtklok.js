// lichtklok.js — de afleiding in vier stappen: van de lichtklok-driehoek naar
// gamma, van de liggende lichtklok naar de lengtecontractie, dan hetzelfde met
// twee linialen naast elkaar, en tot slot allebei op de ijk-hyperbolen.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Lichtklok-afleiding';
export const onderschrift =
  'E\u00e9n driehoek geeft \u03b3, dezelfde klok liggend geeft de lengtecontractie.';

const BREEDTE = 960;
const HOOGTE = 940;

/** Dezelfde breedteschatting als de labelplaatser in teken.js. */
function schatBreedte(tekst, grootte) {
  const hoofdletters = (tekst.match(/[A-Z\u00c0-\u00de]/g) || []).length;
  return (tekst.length + hoofdletters * 0.22) * grootte * 0.58;
}

/** Houdt alleen de uitwijkplekken over die helemaal binnen de viewBox vallen. */
function ladder(spec, plekken) {
  const uit = plekken.filter(function (p) {
    const b = schatBreedte(spec.tekst, spec.grootte);
    let links = spec.x + p[0];
    if (spec.anker === 'middle') links -= b / 2;
    else if (spec.anker === 'end') links -= b;
    const y = spec.y + p[1];
    return links >= 3 && links + b <= BREEDTE - 3 &&
           y - spec.grootte * 0.8 >= 3 && y + spec.grootte * 0.25 <= HOOGTE - 3;
  });
  if (uit.length) return uit;
  // Niets past: schuif het label dan in elk geval de viewBox in, want half
  // buiten beeld is het onleesbaar zonder dat de plaatser dat merkt.
  const b = schatBreedte(spec.tekst, spec.grootte);
  let links = spec.x;
  if (spec.anker === 'middle') links -= b / 2;
  else if (spec.anker === 'end') links -= b;
  let dx = 0;
  if (links < 3) dx = 3 - links;
  else if (links + b > BREEDTE - 3) dx = BREEDTE - 3 - b - links;
  return [[dx, 0]];
}

const DELEN = [
  { id: 'pythagoras', knop: '1 \u00b7 Driehoek', vaan: 'de lichtklok-driehoek' },
  { id: 'staaf', knop: '2 \u00b7 Liggend', vaan: 'de liggende lichtklok' },
  { id: 'linialen', knop: '3 \u00b7 Twee linialen', vaan: 'twee linialen naast elkaar' },
  { id: 'hyperbolen', knop: '4 \u00b7 Hyperbolen', vaan: 'allebei op de ijk-hyperbool' },
];

export function render(doel) {
  let beta = 0.6;
  let deel = 'pythagoras';
  let fractie = 0;          // waar in de rondgang van het licht we zijn (0..1)
  let speelt = false;
  const open = new Set();   // welke stappen uitgeklapt staan

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Alles uit \u00e9\u00e9n lichtstraal</summary>' +
    '<p>Een lichtklok is twee spiegels met een lichtpuls ertussen. Staat hij ' +
    'stil, dan gaat de puls recht op en neer; rijdt hij, dan moet dezelfde puls ' +
    'een schuine weg afleggen \u2014 en omdat licht altijd even snel gaat, duurt ' +
    'dat langer. Daar komt <b>\u03b3</b> vandaan. Leg dezelfde klok plat en er rolt ' +
    'de <b>lengtecontractie</b> uit. De vier stappen hieronder doen dat voor.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Afleiding van de tijdsdilatatie en de lengtecontractie met een lichtklok',
  });
  vak.appendChild(svg);
  const vaan = document.createElement('div');
  vaan.className = 'vak-vaan';
  vak.appendChild(vaan);
  doel.appendChild(vak);

  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<h3>Stap en snelheid</h3>' +
    '<div class="knoppen" id="lk-delen"></div>' +
    '<div class="regelaar" style="margin-top:10px">' +
    '  <label for="lk-beta">Snelheid: <b id="lk-beta-waarde"></b></label>' +
    '  <input type="range" id="lk-beta" min="0.05" max="0.95" step="0.01" value="0.6" />' +
    '</div>' +
    '<div id="lk-tijdvak">' +
    '  <div class="regelaar">' +
    '    <label for="lk-tijd">Perron-tijd: <b id="lk-tijd-waarde"></b></label>' +
    '    <input type="range" id="lk-tijd" min="0" max="1" step="0.002" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="lk-speel">Afspelen</button>' +
    '    <button class="knop" id="lk-begin">Begin</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const stapPaneel = document.createElement('div');
  stapPaneel.className = 'paneel';
  stapPaneel.innerHTML =
    '<h3 id="lk-stap-kop">Stap voor stap</h3><div class="formules" id="lk-stappen"></div>';
  zijkolom.appendChild(stapPaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De lichtklok-driehoek naar Takeuchi, "An Illustrated Guide to Relativity", ' +
    'hoofdstuk 3; de twee linialen naar Einstein, "Relativity", hoofdstuk 12 ' +
    '\u2014 in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  const deelVak = paneel.querySelector('#lk-delen');
  const betaSchuif = paneel.querySelector('#lk-beta');
  const betaWaarde = paneel.querySelector('#lk-beta-waarde');
  const tijdVak = paneel.querySelector('#lk-tijdvak');
  const tijdSchuif = paneel.querySelector('#lk-tijd');
  const tijdWaarde = paneel.querySelector('#lk-tijd-waarde');
  const speelKnop = paneel.querySelector('#lk-speel');
  const beginKnop = paneel.querySelector('#lk-begin');
  const stapKop = stapPaneel.querySelector('#lk-stap-kop');
  const stapVak = stapPaneel.querySelector('#lk-stappen');

  // --- Gedeelde tekenhulpjes ---------------------------------------------
  function kop(labels, tekst, x, y, kleur) {
    const spec = {
      tekst: tekst, x: x, y: y, grootte: 16, kleur: kleur,
      gewicht: 650, prioriteit: 94, anker: 'start',
    };
    spec.verschuif = ladder(spec, [[0, 0], [0, 20], [0, -20], [0, 40]]);
    labels.voegToe(spec);
  }
  function merk(labels, tekst, x, y, kleur, opties) {
    const o = opties || {};
    const spec = {
      tekst: tekst, x: x, y: y, grootte: o.grootte || 14.5, kleur: kleur,
      gewicht: o.gewicht || 600, prioriteit: o.prioriteit || 60,
      anker: o.anker || 'start', cursief: !!o.cursief,
    };
    spec.verschuif = ladder(spec, o.plekken ||
      [[0, 0], [0, 20], [0, -20], [0, 40], [0, -40], [0, 60], [0, -60]]);
    labels.voegToe(spec);
  }
  function spiegel(x, y, breedte) {
    return T.el('line', {
      x1: x - breedte / 2, y1: y, x2: x + breedte / 2, y2: y,
      stroke: 'var(--perron)', 'stroke-width': 5, 'stroke-linecap': 'round',
    });
  }
  function puls(x, y) {
    return T.el('circle', {
      cx: x, cy: y, r: 7.5, fill: 'var(--gebeurtenis)',
      stroke: 'var(--kaart)', 'stroke-width': 1.5,
    });
  }
  /** Hoogte van de puls tussen twee spiegels, als fractie 0..1 heen en weer. */
  function pendel(fase) {
    const heen = fase % 2;
    return heen <= 1 ? heen : 2 - heen;
  }

  // --- Deel 1: de driehoek ------------------------------------------------
  function tekenPythagoras(g, labels) {
    // De rijdende klok moet met zijn hele rondgang in beeld passen; bij hoge
    // snelheid legt hij meer af, dus wordt de klok zelf kleiner getekend.
    const Lpx = Math.max(90, Math.min(320, 620 / (2 * beta * g)));
    // De hele rondgang midden in beeld leggen; bij lage snelheid schuift de
    // klok nauwelijks op, bij hoge juist bijna de volle breedte.
    const reis = 2 * beta * g * Lpx;
    const x0 = Math.max(110, (BREEDTE - reis - 60) / 2);
    // De twee banden hangen om een vaste middellijn, zodat een kleinere klok
    // (bij hoge snelheid) niet onderin de band blijft plakken.
    const middenA = 252, middenB = 712;
    const bodemA = middenA + Lpx / 2, bodemB = middenB + Lpx / 2;
    const topA = bodemA - Lpx, topB = bodemB - Lpx;
    const tMax = 2 * g;
    const t = fractie * tMax;

    kop(labels, 'Klok die stilstaat \u2014 het licht gaat recht op en neer', 24, 40, 'var(--perron)');
    kop(labels, 'Dezelfde klok, rijdend met ' + F.nl(beta, 2) + 'c \u2014 het licht gaat schuin',
        24, Math.max(470, topB - 46), 'var(--trein)');

    [[bodemA, 'a'], [bodemB, 'b']].forEach(function (rij) {
      svg.appendChild(T.el('line', {
        x1: 24, y1: rij[0] + 30, x2: BREEDTE - 24, y2: rij[0] + 30,
        stroke: 'var(--rand-sterk)', 'stroke-width': 1.5, 'stroke-dasharray': '6 6',
      }));
    });

    // Stilstaande klok
    svg.appendChild(T.el('line', {
      x1: x0, y1: bodemA, x2: x0, y2: topA,
      stroke: 'var(--licht)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4',
    }));
    svg.appendChild(spiegel(x0, bodemA, 54));
    svg.appendChild(spiegel(x0, topA, 54));
    const hA = pendel(t);
    svg.appendChild(puls(x0, bodemA - hA * Lpx));
    merk(labels, 'L', x0 - 16, (bodemA + topA) / 2 + 5, 'var(--eigentijd)',
         { anker: 'end', grootte: 16, prioriteit: 80 });
    const tikkenA = Math.floor(t + 1e-9);
    merk(labels, tikkenA + (tikkenA === 1 ? ' tik' : ' tikken'),
         BREEDTE - 40, bodemA - Lpx / 2, 'var(--perron)',
         { anker: 'end', grootte: 30, gewicht: 650, prioriteit: 86,
           plekken: [[0, 0], [0, 40], [0, -40]] });
    merk(labels, 'elke tik is \u00e9\u00e9n keer L/c', BREEDTE - 40, bodemA - Lpx / 2 + 26,
         'var(--tekst-zacht)', { anker: 'end', grootte: 13.5, gewicht: 400, prioriteit: 64,
           plekken: [[0, 0], [0, 22], [0, -66], [0, 44]] });

    // Rijdende klok: eerst de driehoek van de eerste etappe
    const xEind = x0 + beta * g * Lpx;
    svg.appendChild(T.el('line', {
      x1: x0, y1: bodemB, x2: xEind, y2: bodemB,
      stroke: 'var(--trein)', 'stroke-width': 3, 'stroke-dasharray': '7 4',
    }));
    svg.appendChild(T.el('line', {
      x1: xEind, y1: bodemB, x2: xEind, y2: topB,
      stroke: 'var(--eigentijd)', 'stroke-width': 3,
    }));
    svg.appendChild(T.el('line', {
      x1: x0, y1: bodemB, x2: xEind, y2: topB,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 3,
    }));
    svg.appendChild(T.el('path', {
      d: 'M ' + (xEind - 16) + ' ' + bodemB + ' L ' + (xEind - 16) + ' ' + (bodemB - 16) +
         ' L ' + xEind + ' ' + (bodemB - 16),
      fill: 'none', stroke: 'var(--tekst-zacht)', 'stroke-width': 1.2,
    }));
    labels.blokkeerSchuin({ x1: x0, y1: bodemB, x2: xEind, y2: topB, dikte: 12 });
    labels.blokkeerLijn({ x1: x0, y1: bodemB, x2: xEind, y2: bodemB, dikte: 12 });
    labels.blokkeerLijn({ x1: xEind, y1: bodemB, x2: xEind, y2: topB, dikte: 12 });

    merk(labels, 'v\u00b7\u0394t', (x0 + xEind) / 2, bodemB + 24, 'var(--trein)',
         { anker: 'middle', grootte: 15.5, prioriteit: 82,
           plekken: [[0, 0], [0, 20], [0, -46], [70, 0], [-70, 0]] });
    merk(labels, 'L', xEind + 14, (bodemB + topB) / 2 + 5, 'var(--eigentijd)',
         { grootte: 16, prioriteit: 84,
           plekken: [[0, 0], [0, -22], [0, 22], [-28 - 14, 0], [0, -44]] });
    merk(labels, 'c\u00b7\u0394t', (x0 + xEind) / 2 - 22, (bodemB + topB) / 2 - 10, 'var(--gebeurtenis)',
         { anker: 'end', grootte: 15.5, prioriteit: 86,
           plekken: [[0, 0], [0, -24], [-24, 0], [0, -48], [0, 24], [-48, 0]] });

    // De afgelegde weg van de puls tot nu toe
    const spoor = T.el('g');
    for (let k = 0; k * g < t - 1e-9; k++) {
      const tVan = k * g, tTot = Math.min((k + 1) * g, t);
      const yVan = k % 2 === 0 ? bodemB : topB;
      const yTot = k % 2 === 0 ? topB : bodemB;
      const deelFractie = (tTot - tVan) / g;
      spoor.appendChild(T.el('line', {
        x1: x0 + beta * tVan * Lpx, y1: yVan,
        x2: x0 + beta * tTot * Lpx, y2: yVan + (yTot - yVan) * deelFractie,
        stroke: 'var(--gebeurtenis)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4',
      }));
    }
    svg.appendChild(spoor);

    // En de klok zelf op zijn huidige plek
    const xk = x0 + beta * t * Lpx;
    svg.appendChild(T.el('line', {
      x1: xk, y1: bodemB, x2: xk, y2: topB,
      stroke: 'var(--licht)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4',
    }));
    svg.appendChild(spiegel(xk, bodemB, 54));
    svg.appendChild(spiegel(xk, topB, 54));
    const hB = pendel(t / g);
    svg.appendChild(puls(xk, bodemB - hB * Lpx));
    const tikkenB = Math.floor(t / g + 1e-9);
    merk(labels, tikkenB + (tikkenB === 1 ? ' tik' : ' tikken'),
         BREEDTE - 40, bodemB - Lpx / 2, 'var(--trein)',
         { anker: 'end', grootte: 30, gewicht: 650, prioriteit: 85,
           plekken: [[0, 0], [0, 40], [0, -40]] });
    merk(labels, 'deze klok staat op ' + F.nl(t / g, 2) + ' \u00d7 L/c',
         BREEDTE - 40, bodemB - Lpx / 2 + 26, 'var(--tekst-zacht)',
         { anker: 'end', grootte: 13.5, gewicht: 400, prioriteit: 63,
           plekken: [[0, 0], [0, 22], [0, -66], [0, 44]] });

    merk(labels, 'perron-tijd t = ' + F.nl(t, 2) + ' \u00d7 L/c', BREEDTE - 24, 40,
         'var(--tekst-zacht)', { anker: 'end', prioriteit: 70 });
    merk(labels, 'dezelfde spiegelafstand L, dezelfde lichtsnelheid',
         BREEDTE - 24, Math.max(470, topB - 46), 'var(--tekst-zacht)',
         { anker: 'end', grootte: 13.5, gewicht: 400, prioriteit: 68 });
  }

  // --- Deel 2: de liggende lichtklok --------------------------------------
  function tekenStaaf(g, labels) {
    const L0px = Math.max(110, Math.min(300, 620 / (2 * beta * g + 1 / g)));
    const Lpx = L0px / g;
    const t1 = (1 / g) / (1 - beta);          // heen, in eenheden L0/c
    const t2 = (1 / g) / (1 + beta);          // terug
    const tMax = t1 + t2;                     // samen 2 gamma
    const t = fractie * tMax;
    const xA = 120, yA = 180;
    const xB = 120, yB = 430;

    kop(labels, 'De staaf in rust \u2014 eigen lengte L\u2080, heen en terug duurt 2 \u00d7 L\u2080/c',
        24, 42, 'var(--eigentijd)');
    kop(labels, 'Dezelfde staaf, rijdend met ' + F.nl(beta, 2) +
        'c \u2014 heen duurt langer dan terug', 24, 300, 'var(--trein)');

    function staaf(x, y, lengte, kleur) {
      svg.appendChild(T.el('line', {
        x1: x, y1: y, x2: x + lengte, y2: y,
        stroke: kleur, 'stroke-width': 5, 'stroke-linecap': 'round',
      }));
      [x, x + lengte].forEach(function (rand) {
        svg.appendChild(T.el('line', {
          x1: rand, y1: y - 30, x2: rand, y2: y + 30,
          stroke: 'var(--perron)', 'stroke-width': 4, 'stroke-linecap': 'round',
        }));
      });
      labels.blokkeerLijn({ x1: x, y1: y, x2: x + lengte, y2: y, dikte: 26 });
    }

    // Staaf in rust: de puls doet er per etappe precies L0/c over
    staaf(xA, yA, L0px, 'var(--eigentijd)');
    const faseA = t % 2;
    svg.appendChild(puls(xA + (faseA <= 1 ? faseA : 2 - faseA) * L0px, yA));
    merk(labels, 'L\u2080', xA + L0px / 2, yA - 44, 'var(--eigentijd)',
         { anker: 'middle', grootte: 16, prioriteit: 84,
           plekken: [[0, 0], [0, -22], [0, 66], [90, 0], [-90, 0]] });
    merk(labels, 'rondgangen: ' + Math.floor(t / 2 + 1e-9), xA + L0px + 46, yA + 6,
         'var(--tekst-zacht)', { prioriteit: 66, plekken: [[0, 0], [0, 26], [0, -26]] });

    // Rijdende staaf: korter, en de puls moet de voorkant inhalen
    const achter = xB + beta * t * L0px;
    staaf(achter, yB, Lpx, 'var(--trein)');
    const xPulsB = t <= t1 ? xB + t * L0px : xB + (2 * t1 - t) * L0px;
    svg.appendChild(puls(xPulsB, yB));
    merk(labels, 'L = L\u2080/\u03b3 = ' + F.nl(1 / g, 2) + ' \u00d7 L\u2080',
         achter + Lpx / 2, yB - 44, 'var(--trein)',
         { anker: 'middle', grootte: 15, prioriteit: 84,
           plekken: [[0, 0], [0, -22], [0, 66], [0, -44], [120, 0], [-120, 0]] });
    merk(labels, t <= t1 ? 'heen: de voorkant rijdt weg, het licht moet hem inhalen'
                         : 'terug: de achterkant komt het licht tegemoet',
         24, yB + 74, 'var(--gebeurtenis)',
         { prioriteit: 72, plekken: [[0, 0], [0, 24], [0, -140]] });

    // Twee tijdbalken op dezelfde schaal: hoe lang duurt de rondgang?
    kop(labels, 'Hoe lang duurt die rondgang?', 24, 600, 'var(--tekst)');
    const balkVan = 150, balkTot = BREEDTE - 120;
    const perTijd = (balkTot - balkVan) / tMax;
    const balkA = 700, balkB = 812;

    svg.appendChild(T.el('line', {
      x1: balkVan, y1: balkA, x2: balkVan + 2 * perTijd, y2: balkA,
      stroke: 'var(--eigentijd)', 'stroke-width': 11, 'stroke-linecap': 'round',
    }));
    labels.blokkeerLijn({ x1: balkVan, y1: balkA, x2: balkVan + 2 * perTijd, y2: balkA, dikte: 22 });
    merk(labels, 'in rust: 2,00 \u00d7 L\u2080/c', balkVan, balkA - 24,
         'var(--eigentijd)', { prioriteit: 80, plekken: [[0, 0], [0, -24], [0, -48]] });

    svg.appendChild(T.el('line', {
      x1: balkVan, y1: balkB, x2: balkVan + t1 * perTijd, y2: balkB,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 11, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('line', {
      x1: balkVan + t1 * perTijd, y1: balkB, x2: balkTot, y2: balkB,
      stroke: 'var(--blauw)', 'stroke-width': 11, 'stroke-linecap': 'round',
    }));
    labels.blokkeerLijn({ x1: balkVan, y1: balkB, x2: balkTot, y2: balkB, dikte: 22 });
    svg.appendChild(T.el('line', {
      x1: balkVan + t * perTijd, y1: balkB - 21, x2: balkVan + t * perTijd, y2: balkB + 21,
      stroke: 'var(--perron)', 'stroke-width': 2.5,
    }));
    svg.appendChild(T.el('line', {
      x1: balkVan + Math.min(t, 2) * perTijd, y1: balkA - 21,
      x2: balkVan + Math.min(t, 2) * perTijd, y2: balkA + 21,
      stroke: 'var(--perron)', 'stroke-width': 2.5,
    }));
    merk(labels, 'rijdend: ' + F.nl(tMax, 2) + ' \u00d7 L\u2080/c', balkVan, balkB - 24,
         'var(--trein)', { prioriteit: 80, plekken: [[0, 0], [0, -24], [0, -48]] });
    merk(labels, 'heen t\u2081 = ' + F.nl(t1, 2), balkVan + t1 * perTijd / 2, balkB + 32,
         'var(--gebeurtenis)', { anker: 'middle', prioriteit: 78,
           plekken: [[0, 0], [0, 24], [0, -60], [0, 48]] });
    merk(labels, 'terug t\u2082 = ' + F.nl(t2, 2), balkVan + (t1 + t2 / 2) * perTijd, balkB + 32,
         'var(--blauw)', { anker: 'middle', prioriteit: 77,
           plekken: [[0, 0], [0, 24], [0, -60], [0, 48]] });
    merk(labels, 'Dezelfde rondgang, \u03b3 = ' + F.nl(g, 3) + ' keer zo lang \u2014 en de klok ' +
         'die meereist telt gewoon 2,00. Daar komt L = L\u2080/\u03b3 uit.',
         24, 890, 'var(--tekst-zacht)',
         { grootte: 13.5, gewicht: 400, prioriteit: 62, plekken: [[0, 0], [0, 24], [0, -48]] });
  }

  // --- Deel 3: twee linialen ----------------------------------------------
  function tekenLinialen(g, labels) {
    const startX = 120, eindX = 860;
    const eenheid = (eindX - startX) / 1.35;
    const naarX = function (u) { return startX + u * eenheid; };

    function liniaal(y, kleur, naam, onder) {
      svg.appendChild(T.el('line', {
        x1: naarX(0), y1: y, x2: naarX(1.3), y2: y,
        stroke: kleur, 'stroke-width': 2,
      }));
      labels.blokkeerLijn({ x1: naarX(0), y1: y, x2: naarX(1.3), y2: y, dikte: 14 });
      for (let k = 0; k <= 13; k++) {
        const u = k / 10;
        const lang = k % 2 === 0;
        svg.appendChild(T.el('line', {
          x1: naarX(u), y1: y - (lang ? 8 : 5), x2: naarX(u), y2: y + (lang ? 8 : 5),
          stroke: kleur, 'stroke-width': lang ? 1.8 : 1,
        }));
        if (lang) {
          merk(labels, F.nl(u, 1), naarX(u), y + (onder ? 26 : -14), kleur,
               { anker: 'middle', grootte: 13, gewicht: 400, prioriteit: 40,
                 plekken: [[0, 0], [0, onder ? 18 : -18]] });
        }
      }
      merk(labels, naam, naarX(1.3) + 12, y + 5, kleur,
           { grootte: 15, prioriteit: 88, plekken: [[0, 0], [0, -22], [0, 22]] });
    }

    function paar(yBoven, yOnder, titel, kleurBoven, kleurOnder, lengteBoven, lengteOnder,
                  naamBoven, naamOnder, labelBoven, labelOnder) {
      kop(labels, titel, 24, yBoven - 74, 'var(--tekst)');
      liniaal(yBoven, kleurBoven, naamBoven, false);
      liniaal(yOnder, kleurOnder, naamOnder, true);
      // De staaf op beide linialen, elk met zijn eigen uitkomst
      svg.appendChild(T.el('line', {
        x1: naarX(0), y1: yBoven + 20, x2: naarX(lengteBoven), y2: yBoven + 20,
        stroke: 'var(--gebeurtenis)', 'stroke-width': 8, 'stroke-linecap': 'round',
      }));
      svg.appendChild(T.el('line', {
        x1: naarX(0), y1: yOnder - 20, x2: naarX(lengteOnder), y2: yOnder - 20,
        stroke: 'var(--eigentijd)', 'stroke-width': 8, 'stroke-linecap': 'round',
      }));
      merk(labels, labelBoven, naarX(lengteBoven / 2), yBoven + 44, 'var(--gebeurtenis)',
           { anker: 'middle', prioriteit: 82, plekken: [[0, 0], [0, 22], [0, -46], [120, 0]] });
      merk(labels, labelOnder, naarX(lengteOnder / 2), yOnder - 32, 'var(--eigentijd)',
           { anker: 'middle', prioriteit: 82, plekken: [[0, 0], [0, -22], [0, 46], [120, 0]] });
      // Verbindingen tussen dezelfde twee fysieke uiteinden
      svg.appendChild(T.el('line', {
        x1: naarX(0), y1: yBoven + 20, x2: naarX(0), y2: yOnder - 20,
        stroke: 'var(--tekst-licht)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
      }));
      svg.appendChild(T.el('line', {
        x1: naarX(lengteBoven), y1: yBoven + 20, x2: naarX(lengteOnder), y2: yOnder - 20,
        stroke: 'var(--tekst-licht)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
      }));
    }

    paar(214, 384, 'De staaf hoort bij de trein \u2014 het perron leest hem af',
         'var(--perron)', 'var(--trein)', 1 / g, 1,
         'x (perron)', 'x\u2032 (trein)',
         'perron meet L = ' + F.nl(1 / g, 3), 'de staaf zelf: L\u2080 = 1,000');

    svg.appendChild(T.el('line', {
      x1: 24, y1: 520, x2: BREEDTE - 24, y2: 520,
      stroke: 'var(--rand)', 'stroke-width': 2,
    }));

    paar(700, 870, 'En andersom \u2014 nu hoort de staaf bij het perron',
         'var(--trein)', 'var(--perron)', 1 / g, 1,
         'x\u2032 (trein)', 'x (perron)',
         'trein meet L = ' + F.nl(1 / g, 3), 'de staaf zelf: L\u2080 = 1,000');
  }

  // --- Deel 4: allebei op de hyperbool ------------------------------------
  function tekenHyperbolen(g, labels) {
    const MARGE = { boven: 40, onder: 54, links: 70, rechts: 70 };
    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const tekenH = HOOGTE - MARGE.boven - MARGE.onder;
    // Zoveel bereik dat de ijkpunten op (gamma, beta*gamma) ruim passen, met
    // een strookje verleden eronder zodat de oorsprong niet op de rand ligt.
    const bereik = Math.max(2.1, 1.3 * g);
    const onderIn = 0.18 * bereik;
    const ctSpan = bereik + onderIn;
    const xSpan = ctSpan * tekenB / tekenH;
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-onderIn, -onderIn + xSpan],
      yBereik: [-onderIn, bereik],
      marge: MARGE,
    });
    const xMin = schaal.xBereik[0], xMax = schaal.xBereik[1];
    const ctMin = schaal.yBereik[0], ctMax = schaal.yBereik[1];
    const xAs = schaal.naarY(0), yAs = schaal.naarX(0);

    labels.blokkeer({ links: 0, boven: 0, breedte: 250, hoogte: 34 });

    // Lichtlijn en assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(0), y1: schaal.naarY(0),
      x2: schaal.naarX(Math.min(xMax, ctMax)), y2: schaal.naarY(Math.min(xMax, ctMax)),
      stroke: 'var(--licht)', 'stroke-width': 1.5, 'stroke-dasharray': '7 5',
    }));
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(xMin), y1: xAs, x2: schaal.naarX(xMax), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2.2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(ctMin), x2: yAs, y2: schaal.naarY(ctMax),
      stroke: 'var(--perron)', 'stroke-width': 2.2,
    }));
    labels.blokkeerLijn({ x1: schaal.naarX(xMin), y1: xAs, x2: schaal.naarX(xMax), y2: xAs, dikte: 18 });
    labels.blokkeerLijn({ x1: yAs, y1: schaal.naarY(ctMin), x2: yAs, y2: schaal.naarY(ctMax), dikte: 18 });
    merk(labels, 'x', schaal.naarX(xMax) - 6, xAs - 16, 'var(--perron)',
         { anker: 'end', grootte: 17, gewicht: 650, prioriteit: 95 });
    merk(labels, 'ct', yAs + 15, schaal.naarY(ctMax) + 17, 'var(--perron)',
         { grootte: 17, gewicht: 650, prioriteit: 95,
           plekken: [[0, 0], [-52, 0], [0, 20]] });

    // Gekantelde assen van de trein
    [[1, beta, 'x\u2032'], [beta, 1, 'ct\u2032']].forEach(function (as) {
      const rek = Math.min(xMax / as[0], ctMax / as[1]);
      const ex = schaal.naarX(as[0] * rek), ey = schaal.naarY(as[1] * rek);
      svg.appendChild(T.el('line', {
        x1: yAs, y1: xAs, x2: ex, y2: ey,
        stroke: 'var(--trein)', 'stroke-width': 2.2,
      }));
      labels.blokkeerSchuin({ x1: yAs, y1: xAs, x2: ex, y2: ey, dikte: 11 });
      const rx = ex - yAs, ry = ey - xAs, lengte = Math.hypot(rx, ry) || 1;
      merk(labels, as[2], ex + (ry / lengte) * 22, ey - (rx / lengte) * 22 + 5, 'var(--trein)',
           { anker: 'middle', grootte: 17, gewicht: 650, prioriteit: 90,
             plekken: [[0, 0], [0, 20], [0, -20], [26, 0], [-26, 0], [0, 40]] });
    });

    // De twee ijk-hyperbolen
    const bogen = T.el('g');
    const punten1 = [], punten2 = [];
    for (let s = -1.6; s <= 1.6; s += 0.02) {
      const ch = Math.cosh(s), sh = Math.sinh(s);
      if (ch <= xMax && sh >= ctMin && sh <= ctMax) {
        punten1.push(schaal.naarX(ch).toFixed(1) + ',' + schaal.naarY(sh).toFixed(1));
      }
      if (ch <= ctMax && sh >= xMin && sh <= xMax) {
        punten2.push(schaal.naarX(sh).toFixed(1) + ',' + schaal.naarY(ch).toFixed(1));
      }
    }
    [punten1, punten2].forEach(function (p) {
      if (p.length > 1) {
        bogen.appendChild(T.el('polyline', {
          points: p.join(' '), fill: 'none', stroke: 'var(--licht)',
          'stroke-width': 1.4, 'stroke-dasharray': '2 5',
        }));
      }
    });
    svg.appendChild(bogen);
    merk(labels, 'x\u00b2 \u2212 (ct)\u00b2 = 1', schaal.naarX(Math.cosh(0.55)) + 12,
         schaal.naarY(Math.sinh(0.55)), 'var(--tekst-zacht)',
         { cursief: true, grootte: 13.5, gewicht: 400, prioriteit: 20 });
    merk(labels, '(ct)\u00b2 \u2212 x\u00b2 = 1', schaal.naarX(Math.sinh(0.3)) + 14,
         schaal.naarY(Math.cosh(0.3)), 'var(--tekst-zacht)',
         { cursief: true, grootte: 13.5, gewicht: 400, prioriteit: 20,
           plekken: [[0, 0], [0, -22], [0, 22], [0, -44], [0, 44], [0, -66], [0, 66],
                     [60, 0], [60, -22], [60, 22], [0, 88], [0, -88]] });

    // Het ijkpunt van de x'-as geeft de lengte
    const px = g, pct = g * beta, lx = 1 / g;
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(px), y1: schaal.naarY(pct), x2: schaal.naarX(lx), y2: xAs,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 1.8, 'stroke-dasharray': '4 3',
    }));
    svg.appendChild(T.el('circle', {
      cx: schaal.naarX(px), cy: schaal.naarY(pct), r: 6.5,
      fill: 'var(--eigentijd)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
    }));
    svg.appendChild(T.el('circle', {
      cx: schaal.naarX(lx), cy: xAs, r: 6,
      fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
    }));
    // Kort label met hoge voorrang, en de toelichting los eronder: \u00e9\u00e9n lang
    // label vindt bij hoge snelheid nergens meer plek en valt dan h\u00e9\u00e9lemaal weg.
    merk(labels, 'x\u2032 = 1', schaal.naarX(px) + 12, schaal.naarY(pct) + 5,
         'var(--eigentijd)', { grootte: 15, gewicht: 650, prioriteit: 80,
           plekken: [[0, 0], [0, -22], [0, 22], [-80, 0], [0, 44], [0, -44], [0, 66]] });
    merk(labels, 'het eind van de staaf', schaal.naarX(px) + 12, schaal.naarY(pct) + 27,
         'var(--eigentijd)', { grootte: 13, gewicht: 400, prioriteit: 34,
           plekken: [[0, 0], [0, 22], [0, 44], [-200, 0], [0, -66], [0, 66]] });
    merk(labels, 'L = 1/\u03b3 = ' + F.nl(lx, 2), schaal.naarX(lx) + 11, xAs + 44,
         'var(--gebeurtenis)', { grootte: 15, gewicht: 650, prioriteit: 79,
           plekken: [[0, 0], [0, 20], [0, 40], [0, -46], [46, 0], [92, 0]] });

    // Het ijkpunt van de ct'-as geeft de tijd
    const qx = g * beta, qct = g;
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(qx), y1: schaal.naarY(qct), x2: yAs, y2: schaal.naarY(qct),
      stroke: 'var(--accent)', 'stroke-width': 1.8, 'stroke-dasharray': '4 3',
    }));
    svg.appendChild(T.el('circle', {
      cx: schaal.naarX(qx), cy: schaal.naarY(qct), r: 6.5,
      fill: 'var(--accent)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
    }));
    merk(labels, 't\u2032 = 1', schaal.naarX(qx) + 12, schaal.naarY(qct) + 5, 'var(--accent)',
         { grootte: 15, gewicht: 650, prioriteit: 81,
           plekken: [[0, 0], [0, -22], [0, 22], [-80, 0], [0, -44], [0, 44], [0, -66]] });
    merk(labels, '\u00e9\u00e9n tik van de klok', schaal.naarX(qx) + 12, schaal.naarY(qct) + 27,
         'var(--accent)', { grootte: 13, gewicht: 400, prioriteit: 33,
           plekken: [[0, 0], [0, 22], [0, 44], [-190, 0], [0, -66], [0, 66]] });
    merk(labels, '\u0394t = \u03b3 = ' + F.nl(g, 2), yAs - 16, schaal.naarY(qct) - 12,
         'var(--accent)', { anker: 'end', grootte: 15, gewicht: 650, prioriteit: 78,
           plekken: [[0, 0], [0, -20], [0, 26], [-62, 0], [-124, 0], [0, -40]] });

    svg.appendChild(T.gebeurtenis(schaal, { t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 6 }));
    labels.blokkeer({ links: yAs - 12, boven: xAs - 12, breedte: 24, hoogte: 24 });
  }

  // --- De stappen ---------------------------------------------------------
  function stappenVan(g) {
    const b = F.nl(beta, 2);
    const w = F.nl(1 / g, 3);          // wortel(1 - beta^2)
    const L = F.nl(1 / g, 3);
    if (deel === 'pythagoras') {
      return ['Van driehoek naar \u03b3', [
        ['(c\u00b7\u0394t)\u00b2 = L\u00b2 + (v\u00b7\u0394t)\u00b2',
         'Pythagoras op de rechthoekige driehoek: de rode lichtweg is de ' +
         'schuine zijde, de groene spiegelafstand en de gouden verplaatsing ' +
         'zijn de rechthoekszijden.'],
        ['c\u00b2\u00b7\u0394t\u00b2 = L\u00b2 + v\u00b2\u00b7\u0394t\u00b2',
         'Haakjes wegwerken. Aan beide kanten staat nu een \u0394t\u00b2.'],
        ['c\u00b2\u00b7\u0394t\u00b2 \u2212 v\u00b2\u00b7\u0394t\u00b2 = L\u00b2',
         'Alles met \u0394t\u00b2 naar links, zodat het bij elkaar te nemen is.'],
        ['\u0394t\u00b2\u00b7(c\u00b2 \u2212 v\u00b2) = L\u00b2',
         '\u0394t\u00b2 buiten haakjes halen.'],
        ['\u0394t = L / \u221a(c\u00b2 \u2212 v\u00b2)',
         'Delen door (c\u00b2 \u2212 v\u00b2) en de wortel trekken.'],
        ['\u0394t = (L/c) / \u221a(1 \u2212 v\u00b2/c\u00b2)',
         'Een factor c uit de wortel halen; onder de wortel blijft dan ' +
         '1 \u2212 v\u00b2/c\u00b2 staan. Hier: \u221a(1 \u2212 ' + b + '\u00b2) = ' + w + '.'],
        ['\u0394t = \u0394\u03c4 / \u221a(1 \u2212 v\u00b2/c\u00b2)',
         'L/c is de tijd die het licht nodig heeft als de klok stilstaat: ' +
         'de eigen tijd \u0394\u03c4. Dat is precies wat de bovenste klok telt.'],
        ['\u0394t = \u03b3 \u00b7 \u0394\u03c4 = ' + F.nl(g, 3) + ' \u00b7 \u0394\u03c4',
         'En dat is de tijdsdilatatie. Bij ' + b + 'c duurt \u00e9\u00e9n tik van de ' +
         'rijdende klok hier ' + F.nl(g, 3) + ' keer zo lang \u2014 precies het ' +
         'verschil tussen de twee tellers in de tekening.'],
      ]];
    }
    if (deel === 'staaf') {
      const t1 = (1 / g) / (1 - beta), t2 = (1 / g) / (1 + beta);
      return ['Van rondgang naar lengte', [
        ['t = L/(c\u2212v) + L/(c+v)',
         'Heen haalt het licht de wegrijdende voorkant in: de afstand sluit ' +
         'met (c\u2212v). Terug komt de achterkant het licht tegemoet: (c+v). ' +
         'Hier: ' + F.nl(t1, 2) + ' + ' + F.nl(t2, 2) + '.'],
        ['t = 2Lc / (c\u00b2 \u2212 v\u00b2)',
         'Gelijknamig maken en optellen. L is hier de lengte z\u00f3als het perron ' +
         'hem meet \u2014 nog onbekend.'],
        ['\u03c4 = 2L\u2080/c',
         'Dezelfde rondgang, gemeten door een klok die met de staaf meereist. ' +
         'In dat kader staat de staaf stil, dus is het gewoon heen en terug ' +
         'over de eigen lengte.'],
        ['t = \u03b3 \u00b7 \u03c4',
         'Die twee tijden horen bij elkaar via de tijdsdilatatie uit stap 1. ' +
         'De rondgang begint en eindigt op dezelfde plek in de staaf, dus dit ' +
         'mag zonder verdere correctie.'],
        ['2Lc/(c\u00b2\u2212v\u00b2) = \u03b3 \u00b7 2L\u2080/c',
         'Stap 2 en stap 3 ingevuld op hun plek.'],
        ['L = \u03b3\u00b7L\u2080\u00b7(c\u00b2\u2212v\u00b2)/c\u00b2',
         'Losmaken naar L; alleen nog herschikken.'],
        ['L = L\u2080/\u03b3 = ' + L + ' \u00b7 L\u2080',
         '(c\u00b2\u2212v\u00b2)/c\u00b2 is 1/\u03b3\u00b2, dus blijft L\u2080/\u03b3 over. Merk op wat hier ' +
         'gebeurt: de lengtecontractie is geen losse aanname, maar volgt uit ' +
         'de tijdsdilatatie plus de vaste lichtsnelheid.'],
      ]];
    }
    if (deel === 'linialen') {
      return ['Dezelfde staaf, twee linialen', [
        ['staaf: x\u2032 = 0 tot x\u2032 = 1',
         'Leg de staaf langs de x\u2032-as van de trein. Op zijn eigen liniaal ' +
         'loopt hij van 0 tot 1: dat is de groene balk.'],
        ['x = \u03b3(x\u2032 + v\u00b7t\u2032),  t = \u03b3(t\u2032 + v\u00b7x\u2032/c\u00b2)',
         'De omrekening naar het perron. Om een lengte te meten moet je beide ' +
         'uiteinden op hetzelfde perron-moment aflezen, dus zet t = 0.'],
        ['t = 0  \u2192  t\u2032 = \u2212v\u00b7x\u2032/c\u00b2',
         'Voor het perron liggen die twee aflezingen tegelijk; voor de trein ' +
         'niet. Precies daar zit het hele verschil.'],
        ['x = \u03b3\u00b7x\u2032\u00b7(1 \u2212 v\u00b2/c\u00b2) = x\u2032\u00b7\u221a(1 \u2212 v\u00b2/c\u00b2)',
         'Dat invullen en vereenvoudigen. Het begin x\u2032 = 0 blijft 0, het eind ' +
         'x\u2032 = 1 komt uit op ' + F.nl(1 / g, 3) + '.'],
        ['L = ' + F.nl(1 / g, 3) + ' \u2212 0 = ' + F.nl(1 / g, 3),
         'De rode balk op de perron-liniaal. En het onderste plaatje laat zien ' +
         'dat het net zo goed andersom werkt: wie ook meet, ziet de staaf van ' +
         'de ander korter. Dat kan alleen omdat ze het niet eens zijn over ' +
         'welke twee aflezingen gelijktijdig zijn.'],
      ]];
    }
    return ['Allebei van dezelfde kromme', [
      ['x\u00b2 \u2212 (ct)\u00b2 = 1  en  (ct)\u00b2 \u2212 x\u00b2 = 1',
       'Twee hyperbolen. Elk punt erop ligt \u00e9\u00e9n eenheid van de oorsprong, ' +
       'in welk kader je ook meet. Ze doen dus wat een cirkel doet bij een ' +
       'gewone draaiing: de maat vastleggen.'],
      ['x\u2032 = 1 ligt op (\u03b3, \u03b2\u03b3) = (' + F.nl(g, 2) + ', ' + F.nl(beta * g, 2) + ')',
       'Waar de x\u2032-as de ruimte-hyperbool snijdt, ligt het echte eindpunt van ' +
       'de staaf uit stap 2 en 3.'],
      ['L = 1/\u03b3 = ' + F.nl(1 / g, 2),
       'Volg vanaf dat punt de rode lijn omlaag \u2014 evenwijdig aan de ct\u2032-as, ' +
       'want dat is de wereldlijn van het uiteinde \u2014 tot ct = 0. Daar staat ' +
       'de lengte die het perron meet.'],
      ['\u0394t = \u03b3 = ' + F.nl(g, 2),
       'En bij t\u2032 = 1 op de tijd-hyperbool: ga horizontaal naar de ct-as en ' +
       'je leest af hoeveel perron-tijd er in \u00e9\u00e9n tik gaat. Dezelfde twee ' +
       'krommen, twee manieren van aflezen.'],
    ]];
  }

  function vulStappen(g) {
    const [titelTekst, rijen] = stappenVan(g);
    stapKop.textContent = titelTekst;
    stapVak.innerHTML = rijen.map(function (r, i) {
      return '<details class="formule stap"' + (open.has(deel + i) ? ' open' : '') +
        ' data-nr="' + i + '">' +
        '<summary><span class="stap-nr">' + (i + 1) + '</span><code>' + r[0] + '</code></summary>' +
        '<div class="formule-inhoud"><p class="waarom">' + r[1] + '</p></div></details>';
    }).join('');
    stapVak.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        const sleutel = deel + d.getAttribute('data-nr');
        if (d.open) open.add(sleutel); else open.delete(sleutel);
      });
    });
  }

  // --- Tekenen ------------------------------------------------------------
  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const g = F.gamma(beta);
    const labels = T.maakLabelPlaatser();

    if (deel === 'pythagoras') tekenPythagoras(g, labels);
    else if (deel === 'staaf') tekenStaaf(g, labels);
    else if (deel === 'linialen') tekenLinialen(g, labels);
    else tekenHyperbolen(g, labels);

    svg.appendChild(labels.tekenAlles());

    const huidig = DELEN.find(function (d) { return d.id === deel; });
    vaan.textContent = huidig.vaan;
    vaan.style.color = 'var(--tekst-zacht)';
    const beweegt = deel === 'pythagoras' || deel === 'staaf';
    tijdVak.style.display = beweegt ? '' : 'none';
    tijdWaarde.textContent = F.nl(fractie * 2 * g, 2) + ' \u00d7 L/c';
    vulStappen(g);
  }

  // --- Bediening ----------------------------------------------------------
  DELEN.forEach(function (d) {
    const knop = document.createElement('button');
    knop.className = 'knop klein' + (d.id === deel ? ' aan' : '');
    knop.textContent = d.knop;
    knop.addEventListener('click', function () {
      deel = d.id;
      deelVak.querySelectorAll('button').forEach(function (k) {
        k.classList.toggle('aan', k === knop);
      });
      teken();
    });
    deelVak.appendChild(knop);
  });

  betaSchuif.addEventListener('input', function () {
    beta = parseFloat(betaSchuif.value);
    betaWaarde.textContent = F.nl(beta, 2) + 'c';
    teken();
  });
  tijdSchuif.addEventListener('input', function () {
    fractie = parseFloat(tijdSchuif.value);
    teken();
  });
  beginKnop.addEventListener('click', function () {
    fractie = 0;
    tijdSchuif.value = '0';
    teken();
  });
  speelKnop.addEventListener('click', function () {
    speelt = !speelt;
    speelKnop.classList.toggle('aan', speelt);
    speelKnop.textContent = speelt ? 'Pauze' : 'Afspelen';
    if (speelt) stap(null);
  });

  let vorigeTijd = null;
  function stap(nu) {
    if (!speelt) { vorigeTijd = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorigeTijd = null; return; }
    if (nu !== null && vorigeTijd !== null) {
      // Eén volledige rondgang duurt ongeveer vier seconden, ongeacht gamma
      fractie += (nu - vorigeTijd) / 4000;
      if (fractie > 1) fractie -= 1;
      tijdSchuif.value = String(fractie);
      teken();
    }
    vorigeTijd = nu;
    requestAnimationFrame(stap);
  }

  betaWaarde.textContent = F.nl(beta, 2) + 'c';
  teken();
}
