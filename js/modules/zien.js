// zien.js — wat je ziet is niet wat er is.
//
// Meten is: overal op hetzelfde moment aflezen. Dat geeft de lengtecontractie.
// Zien is iets anders: je oog vangt licht op dat nú aankomt, en dat vertrok
// van elk stukje van het voorwerp op een ander moment, toen het voorwerp nog
// ergens anders was. Een staaf die op je afkomt zie je daardoor uitgerekt,
// een staaf die wegvliegt extra kort. En een kubus die langs komt laat zijn
// achterkant zien: hij lijkt niet gekrompen maar gedraaid.
//
// Boven een bovenaanzicht: bruin is waar het voorwerp nu is, paars is waar je
// het ziet. Onder de foto: wat het oog opvangt, van links naar rechts, met de
// hoogte die bij de afstand hoort. Daar zie je de kubus draaien.
// Lengtes in eenheden van de zijde van de kubus; de staaf is 2 lang.
import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Zien en meten';
export const onderschrift =
  'Licht heeft tijd nodig. Wat je ziet is waar iets was, en voor elk stukje een ' +
  'ander moment. Daarom zie je een kubus die langs vliegt niet krimpen maar draaien.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    tik: ['#zi-vorm-staaf'],
    stel: { '#zi-beta': 0.6, '#zi-plek': 0 },
  },
  stappen: [
    {
      kop: 'Meten is niet zien',
      tekst:
        'De bruine staaf is waar hij nu is: gemeten 1,60 lang, gekrompen van 2. ' +
        'Maar licht heeft tijd nodig. Paars is wat je ziet: waar hij was toen het ' +
        'licht vertrok. Dat is 2,25 terug, en 2,50 lang.',
    },
    {
      kop: 'Hij komt eraan: langer',
      tekst:
        'Het licht van de achterkant is langer onderweg dan dat van de voorkant, ' +
        'en vertrok dus eerder, toen de staaf nog verder terug was. Je ziet hem ' +
        'uitgerekt: 3,27 in plaats van 1,60.',
      stel: { '#zi-plek': -1.5 },
    },
    {
      kop: 'Hij gaat weg: korter',
      tekst:
        'Vliegt hij van je weg, dan is het andersom. Nu is het licht van de ' +
        'voorkant het langst onderweg, en zie je hem samengedrukt: 1,06. Korter ' +
        'nog dan de gemeten 1,60.',
      stel: { '#zi-plek': 8 },
    },
    {
      kop: 'Recht voor je',
      tekst:
        'Zie je hem recht voor je, dan zie je bijna de gemeten lengte: 1,62. ' +
        'Maar hij is daar allang niet meer. Terwijl het licht naar je toe kwam ' +
        'is hij 1,80 doorgevlogen.',
      tik: ['#zi-recht'],
    },
    {
      kop: 'Een kubus lijkt gedraaid',
      tekst:
        'Nu een kubus. Het licht van zijn achterkant vertrok eerder, toen hij nog ' +
        'niet in de weg stond: je ziet de achterkant. Van ver is het zijvlak 0,80 ' +
        'breed en het achtervlak 0,60, precies een kubus die 37\u00b0 gedraaid is.',
      tik: ['#zi-vorm-kubus', '#zi-recht'],
    },
    {
      kop: 'Wat is dan echt?',
      tekst:
        'Allebei. Meten is overal op hetzelfde moment aflezen, en dat geeft de ' +
        'krimp. Zien is licht opvangen dat op verschillende momenten vertrok, en ' +
        'dat geeft de draaiing. De krimp is er, maar een foto laat hem niet zien.',
      tik: ['#zi-vorm-kubus', '#zi-recht'],
    },
  ],
};

const BREEDTE = 960;
const HOOGTE = 940;
// Het bovenaanzicht: de baan loopt van links naar rechts, het oog staat eronder
const X0 = -7.2, X1 = 9.6;
const PX = (BREEDTE - 80) / (X1 - X0);        // viewBox-eenheden per lengte-eenheid
const BAAN = 300;                              // y van de baan
const AFSTAND = 3;                             // van het oog tot de baan
// De foto: 75 graden naar links en naar rechts, en evenveel pixels per graad omhoog
const FOTO = { links: 60, rechts: 900, boven: 606, onder: 796, hoek: 75 };
const GRAAD = (FOTO.rechts - FOTO.links) / (2 * FOTO.hoek);
const STAAF = 2;                               // rustlengte van de staaf

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
  let beta = 0.6;
  let plek = 0;           // waar het midden van het voorwerp nu is, langs de baan
  let vorm = 'staaf';     // 'staaf' of 'kubus'
  let speelt = false;

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Waarom zien iets anders is dan meten</summary>' +
    '<p>De lengtecontractie krijg je door <b>te meten</b>: beide uiteinden op ' +
    'hetzelfde moment aflezen. Je oog doet dat niet. Het vangt licht op dat nu ' +
    'aankomt, en licht van een ver stukje is langer onderweg dan licht van een ' +
    'dichtbij stukje. Het vertrok dus eerder, toen het voorwerp nog ergens ' +
    'anders was.</p>' +
    '<p style="margin-top:7px">In het bovenaanzicht is <b>bruin</b> waar het ' +
    'voorwerp nu is en <b>paars</b> wat je ziet. Daaronder de foto: wat het ' +
    'oog opvangt, van links naar rechts. Bij een kubus komt daar de achterkant ' +
    'bij: die zie je omdat de kubus intussen is doorgevlogen en het licht niet ' +
    'meer in de weg staat.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Bovenaanzicht van een voorbijvliegend voorwerp: waar het is en waar je het ziet',
  });
  vak.appendChild(svg);
  doel.appendChild(vak);

  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<div class="knoppen" id="zi-vormen">' +
    '  <button class="knop klein aan" id="zi-vorm-staaf">Staaf</button>' +
    '  <button class="knop klein" id="zi-vorm-kubus">Kubus</button>' +
    '</div>' +
    '<div class="regelaars" style="margin-top:10px">' +
    '  <div class="regelaar">' +
    '    <label for="zi-beta">Snelheid: <b id="zi-beta-w"></b></label>' +
    '    <input type="range" id="zi-beta" min="0" max="0.95" step="0.01" value="0.6" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="zi-plek">Waar hij nu is: <b id="zi-plek-w"></b></label>' +
    '    <input type="range" id="zi-plek" min="-6" max="8.5" step="0.01" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="zi-speel">Afspelen</button>' +
    '    <button class="knop" id="zi-begin">Begin</button>' +
    '    <button class="knop" id="zi-recht">Recht voor je</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const vragenPaneel = document.createElement('div');
  vragenPaneel.className = 'paneel';
  vragenPaneel.innerHTML = '<h3>Vragen bij zien en meten</h3><div class="formules" id="zi-vragen"></div>';
  zijkolom.appendChild(vragenPaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'In eigen woorden. Dat een snel voorwerp er gedraaid uitziet in plaats van ' +
    'gekrompen is in 1959 uitgewerkt door Terrell en door Penrose. De som is ' +
    'niets meer dan de reistijd van het licht.';
  zijkolom.appendChild(bron);

  const betaSchuif = paneel.querySelector('#zi-beta');
  const betaW = paneel.querySelector('#zi-beta-w');
  const plekSchuif = paneel.querySelector('#zi-plek');
  const plekW = paneel.querySelector('#zi-plek-w');
  const speelKnop = paneel.querySelector('#zi-speel');
  const vormKnoppen = {
    staaf: paneel.querySelector('#zi-vorm-staaf'),
    kubus: paneel.querySelector('#zi-vorm-kubus'),
  };
  const vragenVak = vragenPaneel.querySelector('#zi-vragen');
  const open = new Set();

  const SX = function (x) { return 40 + (x - X0) * PX; };
  const SY = function (diep) { return BAAN - diep * PX; };          // diep: verder van het oog af
  const OOG = { x: SX(0), y: BAAN + AFSTAND * PX };

  /** Waar je een punt van het voorwerp ziet; diep is hoe ver het achter de baan ligt. */
  function zie(xNu, diep) {
    const q = F.gezienePlaats(xNu, AFSTAND + diep, beta);
    return { x: q.x, diep: diep, r: q.vertraging, hoek: Math.atan2(q.x, AFSTAND + diep) * 180 / Math.PI };
  }
  /** Hetzelfde punt als licht geen tijd nodig had. */
  function zieNu(xNu, diep) {
    return { x: xNu, diep: diep, r: Math.hypot(xNu, AFSTAND + diep),
             hoek: Math.atan2(xNu, AFSTAND + diep) * 180 / Math.PI };
  }
  /** Vanaf hier staat het beeld van het voorwerp links in beeld. */
  function beginPlek() {
    return Math.max(-6, -5.5 + beta * Math.hypot(5.5, AFSTAND));
  }

  function opzet() {
    const g = beta > 0 ? F.gamma(beta) : 1;
    const lang = (vorm === 'staaf' ? STAAF : 1) / g;       // gemeten lengte langs de baan
    const diepte = vorm === 'staaf' ? 0 : 1;
    const achter = plek - lang / 2, voor = plek + lang / 2;
    return {
      g: g, lang: lang, diepte: diepte, achter: achter, voor: voor,
      // de vier hoekpunten zoals je ze ziet (bij de staaf vallen ver en dichtbij samen)
      da: zie(achter, 0), dv: zie(voor, 0), va: zie(achter, diepte), vv: zie(voor, diepte),
      midden: zie(plek, diepte / 2),
    };
  }

  function merk(labels, spec, plekken) {
    spec.verschuif = ladder(spec, plekken || [[0, 0]]);
    labels.voegToe(spec);
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const labels = T.maakLabelPlaatser();
    const gezienLang = o.dv.x - o.da.x;

    // --- Bovenaanzicht -----------------------------------------------------------
    svg.appendChild(T.el('line', {
      x1: 40, y1: BAAN, x2: BREEDTE - 40, y2: BAAN, stroke: 'var(--licht)', 'stroke-width': 1.4,
      'stroke-dasharray': '4 6',
    }));
    // Het licht dat nu aankomt, van de geziene uiteinden naar het oog
    [o.da, o.dv].concat(vorm === 'kubus' ? [o.va] : []).forEach(function (p) {
      svg.appendChild(T.el('line', {
        x1: SX(p.x), y1: SY(p.diep), x2: OOG.x, y2: OOG.y, stroke: 'var(--accent)', 'stroke-width': 1.3,
        opacity: 0.55,
      }));
    });
    // Wat je ziet: de omtrek door de geziene hoekpunten, met de randen ertussen
    const rand = function (xa, da, xb, db) {
      const p = [];
      for (let i = 0; i <= 8; i++) {
        const q = zie(xa + (xb - xa) * i / 8, da + (db - da) * i / 8);
        p.push(SX(q.x).toFixed(1) + ',' + SY(q.diep).toFixed(1));
      }
      return p;
    };
    if (vorm === 'kubus') {
      const omtrek = rand(o.achter, 0, o.voor, 0).concat(rand(o.voor, 0, o.voor, 1),
        rand(o.voor, 1, o.achter, 1), rand(o.achter, 1, o.achter, 0));
      svg.appendChild(T.el('polygon', {
        points: omtrek.join(' '), fill: 'var(--accent)', 'fill-opacity': 0.16, stroke: 'var(--accent)',
        'stroke-width': 2.5, 'stroke-linejoin': 'round',
      }));
      // Nu: de kubus zoals gemeten, gekrompen langs de baan
      svg.appendChild(T.el('rect', {
        x: SX(o.achter), y: SY(1), width: o.lang * PX, height: PX, fill: 'var(--trein)',
        'fill-opacity': 0.75, stroke: 'var(--trein)', 'stroke-width': 2,
      }));
    } else {
      svg.appendChild(T.el('rect', {
        x: SX(o.da.x), y: BAAN - 16, width: gezienLang * PX, height: 32, rx: 6, fill: 'var(--accent)',
        'fill-opacity': 0.16, stroke: 'var(--accent)', 'stroke-width': 2.5,
      }));
      svg.appendChild(T.el('rect', {
        x: SX(o.achter), y: BAAN - 7, width: o.lang * PX, height: 14, rx: 4, fill: 'var(--trein)',
      }));
    }
    // Rijrichting
    svg.appendChild(T.el('path', {
      d: 'M ' + (SX(o.voor) + 12) + ' ' + (BAAN - 30) + ' L ' + (SX(o.voor) + 40) + ' ' + (BAAN - 30) +
         ' M ' + (SX(o.voor) + 32) + ' ' + (BAAN - 37) + ' L ' + (SX(o.voor) + 41) + ' ' + (BAAN - 30) +
         ' L ' + (SX(o.voor) + 32) + ' ' + (BAAN - 23),
      fill: 'none', stroke: 'var(--trein)', 'stroke-width': 2.5, 'stroke-linecap': 'round',
    }));
    // Het oog
    svg.appendChild(T.el('circle', { cx: OOG.x, cy: OOG.y, r: 12, fill: 'var(--perron)' }));
    svg.appendChild(T.el('circle', { cx: OOG.x, cy: OOG.y - 3, r: 4.5, fill: 'var(--kaart)' }));
    svg.appendChild(T.el('line', {
      x1: OOG.x, y1: OOG.y - 14, x2: OOG.x, y2: BAAN, stroke: 'var(--licht)', 'stroke-width': 1.2,
      'stroke-dasharray': '3 5',
    }));

    labels.blokkeer({ links: SX(o.achter) - 4, boven: SY(o.diepte) - 10, breedte: o.lang * PX + 52, hoogte: o.diepte * PX + 20 });
    if (o.dv.x >= X0) labels.blokkeer({
      links: SX(Math.min(o.da.x, o.va.x)) - 4, boven: SY(o.diepte) - 18,
      breedte: (Math.max(o.dv.x, o.vv.x) - Math.min(o.da.x, o.va.x)) * PX + 8, hoogte: o.diepte * PX + 36,
    });
    labels.blokkeer({ links: OOG.x - 14, boven: OOG.y - 14, breedte: 28, hoogte: 28 });
    merk(labels, {
      tekst: 'VAN BOVEN GEZIEN', x: 30, y: 44, grootte: 15, kleur: 'var(--tekst)', gewicht: 700,
      anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'bruin: waar hij nu is, gemeten ' + F.nl(o.lang, 2) + ' lang',
      x: 30, y: 68, grootte: 14.5, kleur: 'var(--trein)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: vorm === 'staaf'
        ? 'paars: waar je hem ziet, ' + F.nl(gezienLang, 2) + ' lang en ' + F.nl(plek - o.midden.x, 2) + ' terug'
        : 'paars: waar je hem ziet, scheefgetrokken en ' + F.nl(plek - o.midden.x, 2) + ' terug',
      x: 30, y: 92, grootte: 14.5, kleur: 'var(--accent)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'oog', x: OOG.x + 20, y: OOG.y + 5, grootte: 14, kleur: 'var(--perron)', gewicht: 650,
      anker: 'start', prioriteit: 80,
    });
    merk(labels, {
      tekst: 'nu', x: SX(plek), y: SY(o.diepte) - 44, grootte: 14, kleur: 'var(--trein)', gewicht: 700,
      anker: 'middle', prioriteit: 78,
    }, [[0, 0], [0, -18], [40, 0], [-40, 0]]);
    if (o.midden.x < X0 + 0.4) merk(labels, {
      tekst: '\u2190 je ziet hem nog verder naar links, buiten beeld', x: 30, y: 116, grootte: 14.5,
      kleur: 'var(--accent)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    else merk(labels, {
      tekst: 'gezien', x: SX(o.midden.x), y: SY(o.diepte) - 26, grootte: 14, kleur: 'var(--accent)',
      gewicht: 700, anker: 'middle', prioriteit: 76,
    }, [[0, 0], [0, -20], [0, 60 + o.diepte * PX], [-50, 0], [50, 0], [-50, -20], [50, -20]]);

    // --- De foto: wat het oog opvangt ----------------------------------------------
    const midX = (FOTO.links + FOTO.rechts) / 2, midY = (FOTO.boven + FOTO.onder) / 2;
    const HX = function (hoek) {
      return midX + Math.max(-FOTO.hoek, Math.min(FOTO.hoek, hoek)) * GRAAD;
    };
    svg.appendChild(T.el('rect', {
      x: FOTO.links, y: FOTO.boven, width: FOTO.rechts - FOTO.links, height: FOTO.onder - FOTO.boven,
      rx: 8, fill: 'var(--bg)', stroke: 'var(--rand-sterk)', 'stroke-width': 1.5,
    }));
    svg.appendChild(T.el('line', {
      x1: midX, y1: FOTO.boven - 8, x2: midX, y2: FOTO.onder + 8, stroke: 'var(--licht)',
      'stroke-width': 1.2, 'stroke-dasharray': '3 5',
    }));
    // Een vlak op de foto, van het ene punt van het voorwerp naar het andere. Wat
    // verder weg is komt kleiner in beeld: zo hoog als de hoek waaronder je het ziet.
    const half = vorm === 'kubus' ? 0.5 : 0.13;
    const fotoVlak = function (xa, da, xb, db, kleur, dekking, kijk) {
      const boven = [], onder = [];
      for (let i = 0; i <= 8; i++) {
        const q = kijk(xa + (xb - xa) * i / 8, da + (db - da) * i / 8);
        const hoog = Math.atan(half / q.r) * 180 / Math.PI * GRAAD;
        boven.push(HX(q.hoek).toFixed(1) + ',' + (midY - hoog).toFixed(1));
        onder.unshift(HX(q.hoek).toFixed(1) + ',' + (midY + hoog).toFixed(1));
      }
      const eigenschappen = {
        points: boven.concat(onder).join(' '), fill: kleur, 'fill-opacity': dekking, stroke: kleur,
        'stroke-width': 1.6, 'stroke-linejoin': 'round',
      };
      if (dekking === 0) eigenschappen['stroke-dasharray'] = '4 3';
      svg.appendChild(T.el('polygon', eigenschappen));
    };
    // Gestreept: waar hij zou staan als licht geen tijd nodig had
    fotoVlak(o.achter, 0, o.voor, 0, 'var(--trein)', 0, zieNu);
    let achterBreed = 0, voorBreed = 0;
    const buitenFoto = Math.max(o.dv.hoek, o.vv.hoek) < -FOTO.hoek;
    if (buitenFoto) {
      // nog te ver naar links: het beeld staat buiten de rand
    } else if (vorm === 'kubus') {
      // Het achter- of voorvlak als het in zicht is, en het zijvlak dat naar je toe gekeerd is
      achterBreed = o.da.hoek - o.va.hoek;
      voorBreed = o.vv.hoek - o.dv.hoek;
      if (achterBreed > 0) fotoVlak(o.achter, 1, o.achter, 0, 'var(--accent)', 0.6, zie);
      if (voorBreed > 0) fotoVlak(o.voor, 0, o.voor, 1, 'var(--blauw)', 0.5, zie);
      fotoVlak(o.achter, 0, o.voor, 0, 'var(--trein)', 0.7, zie);
    } else {
      fotoVlak(o.achter, 0, o.voor, 0, 'var(--accent)', 0.6, zie);
    }
    merk(labels, {
      tekst: 'DE FOTO: WAT HET OOG OPVANGT', x: 30, y: FOTO.boven - 46, grootte: 15, kleur: 'var(--tekst)',
      gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: vorm === 'staaf'
        ? 'paars: de staaf zoals je hem ziet \u00b7 gestreept: waar hij nu werkelijk is'
        : 'bruin: zijvlak \u00b7 paars: achterkant \u00b7 blauw: voorkant \u00b7 gestreept: waar hij nu is',
      x: 30, y: FOTO.boven - 22, grootte: 14, kleur: 'var(--tekst-zacht)', gewicht: 600,
      anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: 'links', x: FOTO.links, y: FOTO.onder + 24, grootte: 12.5, kleur: 'var(--tekst-zacht)',
      anker: 'start', prioriteit: 40,
    });
    merk(labels, {
      tekst: 'recht voor je', x: midX, y: FOTO.onder + 24, grootte: 12.5, kleur: 'var(--tekst-zacht)',
      anker: 'middle', prioriteit: 40,
    });
    merk(labels, {
      tekst: 'rechts', x: FOTO.rechts, y: FOTO.onder + 24, grootte: 12.5, kleur: 'var(--tekst-zacht)',
      anker: 'end', prioriteit: 40,
    });
    // Onderaan de conclusie van dit moment
    let slot;
    if (buitenFoto) {
      slot = 'je ziet hem nog ver naar links, buiten de foto';
    } else if (vorm === 'kubus') {
      slot = beta === 0 && achterBreed <= 0.3 && voorBreed <= 0.3 ? 'hij staat stil: wat je ziet is wat er is'
           : achterBreed > 0.3
        ? 'je ziet de achterkant: de kubus lijkt gedraaid (van ver: ' + F.nl(Math.asin(beta) * 180 / Math.PI, 0) + '\u00b0)'
        : voorBreed > 0.3 ? 'je ziet de voorkant, zoals bij elk voorwerp dat op je afkomt'
                          : 'je ziet alleen het zijvlak';
    } else {
      const verschil = gezienLang / o.lang;
      slot = beta === 0 ? 'hij staat stil: wat je ziet is wat er is'
           : verschil > 1.03 ? 'gezien ' + F.nl(verschil, 2) + ' keer zo lang als gemeten: hij komt op je af'
           : verschil < 0.97 ? 'gezien ' + F.nl(verschil, 2) + ' keer de gemeten lengte: hij vliegt weg'
           : 'gezien en gemeten zijn hier bijna gelijk';
    }
    merk(labels, {
      tekst: slot, x: 30, y: FOTO.onder + 66, grootte: 15, kleur: 'var(--accent)', gewicht: 650,
      anker: 'start', prioriteit: 96,
    });

    svg.appendChild(labels.tekenAlles());

    betaW.textContent = F.nl(beta, 2) + 'c';
    plekW.textContent = F.nl(plek, 2);
    const kaarten = [
      ['Gemeten lengte', F.nl(o.lang, 3), 'var(--trein)'],
      ['Geziene lengte', F.nl(gezienLang, 3), 'var(--accent)'],
      ['Komt van ver: tot', F.nl(o.lang / (1 - beta), 2), 'var(--accent)'],
      ['Vliegt ver weg: tot', F.nl(o.lang / (1 + beta), 2), 'var(--accent)'],
      ['Licht onderweg (midden)', F.nl(F.gezienePlaats(plek, AFSTAND + o.diepte / 2, beta).vertraging, 2), 'var(--blauw)'],
      ['Draaiing van ver', F.nl(Math.asin(beta) * 180 / Math.PI, 1) + '\u00b0', 'var(--tekst)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
    vulVragen(o);
  }

  function vulVragen(o) {
    const k = beta < 1 ? Math.sqrt((1 + beta) / (1 - beta)) : 0;
    const kaarten = [
      {
        naam: 'Hoe lang lijkt iets dat recht op je afkomt?',
        formule: 'gezien = (L/\u03b3) / (1 \u2212 \u03b2) = L \u00b7 \u221a((1 + \u03b2)/(1 \u2212 \u03b2))',
        som: F.nl(o.lang, 2) + ' / ' + F.nl(1 - beta, 2) + ' = ' + F.nl(o.lang / (1 - beta), 2) +
             ', dat is ' + F.nl(k, 2) + ' keer de rustlengte',
        waarom:
          'Het licht van de achterkant moet de hele staaf langs voor het bij de voorkant is, ' +
          'en intussen vliegt de staaf door. Het verschil in snelheid tussen licht en staaf is ' +
          '1 \u2212 \u03b2, en daar deel je door. Samen met de krimp geeft dat de dopplerfactor: ' +
          'dezelfde die bij de tweeling zegt hoe snel je een klok ziet lopen, en bij de kever ' +
          'hoe ver de punt doorvliegt. Telkens is het licht dat iets najaagt.',
      },
      {
        naam: 'Waarom gedraaid en niet gekrompen?',
        formule: 'zijvlak 1/\u03b3 \u00a0\u00a0 achtervlak \u03b2 \u00a0\u00a0 (1/\u03b3)\u00b2 + \u03b2\u00b2 = 1',
        som: F.nl(1 / o.g, 2) + ' en ' + F.nl(beta, 2) + ': een kubus gedraaid over ' +
             F.nl(Math.asin(beta) * 180 / Math.PI, 0) + '\u00b0 laat precies die twee breedtes zien',
        waarom:
          'Licht van de achterste rand is langer onderweg: een hele kubus dieper. In die tijd ' +
          'schuift de kubus \u03b2 keer zijn diepte op, en zo ver zie je de achterkant achter het ' +
          'zijvlak uitsteken. Het zijvlak zelf is gekrompen tot 1/\u03b3. Die twee breedtes zijn de ' +
          'cosinus en de sinus van dezelfde hoek. Je oog kan dat niet onderscheiden van een ' +
          'gewone kubus die een slag gedraaid is. Het is de cirkel van Epstein, nu als plaatje.',
      },
      {
        naam: 'Bestaat de krimp dan wel?',
        formule: 'meten: gelijktijdig aflezen \u00a0\u00a0 zien: gelijktijdig opvangen',
        som: 'gemeten ' + F.nl(o.lang, 2) + ' \u00b7 gezien ' + F.nl(o.dv.x - o.da.x, 2),
        waarom:
          'Ja. Zet langs de baan een rij klokken en fotocellen en lees af waar de uiteinden ' +
          'op hetzelfde moment zijn: dan vind je de gekrompen lengte. Zo meet je, en zo werkt ' +
          'het in de staaf in de loods. Een foto doet iets anders: die legt vast wat er ' +
          'tegelijk aankomt. Beide uitkomsten kloppen, ze beantwoorden een andere vraag.',
      },
    ];
    vragenVak.innerHTML = kaarten.map(function (k2, i) {
      return '<details class="formule"' + (open.has(i) ? ' open' : '') + ' data-nr="' + i + '">' +
        '<summary><span class="naam">' + k2.naam + '</span></summary>' +
        '<div class="formule-inhoud"><div class="formule-regel">' + k2.formule + '</div>' +
        '<div class="som">' + k2.som + '</div>' +
        '<p class="waarom">' + k2.waarom + '</p></div></details>';
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
  function zetPlek(x) {
    plek = Math.max(-6, Math.min(8.5, x));
    plekSchuif.value = String(plek);
    teken();
  }
  function kiesVorm(welke) {
    vorm = welke;
    vormKnoppen.staaf.classList.toggle('aan', welke === 'staaf');
    vormKnoppen.kubus.classList.toggle('aan', welke === 'kubus');
    teken();
  }
  vormKnoppen.staaf.addEventListener('click', function () { kiesVorm('staaf'); });
  vormKnoppen.kubus.addEventListener('click', function () { kiesVorm('kubus'); });
  betaSchuif.addEventListener('input', function () { beta = parseFloat(betaSchuif.value); teken(); });
  plekSchuif.addEventListener('input', function () { plek = parseFloat(plekSchuif.value); teken(); });
  paneel.querySelector('#zi-begin').addEventListener('click', function () { stopSpelen(); zetPlek(beginPlek()); });
  // Recht voor je zien: het licht deed er dan precies de afstand over, en in
  // die tijd is het voorwerp beta maal die afstand doorgevlogen.
  paneel.querySelector('#zi-recht').addEventListener('click', function () {
    stopSpelen();
    zetPlek(beta * (AFSTAND + (vorm === 'kubus' ? 0.5 : 0)));
  });

  // Slepen: het voorwerp volgt je vinger langs de baan
  T.koppelSleep(svg, BREEDTE, HOOGTE, {
    opStart: function (punt) { if (punt.y > 560) return false; stopSpelen(); return 'voorwerp'; },
    opSleep: function (punt, wat, delta) { zetPlek(plek + delta.dx / PX); },
  });

  let vorigeTik = null;
  function stap(nu) {
    if (!speelt) { vorigeTik = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorigeTik = null; return; }
    if (vorigeTik !== null) {
      // sneller ingesteld is ook sneller in beeld
      plek = Math.min(8.5, plek + Math.min(nu - vorigeTik, 100) / 1000 * 2.4 * beta);
      plekSchuif.value = String(plek);
      teken();
      if (plek >= 8.5) { stopSpelen(); vorigeTik = null; return; }
    }
    vorigeTik = nu;
    requestAnimationFrame(stap);
  }
  speelKnop.addEventListener('click', function () {
    if (speelt) { stopSpelen(); return; }
    if (beta === 0) return;                 // wat stilstaat komt niet voorbij
    speelt = true;
    speelKnop.textContent = 'Pauze';
    speelKnop.classList.add('aan');
    if (plek >= 8.49) plek = beginPlek();
    vorigeTik = null;
    requestAnimationFrame(stap);
  });

  teken();
}
