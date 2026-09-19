// gelijktijdigheid.js — de trein met de lichtflits.
// Midden in de trein gaat een lamp aan. Vanaf het perron gezien rijdt de
// achterkant het licht tegemoet en loopt de voorkant ervoor weg, dus wordt
// de achterkant eerder geraakt. In de trein zelf leggen beide stralen even
// veel af en komen ze tegelijk aan. Hetzelfde verhaal, twee antwoorden op
// de vraag wat "tegelijk" is.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Gelijktijdigheid';
export const onderschrift =
  'Eén flits in het midden van de trein. Vanaf het perron raakt hij de achterkant ' +
  'eerder, in de trein allebei de kanten tegelijk. Speel de tijd af en kijk wat de ' +
  'drie klokken doen.';

const BREEDTE = 960;
const HOOGTE = 940;
const MARGE = { links: 56, rechts: 56 };

// Het diagram bestaat uit drie banden onder elkaar: twee tonelen en een
// grafiek. Alle hoogtes staan hier, zodat ze in één oogopslag kloppen.
// Elke rij tekst heeft een eigen hoogte, anders vechten de klokstanden, de
// snelheidspijl en het flitslabel om dezelfde strook. De naam boven en de
// stand onder een klok volgen uit het middelpunt plus KLOK_STRAAL.
const PERRON = {
  titel: 36, klok: 128, pijl: 192,
  dak: 214, vloer: 274, rail: 293, flits: 321, eigenKlok: 348,
};
const TREIN = {
  titel: 402, samen: 428, klok: 470,
  dak: 552, vloer: 612, rail: 631, grond: 653,
};
const GRAFIEK = { titel: 700, boven: 726, onder: 876 };

const KLOK_STRAAL = 26;

export function render(doel) {
  let beta = 0.6;      // snelheid van de trein
  let L = 1.0;         // eigen lengte van de trein, in lichtseconden
  let t = 0;           // perrontijd
  let speelt = false;

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Twee beelden van dezelfde flits</summary>' +
    '<p>Midden in de trein gaat een lamp aan. Op het <b>perron</b> rijdt de ' +
    'achterkant het licht tegemoet en loopt de voorkant ervoor weg, dus wordt de ' +
    'achterkant eerder geraakt. In de <b>trein</b> is de afstand naar beide kanten ' +
    'gelijk en komt het licht tegelijk aan. Beide beelden horen bij hetzelfde moment ' +
    'van de middenklok; ze verschillen in wat er verder "tegelijk" heet.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'De trein met de lichtflits, gezien vanaf het perron en vanuit de trein',
  });
  vak.appendChild(svg);
  doel.appendChild(vak);

  // Alles wat geen diagram is, staat rechts onder elkaar in de zijkolom
  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<h3>Instellingen</h3>' +
    '<div class="regelaars">' +
    '  <div class="regelaar">' +
    '    <label for="gt-beta">Snelheid van de trein: <b id="gt-beta-w"></b></label>' +
    '    <input type="range" id="gt-beta" min="0.1" max="0.95" step="0.01" value="0.6" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="gt-lengte">Eigen lengte van de trein: <b id="gt-lengte-w"></b></label>' +
    '    <input type="range" id="gt-lengte" min="0.4" max="2" step="0.05" value="1" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="gt-tijd">Tijd op de perronklok: <b id="gt-tijd-w"></b></label>' +
    '    <input type="range" id="gt-tijd" min="0" max="1" step="0.001" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="gt-speel">Afspelen</button>' +
    '    <button class="knop" id="gt-flits">Begin</button>' +
    '    <button class="knop" id="gt-inhaal">Inhaalmoment</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const duiding = document.createElement('div');
  duiding.className = 'paneel';
  zijkolom.appendChild(duiding);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Naar Einstein, "Relativity", hoofdstuk 9 — hier met één flits in het midden, ' +
    'in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  /** Alle afgeleide grootheden bij de huidige v en L. Hangt niet van t af,
   *  zodat het toneel niet verspringt terwijl je de tijd afspeelt. */
  function opzet() {
    const g = F.gamma(beta);
    // Het licht raakt de uiteinden; in het treinkader gebeurt dat aan beide
    // kanten op t' = L/2. Terugtransformeren geeft de perrontijden.
    const achter = F.lorentzTerug(L / 2, -L / 2, beta);
    const voor = F.lorentzTerug(L / 2, L / 2, beta);
    const inhaal = F.inhaalmoment(beta, L);
    // De schuif loopt tot voorbij de laatste aankomst, en als het kan ook tot
    // voorbij het inhaalmoment. Bij een lage snelheid ligt dat moment zo ver
    // weg dat meenemen het begin onbruikbaar kort zou maken.
    const tMax = Math.max(1.4 * voor.t,
                          Math.min(1.15 * inhaal, 4 * voor.t));
    return {
      g: g,
      tAchter: achter.t,
      tVoor: voor.t,
      inhaal: inhaal,
      tMax: tMax,
      // Zo breed dat zowel de trein als de twee lichtstralen in beeld blijven
      xGrens: 1.06 * Math.max(L / 2 + beta * tMax, tMax),
      // De grafiek loopt door tot voorbij het inhaalmoment, ook als de schuif
      // daar niet komt: anders is de kruising nergens te zien.
      tGrafiek: Number.isFinite(inhaal) ? Math.max(tMax, 1.12 * inhaal) : tMax,
    };
  }

  /** Eén wijzerplaat met één wijzer: per eenheid ct maakt hij een rondje.
   *  De stand in cijfers komt eronder te staan. */
  function tekenKlok(labels, px, py, stand, kleur, naam, prioriteit, kant) {
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: KLOK_STRAAL,
      fill: 'var(--kaart)', stroke: kleur, 'stroke-width': 2.4,
    }));
    svg.appendChild(T.el('line', {
      x1: px, y1: py - KLOK_STRAAL + 3, x2: px, y2: py - KLOK_STRAAL + 8,
      stroke: kleur, 'stroke-width': 2,
    }));
    const hoek = ((stand % 1) + 1) % 1 * 2 * Math.PI - Math.PI / 2;
    svg.appendChild(T.el('line', {
      x1: px, y1: py,
      x2: px + Math.cos(hoek) * (KLOK_STRAAL - 7),
      y2: py + Math.sin(hoek) * (KLOK_STRAAL - 7),
      stroke: kleur, 'stroke-width': 2.6, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('circle', { cx: px, cy: py, r: 2.6, fill: kleur }));
    labels.blokkeer({
      links: px - KLOK_STRAAL - 2, boven: py - KLOK_STRAAL - 2,
      breedte: KLOK_STRAAL * 2 + 4, hoogte: KLOK_STRAAL * 2 + 4,
    });
    if (kant === 'rechts') {
      labels.voegToe({
        tekst: F.nl(stand, 2), x: px + KLOK_STRAAL + 12, y: py + 6,
        grootte: 16, kleur: kleur, gewicht: 650, prioriteit: prioriteit,
        verschuif: [[0, 0], [0, -20], [0, 20]],
      });
      if (naam) {
        labels.voegToe({
          tekst: naam, x: px + KLOK_STRAAL + 12, y: py - 14,
          grootte: 13, kleur: 'var(--tekst-zacht)', prioriteit: prioriteit - 20,
          verschuif: [[0, 0], [0, -16], [70, 0]],
        });
      }
      return;
    }
    labels.voegToe({
      tekst: F.nl(stand, 2), x: px, y: py + KLOK_STRAAL + 20,
      grootte: 15, kleur: kleur, anker: 'middle', gewicht: 650,
      prioriteit: prioriteit,
      verschuif: [[0, 0], [0, 17], [-34, 0], [34, 0]],
    });
    if (naam) {
      labels.voegToe({
        tekst: naam, x: px, y: py - KLOK_STRAAL - 14,
        grootte: 13, kleur: 'var(--tekst-zacht)', anker: 'middle',
        prioriteit: prioriteit - 20,
        verschuif: [[0, 0], [0, -16], [-40, 0], [40, 0]],
      });
    }
  }

  /** De wagon zelf: een bak met twee wielen. */
  function tekenWagon(labels, schaal, xAchter, xVoor, band) {
    const links = schaal.naarX(xAchter), rechts = schaal.naarX(xVoor);
    svg.appendChild(T.el('rect', {
      x: links, y: band.dak, width: Math.max(rechts - links, 2),
      height: band.vloer - band.dak, rx: 9,
      fill: 'var(--trein-vlak)', stroke: 'var(--trein)', 'stroke-width': 2.4,
    }));
    labels.blokkeer({
      links: links, boven: band.dak,
      breedte: Math.max(rechts - links, 2), hoogte: band.vloer - band.dak,
    });
    const wielR = Math.min(9, (rechts - links) / 5);
    if (wielR >= 4) {
      [0.26, 0.74].forEach(function (f) {
        svg.appendChild(T.el('circle', {
          cx: links + (rechts - links) * f, cy: band.vloer + wielR + 1, r: wielR,
          fill: 'var(--kaart)', stroke: 'var(--trein)', 'stroke-width': 2.2,
        }));
      });
    }
  }

  /** De twee lichtstralen vanaf het vertrekpunt, plus een ring waar er al
   *  eentje is aangekomen. */
  function tekenLicht(schaal, xBron, bereik, y, geraakt, ringR) {
    [-1, 1].forEach(function (kant) {
      const xEind = xBron + kant * bereik;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(xBron), y1: y, x2: schaal.naarX(xEind), y2: y,
        stroke: 'var(--licht)', 'stroke-width': 1.8, 'stroke-dasharray': '6 4',
      }));
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xEind), cy: y, r: 6, fill: 'var(--licht)',
      }));
    });
    geraakt.forEach(function (xx) {
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xx), cy: y, r: ringR,
        fill: 'none', stroke: 'var(--gebeurtenis)', 'stroke-width': 3,
      }));
    });
  }

  /** Drie klokposities uit elkaar trekken als de wagon te smal is om ze
   *  naast elkaar te zetten. De verbindingslijntjes wijzen dan de plek aan. */
  function klokPosities(schaal, xen) {
    const echt = xen.map(function (x) { return schaal.naarX(x); });
    // Ruim genoeg dat ook de naampjes onder elkaar vandaan blijven
    const minAf = KLOK_STRAAL * 2 + 24;
    const midden = echt[1];
    if (echt[2] - echt[0] >= minAf * 2) return { getekend: echt, echt: echt };
    return { getekend: [midden - minAf, midden, midden + minAf], echt: echt };
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const labels = T.maakLabelPlaatser();

    // Eén horizontale schaal voor beide tonelen, zodat de lengtes onderling
    // te vergelijken zijn: de trein is op het perron zichtbaar korter.
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-o.xGrens, o.xGrens], yBereik: [0, 1],
      marge: { boven: 0, onder: 0, links: MARGE.links, rechts: MARGE.rechts },
    });
    const tAccent = F.klokstand(t, 0, beta);   // stand van de middenklok

    // ---------- Band 1: het perron-beeld ----------
    labels.voegToe({
      tekst: 'PERRON-BEELD — de trein beweegt', x: MARGE.links, y: PERRON.titel,
      grootte: 15, kleur: 'var(--perron)', gewicht: 650, prioriteit: 95,
    });

    svg.appendChild(T.el('line', {
      x1: MARGE.links, y1: PERRON.rail, x2: BREEDTE - MARGE.rechts, y2: PERRON.rail,
      stroke: 'var(--perron)', 'stroke-width': 2.4,
    }));
    labels.blokkeerLijn({
      x1: MARGE.links, y1: PERRON.rail, x2: BREEDTE - MARGE.rechts, y2: PERRON.rail,
      dikte: 16,
    });

    // Merktekens op het perron
    const xStap = F.netteStap(o.xGrens / 3);
    for (let n = -9; n <= 9; n++) {
      const xx = n * xStap;
      if (Math.abs(xx) > o.xGrens) continue;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(xx), y1: PERRON.rail, x2: schaal.naarX(xx), y2: PERRON.rail + 7,
        stroke: 'var(--perron)', 'stroke-width': 1.6,
      }));
    }

    // De wagon, ingekort met de lorentzfactor
    const halfP = L / (2 * o.g);
    const xMiddenP = beta * t;
    tekenWagon(labels, schaal, xMiddenP - halfP, xMiddenP + halfP, PERRON);

    // Waar de flits vertrok blijft op het perron een vaste plek
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(0), y1: PERRON.dak, x2: schaal.naarX(0), y2: PERRON.rail,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4',
    }));
    labels.blokkeerLijn({
      x1: schaal.naarX(0), y1: PERRON.dak, x2: schaal.naarX(0), y2: PERRON.rail, dikte: 10,
    });
    labels.voegToe({
      tekst: 'hier ging de lamp aan', x: schaal.naarX(0), y: PERRON.flits,
      grootte: 13, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 600,
      prioriteit: 62, verschuif: [[0, 0], [0, 18], [-60, 0], [60, 0], [0, 36]],
    });

    const geraaktP = [];
    if (t >= o.tAchter) geraaktP.push(xMiddenP - halfP);
    if (t >= o.tVoor) geraaktP.push(xMiddenP + halfP);
    const ringP = Math.max(7, Math.min(13, (schaal.naarX(halfP) - schaal.naarX(-halfP)) / 3));
    tekenLicht(schaal, 0, t, (PERRON.dak + PERRON.vloer) / 2, geraaktP, ringP);

    // Pijl met de snelheid boven de wagon
    const pijlY = PERRON.pijl;
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(xMiddenP) + 16, y1: pijlY,
      x2: schaal.naarX(xMiddenP) + 62, y2: pijlY,
      stroke: 'var(--trein)', 'stroke-width': 2.4,
    }));
    svg.appendChild(T.el('polygon', {
      points: (schaal.naarX(xMiddenP) + 72) + ',' + pijlY + ' ' +
              (schaal.naarX(xMiddenP) + 60) + ',' + (pijlY - 5) + ' ' +
              (schaal.naarX(xMiddenP) + 60) + ',' + (pijlY + 5),
      fill: 'var(--trein)',
    }));
    labels.voegToe({
      tekst: 'v = ' + F.nl(beta, 2) + 'c', x: schaal.naarX(xMiddenP) - 16, y: pijlY + 5,
      grootte: 14, kleur: 'var(--trein)', anker: 'end', gewicht: 650, prioriteit: 68,
      verschuif: [[0, 0], [0, -18], [0, 18]],
    });

    // De drie treinklokken zoals het perron ze op dit moment ziet
    const plaatsenP = klokPosities(schaal, [xMiddenP - halfP, xMiddenP, xMiddenP + halfP]);
    [['achter', -L / 2], ['midden', 0], ['voor', L / 2]].forEach(function (k, i) {
      const px = plaatsenP.getekend[i];
      svg.appendChild(T.el('line', {
        x1: px, y1: PERRON.klok + KLOK_STRAAL, x2: plaatsenP.echt[i], y2: PERRON.dak,
        stroke: 'var(--trein)', 'stroke-width': 1.2, opacity: 0.55,
      }));
      tekenKlok(labels, px, PERRON.klok, F.klokstand(t, k[1], beta),
                'var(--trein)', k[0], 80);
    });

    // De perronklok staat links onder de rails. Hij geldt voor het hele perron:
    // in dit kader lopen alle perronklokken gelijk.
    tekenKlok(labels, MARGE.links + KLOK_STRAAL, PERRON.eigenKlok, t,
              'var(--perron)', 'perronklok', 82, 'rechts');

    // ---------- Band 2: het trein-beeld ----------
    labels.voegToe({
      tekst: 'TREIN-BEELD — de trein staat stil, t′ = ' + F.nl(tAccent, 2),
      x: MARGE.links, y: TREIN.titel,
      grootte: 15, kleur: 'var(--trein)', gewicht: 650, prioriteit: 95,
    });

    tekenWagon(labels, schaal, -L / 2, L / 2, TREIN);

    // Het perron glijdt naar links weg; zijn merktekens zijn ingekort
    svg.appendChild(T.el('line', {
      x1: MARGE.links, y1: TREIN.rail, x2: BREEDTE - MARGE.rechts, y2: TREIN.rail,
      stroke: 'var(--perron)', 'stroke-width': 2.4,
    }));
    labels.blokkeerLijn({
      x1: MARGE.links, y1: TREIN.rail, x2: BREEDTE - MARGE.rechts, y2: TREIN.rail,
      dikte: 16,
    });
    const grondStap = xStap / o.g;
    for (let n = -24; n <= 24; n++) {
      const xx = n * grondStap - beta * tAccent;
      if (Math.abs(xx) > o.xGrens) continue;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(xx), y1: TREIN.rail, x2: schaal.naarX(xx), y2: TREIN.rail + 7,
        stroke: 'var(--perron)', 'stroke-width': 1.4, opacity: 0.7,
      }));
    }
    // De plek op het perron waar de lamp aanging, schuift mee naar achteren
    const xFlitsplek = -beta * tAccent;
    if (Math.abs(xFlitsplek) <= o.xGrens) {
      svg.appendChild(T.el('polygon', {
        points: schaal.naarX(xFlitsplek) + ',' + (TREIN.rail + 3) + ' ' +
                (schaal.naarX(xFlitsplek) - 7) + ',' + (TREIN.rail + 17) + ' ' +
                (schaal.naarX(xFlitsplek) + 7) + ',' + (TREIN.rail + 17),
        fill: 'var(--gebeurtenis)',
      }));
      labels.voegToe({
        tekst: 'het perron schuift naar links', x: schaal.naarX(xFlitsplek), y: TREIN.grond,
        grootte: 13, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 45,
        verschuif: [[0, 0], [0, 16]],
      });
    }

    const geraaktT = tAccent >= L / 2 ? [-L / 2, L / 2] : [];
    tekenLicht(schaal, 0, tAccent, (TREIN.dak + TREIN.vloer) / 2, geraaktT, 13);

    // Dezelfde drie klokken, nu in hun eigen kader: ze lopen gelijk
    const plaatsenT = klokPosities(schaal, [-L / 2, 0, L / 2]);
    plaatsenT.getekend.forEach(function (px, i) {
      svg.appendChild(T.el('line', {
        x1: px, y1: TREIN.klok + KLOK_STRAAL, x2: plaatsenT.echt[i], y2: TREIN.dak,
        stroke: 'var(--trein)', 'stroke-width': 1.2, opacity: 0.55,
      }));
      tekenKlok(labels, px, TREIN.klok, tAccent, 'var(--trein)', null, 76);
    });
    labels.voegToe({
      tekst: 'alle drie dezelfde stand', x: plaatsenT.getekend[1], y: TREIN.samen,
      grootte: 13, kleur: 'var(--eigentijd)', anker: 'middle', gewicht: 600,
      prioriteit: 64, verschuif: [[0, 0], [0, -16], [0, -32]],
    });

    // ---------- Band 3: voorsprong op de perronklok ----------
    tekenGrafiek(labels, o);

    svg.appendChild(labels.tekenAlles());
    werkPaneelBij(o);
  }

  /** De klokstanden uitgezet tegen de perrontijd, als voorsprong: de
   *  perronklok is de vlakke nullijn, de drie treinklokken lopen evenwijdig
   *  met een vast verschil ertussen. Waar de achterklok de nullijn kruist,
   *  ligt het inhaalmoment. */
  function tekenGrafiek(labels, o) {
    const voorsprong = function (tt, xAccent) {
      return F.klokstand(tt, xAccent, beta) - tt;
    };
    const yBoven = Math.max(voorsprong(0, -L / 2) * 1.35, 0.02);
    const yOnder = Math.min(voorsprong(o.tGrafiek, L / 2) * 1.08, -0.02);
    const gs = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [0, o.tGrafiek], yBereik: [yOnder, yBoven],
      marge: {
        boven: GRAFIEK.boven, onder: HOOGTE - GRAFIEK.onder,
        links: 66, rechts: 150,
      },
    });

    labels.voegToe({
      tekst: 'VOORSPRONG OP DE PERRONKLOK', x: MARGE.links, y: GRAFIEK.titel,
      grootte: 15, kleur: 'var(--tekst)', gewicht: 650, prioriteit: 95,
    });
    // De kern van deze band, op dezelfde regel als de titel: de drie
    // treinklokken lopen evenwijdig, dus hun onderlinge verschil staat vast.
    labels.voegToe({
      tekst: 'drie evenwijdige lijnen — het verschil hangt niet van de tijd af',
      x: MARGE.links + 300, y: GRAFIEK.titel,
      grootte: 13, kleur: 'var(--tekst-zacht)', prioriteit: 92,
      verschuif: [[0, 0], [0, 18], [0, -18]],
    });

    // Assen
    const nul = gs.naarY(0);
    svg.appendChild(T.el('line', {
      x1: gs.naarX(0), y1: gs.naarY(yOnder), x2: gs.naarX(0), y2: gs.naarY(yBoven),
      stroke: 'var(--perron)', 'stroke-width': 1.8,
    }));
    labels.blokkeerLijn({
      x1: gs.naarX(0), y1: gs.naarY(yOnder), x2: gs.naarX(0), y2: gs.naarY(yBoven),
      dikte: 14,
    });

    const tStap = F.netteStap(o.tGrafiek / 5);
    for (let tt = tStap; tt <= o.tGrafiek + 1e-9; tt += tStap) {
      svg.appendChild(T.el('line', {
        x1: gs.naarX(tt), y1: gs.naarY(yOnder), x2: gs.naarX(tt), y2: gs.naarY(yOnder) + 6,
        stroke: 'var(--perron)', 'stroke-width': 1.4,
      }));
      labels.voegToe({
        tekst: F.nl(tt, 1), x: gs.naarX(tt), y: gs.naarY(yOnder) + 22,
        grootte: 13, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 28,
        verschuif: [[0, 0], [0, 15]],
      });
    }
    const yStap = F.netteStap((yBoven - yOnder) / 6);
    for (let yy = Math.ceil(yOnder / yStap) * yStap; yy <= yBoven + 1e-9; yy += yStap) {
      svg.appendChild(T.el('line', {
        x1: gs.naarX(0) - 6, y1: gs.naarY(yy), x2: gs.naarX(0), y2: gs.naarY(yy),
        stroke: 'var(--perron)', 'stroke-width': 1.4,
      }));
      labels.voegToe({
        // Anders staat er '-0,00' op de nullijn
        tekst: F.nl(Math.abs(yy) < 1e-9 ? 0 : yy, 2), x: gs.naarX(0) - 12, y: gs.naarY(yy) + 5,
        grootte: 13, kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 32,
        verschuif: [[0, 0], [0, -15], [0, 15]],
      });
    }

    // De perronklok is per definitie de nullijn
    svg.appendChild(T.el('line', {
      x1: gs.naarX(0), y1: nul, x2: gs.naarX(o.tGrafiek), y2: nul,
      stroke: 'var(--perron)', 'stroke-width': 2.2,
    }));
    labels.blokkeerLijn({
      x1: gs.naarX(0), y1: nul, x2: gs.naarX(o.tGrafiek), y2: nul, dikte: 12,
    });
    labels.voegToe({
      // De eenheid van de horizontale as, linksonder waar het eerste
      // tikgetal is weggelaten
      tekst: 'perrontijd t', x: gs.naarX(0) + 14, y: gs.naarY(yOnder) + 22,
      grootte: 13, kleur: 'var(--tekst-zacht)', gewicht: 600, prioriteit: 68,
      verschuif: [[0, 0], [0, -20], [60, 0]],
    });
    labels.voegToe({
      tekst: 'perronklok', x: gs.naarX(o.tGrafiek) + 10, y: nul + 5,
      grootte: 13, kleur: 'var(--perron)', gewicht: 650, prioriteit: 75,
      verschuif: [[0, 0], [0, -17], [0, 17]],
    });

    // De drie treinklokken: evenwijdige lijnen, het onderlinge verschil
    // verandert niet met de tijd.
    [['achterklok', -L / 2, 2.8], ['middenklok', 0, 1.8], ['voorklok', L / 2, 1.8]]
      .forEach(function (k) {
        const y0 = voorsprong(0, k[1]), y1 = voorsprong(o.tGrafiek, k[1]);
        svg.appendChild(T.el('line', {
          x1: gs.naarX(0), y1: gs.naarY(y0),
          x2: gs.naarX(o.tGrafiek), y2: gs.naarY(y1),
          stroke: 'var(--trein)', 'stroke-width': k[2], 'stroke-linecap': 'round',
        }));
        labels.blokkeerSchuin({
          x1: gs.naarX(0), y1: gs.naarY(y0),
          x2: gs.naarX(o.tGrafiek), y2: gs.naarY(y1), dikte: 10,
        });
        labels.voegToe({
          tekst: k[0], x: gs.naarX(o.tGrafiek) + 10, y: gs.naarY(y1) + 5,
          grootte: 13, kleur: 'var(--trein)', gewicht: 650, prioriteit: 74,
          verschuif: [[0, 0], [0, -17], [0, 17], [0, -34], [0, 34]],
        });
      });

    // Het inhaalmoment: daar kruist de achterklok de nullijn
    if (Number.isFinite(o.inhaal) && o.inhaal <= o.tGrafiek) {
      svg.appendChild(T.el('circle', {
        cx: gs.naarX(o.inhaal), cy: nul, r: 7,
        fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      labels.voegToe({
        tekst: 'inhaalmoment t = ' + F.nl(o.inhaal, 2),
        x: gs.naarX(o.inhaal) + 12, y: nul - 14,
        grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 650, prioriteit: 86,
        verschuif: [[0, 0], [0, -20], [0, 26], [-24, -38], [0, 44]],
      });
    }

    // Waar staan we nu?
    if (t <= o.tGrafiek) {
      svg.appendChild(T.el('line', {
        x1: gs.naarX(t), y1: gs.naarY(yBoven), x2: gs.naarX(t), y2: gs.naarY(yOnder),
        stroke: 'var(--blauw)', 'stroke-width': 1.6, 'stroke-dasharray': '5 5',
      }));
      [-L / 2, 0, L / 2].forEach(function (xa) {
        svg.appendChild(T.el('circle', {
          cx: gs.naarX(t), cy: gs.naarY(voorsprong(t, xa)), r: 5,
          fill: 'var(--blauw)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
        }));
      });
    }
  }

  /** Waardekaarten en de duiding in woorden. */
  function werkPaneelBij(o) {
    const kaarten = [
      ['Licht achterkant', 't = ' + F.nl(o.tAchter, 2), 'var(--trein)'],
      ['Licht voorkant', 't = ' + F.nl(o.tVoor, 2), 'var(--trein)'],
      ['Voorsprong β·L/2', F.nl(beta * L / 2, 3), 'var(--eigentijd)'],
      ['Inhaalmoment', 't = ' + F.nl(o.inhaal, 2), 'var(--gebeurtenis)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');

    let fase;
    if (t < o.tAchter) {
      fase = 'Het licht is naar beide kanten onderweg.';
    } else if (t < o.tVoor) {
      fase = 'De achterkant is geraakt, de voorkant nog niet.';
    } else {
      fase = 'Beide kanten geraakt, met ' + F.nl(o.tVoor - o.tAchter, 2) +
             ' ertussen op het perron.';
    }

    const voorsprongNu = F.klokstand(t, -L / 2, beta) - t;
    const klokZin = t < o.inhaal
      ? 'De achterklok loopt ' + F.nl(voorsprongNu, 3) + ' voor; op t = ' +
        F.nl(o.inhaal, 2) + ' haalt de perronklok hem in.'
      : 'De perronklok is voorbij: de achterklok loopt ' +
        F.nl(-voorsprongNu, 3) + ' achter.';

    duiding.innerHTML =
      '<h3>Wat er nu gebeurt</h3>' +
      '<p style="margin:0 0 8px">' + fase + '</p>' +
      '<p style="margin:0">' + klokZin + '</p>';
  }

  // --- Bediening ---
  const schuifBeta = paneel.querySelector('#gt-beta');
  const schuifLengte = paneel.querySelector('#gt-lengte');
  const schuifTijd = paneel.querySelector('#gt-tijd');
  const betaW = paneel.querySelector('#gt-beta-w');
  const lengteW = paneel.querySelector('#gt-lengte-w');
  const tijdW = paneel.querySelector('#gt-tijd-w');
  const speelKnop = paneel.querySelector('#gt-speel');
  const flitsKnop = paneel.querySelector('#gt-flits');
  const inhaalKnop = paneel.querySelector('#gt-inhaal');

  /** De tijdschuif hangt af van v en L, dus die stellen we telkens opnieuw in. */
  function stelTijdschuifIn() {
    const o = opzet();
    schuifTijd.max = String(o.tMax);
    schuifTijd.step = String(o.tMax / 600);
    if (t > o.tMax) t = o.tMax;
    schuifTijd.value = String(t);
    inhaalKnop.disabled = !(Number.isFinite(o.inhaal) && o.inhaal <= o.tMax);
  }

  function werkBij() {
    betaW.textContent = F.nl(beta, 2) + 'c';
    lengteW.textContent = F.nl(L, 2) + ' ls';
    tijdW.textContent = F.nl(t, 2);
    teken();
  }

  let laatsteTik = 0;
  function stap(nu) {
    if (!speelt) return;
    // De module kan intussen weggeklikt zijn; dan stopt de animatie vanzelf.
    if (!svg.isConnected) { speelt = false; return; }
    const o = opzet();
    const dt = Math.min((nu - laatsteTik) / 1000, 0.1);
    laatsteTik = nu;
    t = t + dt * o.tMax / 7;        // ongeveer zeven seconden voor het hele bereik
    if (t >= o.tMax) {
      t = o.tMax;
      speelt = false;
      speelKnop.textContent = 'Afspelen';
      speelKnop.classList.remove('aan');
    }
    schuifTijd.value = String(t);
    werkBij();
    if (speelt) requestAnimationFrame(stap);
  }

  schuifBeta.addEventListener('input', function () {
    beta = parseFloat(schuifBeta.value);
    stelTijdschuifIn();
    werkBij();
  });
  schuifLengte.addEventListener('input', function () {
    L = parseFloat(schuifLengte.value);
    stelTijdschuifIn();
    werkBij();
  });
  schuifTijd.addEventListener('input', function () {
    t = parseFloat(schuifTijd.value);
    werkBij();
  });
  speelKnop.addEventListener('click', function () {
    const o = opzet();
    speelt = !speelt;
    speelKnop.textContent = speelt ? 'Pauze' : 'Afspelen';
    speelKnop.classList.toggle('aan', speelt);
    if (speelt) {
      if (t >= o.tMax - 1e-9) t = 0;
      laatsteTik = performance.now();
      requestAnimationFrame(stap);
    }
  });
  flitsKnop.addEventListener('click', function () {
    t = 0;
    schuifTijd.value = '0';
    werkBij();
  });
  inhaalKnop.addEventListener('click', function () {
    const o = opzet();
    if (!Number.isFinite(o.inhaal)) return;
    t = Math.min(o.inhaal, o.tMax);
    schuifTijd.value = String(t);
    werkBij();
  });

  stelTijdschuifIn();
  werkBij();
}
