// muonen.js — het bewijs dat uit de lucht komt vallen.
//
// Hoog in de atmosfeer ontstaan muonen. Ze leven gemiddeld 2,2 miljoenste
// seconde, en dat is zelfs met bijna de lichtsnelheid goed voor nog geen
// kilometer. Toch komen ze in groten getale op de grond aan.
//
// Twee verhalen met één uitkomst. Voor de aarde loopt de klok van het muon
// traag, dus het leeft lang genoeg. Voor het muon loopt zijn klok gewoon, maar
// is de atmosfeer gekrompen, dus het is er snel doorheen. Links de aarde,
// rechtsboven het muon, op dezelfde schaal in kilometers; rechtsonder hoeveel
// er onderweg nog leven, met en zonder relativiteit.
//
// Afstanden in kilometers, tijden in microseconden.
import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Muonen: het bewijs';
export const onderschrift =
  'Deeltjes die te kort leven om de grond te halen, halen de grond. Voor de ' +
  'aarde loopt hun klok traag; voor het muon is de atmosfeer dun.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    stel: { '#mu-gamma': 10, '#mu-hoogte': 15, '#mu-tijd': 0 },
  },
  stappen: [
    {
      kop: 'Een deeltje dat te kort leeft',
      tekst:
        'Op 15 km hoogte ontstaan muonen. Ze leven gemiddeld 2,2 miljoenste ' +
        'seconde. Zelfs met bijna de lichtsnelheid kom je daarin maar 0,66 km ' +
        'ver. Toch regent het muonen op de grond.',
    },
    {
      kop: 'Zonder relativiteit: geen enkele',
      tekst:
        'De rode kromme is de verwachting zonder relativiteit: na een paar ' +
        'kilometer is er niets meer over. Van elke 1000 muonen haalt er niet ' +
        '\u00e9\u00e9n de grond.',
      tik: ['#mu-grond'],
    },
    {
      kop: 'De aarde: zijn klok loopt traag',
      tekst:
        'Voor de aarde duurt de val 50 microseconden. Maar de klok van het muon ' +
        'loopt tien keer zo traag: voor hem is het 5,0. Dat is 2,3 levensduren, ' +
        'en dan zijn er van de 1000 nog 101 over.',
      tik: ['#mu-grond'],
    },
    {
      kop: 'Het muon: de lucht is dun',
      tekst:
        'Rechtsboven, vanuit het muon. Zijn klok loopt gewoon, maar de atmosfeer ' +
        'vliegt op hem af en is gekrompen tot 1,5 km. Die is in 5,0 microseconden ' +
        'voorbij. Een ander verhaal, dezelfde 101.',
      stel: { '#mu-tijd': 0.5 },
    },
    {
      kop: 'Sneller is verder',
      tekst:
        'Geef het muon meer energie. Bij \u03b3 = 30 loopt zijn klok dertig keer zo ' +
        'traag en haalt bijna de helft de grond: 468 van de 1000.',
      stel: { '#mu-gamma': 30 },
      tik: ['#mu-grond'],
    },
    {
      kop: 'Gemeten, op een berg en in het dal',
      tekst:
        'Dit is geteld: muonen op een berg en in het dal eronder (Rossi en Hall, ' +
        '1941). Bij 2 km hoogteverschil haalt 74% het dal, waar je zonder ' +
        'relativiteit 5% zou verwachten. Tijdsdilatatie is geen rekentruc.',
      stel: { '#mu-hoogte': 2 },
      tik: ['#mu-grond'],
    },
  ],
};

const BREEDTE = 960;
const HOOGTE = 940;
// Links de aarde: een strook lucht van boven naar beneden
const A = { links: 120, rechts: 250, boven: 134, grond: 852, kop: 44 };
// Rechtsboven het muon: dezelfde schaal, dus een veel dunnere laag
const B = { links: 390, rechts: 520, muon: 150, boven: 86, onder: 396, kop: 44, titelX: 330 };
// Rechtsonder de grafiek: hoeveel er nog leven
const G = { links: 392, rechts: 916, boven: 546, onder: 850 };

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
  let g = 10;          // lorentzfactor van het muon
  let H = 15;          // hoogte waarop het ontstaat, km
  let fractie = 0;     // hoe ver de val is, van 0 tot 1
  let speelt = false;
  let laatste = null;

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Waarom dit een bewijs is</summary>' +
    '<p>Een muon is een zwaar broertje van het elektron dat vanzelf uiteenvalt, ' +
    'gemiddeld na <b>2,2 microseconde</b>. Kosmische straling maakt ze hoog in ' +
    'de atmosfeer. In die tijd leg je, zelfs met de lichtsnelheid, 0,66 km af. ' +
    'Zonder relativiteit zou er op de grond niets van aankomen.</p>' +
    '<p style="margin-top:7px">Ze komen wel aan. De <b>aarde</b> zegt: zijn klok ' +
    'loopt een factor \u03b3 trager, dus hij leeft lang genoeg. Het <b>muon</b> zegt: ' +
    'mijn klok loopt gewoon, maar die atmosfeer is een factor \u03b3 dunner. Beide ' +
    'tekeningen staan op dezelfde schaal, en de teller eronder telt in beide ' +
    'verhalen hetzelfde.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Een muon valt door de atmosfeer, gezien vanaf de aarde en vanuit het muon',
  });
  vak.appendChild(svg);
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
    '    <label for="mu-gamma">Snelheid: <b id="mu-gamma-w"></b></label>' +
    '    <input type="range" id="mu-gamma" min="1.5" max="40" step="0.5" value="10" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="mu-hoogte">Hoogte: <b id="mu-hoogte-w"></b></label>' +
    '    <input type="range" id="mu-hoogte" min="1" max="20" step="0.5" value="15" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="mu-tijd">Onderweg: <b id="mu-tijd-w"></b></label>' +
    '    <input type="range" id="mu-tijd" min="0" max="1" step="0.001" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="mu-speel">Afspelen</button>' +
    '    <button class="knop" id="mu-begin">Begin</button>' +
    '  </div>' +
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein" id="mu-leven">E\u00e9n levensduur</button>' +
    '    <button class="knop klein" id="mu-grond">Grond</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const vragenPaneel = document.createElement('div');
  vragenPaneel.className = 'paneel';
  vragenPaneel.innerHTML = '<h3>Vragen bij de muonen</h3><div class="formules" id="mu-vragen"></div>';
  zijkolom.appendChild(vragenPaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De meting is van Rossi en Hall (1941) en is daarna vaak herhaald. De ' +
    'uitleg is in eigen woorden, met dezelfde bouwstenen als de lichtklok: ' +
    'tijdsdilatatie en lengtecontractie.';
  zijkolom.appendChild(bron);

  const schuifGamma = paneel.querySelector('#mu-gamma');
  const schuifHoogte = paneel.querySelector('#mu-hoogte');
  const schuifTijd = paneel.querySelector('#mu-tijd');
  const gammaW = paneel.querySelector('#mu-gamma-w');
  const hoogteW = paneel.querySelector('#mu-hoogte-w');
  const tijdW = paneel.querySelector('#mu-tijd-w');
  const speelKnop = paneel.querySelector('#mu-speel');
  const levenKnop = paneel.querySelector('#mu-leven');
  const vragenVak = vragenPaneel.querySelector('#mu-vragen');
  const open = new Set();

  /** Alles wat uit de stand volgt. */
  function opzet() {
    const beta = F.betaBijGamma(g);
    const c = F.C_KM_PER_US, leven = F.MUON_LEVENSDUUR_US;
    const tGrond = H / (beta * c);            // valtijd op de aardklok, in microseconden
    const d = fractie * H;                    // afgelegd, km
    const t = d / (beta * c);
    return {
      beta: beta, d: d, t: t, tau: t / g, tGrond: tGrond, tauGrond: tGrond / g,
      dik: H / g,                              // de atmosfeer volgens het muon, km
      // Hoe ver een muon gemiddeld komt, zonder en met relativiteit
      reikZonder: beta * c * leven, reikMet: beta * g * c * leven,
      nuMet: F.overleving(t / g, leven), nuZonder: F.overleving(t, leven),
      grondMet: F.overleving(tGrond / g, leven), grondZonder: F.overleving(tGrond, leven),
      // Waar de klok van het muon precies één levensduur aanwijst
      fLeven: beta * g * c * leven / H,
    };
  }

  function merk(labels, spec, plekken) {
    spec.verschuif = ladder(spec, plekken || [[0, 0]]);
    labels.voegToe(spec);
  }
  function aantal(kans) {
    const n = Math.round(1000 * kans);
    return n === 0 && kans > 0 ? '0' : String(n);
  }
  function procent(kans) {
    if (kans < 0.0005) return '0%';
    return F.nl(100 * kans, kans < 0.1 ? 1 : 0) + '%';
  }

  // --- Links: de aarde staat stil ---------------------------------------------
  function tekenAarde(labels, o) {
    const px = (A.grond - A.boven) / H;
    const yMuon = A.boven + o.d * px;
    svg.appendChild(T.el('rect', {
      x: A.links, y: A.boven, width: A.rechts - A.links, height: A.grond - A.boven,
      fill: 'var(--blauw)', opacity: 0.07,
    }));
    svg.appendChild(T.el('line', {
      x1: A.links - 30, y1: A.grond, x2: A.rechts + 30, y2: A.grond,
      stroke: 'var(--perron)', 'stroke-width': 4,
    }));
    svg.appendChild(T.el('line', {
      x1: A.links, y1: A.boven, x2: A.rechts, y2: A.boven,
      stroke: 'var(--blauw)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5',
    }));
    // Hoogte in kilometers langs de linkerrand
    const stap = F.netteStap(H / 5);
    for (let h = stap; h <= H + 1e-9; h += stap) {
      const y = A.grond - h * px;
      svg.appendChild(T.el('line', {
        x1: A.links - 8, y1: y, x2: A.links, y2: y, stroke: 'var(--perron)', 'stroke-width': 1.3,
      }));
      merk(labels, {
        tekst: F.nl(h, 0) + ' km', x: A.links - 12, y: y + 4, grootte: 12.5,
        kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 20,
      });
    }
    // Het spoor en het muon zelf
    const xm = (A.links + A.rechts) / 2;
    svg.appendChild(T.el('line', {
      x1: xm, y1: A.boven, x2: xm, y2: yMuon, stroke: 'var(--trein)', 'stroke-width': 3, opacity: 0.45,
    }));
    svg.appendChild(T.el('circle', { cx: xm, cy: yMuon, r: 16, fill: 'var(--trein)', opacity: 0.16 }));
    svg.appendChild(T.el('circle', {
      cx: xm, cy: yMuon, r: 9, fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    svg.appendChild(T.greep(A.rechts + 16, yMuon, 'var(--trein)'));

    merk(labels, {
      tekst: 'DE AARDE STAAT STIL', x: 30, y: A.kop, grootte: 15, kleur: 'var(--perron)',
      gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'aardklok: ' + F.nl(o.t, 1) + ' \u00b5s', x: 30, y: A.kop + 24, grootte: 14.5,
      kleur: 'var(--perron)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'hier ontstaat het muon', x: A.links, y: A.boven - 10, grootte: 13, kleur: 'var(--blauw)',
      cursief: true, anker: 'start', prioriteit: 50,
    });
    merk(labels, {
      tekst: 'grond', x: xm, y: A.grond + 24, grootte: 14, kleur: 'var(--perron)', gewicht: 650,
      anker: 'middle', prioriteit: 60,
    });
    merk(labels, {
      tekst: 'klok van het muon: ' + F.nl(o.tau, 2) + ' \u00b5s', x: 30, y: A.kop + 48, grootte: 14.5,
      kleur: 'var(--trein)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    return { px: px };
  }

  // --- Rechtsboven: het muon staat stil -----------------------------------------
  function tekenMuon(labels, o, px) {
    const knip = T.el('clipPath', { id: 'mu-venster' });
    knip.appendChild(T.el('rect', {
      x: B.titelX, y: B.boven, width: 290, height: B.onder - B.boven,
    }));
    svg.appendChild(knip);
    const laag = T.el('g', { 'clip-path': 'url(#mu-venster)' });
    svg.appendChild(laag);
    // De laag lucht schuift omhoog langs het muon, de grond komt eraan
    const top = B.muon - (o.d / g) * px;
    const grond = B.muon + (o.dik - o.d / g) * px;
    laag.appendChild(T.el('rect', {
      x: B.links, y: top, width: B.rechts - B.links, height: grond - top,
      fill: 'var(--blauw)', opacity: 0.07,
    }));
    laag.appendChild(T.el('line', {
      x1: B.links, y1: top, x2: B.rechts, y2: top,
      stroke: 'var(--blauw)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5',
    }));
    laag.appendChild(T.el('line', {
      x1: B.links - 30, y1: grond, x2: B.rechts + 30, y2: grond,
      stroke: 'var(--perron)', 'stroke-width': 4,
    }));
    const xm = (B.links + B.rechts) / 2;
    svg.appendChild(T.el('circle', { cx: xm, cy: B.muon, r: 16, fill: 'var(--trein)', opacity: 0.16 }));
    svg.appendChild(T.el('circle', {
      cx: xm, cy: B.muon, r: 9, fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    // Pijl: de grond komt omhoog
    if (grond < B.onder - 30 && fractie < 0.999) {
      svg.appendChild(T.el('path', {
        d: 'M ' + (B.rechts + 46) + ' ' + (grond + 12) + ' L ' + (B.rechts + 46) + ' ' + (grond - 12) +
           ' M ' + (B.rechts + 40) + ' ' + (grond - 5) + ' L ' + (B.rechts + 46) + ' ' + (grond - 13) +
           ' L ' + (B.rechts + 52) + ' ' + (grond - 5),
        fill: 'none', stroke: 'var(--perron)', 'stroke-width': 2.5, 'stroke-linecap': 'round',
      }));
    }
    merk(labels, {
      tekst: 'HET MUON STAAT STIL', x: B.titelX, y: B.kop, grootte: 15, kleur: 'var(--trein)',
      gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'zijn klok: ' + F.nl(o.tau, 2) + ' \u00b5s', x: B.titelX, y: B.kop + 24, grootte: 14.5,
      kleur: 'var(--trein)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'voor hem is de lucht ' + F.nl(o.dik, 2) + ' km dik', x: B.titelX, y: B.onder + 22,
      grootte: 14, kleur: 'var(--tekst)', anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: fractie > 0.999 ? 'de grond is er' :
             (grond > B.onder ? 'de grond is nog buiten beeld' : 'de grond komt omhoog'),
      x: B.titelX, y: B.onder + 44, grootte: 13, kleur: 'var(--tekst-zacht)', cursief: true,
      anker: 'start', prioriteit: 90,
    });
  }

  // --- Rechtsboven, ernaast: de teller ---------------------------------------------
  function tekenTeller(labels, o) {
    const x = 928;
    merk(labels, {
      tekst: 'Van elke 1000 muonen leven er nu nog', x: x, y: 44, grootte: 14.5, kleur: 'var(--tekst)',
      gewicht: 650, anker: 'end', prioriteit: 97,
    });
    merk(labels, {
      tekst: aantal(o.nuMet), x: x, y: 132, grootte: 64, kleur: 'var(--eigentijd)', gewicht: 700,
      anker: 'end', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'zoals het is', x: x, y: 168, grootte: 14, kleur: 'var(--eigentijd)', gewicht: 650,
      anker: 'end', prioriteit: 97,
    });
    merk(labels, {
      tekst: aantal(o.nuZonder), x: x, y: 262, grootte: 64, kleur: 'var(--gebeurtenis)', gewicht: 700,
      anker: 'end', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'zonder relativiteit', x: x, y: 298, grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 650,
      anker: 'end', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'levensduur: ' + F.nl(F.MUON_LEVENSDUUR_US, 1) + ' \u00b5s \u00b7 nu ' +
             F.nl(o.tau / F.MUON_LEVENSDUUR_US, 2) + ' levensduren oud',
      x: x, y: 344, grootte: 13, kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 90,
    });
  }

  // --- Rechtsonder: hoeveel er onderweg nog leven --------------------------------
  function tekenGrafiek(labels, o) {
    const X = function (km) { return G.links + (km / H) * (G.rechts - G.links); };
    const Y = function (kans) { return G.onder - kans * (G.onder - G.boven); };
    svg.appendChild(T.el('line', {
      x1: G.links, y1: G.onder, x2: G.rechts, y2: G.onder, stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    svg.appendChild(T.el('line', {
      x1: G.links, y1: G.onder, x2: G.links, y2: G.boven, stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    [0, 0.5, 1].forEach(function (k) {
      svg.appendChild(T.el('line', {
        x1: G.links - 6, y1: Y(k), x2: G.links, y2: Y(k), stroke: 'var(--perron)', 'stroke-width': 1.2,
      }));
      merk(labels, {
        tekst: F.nl(100 * k, 0) + '%', x: G.links - 10, y: Y(k) + 4, grootte: 12.5,
        kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 20,
      });
    });
    const stap = F.netteStap(H / 5);
    for (let km = 0; km <= H + 1e-9; km += stap) {
      svg.appendChild(T.el('line', {
        x1: X(km), y1: G.onder, x2: X(km), y2: G.onder + 6, stroke: 'var(--perron)', 'stroke-width': 1.2,
      }));
      merk(labels, {
        tekst: F.nl(km, 0), x: X(km), y: G.onder + 22, grootte: 12.5, kleur: 'var(--tekst-zacht)',
        anker: 'middle', prioriteit: 20,
      });
    }
    const kromme = function (reik, kleur) {
      const p = [];
      for (let i = 0; i <= 120; i++) {
        const km = H * i / 120;
        p.push(X(km).toFixed(1) + ',' + Y(Math.exp(-km / reik)).toFixed(1));
      }
      svg.appendChild(T.el('polyline', { points: p.join(' '), fill: 'none', stroke: kleur, 'stroke-width': 3 }));
    };
    kromme(o.reikZonder, 'var(--gebeurtenis)');
    kromme(o.reikMet, 'var(--eigentijd)');
    // Waar we nu zijn
    svg.appendChild(T.el('line', {
      x1: X(o.d), y1: G.boven - 6, x2: X(o.d), y2: G.onder, stroke: 'var(--trein)',
      'stroke-width': 1.6, 'stroke-dasharray': '5 4',
    }));
    svg.appendChild(T.el('circle', {
      cx: X(o.d), cy: Y(o.nuMet), r: 7, fill: 'var(--eigentijd)', stroke: 'var(--kaart)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('circle', {
      cx: X(o.d), cy: Y(o.nuZonder), r: 7, fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 2,
    }));
    // De getallen bij de stippen; rechts van de lijn, behalve vlak bij de rand
    const kant = X(o.d) > G.rechts - 90 ? -1 : 1;
    merk(labels, {
      tekst: procent(o.nuMet), x: X(o.d) + 13 * kant, y: Y(o.nuMet) - 8, grootte: 14,
      kleur: 'var(--eigentijd)', gewicht: 700, anker: kant > 0 ? 'start' : 'end', prioriteit: 82,
    }, [[0, 0], [0, -16], [0, 20]]);
    merk(labels, {
      tekst: procent(o.nuZonder), x: X(o.d) + 13 * kant, y: Y(o.nuZonder) - 8, grootte: 14,
      kleur: 'var(--gebeurtenis)', gewicht: 700, anker: kant > 0 ? 'start' : 'end', prioriteit: 80,
    }, [[0, 0], [0, -18], [0, -36], [0, 20]]);

    merk(labels, {
      tekst: 'NOG IN LEVEN, TEGEN DE AFGELEGDE WEG', x: G.links - 44, y: G.boven - 62, grootte: 15,
      kleur: 'var(--tekst)', gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'groen, zoals het is: gemiddeld ' + F.nl(o.reikMet, o.reikMet < 10 ? 2 : 1) + ' km ver',
      x: G.links - 44, y: G.boven - 40, grootte: 13.5, kleur: 'var(--eigentijd)', gewicht: 650,
      anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'rood, zonder relativiteit: gemiddeld ' + F.nl(o.reikZonder, 2) + ' km ver',
      x: G.links - 44, y: G.boven - 20, grootte: 13.5, kleur: 'var(--gebeurtenis)', gewicht: 650,
      anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'afgelegd (km)', x: G.rechts, y: G.onder + 42, grootte: 13, kleur: 'var(--tekst-zacht)',
      gewicht: 600, anker: 'end', prioriteit: 50,
    });
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const labels = T.maakLabelPlaatser();
    const aarde = tekenAarde(labels, o);
    tekenMuon(labels, o, aarde.px);
    tekenTeller(labels, o);
    tekenGrafiek(labels, o);
    svg.appendChild(labels.tekenAlles());
    laatste = { px: aarde.px };

    gammaW.textContent = F.nl(o.beta, o.beta > 0.999 ? 5 : 4) + 'c (\u03b3 = ' + F.nl(g, 1) + ')';
    hoogteW.textContent = F.nl(H, 1) + ' km';
    tijdW.textContent = F.nl(o.d, 1) + ' km gevallen';
    levenKnop.disabled = o.fLeven > 1;
    const kaarten = [
      ['Val volgens de aarde', F.nl(o.tGrond, 1) + ' \u00b5s', 'var(--perron)'],
      ['Val volgens het muon', F.nl(o.tauGrond, 2) + ' \u00b5s', 'var(--trein)'],
      ['Lucht volgens het muon', F.nl(o.dik, 2) + ' km', 'var(--trein)'],
      ['Levensduren onderweg', F.nl(o.tauGrond / F.MUON_LEVENSDUUR_US, 2), 'var(--blauw)'],
      ['Haalt de grond', procent(o.grondMet), 'var(--eigentijd)'],
      ['Zonder relativiteit', procent(o.grondZonder), 'var(--gebeurtenis)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
    vulVragen(o);
  }

  function vulVragen(o) {
    const kaarten = [
      {
        naam: 'Wie heeft er gelijk?',
        formule: 'eigen tijd = t/\u03b3 = (H/\u03b3) / v',
        som: F.nl(o.tGrond, 1) + ' / ' + F.nl(g, 1) + ' = ' + F.nl(o.tauGrond, 2) + ' \u00b5s \u00a0en\u00a0 ' +
             F.nl(o.dik, 2) + ' km / ' + F.nl(o.beta, 4) + 'c = ' + F.nl(o.tauGrond, 2) + ' \u00b5s',
        waarom:
          'Allebei. Hoeveel muonen uiteenvallen hangt af van hoeveel tijd er op hun eigen ' +
          'klok verstrijkt, en daar komt in beide verhalen hetzelfde uit. De aarde deelt haar ' +
          'lange valtijd door \u03b3. Het muon deelt een korte afstand door zijn snelheid. De ' +
          'tijdsdilatatie van de een is de lengtecontractie van de ander: het zijn twee kanten ' +
          'van dezelfde zaak.',
      },
      {
        naam: 'Waarom zo\u2019n kromme?',
        formule: 'nog in leven = e^(\u2212eigen tijd / levensduur)',
        som: 'e^(\u2212' + F.nl(o.tauGrond / F.MUON_LEVENSDUUR_US, 2) + ') = ' + procent(o.grondMet),
        waarom:
          'Een muon wordt niet oud: het heeft op elk moment dezelfde kans om uiteen te vallen, ' +
          'hoe lang het ook al bestaat. Na elke levensduur is er daarom steeds dezelfde fractie ' +
          'over, ruim een derde. Na twee levensduren een derde van een derde, enzovoort. Dat ' +
          'geeft een kromme die steeds vlakker wordt maar nooit nul raakt.',
      },
      {
        naam: 'Is het echt gemeten?',
        formule: 'tel op de berg, tel in het dal',
        som: 'bij ' + F.nl(H, 1) + ' km: ' + procent(o.grondMet) + ' tegen ' + procent(o.grondZonder),
        waarom:
          'Ja. Rossi en Hall telden in 1941 muonen op een berg en in het dal en vonden er ' +
          'beneden veel meer dan de levensduur toelaat. Later is het in opslagringen heel ' +
          'precies nagemeten met muonen die rondjes vliegen. De uitkomst klopt steeds met de ' +
          'factor \u03b3. Zet de hoogte op 2 km om een berg na te doen.',
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
  function stopSpelen() {
    speelt = false;
    speelKnop.textContent = 'Afspelen';
    speelKnop.classList.remove('aan');
  }
  function zetTijd(f) {
    fractie = Math.max(0, Math.min(1, f));
    schuifTijd.value = String(fractie);
    teken();
  }
  schuifGamma.addEventListener('input', function () { g = parseFloat(schuifGamma.value); teken(); });
  schuifHoogte.addEventListener('input', function () { H = parseFloat(schuifHoogte.value); teken(); });
  schuifTijd.addEventListener('input', function () { fractie = parseFloat(schuifTijd.value); teken(); });
  paneel.querySelector('#mu-begin').addEventListener('click', function () { stopSpelen(); zetTijd(0); });
  paneel.querySelector('#mu-grond').addEventListener('click', function () { stopSpelen(); zetTijd(1); });
  levenKnop.addEventListener('click', function () { stopSpelen(); zetTijd(opzet().fLeven); });

  // Slepen: het muon in de linker tekening, of de lijn in de grafiek
  T.koppelSleep(svg, BREEDTE, HOOGTE, {
    opStart: function (punt) {
      if (!laatste) return false;
      let wat = false;
      if (punt.x < 320) wat = 'val';
      else if (punt.y > G.boven - 20 && punt.x > G.links - 30) wat = 'grafiek';
      if (!wat) return false;
      stopSpelen();
      return wat;
    },
    opSleep: function (punt, wat) {
      if (wat === 'val') zetTijd((punt.y - A.boven) / (A.grond - A.boven));
      else zetTijd((punt.x - G.links) / (G.rechts - G.links));
    },
  });

  let vorigeTik = null;
  function stap(nu) {
    if (!speelt) { vorigeTik = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorigeTik = null; return; }
    if (vorigeTik !== null) {
      fractie = Math.min(1, fractie + Math.min(nu - vorigeTik, 100) / 8000);
      schuifTijd.value = String(fractie);
      teken();
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

  teken();
}
