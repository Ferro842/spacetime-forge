// minkowski.js — Minkowski-diagram basis: vrije wereldlijnen, en de keuze
// welk object het referentiekader is. Alles kantelt dan mee.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Minkowski-diagram';
export const onderschrift =
  'Objecten die samen vertrekken en uit elkaar lopen. Kies wiens kader je gebruikt: ' +
  'de wereldlijnen kantelen mee, de klokken niet.';

// Diagramvak op het doelscherm: ongeveer 940 x 935 px, dus deze verhouding.
const BREEDTE = 960;
const HOOGTE = 940;
const MARGE = { boven: 36, onder: 48, links: 62, rechts: 72 };

// Bovenrand van de tijdas. De x-as volgt hieruit, want beide assen moeten
// evenveel pixels per eenheid krijgen, anders staat het licht niet op 45 graden.
const CT_MAX = 6;

// Vier objecten liggen klaar; de gebruiker kiest hoeveel er meedoen.
// Snelheden zijn die ten opzichte van het perron, het kader waarin alle
// schuifjes meten. Welk kader je tekent, staat daar los van.
const START = [
  { naam: 'Anna',  beta:  0,    kleur: 'var(--blauw)' },
  { naam: 'Bram',  beta:  0.6,  kleur: 'var(--trein)' },
  { naam: 'Carla', beta: -0.35, kleur: 'var(--accent)' },
  { naam: 'Dirk',  beta:  0.85, kleur: 'var(--eigentijd)' },
];

/** Dezelfde breedteschatting als de labelplaatser in teken.js. */
function schatBreedte(tekst, grootte) {
  const hoofdletters = (tekst.match(/[A-Z\u00c0-\u00de]/g) || []).length;
  return (tekst.length + hoofdletters * 0.22) * grootte * 0.58;
}

/** Valt het label op deze plek nog helemaal binnen de viewBox? */
function binnenBeeld(spec, dx, dy) {
  const b = schatBreedte(spec.tekst, spec.grootte);
  let links = spec.x + dx;
  if (spec.anker === 'middle') links -= b / 2;
  else if (spec.anker === 'end') links -= b;
  const y = spec.y + dy;
  return links >= 3 && links + b <= BREEDTE - 3 &&
         y - spec.grootte * 0.8 >= 3 && y + spec.grootte * 0.25 <= HOOGTE - 3;
}

/**
 * Houdt alleen de uitwijkplekken over die binnen het beeld vallen. Een label
 * dat half buiten de viewBox staat is net zo onleesbaar als een weggelaten
 * label, maar de plaatser telt het wel als geplaatst en houdt er ruimte voor
 * vrij. Vandaar deze zeef.
 */
function ladder(spec, plekken) {
  const uit = plekken.filter(function (p) { return binnenBeeld(spec, p[0], p[1]); });
  return uit.length ? uit : [[0, 0]];
}

export function render(doel) {
  const objecten = START.map(function (o) { return Object.assign({}, o); });
  let aantal = 3;
  let kader = -1;          // -1 = het perron, anders de index van een object
  let tNu = 3;
  let toonGelijktijdig = true;
  let toonHyperbolen = true;

  // --- Bouwstenen in het werkblad ---------------------------------------
  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Hetzelfde verhaal, een ander kader</summary>' +
    '<p>Alle objecten vertrekken samen uit de oorsprong, met hun klok op nul. Kies ' +
    'een ander kader: dat object staat dan stil, de rest kantelt mee. De <b>stippen' +
    '</b> tellen de eigen tijd van elk object; ze liggen op de <b>ijk-hyperbolen</b>, ' +
    'die in elk kader dezelfde zijn. De rode lijn is \u00e9\u00e9n moment in dit kader.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Minkowski-diagram met de wereldlijnen van meerdere objecten',
  });
  vak.appendChild(svg);
  // Welk kader je ziet, hoort in het beeld te staan. Als HTML boven het vak,
  // want in de tekening zelf botst zo'n titel met de wereldlijnen linksboven.
  const vaan = document.createElement('div');
  vaan.className = 'vak-vaan';
  vak.appendChild(vaan);
  doel.appendChild(vak);

  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const objectPaneel = document.createElement('div');
  objectPaneel.className = 'paneel';
  objectPaneel.innerHTML =
    '<div class="paneel-kop"><h3>Objecten</h3>' +
    '<div class="knoppen" id="mk-aantal"></div></div>' +
    '<div id="mk-regels"></div>';
  zijkolom.appendChild(objectPaneel);

  const kaderPaneel = document.createElement('div');
  kaderPaneel.className = 'paneel';
  kaderPaneel.innerHTML =
    '<h3>Referentiekader</h3>' +
    '<div class="knoppen" id="mk-kader"></div>' +
    '<div class="regelaar" style="margin-top:10px">' +
    '  <label for="mk-nu">Nu in dit kader: ct = <b id="mk-nu-waarde"></b></label>' +
    '  <input type="range" id="mk-nu" min="0" max="' + CT_MAX + '" step="0.05" value="3" />' +
    '</div>' +
    '<div class="knoppen" style="margin-top:2px">' +
    '  <button class="knop aan" id="mk-gelijk">Gelijktijdig</button>' +
    '  <button class="knop aan" id="mk-hyper">IJk-hyperbolen</button>' +
    '</div>' +
    '<div id="mk-tabel"></div>';
  zijkolom.appendChild(kaderPaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Opzet van het diagram naar Takeuchi, "An Illustrated Guide to Relativity", ' +
    'hoofdstuk 4; de omrekening tussen kaders naar Einstein, "Relativity", ' +
    'hoofdstuk 11 \u2014 in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  const aantalVak = objectPaneel.querySelector('#mk-aantal');
  const regelVak = objectPaneel.querySelector('#mk-regels');
  const kaderVak = kaderPaneel.querySelector('#mk-kader');
  const tabelVak = kaderPaneel.querySelector('#mk-tabel');
  const nuSchuif = kaderPaneel.querySelector('#mk-nu');
  const nuWaarde = kaderPaneel.querySelector('#mk-nu-waarde');
  const gelijkKnop = kaderPaneel.querySelector('#mk-gelijk');
  const hyperKnop = kaderPaneel.querySelector('#mk-hyper');

  // --- Natuurkunde: alles omgerekend naar het gekozen kader --------------
  function betaVanKader() {
    return kader < 0 ? 0 : objecten[kader].beta;
  }

  /** De meedoende objecten, met hun snelheid en klok in het gekozen kader. */
  function inKader() {
    const bRef = betaVanKader();
    return objecten.slice(0, aantal).map(function (o, i) {
      const bk = F.naarKader(o.beta, bRef);
      const g = F.gamma(bk);
      return {
        index: i, naam: o.naam, kleur: o.kleur, beta: o.beta,
        bk: bk, g: g,
        // Alle klokken stonden op nul in de oorsprong, dus de eigen tijd bij
        // het gekozen 'nu' is simpelweg de coordinaattijd gedeeld door gamma.
        tau: tNu / g,
      };
    });
  }

  function kaderNaam() {
    return kader < 0 ? 'het perron' : objecten[kader].naam;
  }

  // --- Tekenen -----------------------------------------------------------
  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const lijst = inKader();
    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const tekenH = HOOGTE - MARGE.boven - MARGE.onder;
    // Evenveel pixels per eenheid x als per eenheid ct: het licht staat dan
    // precies onder 45 graden en de ijk-hyperbolen houden hun vorm.
    const ctSpan = 6.41;
    const ctMin = CT_MAX - ctSpan;
    const xSpan = ctSpan * tekenB / tekenH;

    // Het venster schuift mee met de waaier wereldlijnen. In het kader van een
    // snel object lopen ze allemaal dezelfde kant op; zonder meeschuiven blijft
    // de halve tekening leeg en vallen de klokstippen buiten beeld.
    let laag = 0, hoog = 0;
    lijst.forEach(function (o) {
      const x = o.bk * CT_MAX;
      if (x < laag) laag = x;
      if (x > hoog) hoog = x;
    });
    // De ct-as moet wel in beeld blijven, anders is de oorsprong zoek.
    const speling = xSpan * 0.32;
    const midden = Math.max(-speling, Math.min(speling, (laag + hoog) / 2));
    const xMin = midden - xSpan / 2;
    const xMax = midden + xSpan / 2;

    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [xMin, xMax], yBereik: [ctMin, CT_MAX],
      marge: MARGE,
    });
    const labels = T.maakLabelPlaatser();
    // Linksboven staat het vaantje met de kadernaam, als HTML over de tekening
    // heen. De plaatser kan dat niet zien, dus die hoek wordt hier bezet.
    labels.blokkeer({ links: 0, boven: 0, breedte: 232, hoogte: 34 });
    const xAs = schaal.naarY(0);
    const yAs = schaal.naarX(0);
    const linkerRand = schaal.naarX(xMin);
    const rechterRand = schaal.naarX(xMax);
    const bovenRand = schaal.naarY(CT_MAX);

    // Alles wat een lijn is, wordt afgekapt op het tekenvlak. Zonder dit
    // lopen snelle wereldlijnen en de lichtkegel door de marge heen, over
    // de getallen langs de assen.
    const defs = T.el('defs');
    const clip = T.el('clipPath', { id: 'mk-vlak' });
    clip.appendChild(T.el('rect', {
      x: linkerRand, y: bovenRand,
      width: rechterRand - linkerRand, height: schaal.naarY(ctMin) - bovenRand,
    }));
    defs.appendChild(clip);
    svg.appendChild(defs);
    const lijnen = T.el('g', { 'clip-path': 'url(#mk-vlak)' });
    svg.appendChild(lijnen);

    // Toekomstkegel: het gebied dat vanuit de oorsprong te bereiken is.
    // Elke wereldlijn hoort er binnen te blijven, en dat is ook te zien.
    const kegelPunten = [
      [0, 0], [xMax, Math.min(xMax, CT_MAX)], [xMax, CT_MAX],
      [xMin, CT_MAX], [xMin, Math.min(-xMin, CT_MAX)],
    ].map(function (p) {
      return schaal.naarX(p[0]) + ',' + schaal.naarY(p[1]);
    }).join(' ');
    lijnen.appendChild(T.el('polygon', {
      points: kegelPunten, fill: 'var(--blauw)', opacity: 0.05,
    }));
    lijnen.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)' }));

    // IJk-hyperbolen: t^2 - x^2 = tau^2. Elk punt erop ligt op dezelfde
    // eigen tijd van de oorsprong, in welk kader je ook rekent.
    if (toonHyperbolen) {
      const bogen = T.el('g');
      for (let tau = 1; tau <= CT_MAX - 0.15; tau += 1) {
        const punten = [];
        const stap = xSpan / 200;
        for (let x = xMin; x <= xMax + 1e-9; x += stap) {
          const t = Math.sqrt(tau * tau + x * x);
          if (t > CT_MAX) continue;
          punten.push(schaal.naarX(x).toFixed(1) + ',' + schaal.naarY(t).toFixed(1));
        }
        if (punten.length < 2) continue;
        bogen.appendChild(T.el('polyline', {
          points: punten.join(' '), fill: 'none',
          stroke: 'var(--licht)', 'stroke-width': 1, 'stroke-dasharray': '2 5',
        }));
      }
      lijnen.appendChild(bogen);
    }

    // Gelijktijdigheidslijnen van het gekozen kader. In dit kader getekend
    // zijn dat gewoon horizontale lijnen; dat is precies de winst van de
    // kaderkeuze: wat hier op een rij ligt, ligt in een ander kader scheef.
    if (toonGelijktijdig) {
      for (let t = 1; t <= CT_MAX - 0.05; t += 1) {
        lijnen.appendChild(T.nuLijn(schaal, {
          beta: 0, t0: t, kleur: 'var(--licht)', dikte: 0.8, streep: '2 7',
        }));
      }
    }

    // Assen van het gekozen kader
    svg.appendChild(T.el('line', {
      x1: linkerRand, y1: xAs, x2: rechterRand, y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: bovenRand, x2: yAs, y2: schaal.naarY(ctMin),
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({ x1: linkerRand, y1: xAs, x2: rechterRand, y2: xAs, dikte: 18 });
    labels.blokkeerLijn({ x1: yAs, y1: bovenRand, x2: yAs, y2: schaal.naarY(ctMin), dikte: 18 });

    labels.voegToe({
      tekst: 'x', x: rechterRand - 6, y: xAs - 16,
      grootte: 17, kleur: 'var(--perron)', anker: 'end', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 15, y: bovenRand + 17,
      grootte: 17, kleur: 'var(--perron)', gewicht: 650, prioriteit: 95,
      verschuif: [[0, 0], [-52, 0], [0, 20], [-52, 20]],
    });

    // Tikken langs de assen. De getallen op de ct-as zijn tegelijk de eigen
    // tijd van wie in dit kader stilstaat: die klok loopt met de as mee.
    const ctStap = F.netteStap(CT_MAX / 6);
    for (let t = ctStap; t <= CT_MAX - 0.15; t += ctStap) {
      svg.appendChild(T.el('line', {
        x1: yAs - 6, y1: schaal.naarY(t), x2: yAs + 6, y2: schaal.naarY(t),
        stroke: 'var(--perron)', 'stroke-width': 1.6,
      }));
      // Opzij uitwijken, niet omhoog: een getal dat verschuift hoort ineens
      // bij de verkeerde tik. Rechts van de as is er vaak nog plek.
      labels.voegToe({
        tekst: F.nl(t, 0), x: yAs - 14, y: schaal.naarY(t) + 5,
        grootte: 14, kleur: 'var(--perron)', anker: 'end', prioriteit: 45,
        verschuif: [[0, 0], [-18, 0], [42, 0], [60, 0], [-40, 0], [80, 0]],
      });
    }
    const xStap = F.netteStap(xSpan / 7);
    for (let n = Math.ceil((xMin + 0.1) / xStap); n * xStap <= xMax - 0.1; n++) {
      const xx = n * xStap;
      if (Math.abs(xx) < 1e-9) continue;   // de oorsprong heeft zijn eigen stip
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(xx), y1: xAs - 6, x2: schaal.naarX(xx), y2: xAs + 6,
        stroke: 'var(--perron)', 'stroke-width': 1.6,
      }));
      labels.voegToe({
        tekst: F.nl(xx, 0), x: schaal.naarX(xx), y: xAs + 27,
        grootte: 14, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 25,
        // Niet verder dan één rij omlaag: een getal dat te ver van zijn tik
        // wegzakt, hoort bij niets meer.
        verschuif: [[0, 0], [0, 17]],
      });
    }

    // Wereldlijnen, met de eigen-tijd stippen erop
    lijst.forEach(function (o) {
      // Waar loopt de lijn het vlak uit: bovenaan, of eerder al opzij?
      const steil = Math.abs(o.bk) < 1e-6;
      const tZij = steil ? Infinity : (o.bk > 0 ? xMax / o.bk : xMin / o.bk);
      const tOnderZij = steil ? -Infinity : (o.bk > 0 ? xMin / o.bk : xMax / o.bk);
      const tTot = Math.min(CT_MAX, tZij);
      const tVan = Math.max(ctMin, tOnderZij);
      lijnen.appendChild(T.worldline(schaal, {
        beta: o.bk, kleur: o.kleur, dikte: 2.4, tVan: tVan, tTot: tTot,
      }));
      labels.blokkeerSchuin({
        x1: schaal.naarX(o.bk * tVan), y1: schaal.naarY(tVan),
        x2: schaal.naarX(o.bk * tTot), y2: schaal.naarY(tTot), dikte: 10,
      });

      // Eigen-tijd stippen: elke hele eenheid op de klok van dit object.
      for (let tau = 1; tau * o.g <= tTot + 1e-9; tau += 1) {
        const t = tau * o.g;
        svg.appendChild(T.el('circle', {
          cx: schaal.naarX(o.bk * t), cy: schaal.naarY(t), r: 4.5,
          fill: o.kleur, stroke: 'var(--kaart)', 'stroke-width': 1.2,
        }));
      }

      // Naam bij het uiteinde van de lijn: bij een steile lijn onder de
      // bovenrand, bij een snelle lijn naast de zijrand.
      const ex = schaal.naarX(o.bk * tTot), ey = schaal.naarY(tTot);
      const naarZij = tZij < CT_MAX;
      const breed = schatBreedte(o.naam, 15);
      const spec = {
        tekst: o.naam, grootte: 15, kleur: o.kleur, gewicht: 650,
        prioriteit: 88 - o.index,
      };
      if (!naarZij) {
        // Uiteinde bovenaan: het label eronder, en niet over de zijrand heen
        spec.x = Math.max(breed / 2 + 5, Math.min(BREEDTE - breed / 2 - 5, ex));
        spec.y = ey + 19; spec.anker = 'middle';
        spec.verschuif = ladder(spec, [[0, 0], [0, 19], [34, 0], [-34, 0], [0, 38],
                                       [52, 19], [-52, 19], [0, 57], [0, 76]]);
      } else if (o.bk > 0) {
        spec.x = Math.min(ex + 13, BREEDTE - breed - 5); spec.y = ey + 5; spec.anker = 'start';
        spec.verschuif = ladder(spec, [[0, 0], [0, 20], [0, -20], [0, 40], [0, -40],
                                       [0, 60], [0, -60], [0, 80], [0, 100]]);
      } else {
        spec.x = Math.max(ex - 13, breed + 5); spec.y = ey + 5; spec.anker = 'end';
        spec.verschuif = ladder(spec, [[0, 0], [0, 20], [0, -20], [0, 40], [0, -40],
                                       [0, 60], [0, -60], [0, 80], [0, 100]]);
      }
      labels.voegToe(spec);
    });

    // Het gekozen 'nu': een moment in dit kader, en de klokstanden erop.
    const nuY = schaal.naarY(tNu);
    lijnen.appendChild(T.nuLijn(schaal, {
      beta: 0, t0: tNu, kleur: 'var(--gebeurtenis)', dikte: 1.8, streep: '9 5',
    }));
    labels.blokkeerLijn({ x1: linkerRand, y1: nuY, x2: rechterRand, y2: nuY, dikte: 12 });
    const nuLabel = {
      tekst: 'nu', x: linkerRand + 4, y: nuY - 10,
      grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 650, prioriteit: 70,
      anker: 'start',
    };
    nuLabel.verschuif = ladder(nuLabel, [[0, 0], [0, 24], [0, -26], [0, 40], [0, -44], [0, 58]]);
    labels.voegToe(nuLabel);

    lijst.forEach(function (o) {
      const x = o.bk * tNu;
      if (x < xMin || x > xMax) return;   // dit object is het beeld al uit
      // Bij nu = 0 zitten alle klokken op dezelfde plek en op dezelfde stand;
      // vier keer "tau=0,00" over elkaar heen zegt niets extra's.
      const stil = tNu < 0.05;
      const px = schaal.naarX(x);
      svg.appendChild(T.el('circle', {
        cx: px, cy: nuY, r: 6.5, fill: 'var(--kaart)',
        stroke: o.kleur, 'stroke-width': 2.6,
      }));
      labels.blokkeer({ links: px - 9, boven: nuY - 9, breedte: 18, hoogte: 18 });
      if (stil) return;
      // De klokstand hoort bij de stip, dus hij wijkt eerst opzij uit en pas
      // daarna naar boven: anders raakt hij los van zijn eigen object.
      const klok = {
        tekst: '\u03c4=' + F.nl(o.tau, 2), x: px + 11, y: nuY + 5,
        grootte: 13.5, kleur: o.kleur, gewicht: 600, prioriteit: 64 - o.index,
        anker: 'start',
      };
      klok.verschuif = ladder(klok,
        [[0, 0], [-98, 0], [0, -20], [-98, -20], [0, 20], [-98, 20],
         [0, -40], [-98, -40], [0, 40], [-98, 40], [0, -60], [-98, -60]]);
      labels.voegToe(klok);
    });

    // De oorsprong: hier zijn ze samen en staan alle klokken op nul.
    svg.appendChild(T.gebeurtenis(schaal, {
      t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 7,
    }));
    labels.blokkeer({ links: yAs - 13, boven: xAs - 13, breedte: 26, hoogte: 26 });
    const nul = {
      tekst: 'alle klokken op 0', x: yAs + 16, y: xAs + 26,
      grootte: 13.5, kleur: 'var(--gebeurtenis)', gewicht: 600, prioriteit: 55,
      anker: 'start',
    };
    // Onder de as is het rustig, maar de wereldlijnen steken er net doorheen;
    // vandaar ook de plekken links van de oorsprong.
    nul.verschuif = ladder(nul, [[0, 0], [0, 19], [0, 38], [-158, 0], [-158, 19],
                                 [-158, 38], [60, 0], [60, 19], [-230, 0], [-230, 19]]);
    labels.voegToe(nul);

    vaan.textContent = 'kader van ' + kaderNaam();
    vaan.style.color = kader < 0 ? 'var(--tekst-zacht)' : objecten[kader].kleur;

    if (toonHyperbolen) {
      const boog = {
        tekst: 'gelijke eigen tijd', x: linkerRand + 4, y: schaal.naarY(1.15) + 4,
        grootte: 13, kleur: 'var(--tekst-zacht)', cursief: true, prioriteit: 20,
        anker: 'start',
      };
      boog.verschuif = ladder(boog, [[0, 0], [0, 20], [0, -20], [0, 40], [0, -40],
                                     [0, 60], [0, -60], [0, 80], [0, -80]]);
      labels.voegToe(boog);
    }

    svg.appendChild(labels.tekenAlles());
    vulTabel(lijst);
  }

  // --- Zijkolom ----------------------------------------------------------
  function vulTabel(lijst) {
    const rijen = lijst.map(function (o) {
      return '<tr>' +
        '<td><span class="stip" style="background:' + o.kleur + '"></span>' + o.naam + '</td>' +
        '<td>' + F.nl(o.bk, 3) + '</td>' +
        '<td>' + F.nl(o.g, 3) + '</td>' +
        '<td>' + F.nl(o.tau, 2) + '</td>' +
        '</tr>';
    }).join('');
    tabelVak.innerHTML =
      '<table class="tabel"><caption>Gemeten in het kader van ' + kaderNaam() +
      '</caption><thead><tr><th>Object</th><th>\u03b2</th><th>\u03b3</th>' +
      '<th>\u03c4 bij nu</th></tr></thead><tbody>' + rijen + '</tbody></table>';
  }

  function bouwAantal() {
    aantalVak.innerHTML = '';
    [2, 3, 4].forEach(function (n) {
      const knop = document.createElement('button');
      knop.className = 'knop klein' + (n === aantal ? ' aan' : '');
      knop.textContent = String(n);
      knop.addEventListener('click', function () {
        aantal = n;
        // Een kader dat niet meer meedoet, valt terug op het perron
        if (kader >= aantal) kader = -1;
        bouwAlles();
        teken();
      });
      aantalVak.appendChild(knop);
    });
  }

  function bouwRegels() {
    regelVak.innerHTML = '';
    for (let i = 0; i < aantal; i++) {
      const o = objecten[i];
      const regel = document.createElement('div');
      regel.className = 'object-regel';

      const naam = document.createElement('input');
      naam.type = 'text';
      naam.className = 'naam-invoer';
      naam.value = o.naam;
      naam.maxLength = 9;
      naam.setAttribute('aria-label', 'Naam van object ' + (i + 1));
      naam.style.borderBottomColor = o.kleur;
      naam.addEventListener('input', function () {
        o.naam = naam.value.trim() || 'object ' + (i + 1);
        bouwKader();
        teken();
      });

      const schuif = document.createElement('input');
      schuif.type = 'range';
      schuif.min = '-0.95';
      schuif.max = '0.95';
      schuif.step = '0.01';
      schuif.value = String(o.beta);
      schuif.setAttribute('aria-label', 'Snelheid van ' + o.naam);

      const waarde = document.createElement('span');
      waarde.className = 'regel-waarde';
      waarde.textContent = F.nl(o.beta, 2) + 'c';

      schuif.addEventListener('input', function () {
        o.beta = parseFloat(schuif.value);
        waarde.textContent = F.nl(o.beta, 2) + 'c';
        teken();
      });

      regel.appendChild(naam);
      regel.appendChild(schuif);
      regel.appendChild(waarde);
      regelVak.appendChild(regel);
    }
  }

  function bouwKader() {
    kaderVak.innerHTML = '';
    const keuzes = [{ i: -1, naam: 'Perron' }];
    for (let i = 0; i < aantal; i++) keuzes.push({ i: i, naam: objecten[i].naam });
    keuzes.forEach(function (k) {
      const knop = document.createElement('button');
      knop.className = 'knop klein' + (k.i === kader ? ' aan' : '');
      knop.textContent = k.naam;
      knop.addEventListener('click', function () {
        kader = k.i;
        bouwKader();
        teken();
      });
      kaderVak.appendChild(knop);
    });
  }

  function bouwAlles() {
    bouwAantal();
    bouwRegels();
    bouwKader();
  }

  nuSchuif.addEventListener('input', function () {
    tNu = parseFloat(nuSchuif.value);
    nuWaarde.textContent = F.nl(tNu, 2);
    teken();
  });
  gelijkKnop.addEventListener('click', function () {
    toonGelijktijdig = !toonGelijktijdig;
    gelijkKnop.classList.toggle('aan', toonGelijktijdig);
    teken();
  });
  hyperKnop.addEventListener('click', function () {
    toonHyperbolen = !toonHyperbolen;
    hyperKnop.classList.toggle('aan', toonHyperbolen);
    teken();
  });

  nuWaarde.textContent = F.nl(tNu, 2);
  bouwAlles();
  teken();
}
