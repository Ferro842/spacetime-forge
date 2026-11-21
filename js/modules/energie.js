// energie.js — energie en impuls, en waarom massa energie is.
//
// Zet energie omhoog en impuls opzij, en een deeltje is een pijl. Staat het
// stil, dan wijst de pijl recht omhoog en is zijn lengte de massa: E = mc².
// Beweegt het, dan schuift de punt langs een hyperbool, E² − p² = m². Dat is
// dezelfde soort kromme als de ijk-hyperbool in het Minkowski-diagram, en de
// pijl wijst langs de wereldlijn van het deeltje.
//
// Deel 2 laat twee deeltjes botsen en aan elkaar blijven zitten. De pijlen
// tellen op, kop aan staart, en de som ligt op een hógere hyperbool: de klomp
// is zwaarder dan de twee deeltjes samen. Beweging is massa geworden.
//
// Eenheden: massa van één deeltje is 1, c = 1; energie en impuls in die maat.
import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Energie en impuls';
export const onderschrift =
  'Een deeltje als pijl: energie omhoog, impuls opzij. Wat vast blijft is de ' +
  'massa. Laat twee deeltjes botsen en er komt massa bij.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    tik: ['#en-deel-deeltje'],
    aan: { '#en-doel': false },
    stel: { '#en-beta': 0.6, '#en-kader': 0 },
  },
  stappen: [
    {
      kop: 'Stilstaan kost energie',
      tekst:
        'Energie staat omhoog, impuls opzij. Een deeltje dat stilstaat heeft geen ' +
        'impuls, maar wel energie: zijn massa. De pijl wijst recht omhoog en is ' +
        '1 lang. Dat is E = mc\u00b2.',
      stel: { '#en-beta': 0 },
    },
    {
      kop: 'In beweging',
      tekst:
        'Bij 0,6c wijst de pijl schuin: impuls 0,75, energie 1,25. Hij wijst ' +
        'precies langs de wereldlijn van het deeltje. De punt schuift langs een ' +
        'hyperbool, dezelfde soort kromme als de maatlat van de ruimtetijd.',
    },
    {
      kop: 'Wat vast blijft is de massa',
      tekst:
        'Hoe hard het ook gaat, E\u00b2 \u2212 p\u00b2 blijft 1: de massa. Het stuk boven de 1 ' +
        'is bewegingsenergie. Bij 0,9c is dat al 1,29 keer de massa zelf, waar ' +
        'Newton 0,41 zou zeggen.',
      stel: { '#en-beta': 0.9 },
    },
    {
      kop: 'Twee deeltjes botsen',
      tekst:
        'Twee deeltjes van massa 1 vliegen met 0,6c op elkaar af en blijven aan ' +
        'elkaar zitten. Tel de pijlen op, kop aan staart: impuls nul, energie ' +
        '2,5. De klomp staat stil en heeft massa 2,5, niet 2.',
      tik: ['#en-deel-botsing'],
    },
    {
      kop: 'Beweging is massa geworden',
      tekst:
        'Die halve massa extra was bewegingsenergie. Ze is niet weg: ze zit in de ' +
        'klomp, als warmte, en weegt mee. Kijk vanuit een ander kader: alle ' +
        'pijlen schuiven langs hun kromme, en de massa blijft 2,5.',
      stel: { '#en-kader': 0.5 },
      tik: ['#en-deel-botsing'],
    },
    {
      kop: 'Waarom je deeltjes op elkaar schiet',
      tekst:
        'Schiet met 0,9c op een deeltje dat stilstaat en de klomp krijgt massa ' +
        '2,57: het meeste blijft beweging. Laat je ze frontaal botsen, dan is ' +
        'het 4,59. Daarom botsen versnellers twee bundels op elkaar.',
      aan: { '#en-doel': true },
      stel: { '#en-beta': 0.9 },
      tik: ['#en-deel-botsing'],
    },
  ],
};

const BREEDTE = 960;
const HOOGTE = 940;
const VLAK = { links: 96, rechts: 916, boven: 132, onder: 856 };

/** Dezelfde breedteschatting als de labelplaatser in teken.js. */
function schatBreedte(tekst, grootte) {
  const hoofdletters = (tekst.match(/[A-Z\u00c0-\u00de]/g) || []).length;
  return (tekst.length + hoofdletters * 0.22) * grootte * 0.58;
}

/** Houdt alleen de uitwijkplekken over die helemaal binnen de viewBox vallen. */
function ladder(spec, plekken) {
  const b = schatBreedte(spec.tekst, spec.grootte);
  function links(dx) {
    let l = spec.x + dx;
    if (spec.anker === 'middle') l -= b / 2;
    else if (spec.anker === 'end') l -= b;
    return l;
  }
  const uit = plekken.filter(function (plek) {
    const y = spec.y + plek[1];
    return links(plek[0]) >= 3 && links(plek[0]) + b <= BREEDTE - 3 &&
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
  let beta = 0.6;         // snelheid van het deeltje (in deel 2: van elk deeltje)
  let deel = 'deeltje';   // 'deeltje' of 'botsing'
  let doelStil = false;   // deel 2: het tweede deeltje staat stil
  let kader = 0;          // deel 2: snelheid van het kader waaruit je kijkt
  let laatste = null;

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Een deeltje als pijl</summary>' +
    '<p>In het Minkowski-diagram is een deeltje een lijn door tijd en plaats. ' +
    'Hier is het een <b>pijl</b>: omhoog zijn energie, opzij zijn impuls. De pijl ' +
    'wijst dezelfde kant op als de wereldlijn. Hoe hard het deeltje ook gaat, de ' +
    'punt blijft op \u00e9\u00e9n kromme, en waar die de energie-as snijdt staat de ' +
    '<b>massa</b>. Stilstaan is dus niet nul energie maar mc\u00b2.</p>' +
    '<p style="margin-top:7px">Pijlen mag je optellen. Bij een <b>botsing</b> waar ' +
    'twee deeltjes aan elkaar blijven zitten is de som \u00e9\u00e9n nieuwe pijl, en die ' +
    'ligt op een hogere kromme: de klomp is zwaarder dan de delen. De ' +
    'bewegingsenergie is massa geworden.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Energie tegen impuls: een deeltje als pijl naar een punt op een hyperbool',
  });
  vak.appendChild(svg);
  doel.appendChild(vak);

  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<div class="knoppen" id="en-delen">' +
    '  <button class="knop klein aan" id="en-deel-deeltje">1 \u00b7 E\u00e9n deeltje</button>' +
    '  <button class="knop klein" id="en-deel-botsing">2 \u00b7 Botsing</button>' +
    '</div>' +
    '<div class="regelaars" style="margin-top:10px">' +
    '  <div class="regelaar">' +
    '    <label for="en-beta">Snelheid: <b id="en-beta-w"></b></label>' +
    '    <input type="range" id="en-beta" min="0" max="0.9" step="0.01" value="0.6" />' +
    '  </div>' +
    '  <div id="en-botsvak" style="visibility:hidden">' +
    '    <div class="regelaar">' +
    '      <label for="en-kader">Kijk vanuit een kader met: <b id="en-kader-w"></b></label>' +
    '      <input type="range" id="en-kader" min="-0.5" max="0.5" step="0.01" value="0" />' +
    '    </div>' +
    '    <div class="knoppen">' +
    '      <button class="knop klein" id="en-doel">Doelwit staat stil</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const formulePaneel = document.createElement('div');
  formulePaneel.className = 'paneel';
  formulePaneel.innerHTML = '<h3>Vragen bij energie en impuls</h3><div class="formules" id="en-vragen"></div>';
  zijkolom.appendChild(formulePaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De energie van een bewegend lichaam en de gelijkwaardigheid van massa en ' +
    'energie volgen Einstein, "Relativity", hoofdstuk 15, in eigen woorden. De ' +
    'tekening met energie en impuls als pijl is een meetkundige aanvulling.';
  zijkolom.appendChild(bron);

  const betaSchuif = paneel.querySelector('#en-beta');
  const betaW = paneel.querySelector('#en-beta-w');
  const kaderSchuif = paneel.querySelector('#en-kader');
  const kaderW = paneel.querySelector('#en-kader-w');
  const botsVak = paneel.querySelector('#en-botsvak');
  const doelKnop = paneel.querySelector('#en-doel');
  const deelKnoppen = {
    deeltje: paneel.querySelector('#en-deel-deeltje'),
    botsing: paneel.querySelector('#en-deel-botsing'),
  };
  const vragenVak = formulePaneel.querySelector('#en-vragen');
  const open = new Set();

  function merk(labels, spec, plekken) {
    spec.verschuif = ladder(spec, plekken || [[0, 0]]);
    labels.voegToe(spec);
  }

  // Bouwstenen die beide delen gebruiken: assen, lichtlijnen, een hyperbool en
  // een pijl. S is de schaal { X, Y, pMin, pMax, eMax }.
  function assen(labels, S) {
    svg.appendChild(T.el('line', {
      x1: VLAK.links, y1: S.Y(0), x2: VLAK.rechts, y2: S.Y(0), stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: S.X(0), y1: S.Y(0), x2: S.X(0), y2: VLAK.boven, stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({ x1: VLAK.links, y1: S.Y(0), x2: VLAK.rechts, y2: S.Y(0), dikte: 10 });
    labels.blokkeerLijn({ x1: S.X(0), y1: S.Y(0), x2: S.X(0), y2: VLAK.boven, dikte: 10 });
    for (let v = Math.ceil(S.pMin); v <= S.pMax + 1e-9; v++) {
      if (v === 0) continue;
      svg.appendChild(T.el('line', {
        x1: S.X(v), y1: S.Y(0), x2: S.X(v), y2: S.Y(0) + 6, stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      merk(labels, {
        tekst: String(v), x: S.X(v), y: S.Y(0) + 22, grootte: 12.5, kleur: 'var(--tekst-zacht)',
        anker: 'middle', prioriteit: 20,
      });
    }
    for (let v = 1; v <= S.eMax + 1e-9; v++) {
      svg.appendChild(T.el('line', {
        x1: S.X(0) - 6, y1: S.Y(v), x2: S.X(0), y2: S.Y(v), stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      merk(labels, {
        tekst: String(v), x: S.X(0) - 10, y: S.Y(v) + 4, grootte: 12.5, kleur: 'var(--tekst-zacht)',
        anker: 'end', prioriteit: 20,
      });
    }
    merk(labels, {
      tekst: 'impuls \u2192', x: VLAK.rechts, y: S.Y(0) + 44, grootte: 14.5, kleur: 'var(--gebeurtenis)',
      gewicht: 650, anker: 'end', prioriteit: 85,
    });
    merk(labels, {
      tekst: '\u2191 energie', x: S.X(0) + 12, y: VLAK.boven + 6, grootte: 14.5, kleur: 'var(--eigentijd)',
      gewicht: 650, anker: 'start', prioriteit: 85,
    }, [[0, 0], [-98, 0], [0, 22], [-98, 22]]);
    // Licht: geen massa, dus energie gelijk aan impuls
    [-1, 1].forEach(function (r) {
      const eind = Math.min(S.eMax, r > 0 ? S.pMax : -S.pMin);
      if (eind < 0.3) return;
      svg.appendChild(T.el('line', {
        x1: S.X(0), y1: S.Y(0), x2: S.X(r * eind), y2: S.Y(eind),
        stroke: 'var(--licht)', 'stroke-width': 1.6, 'stroke-dasharray': '7 5',
      }));
      labels.blokkeerSchuin({ x1: S.X(0), y1: S.Y(0), x2: S.X(r * eind), y2: S.Y(eind), dikte: 6 });
    });
  }
  function hyperbool(S, m, kleur, dikte, streep) {
    const punten = [];
    for (let i = 0; i <= 160; i++) {
      const p = S.pMin + (S.pMax - S.pMin) * i / 160;
      const E = Math.sqrt(m * m + p * p);
      if (E > S.eMax) continue;
      punten.push(S.X(p).toFixed(1) + ',' + S.Y(E).toFixed(1));
    }
    svg.appendChild(T.el('polyline', {
      points: punten.join(' '), fill: 'none', stroke: kleur, 'stroke-width': dikte,
      'stroke-dasharray': streep || null,
    }));
  }
  function pijl(labels, S, van, naar, kleur, dikte) {
    const x1 = S.X(van.p), y1 = S.Y(van.E), x2 = S.X(naar.p), y2 = S.Y(naar.E);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const k = Math.min(16, len * 0.5);
    svg.appendChild(T.el('line', {
      x1: x1, y1: y1, x2: x2 - ux * k * 0.6, y2: y2 - uy * k * 0.6,
      stroke: kleur, 'stroke-width': dikte, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('path', {
      d: 'M ' + x2 + ' ' + y2 + ' L ' + (x2 - ux * k - uy * k * 0.45) + ' ' + (y2 - uy * k + ux * k * 0.45) +
         ' L ' + (x2 - ux * k + uy * k * 0.45) + ' ' + (y2 - uy * k - ux * k * 0.45) + ' Z',
      fill: kleur,
    }));
    labels.blokkeerSchuin({ x1: x1, y1: y1, x2: x2, y2: y2, dikte: 8 });
  }

  // --- Deel 1: één deeltje -------------------------------------------------------
  function tekenDeeltje(labels) {
    const g = beta > 0 ? F.gamma(beta) : 1;
    const E = F.energie(1, beta), p = F.impuls(1, beta);
    const pMin = -0.45, pMax = 2.75, eMax = 2.75;
    const s = Math.min((VLAK.rechts - VLAK.links) / (pMax - pMin), (VLAK.onder - VLAK.boven) / eMax);
    const S = {
      pMin: pMin, pMax: pMax, eMax: eMax,
      X: function (v) { return VLAK.links + (v - pMin) * s; },
      Y: function (v) { return VLAK.onder - v * s; },
    };
    assen(labels, S);
    hyperbool(S, 1, 'var(--blauw)', 2.8);
    // Rustenergie en bewegingsenergie, als twee stukken langs de energie-as
    const xBalk = S.X(0) - 34;
    svg.appendChild(T.el('line', {
      x1: xBalk, y1: S.Y(0), x2: xBalk, y2: S.Y(1), stroke: 'var(--eigentijd)', 'stroke-width': 7,
    }));
    if (E > 1.004) {
      svg.appendChild(T.el('line', {
        x1: xBalk, y1: S.Y(1), x2: xBalk, y2: S.Y(E), stroke: 'var(--gebeurtenis)', 'stroke-width': 7,
      }));
    }
    // Wat Newton voor de bewegingsenergie zou geven
    const newton = 1 + 0.5 * beta * beta;
    if (beta > 0.15) {
      svg.appendChild(T.el('line', {
        x1: xBalk - 12, y1: S.Y(newton), x2: xBalk + 12, y2: S.Y(newton),
        stroke: 'var(--tekst-zacht)', 'stroke-width': 2, 'stroke-dasharray': '3 3',
      }));
    }
    // Hulplijnen van de punt naar de assen
    svg.appendChild(T.el('line', {
      x1: S.X(p), y1: S.Y(0), x2: S.X(p), y2: S.Y(E), stroke: 'var(--gebeurtenis)',
      'stroke-width': 1.4, 'stroke-dasharray': '5 4',
    }));
    svg.appendChild(T.el('line', {
      x1: xBalk, y1: S.Y(E), x2: S.X(p), y2: S.Y(E), stroke: 'var(--eigentijd)',
      'stroke-width': 1.4, 'stroke-dasharray': '5 4',
    }));
    pijl(labels, S, { p: 0, E: 0 }, { p: p, E: E }, 'var(--accent)', 5);
    svg.appendChild(T.el('circle', { cx: S.X(p), cy: S.Y(E), r: 18, fill: 'var(--accent)', opacity: 0.16 }));
    svg.appendChild(T.el('circle', {
      cx: S.X(p), cy: S.Y(E), r: 9, fill: 'var(--accent)', stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    labels.blokkeer({ links: S.X(p) - 14, boven: S.Y(E) - 14, breedte: 28, hoogte: 28 });

    merk(labels, {
      tekst: 'E\u00e9n deeltje met massa 1', x: 30, y: 44, grootte: 15, kleur: 'var(--tekst)',
      gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'energie ' + F.nl(E, 3) + ' = massa 1 + beweging ' + F.nl(E - 1, 3),
      x: 30, y: 68, grootte: 14.5, kleur: 'var(--eigentijd)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'impuls ' + F.nl(p, 3) + ' \u00b7 E\u00b2 \u2212 p\u00b2 = ' + F.nl(E * E - p * p, 3) + ', altijd',
      x: 30, y: 92, grootte: 14.5, kleur: 'var(--gebeurtenis)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'de pijl wijst langs de wereldlijn', x: BREEDTE - 30, y: 44, grootte: 13.5,
      kleur: 'var(--accent)', gewicht: 650, anker: 'end', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'E\u00b2 \u2212 p\u00b2 = 1', x: S.X(pMax) - 8, y: S.Y(Math.sqrt(1 + pMax * pMax)) + 34, grootte: 14,
      kleur: 'var(--blauw)', gewicht: 650, cursief: true, anker: 'end', prioriteit: 60,
    }, [[0, 0], [0, 22], [-60, 30], [-120, 60]]);
    merk(labels, {
      tekst: 'licht: geen massa, E = p', x: S.X(1.9) + 14, y: S.Y(1.9) + 26, grootte: 13,
      kleur: 'var(--licht)', cursief: true, anker: 'start', prioriteit: 40,
    }, [[0, 0], [0, 22], [-40, 44], [-200, -40]]);
    merk(labels, {
      tekst: 'massa', x: xBalk - 12, y: S.Y(0.5) + 5, grootte: 13.5, kleur: 'var(--eigentijd)',
      gewicht: 650, anker: 'end', prioriteit: 70,
    });
    if (E > 1.06) {
      merk(labels, {
        tekst: 'beweging', x: xBalk - 12, y: S.Y((1 + E) / 2) + 5, grootte: 13.5,
        kleur: 'var(--gebeurtenis)', gewicht: 650, anker: 'end', prioriteit: 70,
      }, [[0, 0], [0, -18], [0, 18]]);
    }
    if (beta > 0.15) {
      merk(labels, {
        tekst: 'Newton', x: xBalk - 16, y: S.Y(newton) + 4, grootte: 12.5, kleur: 'var(--tekst-zacht)',
        cursief: true, anker: 'end', prioriteit: 30,
      }, [[0, 0], [0, 16], [0, -16]]);
    }
    return { S: S, g: g, E: E, p: p };
  }

  // --- Deel 2: de botsing ----------------------------------------------------------
  /** De pijlen van de twee deeltjes en hun som, in het gekozen kader. */
  function botsing() {
    const naar = function (v) { const q = F.lorentz(v.E, v.p, kader); return { E: q.t, p: q.x }; };
    const a = naar({ E: F.energie(1, beta), p: F.impuls(1, beta) });
    const b = naar(doelStil ? { E: 1, p: 0 } : { E: F.energie(1, -beta), p: F.impuls(1, -beta) });
    const som = { E: a.E + b.E, p: a.p + b.p };
    return { a: a, b: b, som: som, M: F.invarianteMassa(som.E, som.p) };
  }
  function tekenBotsing(labels) {
    const r = botsing();
    // Ruim genoeg voor de snelste botsing vanuit het snelste kader
    const pMin = -3.0, pMax = 4.6, eMax = 6.6;
    const s = Math.min((VLAK.rechts - VLAK.links) / (pMax - pMin), (VLAK.onder - VLAK.boven) / eMax);
    const S = {
      pMin: pMin, pMax: pMax, eMax: eMax,
      X: function (v) { return VLAK.links + (v - pMin) * s; },
      Y: function (v) { return VLAK.onder - v * s; },
    };
    assen(labels, S);
    hyperbool(S, 1, 'var(--blauw)', 1.6);
    hyperbool(S, 2, 'var(--tekst-zacht)', 1.6, '6 5');
    hyperbool(S, r.M, 'var(--accent)', 2.8);
    // Kop aan staart: eerst deeltje A, daarbovenop deeltje B, en hun som
    pijl(labels, S, { p: 0, E: 0 }, r.a, 'var(--trein)', 4);
    pijl(labels, S, r.a, r.som, 'var(--blauw)', 4);
    pijl(labels, S, { p: 0, E: 0 }, r.som, 'var(--accent)', 5);
    svg.appendChild(T.el('circle', {
      cx: S.X(r.som.p), cy: S.Y(r.som.E), r: 8, fill: 'var(--accent)', stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    labels.blokkeer({ links: S.X(r.som.p) - 12, boven: S.Y(r.som.E) - 12, breedte: 24, hoogte: 24 });

    merk(labels, {
      tekst: doelStil ? 'Een deeltje treft een stilstaand deeltje; ze blijven aan elkaar zitten'
                      : 'Twee deeltjes botsen frontaal en blijven aan elkaar zitten',
      x: 30, y: 44, grootte: 15, kleur: 'var(--tekst)', gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'pijl A plus pijl B, kop aan staart: energie ' + F.nl(r.som.E, 2) + ', impuls ' + F.nl(r.som.p, 2),
      x: 30, y: 68, grootte: 14.5, kleur: 'var(--accent)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'massa van de klomp: ' + F.nl(r.M, 2) + ' \u00b7 erbij gekomen uit beweging: ' + F.nl(r.M - 2, 2),
      x: 30, y: 92, grootte: 14.5, kleur: 'var(--accent)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    // Een letter bij elke pijl, halverwege, aan de buitenkant
    const letter = function (tekst, van, tot, kleur) {
      const mx = (S.X(van.p) + S.X(tot.p)) / 2, my = (S.Y(van.E) + S.Y(tot.E)) / 2;
      const len = Math.hypot(S.X(tot.p) - S.X(van.p), S.Y(tot.E) - S.Y(van.E)) || 1;
      const nx = -(S.Y(tot.E) - S.Y(van.E)) / len, ny = (S.X(tot.p) - S.X(van.p)) / len;   // loodrecht
      const plekken = [];
      [18, -18, 30, -30, 44, -44].forEach(function (af) { plekken.push([nx * af, ny * af]); });
      merk(labels, {
        tekst: tekst, x: mx, y: my + 6, grootte: 17, kleur: kleur, gewicht: 700, anker: 'middle',
        prioriteit: 74,
      }, plekken);
    };
    letter('A', { p: 0, E: 0 }, r.a, 'var(--trein)');
    letter('B', r.a, r.som, 'var(--blauw)');
    merk(labels, {
      tekst: 'de klomp', x: S.X(r.som.p) + 14, y: S.Y(r.som.E) - 16, grootte: 14.5, kleur: 'var(--accent)',
      gewicht: 650, anker: 'start', prioriteit: 84,
    }, [[0, 0], [-110, 0], [0, -20], [-110, -20], [0, 44], [-110, 44]]);
    // De drie krommen, op een vaste plek rechtsboven
    [['dun blauw: massa 1, \u00e9\u00e9n deeltje', 'var(--blauw)'],
     ['gestreept: massa 2, de twee deeltjes in rust', 'var(--tekst-zacht)'],
     ['paars: de klomp, massa ' + F.nl(r.M, 2), 'var(--accent)']].forEach(function (regel, i) {
      merk(labels, {
        tekst: regel[0], x: BREEDTE - 30, y: 124 + 22 * i, grootte: 13.5, kleur: regel[1], gewicht: 650,
        anker: 'end', prioriteit: 95,
      });
    });
    return { S: S, r: r };
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const labels = T.maakLabelPlaatser();
    let kaarten;
    if (deel === 'deeltje') {
      const d = tekenDeeltje(labels);
      laatste = { S: d.S };
      kaarten = [
        ['Energie', F.nl(d.E, 4), 'var(--eigentijd)'],
        ['Impuls', F.nl(d.p, 4), 'var(--gebeurtenis)'],
        ['Bewegingsenergie', F.nl(d.E - 1, 4), 'var(--gebeurtenis)'],
        ['Volgens Newton: \u00bd\u00b7v\u00b2', F.nl(0.5 * beta * beta, 4), 'var(--tekst-zacht)'],
        ['Massa: \u221a(E\u00b2 \u2212 p\u00b2)', F.nl(F.invarianteMassa(d.E, d.p), 4), 'var(--blauw)'],
        ['Lorentzfactor \u03b3', F.nl(d.g, 4), 'var(--accent)'],
      ];
    } else {
      const b = tekenBotsing(labels);
      laatste = { S: b.S };
      kaarten = [
        ['Energie samen', F.nl(b.r.som.E, 3), 'var(--eigentijd)'],
        ['Impuls samen', F.nl(b.r.som.p, 3), 'var(--gebeurtenis)'],
        ['Massa van de klomp', F.nl(b.r.M, 3), 'var(--accent)'],
        ['Erbij gekomen', F.nl(b.r.M - 2, 3), 'var(--accent)'],
      ];
    }
    svg.appendChild(labels.tekenAlles());
    betaW.textContent = F.nl(beta, 2) + 'c';
    kaderW.textContent = F.nl(kader, 2) + 'c';
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
    vulVragen();
  }

  function vulVragen() {
    const g = beta > 0 ? F.gamma(beta) : 1;
    const frontaal = 2 * g, opDoel = Math.sqrt(2 * (1 + g));
    const kaarten = [
      {
        naam: 'Waarom een hyperbool?',
        formule: 'E\u00b2 \u2212 p\u00b2 = m\u00b2',
        som: F.nl(g, 3) + '\u00b2 \u2212 ' + F.nl(g * beta, 3) + '\u00b2 = ' + F.nl(g * g * (1 - beta * beta), 3),
        waarom:
          'Energie en impuls rekenen tussen kaders om op precies dezelfde manier als tijd en ' +
          'plaats. Bij tijd en plaats blijft daarbij (ct)\u00b2 \u2212 x\u00b2 gelijk; hier blijft E\u00b2 \u2212 p\u00b2 ' +
          'gelijk. Wat voor iedereen hetzelfde is, is de massa. De punt van de pijl kan dus ' +
          'alleen langs die ene kromme schuiven, en hij raakt de lichtlijn nooit: voor de ' +
          'laatste beetjes snelheid is steeds meer energie nodig.',
      },
      {
        naam: 'Waar is Newton gebleven?',
        formule: 'E = \u03b3\u00b7m \u2248 m + \u00bd\u00b7m\u00b7v\u00b2',
        som: 'beweging ' + F.nl(g - 1, 4) + ' tegen \u00bd\u00b7v\u00b2 = ' + F.nl(0.5 * beta * beta, 4),
        waarom:
          'Hij zit erin, voor lage snelheden. Vlak bij de as loopt de hyperbool als een ' +
          'parabool, en de hoogte boven de 1 is dan vrijwel \u00bd\u00b7v\u00b2: de bewegingsenergie van ' +
          'Newton. Het gestreepte streepje naast de as wijst die waarde aan. Zet de snelheid ' +
          'laag en het valt samen met de echte energie; zet hem hoog en Newton blijft ver ' +
          'achter. Wat Newton niet had is de 1 zelf: de energie van stilstaan.',
      },
      {
        naam: 'Is de klomp echt zwaarder?',
        formule: 'M = \u221a(E\u00b2 \u2212 p\u00b2) van de som',
        som: 'frontaal: 2\u03b3 = ' + F.nl(frontaal, 3) + ' \u00b7 op een stilstaand doel: \u221a(2 + 2\u03b3) = ' + F.nl(opDoel, 3),
        waarom:
          'Ja. Massa is niets anders dan de energie die een ding heeft als het stilstaat. De ' +
          'klomp staat stil (of je kunt meereizen tot hij stilstaat) en heeft dan al die ' +
          'energie nog: de twee massa\u2019s plus de bewegingsenergie, nu als warmte. Een warme ' +
          'kop thee is om dezelfde reden een fractie zwaarder dan een koude. Andersom werkt ' +
          'het ook: valt iets uiteen in snelle brokstukken, dan zijn die samen lichter.',
      },
    ];
    vragenVak.innerHTML = kaarten.map(function (k, i) {
      return '<details class="formule"' + (open.has(i) ? ' open' : '') + ' data-nr="' + i + '">' +
        '<summary><span class="naam">' + k.naam + '</span></summary>' +
        '<div class="formule-inhoud"><div class="formule-regel">' + k.formule + '</div>' +
        '<div class="som">' + k.som + '</div>' +
        '<p class="waarom">' + k.waarom + '</p></div></details>';
    }).join('');
    vragenVak.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        const nr = Number(d.getAttribute('data-nr'));
        if (d.open) open.add(nr); else open.delete(nr);
      });
    });
  }

  // --- Bediening ---------------------------------------------------------------------
  function kiesDeel(welk) {
    deel = welk;
    deelKnoppen.deeltje.classList.toggle('aan', welk === 'deeltje');
    deelKnoppen.botsing.classList.toggle('aan', welk === 'botsing');
    // Onzichtbaar in plaats van weg: de ruimte blijft, zodat de tabbladen die
    // bij het laden zijn ingedeeld ook in deel 2 passen.
    botsVak.style.visibility = welk === 'botsing' ? 'visible' : 'hidden';
    teken();
  }
  deelKnoppen.deeltje.addEventListener('click', function () { kiesDeel('deeltje'); });
  deelKnoppen.botsing.addEventListener('click', function () { kiesDeel('botsing'); });
  betaSchuif.addEventListener('input', function () { beta = parseFloat(betaSchuif.value); teken(); });
  kaderSchuif.addEventListener('input', function () { kader = parseFloat(kaderSchuif.value); teken(); });
  doelKnop.addEventListener('click', function () {
    doelStil = !doelStil;
    doelKnop.classList.toggle('aan', doelStil);
    teken();
  });

  // Slepen in deel 1: de punt volgt je vinger langs de hyperbool
  T.koppelSleep(svg, BREEDTE, HOOGTE, {
    opStart: function () { return deel === 'deeltje' && laatste ? 'punt' : false; },
    opSleep: function (punt) {
      const S = laatste.S;
      const p = Math.max(0, (punt.x - S.X(0)) / (S.X(1) - S.X(0)));
      beta = Math.min(0.9, Math.round(100 * p / Math.sqrt(1 + p * p)) / 100);
      betaSchuif.value = String(beta);
      teken();
    },
  });

  teken();
}
