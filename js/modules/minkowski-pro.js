// minkowski-pro.js — het Minkowski-diagram met beide assenstelsels tegelijk:
// dat van het kader waaruit je kijkt (recht) en dat van het andere kader
// (gekanteld), met de ijk-hyperbolen die beide stelsels dezelfde maat geven.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Minkowski-diagram Pro';
export const onderschrift =
  'Twee assenstelsels in \u00e9\u00e9n tekening, met de ijk-hyperbool als gemeenschappelijke maatlat.';

const BREEDTE = 960;
const HOOGTE = 940;
const MARGE = { boven: 36, onder: 48, links: 64, rechts: 66 };

// Hoogte van het venster in ct-eenheden bij zoom 1. Bij hoge snelheid liggen
// de ijkpunten verder van de oorsprong, dus dan moet het venster ruimer.
function basisSpan(gammaWaarde) {
  return Math.max(5.8, 2.4 * gammaWaarde);
}

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
  return uit.length ? uit : [[0, 0]];
}

export function render(doel) {
  let beta = 0.6;
  let vanuitTrein = false;       // vanuit welk kader kijk je?
  let toonHyperbolen = true;
  let zoom = 1;
  const verschuif = { x: 0, ct: 0 };   // pannen, in natuurkundige eenheden
  const open = new Set();              // welke formulekaarten uitgeklapt staan
  let vorigePan = { x: 0, y: 0 };

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>De ijk-hyperbool is de maatlat</summary>' +
    '<p>Het rechte assenstelsel is dat van het kader waaruit je kijkt, het ' +
    'gekantelde dat van het andere. Wat in beide stelsels dezelfde maat geeft ' +
    'is de <b>ijk-hyperbool</b>: elk punt erop ligt \u00e9\u00e9n eenheid van de oorsprong, ' +
    'in welk kader je ook meet. Daar zijn <b>1/\u03b3</b> en <b>\u03b3</b> rechtstreeks van af ' +
    'te lezen. Draai het kader om en je ziet hetzelfde beeld gespiegeld.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Minkowski-diagram met twee assenstelsels en ijk-hyperbolen',
  });
  vak.appendChild(svg);

  const vaan = document.createElement('div');
  vaan.className = 'vak-vaan';
  vak.appendChild(vaan);

  // Zoombalkje linksonder in het vak; knijpen kan ook, rechtstreeks op de SVG
  const zoomBalk = document.createElement('div');
  zoomBalk.className = 'zoom-overlay onder';
  zoomBalk.innerHTML =
    '<button id="mp-uit" aria-label="Uitzoomen">\u2212</button>' +
    '<span id="mp-zoom">1,00\u00d7</span>' +
    '<button id="mp-in" aria-label="Inzoomen">+</button>' +
    '<button id="mp-terug">terug</button>';
  vak.appendChild(zoomBalk);
  doel.appendChild(vak);

  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<h3>Instellingen</h3>' +
    '<div class="regelaar">' +
    '  <label for="mp-beta">Snelheid van de trein: <b id="mp-beta-waarde"></b></label>' +
    '  <input type="range" id="mp-beta" min="0.05" max="0.95" step="0.01" value="0.6" />' +
    '</div>' +
    '<div class="knoppen" style="margin-top:6px">' +
    '  <button class="knop" id="mp-kader">\u21c4 Kijk vanuit de trein</button>' +
    '  <button class="knop aan" id="mp-hyper">IJk-hyperbolen</button>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const formulePaneel = document.createElement('div');
  formulePaneel.className = 'paneel';
  formulePaneel.innerHTML = '<h3>Formules \u2014 tik voor de afleiding</h3><div class="formules" id="mp-formules"></div>';
  zijkolom.appendChild(formulePaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De Lorentz-transformatie volgt Einstein, "Relativity", hoofdstuk 11; de ' +
    'meetkundige lezing met ijk-hyperbolen volgt Takeuchi, "An Illustrated Guide ' +
    'to Relativity", hoofdstuk 5 \u2014 in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  const betaSchuif = paneel.querySelector('#mp-beta');
  const betaWaarde = paneel.querySelector('#mp-beta-waarde');
  const kaderKnop = paneel.querySelector('#mp-kader');
  const hyperKnop = paneel.querySelector('#mp-hyper');
  const formuleVak = formulePaneel.querySelector('#mp-formules');
  const zoomTekst = zoomBalk.querySelector('#mp-zoom');

  function kaderNaam() { return vanuitTrein ? 'de trein' : 'het perron'; }
  function anderNaam() { return vanuitTrein ? 'het perron' : 'de trein'; }

  // --- Tekenen -----------------------------------------------------------
  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = F.gamma(beta);
    // Het andere kader beweegt vanuit hier gezien met +beta of -beta,
    // afhankelijk van waar je staat. Verder is de tekening identiek: dat is
    // precies wat de omkeerknop laat zien.
    const bAnder = vanuitTrein ? -beta : beta;

    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const tekenH = HOOGTE - MARGE.boven - MARGE.onder;
    const span = basisSpan(g) / zoom;
    // Het venster wordt zo neergelegd dat beide ijkpunten erin passen. Kijk je
    // vanuit het andere kader, dan kantelt de x'-as omlaag en ligt zijn ijkpunt
    // in het verleden; zonder deze verschuiving valt het buiten beeld.
    const middenCt = (g + Math.min(0, g * bAnder)) / 2;
    const ctMin = middenCt - span / 2 + verschuif.ct;
    const ctMax = ctMin + span;
    const xSpan = span * tekenB / tekenH;
    const xMin = -xSpan / 2 + verschuif.x;
    const xMax = xMin + xSpan;

    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [xMin, xMax], yBereik: [ctMin, ctMax],
      marge: MARGE,
    });
    const labels = T.maakLabelPlaatser();
    const linkerRand = schaal.naarX(xMin), rechterRand = schaal.naarX(xMax);
    const bovenRand = schaal.naarY(ctMax), onderRand = schaal.naarY(ctMin);
    const xAs = schaal.naarY(0), yAs = schaal.naarX(0);
    const pxPerEenheid = tekenB / xSpan;

    // Linksboven staat het vaantje, rechtsonder het zoombalkje: allebei HTML
    // over de tekening heen, dus de plaatser moet die hoeken bezet weten.
    labels.blokkeer({ links: 0, boven: 0, breedte: 250, hoogte: 34 });
    labels.blokkeer({ links: 0, boven: HOOGTE - 46, breedte: 250, hoogte: 46 });

    const defs = T.el('defs');
    const clip = T.el('clipPath', { id: 'mp-vlak' });
    clip.appendChild(T.el('rect', {
      x: linkerRand, y: bovenRand,
      width: rechterRand - linkerRand, height: onderRand - bovenRand,
    }));
    defs.appendChild(clip);
    svg.appendChild(defs);
    const lijnen = T.el('g', { 'clip-path': 'url(#mp-vlak)' });
    svg.appendChild(lijnen);

    // Lichtkegel: in beide kaders dezelfde 45 graden. Draai het kader om en
    // deze lijnen blijven staan waar ze staan; dat is het hele punt.
    lijnen.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)', naarVerleden: true }));

    // --- IJk-hyperbolen -------------------------------------------------
    // (ct)^2 - x^2 = k^2 ijkt de tijdassen, x^2 - (ct)^2 = k^2 de ruimteassen.
    // Samen doen ze wat een cirkel doet bij een gewone draaiing: de eenheid
    // vastleggen, ongeacht hoe het assenstelsel gedraaid staat.
    if (toonHyperbolen) {
      const bogen = T.el('g');
      for (const k of [1, 2]) {
        const doorzicht = k === 1 ? 1 : 0.4;
        // Tijdachtig: ct = +/- sqrt(k^2 + x^2), over de zichtbare x-breedte
        [1, -1].forEach(function (richting) {
          const punten = [];
          for (let x = xMin; x <= xMax + 1e-9; x += xSpan / 200) {
            const ct = richting * Math.sqrt(k * k + x * x);
            if (ct < ctMin - 1 || ct > ctMax + 1) continue;
            punten.push(schaal.naarX(x).toFixed(1) + ',' + schaal.naarY(ct).toFixed(1));
          }
          if (punten.length > 1) {
            bogen.appendChild(T.el('polyline', {
              points: punten.join(' '), fill: 'none', stroke: 'var(--licht)',
              'stroke-width': 1.2, 'stroke-dasharray': '2 5', opacity: doorzicht,
            }));
          }
        });
        // Ruimteachtig: x = +/- sqrt(k^2 + (ct)^2), over de zichtbare hoogte
        [1, -1].forEach(function (richting) {
          const punten = [];
          for (let ct = ctMin; ct <= ctMax + 1e-9; ct += span / 200) {
            const x = richting * Math.sqrt(k * k + ct * ct);
            if (x < xMin - 1 || x > xMax + 1) continue;
            punten.push(schaal.naarX(x).toFixed(1) + ',' + schaal.naarY(ct).toFixed(1));
          }
          if (punten.length > 1) {
            bogen.appendChild(T.el('polyline', {
              points: punten.join(' '), fill: 'none', stroke: 'var(--licht)',
              'stroke-width': 1.2, 'stroke-dasharray': '2 5', opacity: doorzicht,
            }));
          }
        });
      }
      lijnen.appendChild(bogen);
    }

    // --- Assen van het kader waaruit je kijkt ----------------------------
    const rechtKleur = vanuitTrein ? 'var(--trein)' : 'var(--perron)';
    const schuinKleur = vanuitTrein ? 'var(--perron)' : 'var(--trein)';
    svg.appendChild(T.el('line', {
      x1: linkerRand, y1: xAs, x2: rechterRand, y2: xAs,
      stroke: rechtKleur, 'stroke-width': 2.2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: bovenRand, x2: yAs, y2: onderRand,
      stroke: rechtKleur, 'stroke-width': 2.2,
    }));
    labels.blokkeerLijn({ x1: linkerRand, y1: xAs, x2: rechterRand, y2: xAs, dikte: 18 });
    labels.blokkeerLijn({ x1: yAs, y1: bovenRand, x2: yAs, y2: onderRand, dikte: 18 });
    labels.voegToe({
      tekst: 'x', x: rechterRand - 6, y: xAs - 16,
      grootte: 17, kleur: rechtKleur, anker: 'end', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 15, y: bovenRand + 17,
      grootte: 17, kleur: rechtKleur, gewicht: 650, prioriteit: 95,
      verschuif: [[0, 0], [-52, 0], [0, 20], [-52, 20]],
    });

    // Tikken op de rechte assen
    const stap = F.netteStap(span / 6);
    for (let n = Math.ceil((ctMin + 0.05) / stap); n * stap <= ctMax - 0.05; n++) {
      const t = n * stap;
      if (Math.abs(t) < 1e-9) continue;
      svg.appendChild(T.el('line', {
        x1: yAs - 6, y1: schaal.naarY(t), x2: yAs + 6, y2: schaal.naarY(t),
        stroke: rechtKleur, 'stroke-width': 1.6,
      }));
      labels.voegToe({
        tekst: F.nl(t, stap < 1 ? 1 : 0), x: yAs - 14, y: schaal.naarY(t) + 5,
        grootte: 14, kleur: rechtKleur, anker: 'end', prioriteit: 45,
        verschuif: [[0, 0], [-18, 0], [-36, 0], [44, 0], [62, 0], [-54, 0], [80, 0]],
      });
    }
    for (let n = Math.ceil((xMin + 0.05) / stap); n * stap <= xMax - 0.05; n++) {
      const x = n * stap;
      if (Math.abs(x) < 1e-9) continue;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(x), y1: xAs - 6, x2: schaal.naarX(x), y2: xAs + 6,
        stroke: rechtKleur, 'stroke-width': 1.6,
      }));
      labels.voegToe({
        tekst: F.nl(x, stap < 1 ? 1 : 0), x: schaal.naarX(x), y: xAs + 27,
        grootte: 14, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 25,
        // Bij lage snelheid ligt de x'-as vlak onder de x-as en is eronder geen
        // plek; net boven de as staat het getal nog bij zijn eigen tik.
        verschuif: [[0, 0], [0, 17], [0, -28], [0, 34], [0, -48]],
      });
    }

    // --- Assen van het andere kader: gekanteld ---------------------------
    // ct'-as is de wereldlijn x' = 0, dus x = beta*ct.
    // x'-as is de gelijktijdigheid t' = 0, dus ct = beta*x.
    // Allebei kantelen ze even ver naar de lichtlijn toe; die lijn is dus de
    // spiegelas, en juist daarom meet iedereen dezelfde lichtsnelheid.
    const assen = [
      { naam: 'ct\u2032', dx: bAnder, dct: 1 },
      { naam: 'x\u2032', dx: 1, dct: bAnder },
    ];
    assen.forEach(function (as) {
      // Van rand tot rand door de oorsprong
      const punten = [];
      [1, -1].forEach(function (richting) {
        const rek = Math.min(
          as.dx === 0 ? Infinity : (as.dx * richting > 0 ? xMax / (as.dx * richting) : xMin / (as.dx * richting)),
          as.dct === 0 ? Infinity : (as.dct * richting > 0 ? ctMax / (as.dct * richting) : ctMin / (as.dct * richting))
        );
        punten.push([as.dx * richting * rek, as.dct * richting * rek]);
      });
      const [a, b] = punten;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(a[0]), y1: schaal.naarY(a[1]),
        x2: schaal.naarX(b[0]), y2: schaal.naarY(b[1]),
        stroke: schuinKleur, 'stroke-width': 2.2,
      }));
      labels.blokkeerSchuin({
        x1: schaal.naarX(a[0]), y1: schaal.naarY(a[1]),
        x2: schaal.naarX(b[0]), y2: schaal.naarY(b[1]), dikte: 11,
      });
      // Naam loodrecht naast het uiteinde in de toekomstrichting
      const eind = a[1] > b[1] ? a : b;
      const ex = schaal.naarX(eind[0]), ey = schaal.naarY(eind[1]);
      const rx = ex - yAs, ry = ey - xAs;
      const lengte = Math.hypot(rx, ry) || 1;
      const naam = {
        tekst: as.naam, x: ex + (ry / lengte) * 22, y: ey - (rx / lengte) * 22 + 5,
        grootte: 17, kleur: schuinKleur, anker: 'middle', gewicht: 650, prioriteit: 90,
      };
      naam.verschuif = ladder(naam, [[0, 0], [0, 20], [0, -20], [28, 0], [-28, 0], [0, 40],
                                     [0, -40], [44, 20], [-44, 20], [56, 0], [-56, 0],
                                     [0, 60], [0, -60]]);
      labels.voegToe(naam);
    });

    // Eenheidsmarkeringen langs de gekantelde assen: stap eenheden eigen maat.
    // Ze liggen verder van de oorsprong dan de rechte tikken, en precies op
    // de ijk-hyperbolen.
    for (let n = 1; n * stap * g <= Math.max(ctMax, xMax) * 1.5; n++) {
      const k = n * stap;
      const plekken = [
        [g * bAnder * k, g * k], [-g * bAnder * k, -g * k],   // langs ct'
        [g * k, g * bAnder * k], [-g * k, -g * bAnder * k],   // langs x'
      ];
      plekken.forEach(function (p) {
        if (p[0] < xMin || p[0] > xMax || p[1] < ctMin || p[1] > ctMax) return;
        svg.appendChild(T.el('circle', {
          cx: schaal.naarX(p[0]), cy: schaal.naarY(p[1]), r: 3.4,
          fill: schuinKleur,
        }));
      });
    }

    // --- Aflezen op de hyperbool -----------------------------------------
    if (toonHyperbolen) {
      // IJkpunt van de x'-as: het punt x'=1 op t'=0. Zijn wereldlijn loopt
      // evenwijdig aan de ct'-as en snijdt de x-as bij 1/gamma: de meetlat
      // van het andere kader, gemeten in dit kader.
      const px = g, pct = g * bAnder;
      const lx = 1 / g;
      if (px >= xMin && px <= xMax && pct >= ctMin && pct <= ctMax) {
        lijnen.appendChild(T.el('line', {
          x1: schaal.naarX(px), y1: schaal.naarY(pct),
          x2: schaal.naarX(lx), y2: xAs,
          stroke: 'var(--gebeurtenis)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3',
        }));
        svg.appendChild(T.el('circle', {
          cx: schaal.naarX(px), cy: schaal.naarY(pct), r: 6,
          fill: 'var(--eigentijd)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
        }));
        svg.appendChild(T.el('circle', {
          cx: schaal.naarX(lx), cy: xAs, r: 5.5,
          fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
        }));
        const merk = {
          tekst: 'x\u2032 = 1', x: schaal.naarX(px) + 12, y: schaal.naarY(pct) + 5,
          grootte: 15, kleur: 'var(--eigentijd)', gewicht: 650, prioriteit: 80, anker: 'start',
        };
        merk.verschuif = ladder(merk, [[0, 0], [0, -20], [0, 20], [-95, 0], [0, -40], [0, 40],
                                       [-95, -20], [-95, 20], [0, 60], [0, -60], [-190, 0]]);
        labels.voegToe(merk);
        // Rechts van de rode stip beginnen: 1/gamma ligt vlak bij de oorsprong,
        // en een gecentreerd label zou daar altijd over de ct-as heen vallen.
        const lengteLabel = {
          tekst: '1/\u03b3 = ' + F.nl(lx, 2), x: schaal.naarX(lx) + 11, y: xAs + 44,
          grootte: 14.5, kleur: 'var(--gebeurtenis)', gewicht: 650, prioriteit: 78, anker: 'start',
        };
        lengteLabel.verschuif = ladder(lengteLabel, [[0, 0], [0, 20], [0, 40], [0, -46],
                                                     [46, 0], [46, 20], [92, 0], [0, 60]]);
        labels.voegToe(lengteLabel);
      }

      // IJkpunt van de ct'-as: t'=1. Horizontaal (gelijktijdig in dit kader)
      // naar de ct-as toe geeft gamma: zoveel tijd is hier verstreken terwijl
      // die klok er één telde.
      const qx = g * bAnder, qct = g;
      if (qx >= xMin && qx <= xMax && qct >= ctMin && qct <= ctMax) {
        lijnen.appendChild(T.el('line', {
          x1: schaal.naarX(qx), y1: schaal.naarY(qct),
          x2: yAs, y2: schaal.naarY(qct),
          stroke: 'var(--accent)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3',
        }));
        svg.appendChild(T.el('circle', {
          cx: schaal.naarX(qx), cy: schaal.naarY(qct), r: 6,
          fill: 'var(--accent)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
        }));
        const merk = {
          tekst: 't\u2032 = 1', x: schaal.naarX(qx) + 12, y: schaal.naarY(qct) + 5,
          grootte: 15, kleur: 'var(--accent)', gewicht: 650, prioriteit: 79, anker: 'start',
        };
        merk.verschuif = ladder(merk, [[0, 0], [0, -20], [0, 20], [-95, 0], [0, -40], [0, 40],
                                       [-95, -20], [-95, 20], [0, 60], [0, -60], [-190, 0]]);
        labels.voegToe(merk);
        const tijdLabel = {
          tekst: '\u03b3 = ' + F.nl(g, 2), x: yAs - 16, y: schaal.naarY(qct) - 10,
          grootte: 14.5, kleur: 'var(--accent)', gewicht: 650, prioriteit: 77, anker: 'end',
        };
        tijdLabel.verschuif = ladder(tijdLabel, [[0, 0], [0, -18], [0, 24], [0, -36], [0, 42],
                                                 [-62, 0], [-62, -18], [-62, 24], [-124, 0],
                                                 [-124, -20], [0, -56], [0, 60]]);
        labels.voegToe(tijdLabel);
      }

      // Naam van de krommen, op een rustige plek langs de rechterboog
      const bx = Math.sqrt(1 + 0.42 * 0.42), bct = 0.42;
      if (bx <= xMax && bct >= ctMin) {
        const naam = {
          tekst: 'x\u00b2 \u2212 (ct)\u00b2 = 1', x: schaal.naarX(bx) + 10, y: schaal.naarY(bct) + 5,
          grootte: 13.5, kleur: 'var(--tekst-zacht)', cursief: true, prioriteit: 18, anker: 'start',
        };
        naam.verschuif = ladder(naam, [[0, 0], [0, 22], [0, -22], [0, 44], [0, -44], [0, 66],
                                      [70, 0], [70, 22], [-70, 44], [0, 88], [140, 0]]);
        labels.voegToe(naam);
      }
      const ax = -0.42, act = Math.sqrt(1 + 0.42 * 0.42);
      if (ax >= xMin && act <= ctMax) {
        const naam = {
          tekst: '(ct)\u00b2 \u2212 x\u00b2 = 1', x: schaal.naarX(ax) - 10, y: schaal.naarY(act) - 8,
          grootte: 13.5, kleur: 'var(--tekst-zacht)', cursief: true, prioriteit: 17, anker: 'end',
        };
        naam.verschuif = ladder(naam, [[0, 0], [0, -22], [0, 22], [0, -44], [0, 44], [0, 66],
                                      [-70, 0], [-70, -22], [70, -44], [0, 88], [0, -66]]);
        labels.voegToe(naam);
      }
    }

    // De oorsprong: hier vallen beide assenstelsels samen
    svg.appendChild(T.gebeurtenis(schaal, { t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 6 }));
    labels.blokkeer({ links: yAs - 12, boven: xAs - 12, breedte: 24, hoogte: 24 });

    svg.appendChild(labels.tekenAlles());

    vaan.textContent = 'kader van ' + kaderNaam();
    vaan.style.color = rechtKleur;
    zoomTekst.textContent = F.nl(zoom, 2) + '\u00d7';
    kaderKnop.textContent = '\u21c4 Kijk vanuit ' + anderNaam();
    vulFormules(g);
    return pxPerEenheid;
  }

  // --- Formules met afleiding -------------------------------------------
  function vulFormules(g) {
    const b = F.nl(beta, 2);
    // Vanuit de trein gezien beweegt het andere kader de andere kant op, dus
    // dan staat er overal een minteken bij beta.
    const bAnder = vanuitTrein ? -beta : beta;
    const bA = F.nl(bAnder, 2);
    const kaders = kaderNaam() + ' \u2194 ' + anderNaam();
    const kaarten = [
      {
        naam: 'Lorentzfactor',
        formule: '\u03b3 = 1/\u221a(1 \u2212 \u03b2\u00b2)',
        som: '\u03b3 = 1/\u221a(1 \u2212 ' + b + '\u00b2) = ' + F.nl(g, 4),
        waarom:
          'Licht legt in elk kader per tijdseenheid evenveel afstand af. Een klok ' +
          'die met \u03b2 meebeweegt laat het licht schuin lopen in plaats van recht, en ' +
          'die schuine weg is langer: per eenheid eigen tijd verstrijkt er hier een ' +
          'factor \u03b3 meer. Uit de stelling van Pythagoras op die schuine weg volgt ' +
          '1 = \u03b3\u00b2(1 \u2212 \u03b2\u00b2), en dus \u03b3 = 1/\u221a(1 \u2212 \u03b2\u00b2). In de tekening is \u03b3 de ' +
          'factor waarmee de ijkpunten van het gekantelde stelsel verder van de ' +
          'oorsprong liggen dan die van het rechte.',
      },
      {
        naam: 'Kanteling van de assen',
        formule: 'ct\u2032-as: x = \u03b2\u00b7ct \u00a0\u00a0 x\u2032-as: ct = \u03b2\u00b7x',
        som: 'hier \u03b2 = ' + bA + ', dus een hoek van ' +
             F.nl(Math.abs(Math.atan(bAnder)) * 180 / Math.PI, 1) +
             '\u00b0 met de eigen as, voor beide assen dezelfde kant op',
        waarom:
          'De ct\u2032-as is de verzameling gebeurtenissen op x\u2032 = 0, dus de wereldlijn ' +
          'van het meebewegende punt zelf: x = \u03b2\u00b7ct. De x\u2032-as is de verzameling ' +
          'gebeurtenissen op t\u2032 = 0, dus alles wat in dat kader gelijktijdig is met ' +
          'de oorsprong: vul t\u2032 = \u03b3(t \u2212 \u03b2x) = 0 in en er staat ct = \u03b2\u00b7x. Beide assen ' +
          'draaien even ver naar de lichtlijn toe, van weerskanten. Die lijn is dus ' +
          'de spiegelas, en dat is de meetkundige vorm van: iedereen meet dezelfde ' +
          'lichtsnelheid.',
      },
      {
        naam: 'Lorentz-transformatie',
        formule: 'x\u2032 = \u03b3(x \u2212 \u03b2\u00b7ct) \u00a0\u00a0 ct\u2032 = \u03b3(ct \u2212 \u03b2\u00b7x)',
        som: 'terug gaat met +\u03b2: x = \u03b3(x\u2032 + \u03b2\u00b7ct\u2032), ct = \u03b3(ct\u2032 + \u03b2\u00b7x\u2032)',
        waarom:
          'Dit is dezelfde omrekening als hierboven, maar dan als formule in plaats ' +
          'van als tekening. Hij moet aan drie dingen voldoen: recht blijft recht ' +
          '(geen versnelling), de oorsprong blijft de oorsprong, en de lichtlijn ' +
          'x = ct moet op x\u2032 = ct\u2032 uitkomen. De enige omrekening die dat alle drie ' +
          'doet is deze, met precies die \u03b3 ervoor. Het omdraaien van het kader is ' +
          'niets anders dan \u03b2 vervangen door \u2212\u03b2 (' + kaders + ').',
      },
      {
        naam: 'IJk-hyperbool',
        formule: '(ct)\u00b2 \u2212 x\u00b2 = 1 \u00a0 en \u00a0 x\u00b2 \u2212 (ct)\u00b2 = 1',
        som: 'de ijkpunten liggen op (\u03b2\u03b3, \u03b3) = (' + F.nl(bAnder * g, 2) + ', ' +
             F.nl(g, 2) + ') en (\u03b3, \u03b2\u03b3) = (' + F.nl(g, 2) + ', ' + F.nl(bAnder * g, 2) + ')',
        waarom:
          'Bij een gewone draaiing blijft x\u00b2 + y\u00b2 gelijk, en een cirkel legt daarom ' +
          'de eenheid vast voor elk gedraaid assenstelsel. In de ruimtetijd blijft ' +
          'niet de som maar het verschil (ct)\u00b2 \u2212 x\u00b2 gelijk \u2014 het invariante interval ' +
          '\u2014 en dus neemt een hyperbool de rol van de cirkel over. Elk punt op de ' +
          'hyperbool ligt \u00e9\u00e9n eenheid van de oorsprong, in welk kader je ook meet. ' +
          'Daar waar een as de hyperbool snijdt, ligt dus zijn eigen "1".',
      },
      {
        naam: 'Lengtecontractie',
        formule: 'L = L\u2080/\u03b3',
        som: 'L = 1/' + F.nl(g, 3) + ' = ' + F.nl(1 / g, 3) + ' (rode stip op de x-as)',
        waarom:
          'Neem een meetlat van \u00e9\u00e9n eenheid in het andere kader. Zijn rechteruiteinde ' +
          'is het punt x\u2032 = 1, en dat ligt waar de x\u2032-as de ruimte-hyperbool snijdt. ' +
          'Om die lat hier te meten moet je beide uiteinden op hetzelfde moment van ' +
          'dit kader aflezen, dus op ct = 0. Volg daarom de wereldlijn van dat ' +
          'uiteinde \u2014 de rode streepjeslijn, evenwijdig aan de ct\u2032-as \u2014 omlaag naar ' +
          'de x-as: daar staat 1/\u03b3. Korter dus, en het zit hem volledig in het ' +
          'woordje "gelijktijdig".',
      },
      {
        naam: 'Tijdsdilatatie',
        formule: '\u0394t = \u03b3\u00b7\u03c4',
        som: '\u03c4 = 1 op de bewegende klok \u2192 \u0394t = ' + F.nl(g, 3) + ' hier',
        waarom:
          'Het punt t\u2032 = 1 op de ct\u2032-as is de gebeurtenis "die klok tikt \u00e9\u00e9n". Lees ' +
          'af wanneer dat hier gebeurt door horizontaal naar de ct-as te gaan \u2014 ' +
          'horizontaal, want dat is wat gelijktijdig betekent in dit kader. Je komt ' +
          'uit op ct = \u03b3. Er is hier dus meer tijd verstreken dan daar. Draai het ' +
          'kader om en hetzelfde gebeurt andersom: de tekening spiegelt, en beiden ' +
          'hebben gelijk, omdat ze het over verschillende paren gebeurtenissen hebben.',
      },
      {
        naam: 'Wederkerigheid',
        formule: 'beide kaders zien dezelfde \u03b3',
        som: 'vanuit ' + kaderNaam() + ' beweegt ' + anderNaam() + ' met ' +
             (vanuitTrein ? '\u2212' : '') + b + 'c',
        waarom:
          'Er is geen kader dat "echt stilstaat", dus moet de tekening er vanuit ' +
          'beide kanten hetzelfde uitzien \u2014 en dat doet hij: met de omkeerknop ' +
          'kantelt hetzelfde beeld de andere kant op. Allebei zien ze elkaars ' +
          'meetlat korter en elkaars klok langzamer. Dat is geen tegenspraak, want ' +
          '"tegelijk" betekent voor allebei iets anders: de x-as en de x\u2032-as zijn ' +
          'verschillende lijnen in dezelfde tekening.',
      },
    ];

    formuleVak.innerHTML = kaarten.map(function (k, i) {
      return '<details class="formule"' + (open.has(i) ? ' open' : '') + ' data-nr="' + i + '">' +
        '<summary><span class="naam">' + k.naam + '</span></summary>' +
        '<div class="formule-inhoud"><div class="formule-regel">' + k.formule + '</div>' +
        '<div class="som">' + k.som + '</div>' +
        '<p class="waarom">' + k.waarom + '</p></div></details>';
    }).join('');
    formuleVak.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        const nr = Number(d.getAttribute('data-nr'));
        if (d.open) open.add(nr); else open.delete(nr);
      });
    });
  }

  // --- Bediening ---------------------------------------------------------
  betaSchuif.addEventListener('input', function () {
    beta = parseFloat(betaSchuif.value);
    betaWaarde.textContent = F.nl(beta, 2) + 'c';
    teken();
  });
  kaderKnop.addEventListener('click', function () {
    vanuitTrein = !vanuitTrein;
    kaderKnop.classList.toggle('aan', vanuitTrein);
    teken();
  });
  hyperKnop.addEventListener('click', function () {
    toonHyperbolen = !toonHyperbolen;
    hyperKnop.classList.toggle('aan', toonHyperbolen);
    teken();
  });

  // Knijpen en slepen op de tekening zelf. De helper koppelt de
  // touch-handlers met passive:false, anders blijft de pagina meescrollen.
  const bediening = T.koppelZoomEnPan(svg, {
    minZoom: 0.5, maxZoom: 4,
    opWijziging: function (stand) {
      const g = F.gamma(beta);
      const tekenH = HOOGTE - MARGE.boven - MARGE.onder;
      const span = basisSpan(g) / stand.zoom;
      const pxPerEenheid = tekenH / span;
      // De helper geeft de totale verschuiving; hier is alleen het verschil
      // sinds de vorige melding bruikbaar, want de schaal verandert onderweg.
      const dx = stand.panX - vorigePan.x, dy = stand.panY - vorigePan.y;
      vorigePan = { x: stand.panX, y: stand.panY };
      zoom = stand.zoom;
      verschuif.x -= dx / pxPerEenheid;
      verschuif.ct += dy / pxPerEenheid;
      teken();
    },
  });

  zoomBalk.querySelector('#mp-in').addEventListener('click', function () {
    zoom = Math.min(4, zoom * 1.35); teken();
  });
  zoomBalk.querySelector('#mp-uit').addEventListener('click', function () {
    zoom = Math.max(0.5, zoom / 1.35); teken();
  });
  zoomBalk.querySelector('#mp-terug').addEventListener('click', function () {
    zoom = 1; verschuif.x = 0; verschuif.ct = 0;
    vorigePan = { x: 0, y: 0 };
    bediening.reset();
  });

  betaWaarde.textContent = F.nl(beta, 2) + 'c';
  teken();
}
