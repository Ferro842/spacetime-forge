// kever.js — de kever met de klinknagel.
//
// Een klinknagel vliegt op een gat af dat dieper is dan zijn steel lang is,
// met een kever op de bodem. De muur ziet een gekrompen nagel en verwacht dat
// de kop stuit lang voordat de punt beneden is. De nagel ziet een gekrompen
// gat en verwacht het omgekeerde. De kever is geplet of niet: daar moeten
// beide het over eens zijn.
//
// De sleutel is dat de punt niet kan weten dat de kop gestuit is. Dat nieuws
// gaat hooguit met de lichtsnelheid door de steel, en tot het aankomt vliegt
// de punt door. Meer dan dat gebruikt deze module niet: wat de nagel doet als
// het nieuws er eenmaal is hangt af van het materiaal en blijft buiten beeld.
//
// Net als in de staaf in de loods zet de schuif één klok, die op de punt, en
// legt elk kader zijn eigen nu door die gebeurtenis. Lengte en tijd in
// millimeters, zodat licht onder 45° loopt.
import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Kever en klinknagel';
export const onderschrift =
  'Een klinknagel die te kort is voor het gat plet de kever toch. De punt weet ' +
  'nog niet dat de kop gestuit is: dat nieuws gaat niet sneller dan het licht.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    tik: ['#kv-kader-muur'],
    stel: { '#kv-beta': 0.8, '#kv-steel': 10, '#kv-gat': 15, '#kv-tijd': 0 },
  },
  stappen: [
    {
      kop: 'De vraag',
      tekst:
        'Een klinknagel met een steel van 10 mm vliegt met 0,8c op een gat van ' +
        '15 mm diep af. Onderin zit een kever. In rust komt de nagel 5 mm tekort. ' +
        'Is de kever veilig?',
    },
    {
      kop: 'De muur: ruim veilig',
      tekst:
        'Bovenste beeld. Voor de muur is de steel gekrompen tot 6 mm. De kop ' +
        'stuit op de muur terwijl de punt nog 9 mm van de kever is.',
      tik: ['#kv-kop-muur'],
    },
    {
      kop: 'De nagel: het gat is te ondiep',
      tekst:
        'Onderste beeld. Voor de nagel is het gat gekrompen tot 9 mm. De bodem ' +
        'raakt de punt terwijl de muur nog 1 mm van de kop is. Twee kaders, twee ' +
        'tegengestelde voorspellingen.',
      tik: ['#kv-afloop'],
    },
    {
      kop: 'Wat de muur dan ziet',
      tekst:
        'Bovenste beeld, op datzelfde moment van de punt. De kop zit allang tegen ' +
        'de muur, maar de punt is doorgevlogen: de steel is uitgerekt tot 15 mm. ' +
        'Ook de muur ziet de kever geplet worden.',
      tik: ['#kv-afloop'],
    },
    {
      kop: 'Het nieuws komt te laat',
      tekst:
        'In het diagram vertrekt bij het stuiten van de kop een lichtlijn: sneller ' +
        'kan het nieuws niet door de steel. De punt loopt rechtdoor tot hij die ' +
        'lijn kruist, en dat zou pas op 30 mm zijn. De bodem ligt op 15.',
      tik: ['#kv-afloop'],
    },
    {
      kop: 'Drie keer de steel',
      tekst:
        'Die 30 mm is de steel maal de dopplerfactor: dezelfde 3 als bij de ' +
        'tweeling op 0,8c. Elk gat dat ondieper is, is dodelijk, hoe stijf de ' +
        'nagel ook is.',
      tik: ['#kv-kader-nagel', '#kv-afloop'],
    },
    {
      kop: 'Een dieper gat',
      tekst:
        'Maak het gat 34 mm diep. Nu haalt het nieuws de punt in, 4 mm voor de ' +
        'bodem. Of hij daarna ook stopt hangt af van de nagel zelf: hier houdt de ' +
        'relativiteit op en begint het materiaal.',
      stel: { '#kv-gat': 34 },
      tik: ['#kv-afloop'],
    },
  ],
};

const BREEDTE = 960;
const HOOGTE = 940;
// Twee tonelen boven elkaar, daaronder het diagram
// (het vaantje staat linksboven, dus de eerste regel begint daaronder)
const TONEEL = [{ kop: 46, midden: 110, voet: 178 }, { kop: 206, midden: 270, voet: 338 }];
const SCHEIDING = 354;
const VLAK = { links: 74, rechts: 930, titel: 376, boven: 392, onder: 892 };
const KOP = 12;        // dikte van de kop van de nagel, in viewBox-eenheden
const WAND = 44;       // hoeveel muur er achter de bodem nog getekend wordt

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
  let beta = 0.8;
  let L = 10;             // steel in rust, mm
  let D = 15;             // diepte van het gat, mm
  let fractie = 0;        // waar op de klok van de punt, van begin tot afloop
  let kader = 'muur';     // in welk kader het diagram getekend is
  let speelt = false;
  let laatste = null;     // wat het slepen nodig heeft van de laatste tekening

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Wie heeft gelijk, de muur of de nagel?</summary>' +
    '<p>De <b>muur</b> ziet een gekrompen nagel: de kop stuit, en de punt is nog ' +
    'lang niet beneden. De <b>nagel</b> ziet een gekrompen gat: de bodem raakt de ' +
    'punt voordat de muur bij de kop is. Ze zijn het oneens over de volgorde, en ' +
    'dat mag. Over de kever mogen ze het niet oneens zijn.</p>' +
    '<p style="margin-top:7px">De uitkomst volgt uit \u00e9\u00e9n ding: de punt kan niet ' +
    'weten dat de kop gestuit is voordat het <b>nieuws</b> er is, en dat gaat ' +
    'hooguit met de lichtsnelheid. Tot dan vliegt hij door. De schuif zet de klok ' +
    'op de punt; elk beeld toont zijn eigen nu door dat ene moment. Lengte en ' +
    'tijd staan in millimeters.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Klinknagel en gat in twee kaders, met het ruimtetijd-diagram eronder',
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
    '<h3>Instellingen</h3>' +
    '<div class="regelaars">' +
    '  <div class="regelaar">' +
    '    <label for="kv-beta">Snelheid van de nagel: <b id="kv-beta-w"></b></label>' +
    '    <input type="range" id="kv-beta" min="0.3" max="0.95" step="0.01" value="0.8" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="kv-steel">Steel in rust: <b id="kv-steel-w"></b></label>' +
    '    <input type="range" id="kv-steel" min="6" max="14" step="0.5" value="10" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="kv-gat">Diepte van het gat: <b id="kv-gat-w"></b></label>' +
    '    <input type="range" id="kv-gat" min="8" max="40" step="0.5" value="15" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="kv-tijd">Klok op de punt: <b id="kv-tijd-w"></b></label>' +
    '    <input type="range" id="kv-tijd" data-stand="nee" min="0" max="1" step="0.001" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="kv-speel">Afspelen</button>' +
    '    <button class="knop" id="kv-begin">Begin</button>' +
    '  </div>' +
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein" id="kv-kop-muur">Muur: kop stuit</button>' +
    '    <button class="knop klein" id="kv-kop-nagel">Nagel: kop stuit</button>' +
    '    <button class="knop klein" id="kv-afloop">Afloop</button>' +
    '  </div>' +
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein aan" id="kv-kader-muur">Diagram: muur</button>' +
    '    <button class="knop klein" id="kv-kader-nagel">Diagram: nagel</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const vragenPaneel = document.createElement('div');
  vragenPaneel.className = 'paneel';
  vragenPaneel.innerHTML = '<h3>Vragen bij de kever</h3><div class="formules" id="kv-vragen"></div>';
  zijkolom.appendChild(vragenPaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Een bekende denkproef uit de natuurkundeboeken, hier in eigen woorden. De ' +
    'bouwstenen zijn dezelfde als bij de staaf in de loods: lengtecontractie, ' +
    'gelijktijdigheid, en nieuws dat niet sneller gaat dan het licht.';
  zijkolom.appendChild(bron);

  const schuifBeta = paneel.querySelector('#kv-beta');
  const schuifSteel = paneel.querySelector('#kv-steel');
  const schuifGat = paneel.querySelector('#kv-gat');
  const schuifTijd = paneel.querySelector('#kv-tijd');
  const betaW = paneel.querySelector('#kv-beta-w');
  const steelW = paneel.querySelector('#kv-steel-w');
  const gatW = paneel.querySelector('#kv-gat-w');
  const tijdW = paneel.querySelector('#kv-tijd-w');
  const speelKnop = paneel.querySelector('#kv-speel');
  const kopMuurKnop = paneel.querySelector('#kv-kop-muur');
  const kopNagelKnop = paneel.querySelector('#kv-kop-nagel');
  const kaderMuurKnop = paneel.querySelector('#kv-kader-muur');
  const kaderNagelKnop = paneel.querySelector('#kv-kader-nagel');
  const vragenVak = vragenPaneel.querySelector('#kv-vragen');
  const open = new Set();

  /**
   * Alles wat uit de stand volgt. Muurkader: het muurvlak ligt op x = 0, de
   * bodem op x = D, de kop stuit op t = 0. Nagelkader: de kop ligt op x' = 0,
   * de punt op x' = L, en ook daar stuit de kop op t' = 0.
   */
  function opzet() {
    const g = F.gamma(beta);
    const k = F.doppler(beta, true);
    const Lk = L / g, Dk = D / g;
    // In muurtijd: wanneer de punt de bodem raakt als niets hem tegenhoudt,
    // en wanneer en waar het nieuws van de kop de punt inhaalt.
    const tP = (D - Lk) / beta;
    const S = F.lichtHaaltIn(Lk, beta);
    const geplet = D < S.x;
    // Dezelfde momenten op de klok van de punt (dat is de nageltijd daar)
    const tauP = (Dk - L) / beta;
    const tauS = L;
    const tauKopMuur = -beta * L;       // het muur-nu van 'kop stuit' gaat hier door de punt
    const tauEind = geplet ? tauP : tauS;
    const tauBegin = Math.min(tauKopMuur, tauP, 0) - 0.6 * L;
    const tau = tauBegin + fractie * (tauEind - tauBegin);
    const tMuur = g * (tau + beta * L);
    return {
      g: g, k: k, Lk: Lk, Dk: Dk, tP: tP, S: S, geplet: geplet,
      tauP: tauP, tauS: tauS, tauKopMuur: tauKopMuur, tauEind: tauEind, tauBegin: tauBegin,
      tau: tau, tMuur: tMuur, tNagel: tau,
      tMuurBegin: g * (tauBegin + beta * L), tMuurEind: g * (tauEind + beta * L),
      // Tot welke muurtijd de punt ongehinderd doorvliegt
      tE: geplet ? tP : S.t,
    };
  }

  function merk(labels, spec, plekken) {
    spec.verschuif = ladder(spec, plekken || [[0, 0]]);
    labels.voegToe(spec);
  }

  // --- De twee tonelen ---------------------------------------------------------
  function tekenTonelen(labels, o) {
    // Hoeveel millimeter elk toneel links en rechts van zijn vaste punt nodig heeft
    const linksA = -Math.min(beta * o.tMuurBegin, 0);
    const rechtsA = D;
    const linksB = beta * Math.max(0, o.tauEind);
    const rechtsB = Math.max(L, o.Dk - beta * o.tauBegin);
    const ruimte = BREEDTE - 100 - KOP - WAND;
    const pxPerMm = Math.min(ruimte / (linksA + rechtsA), ruimte / (linksB + rechtsB), 34);
    const nulA = 50 + KOP + linksA * pxPerMm + (ruimte - (linksA + rechtsA) * pxPerMm) / 2;
    const nulB = 50 + KOP + linksB * pxPerMm + (ruimte - (linksB + rechtsB) * pxPerMm) / 2;
    const afgelopen = fractie > 0.999;

    function toneel(band, nul, s) {
      const X = function (mm) { return nul + mm * pxPerMm; };
      const y = band.midden;
      // De muur met het gat erin
      svg.appendChild(T.el('rect', {
        x: X(s.vlak), y: y - 46, width: (s.bodem - s.vlak) * pxPerMm + WAND, height: 92,
        fill: 'var(--perron)', opacity: 0.2,
      }));
      svg.appendChild(T.el('rect', {
        x: X(s.vlak), y: y - 46, width: (s.bodem - s.vlak) * pxPerMm + WAND, height: 92,
        fill: 'none', stroke: 'var(--perron)', 'stroke-width': 2,
      }));
      svg.appendChild(T.el('rect', {
        x: X(s.vlak) - 1.5, y: y - 13, width: (s.bodem - s.vlak) * pxPerMm + 1.5, height: 26,
        fill: 'var(--kaart)',
      }));
      svg.appendChild(T.el('path', {
        d: 'M ' + X(s.vlak) + ' ' + (y - 13) + ' L ' + X(s.bodem) + ' ' + (y - 13) +
           ' L ' + X(s.bodem) + ' ' + (y + 13) + ' L ' + X(s.vlak) + ' ' + (y + 13),
        fill: 'none', stroke: 'var(--perron)', 'stroke-width': 2,
      }));
      // De kever, op de bodem
      const plat = afgelopen && o.geplet;
      svg.appendChild(T.el('ellipse', {
        cx: X(s.bodem) - (plat ? 2.5 : 7), cy: y, rx: plat ? 2.5 : 6, ry: plat ? 12 : 8,
        fill: plat ? 'var(--gebeurtenis)' : 'var(--eigentijd)',
      }));
      // De steel: het deel dat het nieuws al heeft is lichter getekend. Wat dat
      // deel precies doet weten we niet; alleen dat het niet meer vrij vliegt.
      const grens = s.nieuws === null ? s.kop : s.nieuws;
      if (s.nieuws !== null && grens > s.kop) {
        svg.appendChild(T.el('rect', {
          x: X(s.kop), y: y - 7, width: (grens - s.kop) * pxPerMm, height: 14,
          fill: 'var(--trein)', opacity: 0.3, stroke: 'var(--trein)', 'stroke-width': 1.5,
          'stroke-dasharray': '4 3',
        }));
      }
      if (s.punt > grens) {
        svg.appendChild(T.el('rect', {
          x: X(grens), y: y - 7, width: (s.punt - grens) * pxPerMm, height: 14,
          fill: 'var(--trein)',
        }));
      }
      if (s.nieuws !== null) {
        svg.appendChild(T.el('line', {
          x1: X(grens), y1: y - 22, x2: X(grens), y2: y + 22,
          stroke: 'var(--accent)', 'stroke-width': 3,
        }));
      }
      // De kop
      svg.appendChild(T.el('rect', {
        x: X(s.kop) - KOP, y: y - 26, width: KOP, height: 52, rx: 3, fill: 'var(--trein)',
      }));
      // Richtingspijl bij wat er beweegt
      const pijlX = s.pijl === 'nagel' ? X(s.kop) - KOP - 34 : X(s.bodem) + WAND + 34;
      const r = s.pijl === 'nagel' ? 1 : -1;
      if (pijlX > 12 && pijlX < BREEDTE - 12) {
        svg.appendChild(T.el('path', {
          d: 'M ' + (pijlX - 12 * r) + ' ' + y + ' L ' + (pijlX + 8 * r) + ' ' + y +
             ' M ' + (pijlX + 2 * r) + ' ' + (y - 6) + ' L ' + (pijlX + 9 * r) + ' ' + y +
             ' L ' + (pijlX + 2 * r) + ' ' + (y + 6),
          fill: 'none', stroke: s.pijl === 'nagel' ? 'var(--trein)' : 'var(--perron)',
          'stroke-width': 2.5, 'stroke-linecap': 'round',
        }));
      }
      // Drie vaste regels: wie stilstaat, wat de klok zegt, en de maten
      merk(labels, {
        tekst: s.titel, x: 50, y: band.kop, grootte: 15, kleur: s.kleur, gewicht: 700,
        anker: 'start', prioriteit: 97,
      });
      merk(labels, {
        tekst: s.klok, x: BREEDTE - 50, y: band.kop, grootte: 15, kleur: s.kleur, gewicht: 650,
        anker: 'end', prioriteit: 97,
      });
      merk(labels, {
        tekst: s.maten, x: 50, y: band.voet, grootte: 14, kleur: 'var(--tekst)',
        anker: 'start', prioriteit: 96,
      });
      if (s.nieuws !== null) {
        merk(labels, {
          tekst: 'nieuws', x: X(grens), y: y - 30, grootte: 13, kleur: 'var(--accent)',
          gewicht: 650, anker: 'middle', prioriteit: 60,
        }, [[0, 0], [0, 66], [-40, 0], [40, 0]]);
      }
    }

    // Toneel A: de muur staat stil
    const kopA = o.tMuur < 0 ? beta * o.tMuur : 0;
    const puntA = o.Lk + beta * o.tMuur;
    const nieuwsA = o.tMuur > 0 ? Math.min(o.tMuur, puntA) : null;
    toneel(TONEEL[0], nulA, {
      vlak: 0, bodem: D, kop: kopA, punt: puntA, nieuws: nieuwsA, pijl: 'nagel',
      titel: 'DE MUUR STAAT STIL', kleur: 'var(--perron)',
      klok: 'de muur zegt: t = ' + F.nl(o.tMuur, 2) + ' mm',
      maten: o.tMuur > 0
        ? 'kop tegen de muur, punt vliegt door: steel nu ' + F.nl(puntA - kopA, 2) +
          ' mm \u00b7 gat ' + F.nl(D, 2) + ' mm'
        : 'steel ' + F.nl(o.Lk, 2) + ' mm (gekrompen) \u00b7 gat ' + F.nl(D, 2) + ' mm',
    });

    // Toneel B: de nagel staat stil, de muur komt van rechts
    const vlakB = -beta * o.tNagel;
    const kopB = o.tNagel > 0 ? vlakB : 0;
    const nieuwsB = o.tNagel > 0 ? Math.min(o.tNagel, L) : null;
    toneel(TONEEL[1], nulB, {
      vlak: vlakB, bodem: o.Dk - beta * o.tNagel, kop: kopB, punt: L, nieuws: nieuwsB, pijl: 'muur',
      titel: 'DE NAGEL STAAT STIL', kleur: 'var(--trein)',
      klok: 'de nagel zegt: t\u2032 = ' + F.nl(o.tNagel, 2) + ' mm',
      maten: o.tNagel > 0
        ? 'de muur duwt de kop mee, de punt staat nog stil \u00b7 gat ' + F.nl(o.Dk, 2) + ' mm (gekrompen)'
        : 'steel ' + F.nl(L, 2) + ' mm \u00b7 gat ' + F.nl(o.Dk, 2) + ' mm (gekrompen)',
    });

    return { pxPerMm: pxPerMm };
  }

  // --- Het diagram ---------------------------------------------------------------
  function tekenDiagram(labels, o) {
    const muur = kader === 'muur';
    const naar = function (t, x) { return muur ? { t: t, x: x } : F.lorentz(t, x, beta); };

    // Het venster volgt uit de gebeurtenissen, in het gekozen kader
    let t0, t1, x0, x1;
    if (muur) {
      t0 = o.tMuurBegin; t1 = Math.max(o.S.t, o.tP);
      x0 = Math.min(beta * t0, 0); x1 = Math.max(D, o.S.x);
    } else {
      t0 = o.tauBegin; t1 = Math.max(o.tauS, o.tauP);
      x0 = Math.min(0, -beta * t1); x1 = Math.max(L, o.Dk - beta * t0);
    }
    const dt = t1 - t0, dx = x1 - x0;
    t0 -= 0.05 * dt; t1 += 0.09 * dt;
    // Rechts van de bodem staat ook tekst; in het nagelkader ligt daar de muur
    x1 = muur ? Math.max(x1 + 0.07 * dx, D + 0.26 * dx) : x1 + 0.07 * dx;
    // Links van het muurvlak (of van de kop) staat tekst: daar blijft ruimte
    x0 = Math.min(x0 - 0.07 * dx, -0.24 * dx);
    const s = Math.min((VLAK.rechts - VLAK.links) / (x1 - x0), (VLAK.onder - VLAK.boven) / (t1 - t0));
    // Is het venster hoger dan breed, dan blijft er opzij ruimte over. Die hoort
    // bij het diagram: daar komen de teksten bij de gebeurtenissen te staan.
    const over = (VLAK.rechts - VLAK.links) / s - (x1 - x0);
    if (over > 0) { x0 -= over / 2; x1 += over / 2; }
    const xMid = (x0 + x1) / 2;
    const pxMid = (VLAK.links + VLAK.rechts) / 2;
    const X = function (x) { return pxMid + (x - xMid) * s; };
    const Y = function (t) { return VLAK.onder - (t - t0) * s; };
    const boven = Math.max(VLAK.boven, Y(t1));
    const linksPx = Math.max(VLAK.links, X(x0)), rechtsPx = Math.min(VLAK.rechts, X(x1));
    const P = function (t, x) { const q = naar(t, x); return { x: X(q.x), y: Y(q.t) }; };

    // Een lijnstuk afknippen op het venster; null als er niets van overblijft
    function knip(a, b) {
      let u0 = 0, u1 = 1;
      const d = [b.x - a.x, b.y - a.y];
      const tests = [[-d[0], a.x - linksPx], [d[0], rechtsPx - a.x], [-d[1], a.y - boven], [d[1], VLAK.onder - a.y]];
      for (let i = 0; i < 4; i++) {
        const p = tests[i][0], q = tests[i][1];
        if (Math.abs(p) < 1e-12) { if (q < 0) return null; continue; }
        const r = q / p;
        if (p < 0) { if (r > u1) return null; if (r > u0) u0 = r; }
        else { if (r < u0) return null; if (r < u1) u1 = r; }
      }
      return [{ x: a.x + u0 * d[0], y: a.y + u0 * d[1] }, { x: a.x + u1 * d[0], y: a.y + u1 * d[1] }];
    }
    function lijn(a, b, kleur, dikte, streep, blok) {
      const k = knip(a, b);
      if (!k) return null;
      svg.appendChild(T.el('line', {
        x1: k[0].x, y1: k[0].y, x2: k[1].x, y2: k[1].y, stroke: kleur, 'stroke-width': dikte,
        'stroke-dasharray': streep || null, 'stroke-linecap': 'round',
      }));
      if (blok) labels.blokkeerSchuin({ x1: k[0].x, y1: k[0].y, x2: k[1].x, y2: k[1].y, dikte: blok });
      return k;
    }

    const knipVlak = T.el('clipPath', { id: 'kv-vlak' });
    knipVlak.appendChild(T.el('rect', {
      x: linksPx, y: boven, width: rechtsPx - linksPx, height: VLAK.onder - boven,
    }));
    svg.appendChild(knipVlak);
    const laag = T.el('g', { 'clip-path': 'url(#kv-vlak)' });
    svg.appendChild(laag);
    const veelhoek = function (punten, kleur, dekking) {
      laag.appendChild(T.el('polygon', {
        points: punten.map(function (q) { const p = P(q[0], q[1]); return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' '),
        fill: kleur, opacity: dekking,
      }));
    };
    // Ver genoeg naar boven en beneden om elk venster te vullen, in muurtijd
    const ver = 6 * (Math.abs(o.tMuurBegin) + o.S.t + Math.abs(o.tP) + D + L);
    const tLaag = -ver, tHoog = ver;

    // Het gat: de strook tussen muurvlak en bodem
    veelhoek([[tLaag, 0], [tLaag, D], [tHoog, D], [tHoog, 0]], 'var(--perron)', 0.09);
    // De nagel: de strook tussen kop en punt, tot waar de punt vrij vliegt
    const tE = o.tE;
    if (tE > 0) {
      veelhoek([[tLaag, beta * tLaag], [tLaag, o.Lk + beta * tLaag], [tE, o.Lk + beta * tE], [tE, 0], [0, 0]],
        'var(--trein)', 0.2);
      // Het deel dat het nieuws al heeft
      veelhoek([[0, 0], [tE, Math.min(tE, o.Lk + beta * tE)], [tE, 0]], 'var(--accent)', 0.16);
    } else {
      veelhoek([[tLaag, beta * tLaag], [tLaag, o.Lk + beta * tLaag], [tE, o.Lk + beta * tE], [tE, beta * tE]],
        'var(--trein)', 0.2);
    }

    // Assen
    svg.appendChild(T.el('line', {
      x1: linksPx, y1: VLAK.onder, x2: rechtsPx, y2: VLAK.onder, stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    svg.appendChild(T.el('line', {
      x1: linksPx, y1: VLAK.onder, x2: linksPx, y2: boven, stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    labels.blokkeerLijn({ x1: linksPx, y1: VLAK.onder, x2: rechtsPx, y2: VLAK.onder, dikte: 8 });
    labels.blokkeerLijn({ x1: linksPx, y1: VLAK.onder, x2: linksPx, y2: boven, dikte: 8 });
    const stap = F.netteStap((t1 - t0) / 6);
    for (let v = Math.ceil(t0 / stap) * stap; v <= t1 + 1e-9; v += stap) {
      if (Y(v) < boven + 6) continue;
      svg.appendChild(T.el('line', {
        x1: linksPx - 5, y1: Y(v), x2: linksPx, y2: Y(v), stroke: 'var(--perron)', 'stroke-width': 1.2,
      }));
      merk(labels, {
        tekst: F.nl(v, 0), x: linksPx - 9, y: Y(v) + 4, grootte: 12.5, kleur: 'var(--tekst-zacht)',
        anker: 'end', prioriteit: 20,
      });
    }
    for (let v = Math.ceil(x0 / stap) * stap; v <= x1 + 1e-9; v += stap) {
      if (X(v) < linksPx + 4 || X(v) > rechtsPx - 4) continue;
      svg.appendChild(T.el('line', {
        x1: X(v), y1: VLAK.onder, x2: X(v), y2: VLAK.onder + 5, stroke: 'var(--perron)', 'stroke-width': 1.2,
      }));
      merk(labels, {
        tekst: F.nl(v, 0), x: X(v), y: VLAK.onder + 20, grootte: 12.5, kleur: 'var(--tekst-zacht)',
        anker: 'middle', prioriteit: 20,
      });
    }
    merk(labels, {
      tekst: 'Diagram in het kader van de ' + (muur ? 'muur' : 'nagel') +
             (muur ? ' (ct omhoog, x opzij, mm)' : ' (ct\u2032 omhoog, x\u2032 opzij, mm)'),
      x: 50, y: VLAK.titel, grootte: 14, kleur: muur ? 'var(--perron)' : 'var(--trein)', gewicht: 650,
      anker: 'start', prioriteit: 96,
    });

    merk(labels, {
      tekst: 'paars: het nieuws, met de lichtsnelheid', x: BREEDTE - 50, y: VLAK.titel, grootte: 13.5,
      kleur: 'var(--accent)', gewicht: 650, anker: 'end', prioriteit: 96,
    });

    // De vier wereldlijnen
    const vlakLijn = lijn(P(tLaag, 0), P(tHoog, 0), 'var(--perron)', 2.6, null, 8);
    const bodemLijn = lijn(P(tLaag, D), P(tHoog, D), 'var(--perron)', 2.6, null, 8);
    const kopLijn = lijn(P(tLaag, beta * tLaag), P(Math.min(0, tE), beta * Math.min(0, tE)), 'var(--trein)', 3, null, 8);
    const puntLijn = lijn(P(tLaag, o.Lk + beta * tLaag), P(tE, o.Lk + beta * tE), 'var(--trein)', 3, null, 8);
    // Waar de punt heen zou gaan als er niets gebeurde: gestreept
    const verderTot = o.geplet ? o.S.t : o.tP;
    // (gestreept is wat niet gebeurt: daar mag een label overheen)
    lijn(P(tE, o.Lk + beta * tE), P(verderTot, o.Lk + beta * verderTot), 'var(--trein)', 2, '5 6', 0);
    // Het nieuws: de lichtlijn vanaf het stuiten van de kop
    let nieuwsLijn = null;
    if (tE > 0) {
      const tot = Math.min(tE, o.S.t);
      nieuwsLijn = lijn(P(0, 0), P(tot, tot), 'var(--accent)', 2.8, null, 8);
      if (o.geplet) lijn(P(tot, tot), P(o.S.t, o.S.x), 'var(--accent)', 2, '5 6', 0);
    }

    // Namen bij de lijnen. Het label probeert een rij plekken langs zijn lijn,
    // eerst aan de eigen kant en dan aan de overkant.
    function naamOp(stuk, tekst, kleur, kant, prioriteit, plaatsen) {
      if (!stuk) return;
      const hoog = stuk[0].y < stuk[1].y ? stuk[0] : stuk[1];
      const laag2 = stuk[0].y < stuk[1].y ? stuk[1] : stuk[0];
      const punt = function (u) {
        return { x: hoog.x + (laag2.x - hoog.x) * u, y: hoog.y + (laag2.y - hoog.y) * u };
      };
      const rc = (laag2.x - hoog.x) / Math.max(1, laag2.y - hoog.y);
      // Een schuine lijn loopt binnen de hoogte van een regel al een eind
      // opzij, dus het label moet er verder vanaf staan dan bij een rechte.
      const af = 12 + 14 * Math.min(1.6, Math.abs(rc));
      const bT = schatBreedte(tekst, 14);
      const eerste = punt(plaatsen[0]);
      const spec = {
        tekst: tekst, x: eerste.x + af * kant, y: eerste.y + 5, grootte: 14, kleur: kleur,
        gewicht: 650, anker: kant > 0 ? 'start' : 'end', prioriteit: prioriteit,
      };
      const plekken = [];
      [kant, -kant].forEach(function (zijde) {
        plaatsen.forEach(function (u) {
          const p = punt(u);
          // Aan de overkant blijft het anker hetzelfde, dus de tekst schuift
          // daar een eigen breedte verder op.
          const x = zijde === kant ? p.x + af * kant : p.x - af * kant - bT * kant;
          plekken.push([x - spec.x, p.y + 5 - spec.y]);
        });
      });
      merk(labels, spec, plekken);
    }
    const BOVEN = [0.07, 0.17, 0.27, 0.38, 0.5, 0.62, 0.74, 0.86, 0.95];
    const ONDER = [0.62, 0.76, 0.48, 0.88, 0.34, 0.2];
    naamOp(vlakLijn, 'muurvlak', 'var(--perron)', -1, 88, BOVEN);
    naamOp(bodemLijn, 'bodem met de kever', 'var(--perron)', 1, 88, BOVEN);
    // Kop en punt: onder de as, waar hun lijn het beeld binnenkomt. Daar is
    // altijd plaats; alleen een maatgetal moet er soms voor wijken.
    function naamOnder(stuk, tekst, kleur, prioriteit, uitwijk) {
      if (!stuk) return;
      const voet = stuk[0].y > stuk[1].y ? stuk[0] : stuk[1];
      if (voet.y < VLAK.onder - 2) { naamOp(stuk, tekst, kleur, uitwijk, prioriteit, ONDER); return; }
      merk(labels, {
        tekst: tekst, x: voet.x, y: VLAK.onder + 20, grootte: 14, kleur: kleur, gewicht: 650,
        anker: 'middle', prioriteit: prioriteit,
      }, [[0, 0], [0, 17], [-24 * uitwijk * -1, 0], [24 * uitwijk * -1, 17], [0, 34]]);
    }
    naamOnder(kopLijn, 'kop', 'var(--trein)', 72, -1);
    naamOnder(puntLijn, 'punt', 'var(--trein)', 72, 1);
    // Het nieuws: bovenaan is de wig tussen kop en lichtlijn het breedst
    naamOp(nieuwsLijn, 'nieuws', 'var(--accent)', -1, 58, [0.14, 0.28, 0.42, 0.56, 0.7, 0.05]);
    // De gebeurtenissen
    // vanafX: zet de tekst niet naast de stip maar naast die plaats, met een
    // stippellijntje ernaartoe (voor een stip die midden tussen de lijnen ligt)
    function stip(t, x, kleur, hol, tekst, kant, prioriteit, vanafX) {
      const p = P(t, x);
      if (p.x < linksPx - 2 || p.x > rechtsPx + 2 || p.y < boven - 2 || p.y > VLAK.onder + 2) return;
      svg.appendChild(T.el('circle', {
        cx: p.x, cy: p.y, r: 7, fill: hol ? 'var(--kaart)' : kleur, stroke: hol ? kleur : 'var(--kaart)',
        'stroke-width': hol ? 2.6 : 2,
      }));
      labels.blokkeer({ links: p.x - 10, boven: p.y - 10, breedte: 20, hoogte: 20 });
      let ankerX = p.x;
      if (vanafX !== undefined) {
        ankerX = P(t, vanafX).x;
        if (!muur) ankerX = X(vanafX);
        svg.appendChild(T.el('line', {
          x1: p.x + 9 * kant, y1: p.y, x2: ankerX + 8 * kant, y2: p.y, stroke: kleur,
          'stroke-width': 1.3, 'stroke-dasharray': '2 4',
        }));
      }
      const spec = {
        tekst: tekst, x: ankerX + 19 * kant, y: p.y + 5, grootte: 14, kleur: kleur, gewicht: 650,
        anker: kant > 0 ? 'start' : 'end', prioriteit: prioriteit,
      };
      // Eerst naast de stip, dan erboven of eronder, aan beide kanten, en als
      // laatste er recht boven of onder.
      const b = schatBreedte(tekst, 14) + 38;
      const plekken = [];
      [0, -22, 22, -44, 44, -66, 66, -88, 88].forEach(function (dy) {
        // Binnen het diagram blijven: onder de as staan de namen van de lijnen
        if (spec.y + dy < boven + 12 || spec.y + dy > VLAK.onder - 6) return;
        plekken.push([0, dy], [-b * kant, dy]);
        if (dy !== 0) plekken.push([-b * kant / 2, dy > 0 ? dy + 6 : dy - 6]);
      });
      if (!plekken.length) plekken.push([0, 0]);
      merk(labels, spec, plekken);
    }
    if (tE > 0) stip(0, 0, 'var(--gebeurtenis)', false, 'kop stuit', -1, 92);
    if (o.geplet) {
      stip(o.tP, D, 'var(--gebeurtenis)', false, 'punt raakt de kever', 1, 94);
      stip(o.S.t, o.S.x, 'var(--accent)', true, 'pas hier ingehaald: ' + F.nl(o.S.x, 1) + ' mm', -1, 80);
    } else if (muur) {
      // De stip ligt in het gat, tussen de lijnen; de tekst staat rechts van de bodem
      stip(o.S.t, o.S.x, 'var(--accent)', false, 'nieuws bij de punt: ' + F.nl(o.S.x, 1) + ' mm', 1, 94, D);
      stip(o.tP, D, 'var(--gebeurtenis)', true, 'zou hier raken', 1, 80);
    } else {
      // In het nagelkader is links van het muurvlak plaats
      stip(o.S.t, o.S.x, 'var(--accent)', false, 'nieuws bij de punt', -1, 94, -beta * o.tauS);
      stip(o.tP, D, 'var(--gebeurtenis)', true, 'zou hier raken', 1, 80);
    }

    // Het nu van dit kader, en het nu van het andere kader door de punt
    const tNu = muur ? o.tMuur : o.tNagel;
    const nuY = Y(tNu);
    const puntNu = P(o.tMuur, o.Lk + beta * o.tMuur);
    const hel = muur ? beta : -beta;          // helling van het andere nu in dit diagram
    const a = { x: linksPx, y: puntNu.y + hel * (puntNu.x - linksPx) };
    const b2 = { x: rechtsPx, y: puntNu.y - hel * (rechtsPx - puntNu.x) };
    // Niet als bezet gemeld: het is een dunne hulplijn waar een label overheen mag
    const anderNu = lijn(a, b2, 'var(--blauw)', 1.8, '7 5', 0);
    if (nuY >= boven - 1 && nuY <= VLAK.onder + 1) {
      svg.appendChild(T.el('line', {
        x1: linksPx, y1: nuY, x2: rechtsPx + 18, y2: nuY, stroke: 'var(--gebeurtenis)', 'stroke-width': 2,
      }));
      labels.blokkeerLijn({ x1: linksPx, y1: nuY, x2: rechtsPx + 18, y2: nuY, dikte: 8 });
      svg.appendChild(T.greep(Math.min(rechtsPx + 8, BREEDTE - 14), nuY, 'var(--gebeurtenis)'));
      merk(labels, {
        tekst: 'nu', x: linksPx + 14, y: nuY - 13, grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 700,
        anker: 'start', prioriteit: 78,
      }, [[0, 0], [0, 34], [40, 0], [40, 34], [80, 0], [80, 34], [140, 0], [140, 34],
          [220, 0], [220, 34], [320, 0], [320, 34]]);
    }
    if (anderNu) {
      // Langs de eigen lijn, er net boven of eronder, het verst van de punt eerst
      const verst = Math.abs(anderNu[0].x - puntNu.x) > Math.abs(anderNu[1].x - puntNu.x) ? 0 : 1;
      const op = function (u) {
        const w = verst === 0 ? u : 1 - u;
        return { x: anderNu[0].x + (anderNu[1].x - anderNu[0].x) * w,
                 y: anderNu[0].y + (anderNu[1].y - anderNu[0].y) * w };
      };
      const eerste = op(0.14);
      const spec = {
        tekst: (muur ? 'nagel' : 'muur') + '-nu', x: eerste.x, y: eerste.y - 11,
        grootte: 13, kleur: 'var(--blauw)', gewicht: 650, anker: 'middle', prioriteit: 56,
      };
      const plekken = [];
      [0.14, 0.26, 0.38, 0.5, 0.08, 0.62, 0.74, 0.86].forEach(function (u) {
        const p = op(u);
        plekken.push([p.x - spec.x, p.y - 11 - spec.y], [p.x - spec.x, p.y + 21 - spec.y]);
      });
      merk(labels, spec, plekken);
    }
    svg.appendChild(T.el('circle', {
      cx: puntNu.x, cy: puntNu.y, r: 5, fill: 'var(--blauw)', stroke: 'var(--kaart)', 'stroke-width': 2,
    }));

    return { vanY: function (py) { return t0 + (VLAK.onder - py) / s; } };
  }

  function teken() {
    // De tijd staat preciezer in de module dan de schuif kan aanwijzen (een
    // sprongknop of het vastklikken legt hem tussen twee stapjes). Het geheugen
    // leest hem daarom hier af, niet van de schuif (zie js/geheugen.js).
    vak.dataset.stand = JSON.stringify({ tijd: fractie });
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const labels = T.maakLabelPlaatser();
    const tonelen = tekenTonelen(labels, o);
    svg.appendChild(T.el('line', {
      x1: 50, y1: SCHEIDING, x2: BREEDTE - 50, y2: SCHEIDING, stroke: 'var(--rand)', 'stroke-width': 2,
    }));
    const diagram = tekenDiagram(labels, o);
    svg.appendChild(labels.tekenAlles());
    laatste = { o: o, pxPerMm: tonelen.pxPerMm, vanY: diagram.vanY };

    // Het vaantje zegt hoe het afloopt, of waar we zijn
    let stand;
    if (fractie > 0.999) {
      stand = o.geplet ? 'geplet: het nieuws kwam te laat'
                       : 'het nieuws is op tijd: nu hangt het van de nagel af';
    } else if (o.tMuur > 0 && o.tNagel <= 0) {
      stand = 'de muur zegt: kop gestuit \u00b7 de nagel zegt: nog niet';
    } else if (o.tMuur > 0) {
      stand = 'de kop is gestuit, de punt weet het nog niet';
    } else {
      stand = 'de nagel vliegt op het gat af';
    }
    vaan.textContent = stand;
    vaan.style.color = fractie > 0.999 && o.geplet ? 'var(--gebeurtenis)' : 'var(--tekst-zacht)';

    tijdW.textContent = '\u03c4 = ' + F.nl(o.tau, 2) + ' mm';
    // Een sprong naar een moment dat niet meer komt heeft geen zin
    kopMuurKnop.disabled = o.tauKopMuur > o.tauEind;
    kopNagelKnop.disabled = 0 > o.tauEind;
    vulGetallen(o);
    vulVragen(o);
  }

  function vulGetallen(o) {
    const kaarten = [
      D >= L ? ['Tekort in rust', F.nl(D - L, 2) + ' mm', 'var(--tekst)']
             : ['In rust al te lang met', F.nl(L - D, 2) + ' mm', 'var(--tekst)'],
      ['De muur meet de steel', F.nl(o.Lk, 2) + ' mm', 'var(--perron)'],
      ['De nagel meet het gat', F.nl(o.Dk, 2) + ' mm', 'var(--trein)'],
      ['Dopplerfactor', F.nl(o.k, 3), 'var(--blauw)'],
      ['De punt komt minstens tot', F.nl(o.S.x, 2) + ' mm', 'var(--accent)'],
      ['De kever', o.geplet ? 'geplet' : 'heeft een kans', o.geplet ? 'var(--gebeurtenis)' : 'var(--eigentijd)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
  }

  function vulVragen(o) {
    const b = F.nl(beta, 2);
    const kaarten = [
      {
        naam: 'Wie heeft er gelijk?',
        formule: 'geplet als D < L \u00b7 \u221a((1 + \u03b2)/(1 \u2212 \u03b2))',
        som: F.nl(D, 1) + (o.geplet ? ' < ' : ' > ') + F.nl(L, 1) + ' \u00b7 ' + F.nl(o.k, 3) + ' = ' +
             F.nl(o.S.x, 2) + ', dus ' + (o.geplet ? 'geplet' : 'het nieuws is op tijd'),
        waarom:
          'Allebei, over wat ze meten. De muur meet echt een steel van ' + F.nl(o.Lk, 2) + ' mm en ' +
          'de nagel echt een gat van ' + F.nl(o.Dk, 2) + ' mm. Ze zijn het oneens over de volgorde ' +
          'van twee dingen die ver uit elkaar gebeuren: het stuiten van de kop en het aankomen ' +
          'van de punt. Dat mag, want geen signaal kan van het ene naar het andere. Over de kever ' +
          'zelf zijn ze het eens: in beide kaders komt dezelfde uitkomst uit de som.',
      },
      {
        naam: 'Waarom vliegt de punt door?',
        formule: 'nieuws: x = ct \u00a0\u00a0 punt: x = L/\u03b3 + \u03b2\u00b7ct',
        som: 'ct = ' + F.nl(o.Lk, 2) + ' + ' + b + '\u00b7ct \u2192 ct = ' + F.nl(o.S.t, 2) + ' mm',
        waarom:
          'Een kop die stuit kan de punt alleen tegenhouden door een duw die door de steel ' +
          'loopt, en geen duw gaat sneller dan het licht. Tot die duw aankomt merkt de punt ' +
          'niets en vliegt hij door met ' + b + 'c. In het diagram is dat de paarse lichtlijn ' +
          'vanaf "kop stuit": de wereldlijn van de punt loopt rechtdoor tot hij die lijn kruist. ' +
          'Een volkomen stijve nagel, waarvan de punt meteen stopt, bestaat dus niet.',
      },
      {
        naam: 'Waar komt die factor vandaan?',
        formule: 'L/\u03b3 \u00b7 1/(1 \u2212 \u03b2) = L \u00b7 \u221a((1 + \u03b2)/(1 \u2212 \u03b2))',
        som: F.nl(o.Lk, 2) + ' / ' + F.nl(1 - beta, 2) + ' = ' + F.nl(o.S.x, 2) + ' mm',
        waarom:
          'Het nieuws moet een voorsprong van L/\u03b3 inhalen op een punt die zelf met \u03b2 ' +
          'wegvliegt; het verschil in snelheid is 1 \u2212 \u03b2. Samen geeft dat de dopplerfactor, ' +
          'dezelfde die in de tweelingmodule zegt hoe snel je elkaars klok ziet lopen. Dat is ' +
          'geen toeval: in beide gevallen jaagt licht iets na dat wegvliegt.',
      },
      {
        naam: 'En wat gebeurt er daarna?',
        formule: 'dat hangt van de nagel af',
        som: o.geplet
          ? 'hier doet het er niet toe: de punt is al beneden'
          : 'het nieuws is ' + F.nl(D - o.S.x, 2) + ' mm voor de bodem bij de punt',
        waarom:
          'De lichtsnelheid is de uiterste grens. Een echte nagel geeft een duw door met de ' +
          'geluidssnelheid in het metaal, en dat is veel trager: dan vliegt de punt nog verder. ' +
          'En intussen wordt de steel uitgerekt tot ver voorbij zijn eigen lengte, dus hij ' +
          'scheurt of rekt. Wat er dan precies gebeurt is materiaalkunde. De relativiteit zegt ' +
          'alleen dit: ondieper dan L maal de dopplerfactor is er geen ontkomen aan.',
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

  // --- Bediening -------------------------------------------------------------------
  function werkBij() {
    betaW.textContent = F.nl(beta, 2) + 'c';
    steelW.textContent = F.nl(L, 1) + ' mm';
    gatW.textContent = F.nl(D, 1) + ' mm';
    teken();
  }
  function stopSpelen() {
    speelt = false;
    speelKnop.textContent = 'Afspelen';
    speelKnop.classList.remove('aan');
  }
  /** Zet de klok op de punt op een bepaalde stand. */
  function gaNaar(tau) {
    const o = opzet();
    fractie = Math.max(0, Math.min(1, (tau - o.tauBegin) / (o.tauEind - o.tauBegin)));
    schuifTijd.value = String(fractie);
    werkBij();
  }

  schuifBeta.addEventListener('input', function () { beta = parseFloat(schuifBeta.value); werkBij(); });
  schuifSteel.addEventListener('input', function () { L = parseFloat(schuifSteel.value); werkBij(); });
  schuifGat.addEventListener('input', function () { D = parseFloat(schuifGat.value); werkBij(); });
  schuifTijd.addEventListener('input', function () { fractie = parseFloat(schuifTijd.value); werkBij(); });
  paneel.querySelector('#kv-begin').addEventListener('click', function () { stopSpelen(); gaNaar(opzet().tauBegin); });
  kopMuurKnop.addEventListener('click', function () { stopSpelen(); gaNaar(opzet().tauKopMuur); });
  kopNagelKnop.addEventListener('click', function () { stopSpelen(); gaNaar(0); });
  paneel.querySelector('#kv-afloop').addEventListener('click', function () { stopSpelen(); gaNaar(opzet().tauEind); });
  function kiesKader(welk) {
    kader = welk;
    kaderMuurKnop.classList.toggle('aan', welk === 'muur');
    kaderNagelKnop.classList.toggle('aan', welk === 'nagel');
    werkBij();
  }
  kaderMuurKnop.addEventListener('click', function () { kiesKader('muur'); });
  kaderNagelKnop.addEventListener('click', function () { kiesKader('nagel'); });

  // De precieze tijd terugzetten, uit het geheugen of uit een link
  vak.addEventListener('verhaal-stand', function (e) {
    const s = e.detail || {};
    if (!Number.isFinite(s.tijd)) return;
    fractie = Math.max(0, Math.min(1, s.tijd));
    schuifTijd.value = String(fractie);
    werkBij();
  });

  // --- Slepen in de tekening zelf -------------------------------------------------
  // Boven sleep je de nagel, daaronder de muur, en in het diagram de rode
  // nu-lijn. Vlak bij het stuiten van de kop klikt de klok vast, anders is dat
  // moment met een vinger niet precies te raken. De ruwe stand wordt apart
  // bijgehouden, zodat je van een vastgeklikt moment ook weer loskomt.
  let ruweTau = 0;
  function klikVast(tau, o) {
    const marge = 0.01 * (o.tauEind - o.tauBegin);
    const doelen = [o.tauKopMuur, 0];
    for (let i = 0; i < doelen.length; i++) {
      if (doelen[i] <= o.tauEind && Math.abs(tau - doelen[i]) < marge) return doelen[i];
    }
    return tau;
  }
  T.koppelSleep(svg, BREEDTE, HOOGTE, {
    opStart: function (punt) {
      if (!laatste) return false;
      let wat = false;
      if (punt.y >= TONEEL[0].kop - 16 && punt.y <= TONEEL[0].voet + 8) wat = 'nagel';
      else if (punt.y >= TONEEL[1].kop - 16 && punt.y <= TONEEL[1].voet + 8) wat = 'muur';
      else if (punt.y >= VLAK.boven - 8 && punt.y <= VLAK.onder + 8) wat = 'nu';
      if (!wat) return false;
      stopSpelen();
      ruweTau = laatste.o.tau;
      return wat;
    },
    opSleep: function (punt, wat, delta) {
      const o = laatste.o;
      if (wat === 'nagel') {
        // Voor de muur schuift de nagel met beta per eenheid muurtijd, en de
        // klok op de punt loopt een factor gamma trager dan die tijd.
        ruweTau += delta.dx / laatste.pxPerMm / (beta * o.g);
      } else if (wat === 'muur') {
        // Voor de nagel schuift de muur naar links: -beta per eenheid tau
        ruweTau -= delta.dx / laatste.pxPerMm / beta;
      } else {
        const tNu = laatste.vanY(punt.y);
        ruweTau = kader === 'muur' ? tNu / o.g - beta * L : tNu;
      }
      ruweTau = Math.max(o.tauBegin, Math.min(o.tauEind, ruweTau));
      gaNaar(klikVast(ruweTau, o));
    },
  });

  // --- Afspelen ---------------------------------------------------------------------
  let vorigeTik = null;
  function stap(nu) {
    if (!speelt) { vorigeTik = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorigeTik = null; return; }
    if (vorigeTik !== null) {
      // Het hele verloop in ongeveer negen seconden
      fractie = Math.min(1, fractie + Math.min(nu - vorigeTik, 100) / 9000);
      schuifTijd.value = String(fractie);
      werkBij();
      if (fractie >= 1) { stopSpelen(); vorigeTik = null; return; }
    }
    vorigeTik = nu;
    requestAnimationFrame(stap);
  }
  speelKnop.addEventListener('click', function () {
    if (speelt) { stopSpelen(); return; }
    speelt = true;
    speelKnop.textContent = 'Pauze';
    speelKnop.classList.add('aan');
    if (fractie >= 0.999) fractie = 0;
    vorigeTik = null;
    requestAnimationFrame(stap);
  });

  werkBij();
}
