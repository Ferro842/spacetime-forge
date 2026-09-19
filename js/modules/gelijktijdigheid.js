// gelijktijdigheid.js — de trein met de lichtflits.
// Midden in de trein gaat een lamp aan. Vanaf het perron gezien rijdt de
// achterkant het licht tegemoet en loopt de voorkant ervoor weg, dus wordt
// de achterkant eerder geraakt. In de trein zelf leggen beide stralen even
// veel af en komen ze tegelijk aan.
//
// De twee tonelen laten zien wát er gebeurt; het Minkowski-diagram eronder
// laat zien wáárom. Daar kruipt de horizontale perron-nulijn omhoog terwijl
// de gekantelde trein-nulijn schuin meeloopt: twee sneden door dezelfde
// ruimtetijd, en dat is precies waar "tegelijk" uit elkaar valt.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Gelijktijdigheid';
export const onderschrift =
  'Eén flits in het midden van de trein. Vanaf het perron raakt hij de achterkant ' +
  'eerder, in de trein allebei de kanten tegelijk. Speel de tijd af en kijk de ' +
  'twee nulijnen in het Minkowski-diagram uit elkaar lopen.';

const BREEDTE = 960;
const HOOGTE = 940;
// Links extra ruimte voor de ct-getallen van het Minkowski-diagram. Beide
// tonelen en dat diagram gebruiken dezelfde marges, en dus exact dezelfde
// omrekening van x naar het scherm: de wagon staat recht boven zijn eigen
// wereldlijnen.
const MARGE = { links: 74, rechts: 56 };

// Drie banden onder elkaar. Elke rij tekst heeft een eigen hoogte, anders
// vechten de klokstanden, de snelheidspijl en het flitslabel om dezelfde
// strook. De stand onder een klok volgt uit het middelpunt plus KLOK_STRAAL.
const PERRON = {
  titel: 30, naam: 52, klok: 86, stand: 130,
  dak: 146, vloer: 196, rail: 212, flits: 236,
};
const TREIN = {
  titel: 268, klok: 330, stand: 374,
  dak: 390, vloer: 440, rail: 456, grond: 478,
};
const ONDER = { titel: 508, boven: 530, onder: 908, tik: 932 };
// In het grote beeld vervallen de twee tonelen en krijgt de onderste band
// het hele vlak; dan is er plek voor de getallen bij elke tik.
const ONDER_GROOT = { titel: 30, boven: 76, onder: 908, tik: 932 };

const KLOK_STRAAL = 22;

/** Dezelfde breedteschatting als de labelplaatser in teken.js. */
function schatBreedte(tekst, grootte) {
  const hoofdletters = (tekst.match(/[A-Z\u00c0-\u00de]/g) || []).length;
  return (tekst.length + hoofdletters * 0.22) * grootte * 0.58;
}

/**
 * Houdt alleen de uitwijkplekken over die binnen de viewBox vallen, en schuift
 * het label anders alsnog naar binnen. Half buiten beeld is net zo onleesbaar
 * als weggelaten, maar de plaatser telt het wel als geplaatst.
 */
function ladder(spec, plekken) {
  function links(dx) {
    const b = schatBreedte(spec.tekst, spec.grootte);
    let l = spec.x + dx;
    if (spec.anker === 'middle') l -= b / 2;
    else if (spec.anker === 'end') l -= b;
    return l;
  }
  const b = schatBreedte(spec.tekst, spec.grootte);
  const uit = plekken.filter(function (p) {
    const y = spec.y + p[1];
    return links(p[0]) >= 3 && links(p[0]) + b <= BREEDTE - 3 &&
           y - spec.grootte * 0.8 >= 3 && y + spec.grootte * 0.25 <= HOOGTE - 3;
  });
  if (uit.length) return uit;
  const l = links(0);
  let dx = 0;
  if (l < 3) dx = 3 - l;
  else if (l + b > BREEDTE - 3) dx = BREEDTE - 3 - b - l;
  return [[dx, 0]];
}

export function render(doel) {
  let beta = 0.6;           // snelheid van de trein
  let L = 1.0;              // eigen lengte van de trein, in lichtseconden
  let t = 0;                // perrontijd
  let speelt = false;
  let onderBand = 'minkowski';   // of 'klokstanden'
  let groot = false;             // onderste band over het hele vlak
  let laatsteTik = 0;

  /** De grenzen van de onderste band, afhankelijk van het gekozen beeld. */
  function band() { return groot ? ONDER_GROOT : ONDER; }

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Twee beelden van dezelfde flits</summary>' +
    '<p>Midden in de trein gaat een lamp aan. Op het <b>perron</b> rijdt de ' +
    'achterkant het licht tegemoet en loopt de voorkant ervoor weg, dus wordt de ' +
    'achterkant eerder geraakt; in de <b>trein</b> komt het tegelijk aan. Onderin ' +
    'dezelfde gebeurtenissen als Minkowski-diagram: een aankomst wordt <b>rood</b> ' +
    'zodra het perron erlangs is en krijgt een <b>gouden ring</b> zodra de trein ' +
    'erlangs is.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'De trein met de lichtflits vanaf het perron, vanuit de trein, ' +
                  'en als Minkowski-diagram',
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
    '  <div class="knoppen">' +
    '    <button class="knop klein aan" id="gt-mink">Minkowski</button>' +
    '    <button class="knop klein" id="gt-klok">Klokstanden</button>' +
    '    <button class="knop klein" id="gt-groot">Groot</button>' +
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

  const tekenB = BREEDTE - MARGE.links - MARGE.rechts;

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
    const tMax = Math.max(1.4 * voor.t, Math.min(1.15 * inhaal, 4 * voor.t));
    // Het Minkowski-diagram heeft gelijke schaal in x en ct, dus de ct-as die
    // erin past volgt uit de breedte. Andersom betekent dat: het x-venster
    // moet ruim genoeg zijn om de hele tijdschuif in beeld te houden.
    const plotH = band().onder - band().boven;
    const nodigVoorCt = tMax * tekenB / (1.88 * plotH);
    const xGrens = Math.max(1.06 * (L / 2 + beta * tMax), nodigVoorCt);
    // Zonder de tonelen hoeft het x-venster niet symmetrisch te zijn: links
    // is alleen plek nodig voor de achterste aankomst, rechts voor de hele
    // rit. Dat scheelt breedte, en bij gelijke schaal dus ook lege hoogte.
    const rechts = 1.06 * (L / (2 * g) + beta * tMax);
    const links = -Math.max(1.3 * achter.t + 0.12 * rechts, 0.24 * rechts);
    const tekort = tMax * 1.12 * tekenB / plotH - (rechts - links);
    const xLinks = groot ? links - Math.max(0, tekort) : -xGrens;
    const xRechts = groot ? rechts : xGrens;
    const ctSpan = (xRechts - xLinks) * plotH / tekenB;
    return {
      g: g,
      tAchter: achter.t,
      tVoor: voor.t,
      inhaal: inhaal,
      tMax: tMax,
      xGrens: xGrens,
      xLinks: xLinks,
      xRechts: xRechts,
      ctOnder: -0.06 * ctSpan,
      ctBoven: 0.94 * ctSpan,
      // Voor de klokstanden-grafiek: doorlopen tot voorbij het inhaalmoment,
      // ook als de schuif daar niet komt, anders is de kruising nergens te zien.
      tGrafiek: Number.isFinite(inhaal) ? Math.max(tMax, 1.12 * inhaal) : tMax,
    };
  }

  /** Eén wijzerplaat met één wijzer: per eenheid ct maakt hij een rondje. */
  function tekenKlok(labels, px, py, stand, kleur, naam, prioriteit, kant) {
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: KLOK_STRAAL,
      fill: 'var(--kaart)', stroke: kleur, 'stroke-width': 2.2,
    }));
    svg.appendChild(T.el('line', {
      x1: px, y1: py - KLOK_STRAAL + 3, x2: px, y2: py - KLOK_STRAAL + 7,
      stroke: kleur, 'stroke-width': 2,
    }));
    const hoek = ((stand % 1) + 1) % 1 * 2 * Math.PI - Math.PI / 2;
    svg.appendChild(T.el('line', {
      x1: px, y1: py,
      x2: px + Math.cos(hoek) * (KLOK_STRAAL - 6),
      y2: py + Math.sin(hoek) * (KLOK_STRAAL - 6),
      stroke: kleur, 'stroke-width': 2.4, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('circle', { cx: px, cy: py, r: 2.4, fill: kleur }));
    labels.blokkeer({
      links: px - KLOK_STRAAL - 2, boven: py - KLOK_STRAAL - 2,
      breedte: KLOK_STRAAL * 2 + 4, hoogte: KLOK_STRAAL * 2 + 4,
    });
    if (kant === 'rechts') {
      labels.voegToe({
        tekst: F.nl(stand, 2), x: px + KLOK_STRAAL + 10, y: py + 6,
        grootte: 15, kleur: kleur, gewicht: 650, prioriteit: prioriteit,
        verschuif: [[0, 0], [0, -18], [0, 18]],
      });
      if (naam) {
        labels.voegToe({
          tekst: naam, x: px + KLOK_STRAAL + 10, y: py - 12,
          grootte: 12, kleur: 'var(--tekst-zacht)', prioriteit: prioriteit - 20,
          verschuif: [[0, 0], [0, -14], [60, 0]],
        });
      }
      return;
    }
    labels.voegToe({
      tekst: F.nl(stand, 2), x: px, y: py + KLOK_STRAAL + 18,
      grootte: 14, kleur: kleur, anker: 'middle', gewicht: 650,
      prioriteit: prioriteit,
      verschuif: [[0, 0], [0, 15], [-30, 0], [30, 0]],
    });
  }

  /** De wagon: een bak met twee wielen. Bij een sterk ingekorte wagon
   *  krimpen de wielen mee, anders worden het overlappende klodders. */
  function tekenWagon(labels, schaal, xAchter, xVoor, band) {
    const links = schaal.naarX(xAchter), rechts = schaal.naarX(xVoor);
    svg.appendChild(T.el('rect', {
      x: links, y: band.dak, width: Math.max(rechts - links, 2),
      height: band.vloer - band.dak, rx: 8,
      fill: 'var(--trein-vlak)', stroke: 'var(--trein)', 'stroke-width': 2.2,
    }));
    labels.blokkeer({
      links: links, boven: band.dak,
      breedte: Math.max(rechts - links, 2), hoogte: band.vloer - band.dak,
    });
    const wielR = Math.min(8, (rechts - links) / 5);
    if (wielR >= 4) {
      [0.26, 0.74].forEach(function (f) {
        svg.appendChild(T.el('circle', {
          cx: links + (rechts - links) * f, cy: band.vloer + wielR + 1, r: wielR,
          fill: 'var(--kaart)', stroke: 'var(--trein)', 'stroke-width': 2,
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
        stroke: 'var(--licht)', 'stroke-width': 1.6, 'stroke-dasharray': '6 4',
      }));
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xEind), cy: y, r: 5, fill: 'var(--licht)',
      }));
    });
    geraakt.forEach(function (xx) {
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xx), cy: y, r: ringR,
        fill: 'none', stroke: 'var(--gebeurtenis)', 'stroke-width': 2.6,
      }));
    });
  }

  /** Drie klokposities uit elkaar trekken als de wagon te smal is om ze
   *  naast elkaar te zetten. De verbindingslijntjes wijzen dan de plek aan. */
  function klokPosities(schaal, xen) {
    const echt = xen.map(function (x) { return schaal.naarX(x); });
    const minAf = KLOK_STRAAL * 2 + 22;
    if (echt[2] - echt[0] >= minAf * 2) return { getekend: echt, echt: echt };
    const midden = echt[1];
    return { getekend: [midden - minAf, midden, midden + minAf], echt: echt };
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const labels = T.maakLabelPlaatser();

    // Eén horizontale schaal voor de tonelen én het Minkowski-diagram, zodat
    // alles onder elkaar dezelfde plaats op de x-as heeft. De trein is op het
    // perron zichtbaar korter dan in zijn eigen kader.
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-o.xGrens, o.xGrens], yBereik: [0, 1],
      marge: { boven: 0, onder: 0, links: MARGE.links, rechts: MARGE.rechts },
    });
    const tAccent = F.klokstand(t, 0, beta);   // stand van de middenklok
    const xStap = F.netteStap(o.xGrens / 3);

    if (!groot) {
      tekenPerronBeeld(labels, schaal, o, tAccent, xStap);
      tekenTreinBeeld(labels, schaal, o, tAccent, xStap);
    }
    if (onderBand === 'minkowski') tekenMinkowski(labels, o, xStap);
    else tekenKlokstanden(labels, o);

    svg.appendChild(labels.tekenAlles());
    werkPaneelBij(o);
  }

  // ---------- Band 1: het perron-beeld ----------
  function tekenPerronBeeld(labels, schaal, o, tAccent, xStap) {
    labels.voegToe({
      tekst: 'PERRON-BEELD — de trein rijdt met v = ' + F.nl(beta, 2) +
             'c naar rechts', x: MARGE.links, y: PERRON.titel,
      grootte: 14, kleur: 'var(--perron)', gewicht: 650, prioriteit: 95,
    });

    svg.appendChild(T.el('line', {
      x1: MARGE.links, y1: PERRON.rail, x2: BREEDTE - MARGE.rechts, y2: PERRON.rail,
      stroke: 'var(--perron)', 'stroke-width': 2.2,
    }));
    labels.blokkeerLijn({
      x1: MARGE.links, y1: PERRON.rail, x2: BREEDTE - MARGE.rechts, y2: PERRON.rail,
      dikte: 14,
    });
    for (let n = -9; n <= 9; n++) {
      const xx = n * xStap;
      if (Math.abs(xx) > o.xGrens) continue;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(xx), y1: PERRON.rail, x2: schaal.naarX(xx), y2: PERRON.rail + 6,
        stroke: 'var(--perron)', 'stroke-width': 1.5,
      }));
    }

    const halfP = L / (2 * o.g);
    const xMidden = beta * t;
    tekenWagon(labels, schaal, xMidden - halfP, xMidden + halfP, PERRON);

    // Waar de flits vertrok blijft op het perron een vaste plek
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(0), y1: PERRON.dak, x2: schaal.naarX(0), y2: PERRON.rail,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4',
    }));
    labels.blokkeerLijn({
      x1: schaal.naarX(0), y1: PERRON.dak, x2: schaal.naarX(0), y2: PERRON.rail, dikte: 10,
    });
    labels.voegToe({
      tekst: 'hier ging de lamp aan', x: schaal.naarX(0), y: PERRON.flits,
      grootte: 12, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 600,
      prioriteit: 62, verschuif: [[0, 0], [0, 16], [-60, 0], [60, 0]],
    });

    const geraakt = [];
    if (t >= o.tAchter) geraakt.push(xMidden - halfP);
    if (t >= o.tVoor) geraakt.push(xMidden + halfP);
    const ringR = Math.max(6, Math.min(11, (schaal.naarX(halfP) - schaal.naarX(-halfP)) / 3));
    tekenLicht(schaal, 0, t, (PERRON.dak + PERRON.vloer) / 2, geraakt, ringR);

    // Alleen de pijl boven de wagon; de snelheid staat in de bandtitel
    const pijlY = PERRON.dak - 6;
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(xMidden) + 14, y1: pijlY,
      x2: schaal.naarX(xMidden) + 54, y2: pijlY,
      stroke: 'var(--trein)', 'stroke-width': 2.2,
    }));
    svg.appendChild(T.el('polygon', {
      points: (schaal.naarX(xMidden) + 63) + ',' + pijlY + ' ' +
              (schaal.naarX(xMidden) + 52) + ',' + (pijlY - 4.5) + ' ' +
              (schaal.naarX(xMidden) + 52) + ',' + (pijlY + 4.5),
      fill: 'var(--trein)',
    }));
    // De drie treinklokken zoals het perron ze op dit moment ziet
    const plaatsen = klokPosities(schaal, [xMidden - halfP, xMidden, xMidden + halfP]);
    [['achter', -L / 2], ['midden', 0], ['voor', L / 2]].forEach(function (k, i) {
      const px = plaatsen.getekend[i];
      svg.appendChild(T.el('line', {
        x1: px, y1: PERRON.klok + KLOK_STRAAL, x2: plaatsen.echt[i], y2: PERRON.dak,
        stroke: 'var(--trein)', 'stroke-width': 1.1, opacity: 0.55,
      }));
      tekenKlok(labels, px, PERRON.klok, F.klokstand(t, k[1], beta),
                'var(--trein)', null, 80);
      labels.voegToe({
        tekst: k[0], x: px, y: PERRON.naam,
        grootte: 12, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 58,
        verschuif: [[0, 0], [0, -14], [-34, 0], [34, 0]],
      });
    });

    // De perronklok links; die geldt voor het hele perron, want in dit kader
    // lopen alle perronklokken gelijk.
    tekenKlok(labels, MARGE.links + KLOK_STRAAL, PERRON.klok, t,
              'var(--perron)', 'perronklok', 82, 'rechts');
  }

  // ---------- Band 2: het trein-beeld ----------
  function tekenTreinBeeld(labels, schaal, o, tAccent, xStap) {
    labels.voegToe({
      tekst: 'TREIN-BEELD — de trein staat stil, t′ = ' + F.nl(tAccent, 2) +
             ', alle drie de klokken gelijk',
      x: MARGE.links, y: TREIN.titel,
      grootte: 14, kleur: 'var(--trein)', gewicht: 650, prioriteit: 95,
    });

    tekenWagon(labels, schaal, -L / 2, L / 2, TREIN);

    // Het perron glijdt naar links weg; zijn merktekens zijn ingekort
    svg.appendChild(T.el('line', {
      x1: MARGE.links, y1: TREIN.rail, x2: BREEDTE - MARGE.rechts, y2: TREIN.rail,
      stroke: 'var(--perron)', 'stroke-width': 2.2,
    }));
    labels.blokkeerLijn({
      x1: MARGE.links, y1: TREIN.rail, x2: BREEDTE - MARGE.rechts, y2: TREIN.rail,
      dikte: 14,
    });
    const grondStap = xStap / o.g;
    for (let n = -24; n <= 24; n++) {
      const xx = n * grondStap - beta * tAccent;
      if (Math.abs(xx) > o.xGrens) continue;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(xx), y1: TREIN.rail, x2: schaal.naarX(xx), y2: TREIN.rail + 6,
        stroke: 'var(--perron)', 'stroke-width': 1.3, opacity: 0.7,
      }));
    }
    const xFlitsplek = -beta * tAccent;
    if (Math.abs(xFlitsplek) <= o.xGrens) {
      svg.appendChild(T.el('polygon', {
        points: schaal.naarX(xFlitsplek) + ',' + (TREIN.rail + 3) + ' ' +
                (schaal.naarX(xFlitsplek) - 6) + ',' + (TREIN.rail + 15) + ' ' +
                (schaal.naarX(xFlitsplek) + 6) + ',' + (TREIN.rail + 15),
        fill: 'var(--gebeurtenis)',
      }));
      labels.voegToe({
        tekst: 'het perron schuift naar links', x: schaal.naarX(xFlitsplek),
        y: TREIN.grond,
        grootte: 12, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 45,
        verschuif: [[0, 0], [0, 14], [-80, 0], [80, 0]],
      });
    }

    const geraakt = tAccent >= L / 2 ? [-L / 2, L / 2] : [];
    tekenLicht(schaal, 0, tAccent, (TREIN.dak + TREIN.vloer) / 2, geraakt, 11);

    const plaatsen = klokPosities(schaal, [-L / 2, 0, L / 2]);
    plaatsen.getekend.forEach(function (px, i) {
      svg.appendChild(T.el('line', {
        x1: px, y1: TREIN.klok + KLOK_STRAAL, x2: plaatsen.echt[i], y2: TREIN.dak,
        stroke: 'var(--trein)', 'stroke-width': 1.1, opacity: 0.55,
      }));
      tekenKlok(labels, px, TREIN.klok, tAccent, 'var(--trein)', null, 76);
    });
  }

  // ---------- Band 3a: het Minkowski-diagram ----------
  // Dezelfde gebeurtenissen, nu met de tijd omhoog. De horizontale lijn is
  // wat het perron "nu" noemt, de gekantelde wat de trein "nu" noemt; ze
  // snijden elkaar op de middenklok en lopen aan de uiteinden uit elkaar.
  function tekenMinkowski(labels, o, xStap) {
    const B = band();
    const ms = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [o.xLinks, o.xRechts], yBereik: [o.ctOnder, o.ctBoven],
      marge: {
        boven: B.boven, onder: HOOGTE - B.onder,
        links: MARGE.links, rechts: MARGE.rechts,
      },
    });
    const tAccent = F.klokstand(t, 0, beta);
    // De trein-nulijn passeert beide aankomsten tegelijk: als zijn eigen klok
    // op L/2 staat. Dat is de kern van het hele verhaal.
    const treinVoorbij = tAccent >= L / 2 - 1e-12;
    const halfEigen = L / (2 * o.g);
    const pxPer = ms.naarX(1) - ms.naarX(0);      // pixels per eenheid, x en ct gelijk
    const perpLen = Math.hypot(1, beta);
    const perpX = 1 / perpLen, perpY = beta / perpLen;   // loodrecht op een wereldlijn

    labels.voegToe({
      tekst: 'MINKOWSKI-DIAGRAM', x: MARGE.links, y: B.titel,
      grootte: 14, kleur: 'var(--tekst)', gewicht: 650, prioriteit: 99,
    });
    // De drie tijden staan in de titelrij, elk in de kleur van zijn lijn.
    // Daar zijn ze altijd leesbaar; als naamkaartje aan het uiteinde van een
    // lijn vochten ze met de wereldlijnen en vielen ze steeds weg.
    [['perron nu: t = ' + F.nl(t, 2), 220, 'var(--perron)'],
     ['trein nu: t\u2032 = ' + F.nl(tAccent, 2), 380, 'var(--trein)'],
     ['stippellijn: t\u2032 = ' + F.nl(L / 2, 2), 540, 'var(--trein)'],
    ].forEach(function (r, i) {
      labels.voegToe({
        tekst: r[0], x: MARGE.links + r[1], y: B.titel,
        grootte: 12.5, kleur: r[2], gewicht: 650, prioriteit: 98 - i,
        verschuif: [[0, 0]],
      });
    });
    if (groot) {
      labels.voegToe({
        tekst: 'rood = het perron is erlangs, gouden ring = de trein is erlangs',
        x: MARGE.links, y: B.titel + 21,
        grootte: 12, kleur: 'var(--tekst-zacht)', prioriteit: 93,
        verschuif: [[0, 0], [0, 16]],
      });
    }

    const xAs = ms.naarY(0), yAs = ms.naarX(0);

    // Lichtkegel vanaf de flits: onder 45°, want x en ct hebben dezelfde schaal
    svg.appendChild(T.lichtkegel(ms, { kleur: 'var(--licht)' }));
    [[1, 1], [-1, 1]].forEach(function (hoek) {
      labels.blokkeerSchuin({
        x1: yAs, y1: xAs,
        x2: ms.naarX(o.ctBoven * hoek[0]), y2: ms.naarY(o.ctBoven * hoek[1]),
        dikte: 9,
      });
    });

    // Assen
    svg.appendChild(T.el('line', {
      x1: ms.naarX(o.xLinks), y1: xAs, x2: ms.naarX(o.xRechts), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 1.8,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: ms.naarY(o.ctOnder), x2: yAs, y2: ms.naarY(o.ctBoven),
      stroke: 'var(--perron)', 'stroke-width': 1.8,
    }));
    labels.blokkeerLijn({
      x1: yAs, y1: ms.naarY(o.ctOnder), x2: yAs, y2: ms.naarY(o.ctBoven), dikte: 12,
    });
    for (let n = -9; n <= 9; n++) {
      const xx = n * xStap;
      if (xx < o.xLinks || xx > o.xRechts || xx === 0) continue;
      svg.appendChild(T.el('line', {
        x1: ms.naarX(xx), y1: xAs, x2: ms.naarX(xx), y2: xAs + 5,
        stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      labels.voegToe({
        tekst: F.nl(xx, 1), x: ms.naarX(xx), y: xAs + 17,
        grootte: 12, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 26,
        verschuif: [[0, 0], [0, 14], [0, -31], [0, 28], [-26, 0], [26, 0], [0, -45]],
      });
    }
    const ctStap = F.netteStap(o.ctBoven / 4);
    for (let ct = ctStap; ct <= o.ctBoven; ct += ctStap) {
      svg.appendChild(T.el('line', {
        x1: yAs - 5, y1: ms.naarY(ct), x2: yAs, y2: ms.naarY(ct),
        stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      labels.voegToe({
        tekst: F.nl(ct, 1), x: yAs - 16, y: ms.naarY(ct) + 4,
        grootte: 12, kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 34,
        verschuif: [[0, 0], [-28, 0], [-56, 0], [0, -14], [-28, -14], [0, 14]],
      });
    }
    labels.voegToe({
      tekst: 'x', x: ms.naarX(o.xRechts) - 2, y: xAs - 10,
      grootte: 14, kleur: 'var(--perron)', anker: 'end', gewicht: 650, prioriteit: 88,
      verschuif: [[0, 0], [-24, 0], [0, -16]],
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 14, y: ms.naarY(o.ctBoven) + 12,
      grootte: 14, kleur: 'var(--perron)', gewicht: 650, prioriteit: 88,
      verschuif: [[0, 0], [-46, 0], [-80, 0], [0, 18], [-46, 18]],
    });

    // De drie wereldlijnen van de trein, met een tik per eigen seconde.
    // De tikken op de drie lijnen liggen niet naast elkaar: precies dat
    // hoogteverschil is de desynchronisatie die het perron ziet.
    const tauStap = F.netteStap(o.ctBoven / o.g / 4);
    [[-L / 2, -halfEigen], [0, 0], [L / 2, halfEigen]].forEach(function (paar) {
      const xAccent = paar[0], x0 = paar[1];
      svg.appendChild(T.worldline(ms, {
        beta: beta, x0: x0, t0: 0, kleur: 'var(--trein)', dikte: x0 === 0 ? 2.6 : 2,
      }));
      labels.blokkeerSchuin({
        x1: ms.naarX(x0 + beta * o.ctOnder), y1: ms.naarY(o.ctOnder),
        x2: ms.naarX(x0 + beta * o.ctBoven), y2: ms.naarY(o.ctBoven), dikte: 9,
      });
      // Eigen-tijdstikken: tau = k op deze klok valt op perrontijd
      // t = gamma*(tau + beta*x'), dus elke lijn heeft zijn eigen rooster.
      const kVan = Math.ceil((o.ctOnder / o.g - beta * xAccent) / tauStap);
      const kTot = Math.floor((o.ctBoven / o.g - beta * xAccent) / tauStap);
      for (let k = kVan; k <= kTot; k++) {
        const tau = k * tauStap;
        const tTik = o.g * (tau + beta * xAccent);
        if (tTik < o.ctOnder || tTik > o.ctBoven) continue;
        const px = ms.naarX(x0 + beta * tTik), py = ms.naarY(tTik);
        const lang = Math.abs(k) % 5 === 0 ? 8 : 5.5;
        svg.appendChild(T.el('line', {
          x1: px - perpX * lang, y1: py - perpY * lang,
          x2: px + perpX * lang, y2: py + perpY * lang,
          stroke: 'var(--trein)', 'stroke-width': k === 0 ? 2.2 : 1.4,
        }));
        // In het grote beeld krijgt de middenklok er getallen bij
        if (groot && x0 === 0 && k > 0) {
          const nr = {
            tekst: F.nl(tau, tauStap < 1 ? 1 : 0),
            x: px - perpX * 13, y: py - perpY * 13 + 4,
            grootte: 11.5, kleur: 'var(--trein)', anker: 'end', prioriteit: 24,
          };
          nr.verschuif = ladder(nr, [[0, 0], [-16, 0], [-32, 0], [0, -14], [0, 14]]);
          labels.voegToe(nr);
        }
      }
    });
    if (groot) {
      labels.voegToe({
        tekst: 'tikjes = eigen tijd, elke ' + F.nl(tauStap, tauStap < 1 ? 1 : 0),
        x: MARGE.links + 500, y: B.titel + 21,
        grootte: 12, kleur: 'var(--trein)', prioriteit: 90,
        verschuif: [[0, 0], [0, 16], [0, -16]],
      });
    }

    // De lijn door beide aankomsten: in de trein zijn ze gelijktijdig, dus
    // hij loopt evenwijdig aan de x'-as en snijdt de ct-as op L/(2 gamma).
    svg.appendChild(T.nuLijn(ms, {
      beta: beta, x0: 0, t0: L / (2 * o.g),
      kleur: 'var(--trein)', dikte: 1.3, streep: '2 5',
    }));

    // De twee aankomsten van het licht. De kleur vertelt welk kader ze al
    // achter de rug heeft: rood zodra het perron erlangs is, een gouden ring
    // zodra de trein erlangs is. Bij de achterkant komt het perron eerst,
    // bij de voorkant de trein \u2014 omgekeerde volgorde, zelfde flits.
    [['achter', o.tAchter, -o.tAchter], ['voor', o.tVoor, o.tVoor]].forEach(function (gb) {
      const naam = gb[0], tE = gb[1], xE = gb[2];
      const perronVoorbij = t >= tE - 1e-12;
      const px = ms.naarX(xE), py = ms.naarY(tE);
      if (treinVoorbij) {
        svg.appendChild(T.el('circle', {
          cx: px, cy: py, r: 11, fill: 'none',
          stroke: 'var(--trein)', 'stroke-width': 2.6,
        }));
      }
      svg.appendChild(T.el('circle', {
        cx: px, cy: py, r: 6.5,
        fill: perronVoorbij ? 'var(--gebeurtenis)' : 'var(--kaart)',
        stroke: perronVoorbij ? 'var(--kaart)' : 'var(--licht)', 'stroke-width': 2,
      }));
      labels.blokkeer({ links: px - 13, boven: py - 13, breedte: 26, hoogte: 26 });
      // Hier kruisen de lichtlijn en een wereldlijn elkaar, dus vlak naast de
      // stip is alles bezet: het label begint pas een eind verderop.
      const merk = {
        tekst: naam + ': t = ' + F.nl(tE, 2),
        x: px + (xE < 0 ? -34 : 34), y: py + 5,
        anker: xE < 0 ? 'end' : 'start',
        grootte: 13, gewicht: 650, prioriteit: 86,
        kleur: perronVoorbij ? 'var(--gebeurtenis)' : 'var(--tekst-zacht)',
      };
      const kant = xE < 0 ? -1 : 1;
      // Past het label niet aan zijn eigen kant, dan mag het naar de overkant
      // van de stip springen: het anker blijft staan, de sprong is precies de
      // eigen breedte plus twee keer de tussenruimte.
      const over = -kant * (schatBreedte(merk.tekst, merk.grootte) + 68);
      merk.verschuif = ladder(merk, [
        [0, 0], [0, 22], [0, -22], [kant * 34, 0], [0, 44], [kant * 34, 22],
        [0, -44], [kant * 68, 0], [0, 66], [kant * 68, 22],
        [over, 0], [over, 22], [over, -22], [over, 44], [over, -44], [over, 66],
      ]);
      labels.voegToe(merk);
    });

    // De flits zelf
    svg.appendChild(T.gebeurtenis(ms, { t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 6 }));

    // Wat het perron "nu" noemt: een vlakke lijn die met de tijd omhoog kruipt
    svg.appendChild(T.nuLijn(ms, {
      beta: 0, x0: 0, t0: t, kleur: 'var(--perron)', dikte: 2, streep: '7 5',
    }));

    // Wat de trein "nu" noemt: even schuin als de snelheid, door de middenklok
    svg.appendChild(T.nuLijn(ms, {
      beta: beta, x0: beta * t, t0: t, kleur: 'var(--trein)', dikte: 2, streep: '7 5',
    }));

    // De gebeurtenissen die elk kader "nu" noemt, op de drie wereldlijnen.
    // Bij de perron-nulijn staat erbij wat die treinklok op dat moment
    // aanwijst: dezelfde drie getallen als onder de klokken in band 1.
    [['achter', -L / 2, -halfEigen], ['midden', 0, 0], ['voor', L / 2, halfEigen]]
      .forEach(function (k, i) {
        const xAccent = k[1], x0 = k[2];
        const px = ms.naarX(x0 + beta * t), py = ms.naarY(t);
        svg.appendChild(T.el('circle', {
          cx: px, cy: py, r: 4.5,
          fill: 'var(--perron)', stroke: 'var(--kaart)', 'stroke-width': 1.4,
        }));
        // Het label staat naast de wereldlijn, niet erop: recht boven of
        // onder een lijn blijft elke uitwijkplek even bezet, want de lijn
        // loopt er schuin doorheen.
        const stand = F.klokstand(t, xAccent, beta);
        const naarLinks = i === 0;
        const stap = {
          tekst: '\u03c4=' + F.nl(stand, 2),
          x: px + (naarLinks ? -15 : 15),
          // De naam van de perron-nulijn hangt links bóven de lijn, dus de
          // achterste klokstand gaat er juist onder zitten.
          y: py + (i === 2 ? -9 : 19),
          anker: naarLinks ? 'end' : 'start',
          grootte: 12.5, kleur: 'var(--trein)', gewicht: 650, prioriteit: 78 - i,
        };
        const kant2 = naarLinks ? -1 : 1;
        const over2 = -kant2 * (schatBreedte(stap.tekst, stap.grootte) + 30);
        stap.verschuif = ladder(stap, [
          [0, 0], [0, 19], [0, -19], [kant2 * 30, 0], [0, 38], [kant2 * 30, 19],
          [0, -38], [kant2 * 60, 0], [0, 57], [kant2 * 60, 19],
          [over2, 0], [over2, 19], [over2, -19], [over2, 38], [over2, -38],
        ]);
        labels.voegToe(stap);
        // Op de trein-nulijn: ct = t + beta*gamma^2*x0 voor de wereldlijn door x0
        const ctTrein = t + beta * o.g * o.g * x0;
        if (ctTrein >= o.ctOnder && ctTrein <= o.ctBoven) {
          svg.appendChild(T.el('circle', {
            cx: ms.naarX(x0 + beta * ctTrein), cy: ms.naarY(ctTrein), r: 4.5,
            fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 1.4,
          }));
        }
      });
  }

  // ---------- Band 3b: de klokstanden ----------
  // De perronklok is de vlakke nullijn; de drie treinklokken lopen evenwijdig,
  // dus hun onderlinge verschil staat vast. Waar de achterklok de nullijn
  // kruist, ligt het inhaalmoment.
  function tekenKlokstanden(labels, o) {
    const voorsprong = function (tt, xAccent) {
      return F.klokstand(tt, xAccent, beta) - tt;
    };
    const yBoven = Math.max(voorsprong(0, -L / 2) * 1.35, 0.02);
    const yOnder = Math.min(voorsprong(o.tGrafiek, L / 2) * 1.08, -0.02);
    const gs = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [0, o.tGrafiek], yBereik: [yOnder, yBoven],
      marge: {
        boven: band().boven, onder: HOOGTE - band().onder,
        links: MARGE.links, rechts: 150,
      },
    });
    labels.voegToe({
      tekst: 'VOORSPRONG OP DE PERRONKLOK', x: MARGE.links, y: band().titel,
      grootte: 14, kleur: 'var(--tekst)', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'drie evenwijdige lijnen — het verschil hangt niet van de tijd af',
      x: MARGE.links + 300, y: band().titel,
      grootte: 12, kleur: 'var(--tekst-zacht)', prioriteit: 92,
      verschuif: [[0, 0], [0, 16], [0, -16]],
    });

    const nul = gs.naarY(0);
    svg.appendChild(T.el('line', {
      x1: gs.naarX(0), y1: gs.naarY(yOnder), x2: gs.naarX(0), y2: gs.naarY(yBoven),
      stroke: 'var(--perron)', 'stroke-width': 1.8,
    }));
    labels.blokkeerLijn({
      x1: gs.naarX(0), y1: gs.naarY(yOnder), x2: gs.naarX(0), y2: gs.naarY(yBoven),
      dikte: 12,
    });
    const tStap = F.netteStap(o.tGrafiek / 5);
    for (let tt = tStap; tt <= o.tGrafiek + 1e-9; tt += tStap) {
      svg.appendChild(T.el('line', {
        x1: gs.naarX(tt), y1: gs.naarY(yOnder), x2: gs.naarX(tt), y2: gs.naarY(yOnder) + 5,
        stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      labels.voegToe({
        tekst: F.nl(tt, 1), x: gs.naarX(tt), y: gs.naarY(yOnder) + 20,
        grootte: 12, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 28,
        verschuif: [[0, 0], [0, 14]],
      });
    }
    labels.voegToe({
      tekst: 'perrontijd t', x: gs.naarX(0) + 14, y: gs.naarY(yOnder) + 20,
      grootte: 12, kleur: 'var(--tekst-zacht)', gewicht: 600, prioriteit: 68,
      verschuif: [[0, 0], [0, -18], [60, 0]],
    });
    const yStap = F.netteStap((yBoven - yOnder) / 6);
    for (let yy = Math.ceil(yOnder / yStap) * yStap; yy <= yBoven + 1e-9; yy += yStap) {
      svg.appendChild(T.el('line', {
        x1: gs.naarX(0) - 5, y1: gs.naarY(yy), x2: gs.naarX(0), y2: gs.naarY(yy),
        stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      labels.voegToe({
        tekst: F.nl(Math.abs(yy) < 1e-9 ? 0 : yy, 2), x: gs.naarX(0) - 14,
        y: gs.naarY(yy) + 4,
        grootte: 12, kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 32,
        verschuif: [[0, 0], [0, -13], [0, 13]],
      });
    }

    svg.appendChild(T.el('line', {
      x1: gs.naarX(0), y1: nul, x2: gs.naarX(o.tGrafiek), y2: nul,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({
      x1: gs.naarX(0), y1: nul, x2: gs.naarX(o.tGrafiek), y2: nul, dikte: 11,
    });
    labels.voegToe({
      tekst: 'perronklok', x: gs.naarX(o.tGrafiek) + 10, y: nul + 4,
      grootte: 12, kleur: 'var(--perron)', gewicht: 650, prioriteit: 75,
      verschuif: [[0, 0], [0, -16], [0, 16]],
    });

    [['achterklok', -L / 2, 2.6], ['middenklok', 0, 1.8], ['voorklok', L / 2, 1.8]]
      .forEach(function (k) {
        const y0 = voorsprong(0, k[1]), y1 = voorsprong(o.tGrafiek, k[1]);
        svg.appendChild(T.el('line', {
          x1: gs.naarX(0), y1: gs.naarY(y0),
          x2: gs.naarX(o.tGrafiek), y2: gs.naarY(y1),
          stroke: 'var(--trein)', 'stroke-width': k[2], 'stroke-linecap': 'round',
        }));
        labels.blokkeerSchuin({
          x1: gs.naarX(0), y1: gs.naarY(y0),
          x2: gs.naarX(o.tGrafiek), y2: gs.naarY(y1), dikte: 9,
        });
        labels.voegToe({
          tekst: k[0], x: gs.naarX(o.tGrafiek) + 10, y: gs.naarY(y1) + 4,
          grootte: 12, kleur: 'var(--trein)', gewicht: 650, prioriteit: 74,
          verschuif: [[0, 0], [0, -16], [0, 16], [0, -32], [0, 32]],
        });
      });

    if (Number.isFinite(o.inhaal) && o.inhaal <= o.tGrafiek) {
      svg.appendChild(T.el('circle', {
        cx: gs.naarX(o.inhaal), cy: nul, r: 6,
        fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      labels.voegToe({
        tekst: 'inhaalmoment t = ' + F.nl(o.inhaal, 2),
        x: gs.naarX(o.inhaal) + 12, y: nul - 12,
        grootte: 13, kleur: 'var(--gebeurtenis)', gewicht: 650, prioriteit: 86,
        verschuif: [[0, 0], [0, -18], [0, 24], [-24, -34], [0, 40]],
      });
    }
    if (t <= o.tGrafiek) {
      svg.appendChild(T.el('line', {
        x1: gs.naarX(t), y1: gs.naarY(yBoven), x2: gs.naarX(t), y2: gs.naarY(yOnder),
        stroke: 'var(--blauw)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5',
      }));
      [-L / 2, 0, L / 2].forEach(function (xa) {
        svg.appendChild(T.el('circle', {
          cx: gs.naarX(t), cy: gs.naarY(voorsprong(t, xa)), r: 4.5,
          fill: 'var(--blauw)', stroke: 'var(--kaart)', 'stroke-width': 1.4,
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
      fase = 'Beide kanten geraakt, ' + F.nl(o.tVoor - o.tAchter, 2) + ' ertussen.';
    }
    const voorsprongNu = F.klokstand(t, -L / 2, beta) - t;
    const klokZin = t < o.inhaal
      ? 'De achterklok loopt ' + F.nl(voorsprongNu, 3) + ' voor, tot t = ' +
        F.nl(o.inhaal, 2) + '.'
      : 'De achterklok loopt nu ' + F.nl(-voorsprongNu, 3) + ' achter.';

    const ringZin = F.klokstand(t, 0, beta) >= L / 2
      ? 'In de trein zijn beide aankomsten al geweest (gouden ringen).'
      : 'Voor de trein moeten beide aankomsten nog komen.';
    duiding.innerHTML =
      '<h3>Wat er nu gebeurt</h3>' +
      '<p style="margin:0">' + fase + ' ' + klokZin + ' ' + ringZin + '</p>';
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
  const minkKnop = paneel.querySelector('#gt-mink');
  const klokKnop = paneel.querySelector('#gt-klok');
  const grootKnop = paneel.querySelector('#gt-groot');

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
  function kiesBand(welke) {
    onderBand = welke;
    minkKnop.classList.toggle('aan', welke === 'minkowski');
    klokKnop.classList.toggle('aan', welke === 'klokstanden');
    werkBij();
  }
  minkKnop.addEventListener('click', function () { kiesBand('minkowski'); });
  klokKnop.addEventListener('click', function () { kiesBand('klokstanden'); });
  grootKnop.addEventListener('click', function () {
    groot = !groot;
    grootKnop.classList.toggle('aan', groot);
    // Het venster verandert van vorm, dus de tijdschuif moet opnieuw
    stelTijdschuifIn();
    werkBij();
  });

  stelTijdschuifIn();
  werkBij();
}
