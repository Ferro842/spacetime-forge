// optellen.js — snelheden tellen niet op, hoeken wel.
//
// Raketten op elkaar: elke trap vertrekt met dezelfde snelheid, gemeten vanaf
// de trap eronder. De snelheid is de helling van een wereldlijn, en hellingen
// tel je niet op. Wat wel optelt is de hoek tussen twee wereldlijnen. In de
// ruimtetijd is dat een hyperbolische hoek: je ziet hem als het oppervlak van
// de wig tussen de twee lijnen, tot aan de ijk-hyperbool. Ter vergelijking
// kan dezelfde tekening met een cirkel en gewone hellingen.
import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Snelheden optellen';
export const onderschrift =
  'Drie raketten van elk 0,6c op elkaar geven geen 1,8c. Wat wel optelt is de ' +
  'hoek tussen de wereldlijnen, en die zie je als oppervlak.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    tik: ['#op-aantal-3', '#op-kader-0'],
    aan: { '#op-cirkel': false },
    stel: { '#op-beta': 0.6 },
  },
  stappen: [
    {
      kop: 'E\u00e9n raket',
      tekst:
        'Een raket vertrekt van de aarde met 0,6c. Zijn wereldlijn helt 0,6 naar ' +
        'rechts: zo veel plaats per eenheid tijd. Snelheid is in dit diagram dus ' +
        'een helling.',
      tik: ['#op-aantal-1'],
    },
    {
      kop: 'Een tweede trap erbovenop',
      tekst:
        'Vanaf die raket vertrekt een tweede, ook met 0,6c, gemeten vanuit de ' +
        'eerste. Gewoon optellen geeft 1,2c: sneller dan het licht. De aarde meet ' +
        '0,88c.',
      tik: ['#op-aantal-2'],
    },
    {
      kop: 'En een derde',
      tekst:
        'Nog een trap van 0,6c. Gewoon opgeteld 1,8c, in werkelijkheid 0,97c. ' +
        'Elke trap komt dichter bij de lichtlijn, en geen enkele raakt hem.',
    },
    {
      kop: 'Wat w\u00e9l optelt',
      tekst:
        'Kijk naar de bovenste liniaal: daar zijn de stappen precies gelijk. Dat ' +
        'is de hoek tussen de wereldlijnen, en elke trap telt er dezelfde 0,69 ' +
        'bij. De onderste liniaal perst die gelijke stappen samen tegen c aan.',
    },
    {
      kop: 'De hoek is een oppervlak',
      tekst:
        'In het diagram is die hoek de wig tussen twee wereldlijnen, tot aan de ' +
        'kromme. De wiggen worden steeds smaller en langer, maar ze zijn alle ' +
        'drie precies even groot.',
    },
    {
      kop: 'Vanuit de tweede trap',
      tekst:
        'Stap over op trap 2. Alles schuift langs de kromme, de wiggen blijven ' +
        'even groot. Trap 1 gaat nu met 0,6c naar links, trap 3 met 0,6c naar ' +
        'rechts: iedere trap ziet zijn buren op 0,6c.',
      tik: ['#op-kader-2'],
    },
    {
      kop: 'Zoals hellingen op een cirkel',
      tekst:
        'Hetzelfde met gewone hellingen: twee keer 0,6 geeft geen 1,2 maar 1,88. ' +
        'Ook daar tel je hoeken op. Het verschil: op een cirkel draai je door, ' +
        'voorbij loodrecht. De kromme van de ruimtetijd loopt eeuwig door en haalt ' +
        'de lichtlijn nooit.',
      aan: { '#op-cirkel': true },
      tik: ['#op-aantal-2'],
    },
  ],
};

const BREEDTE = 960;
const HOOGTE = 940;
// Van boven naar beneden: kop, namen, hoekwaarden, hoekliniaal, de lijnen
// ertussen, snelheidsliniaal, snelheden (tot drie regels), onderschrift.
const LINIAAL = { links: 110, rechts: 880, kop: 52, namen: 78, waarden: 100, hoek: 124,
                  vaart: 214, onder: 298 };
const VLAK = { links: 40, rechts: 920, boven: 332, onder: 884 };
const KLEUREN = ['var(--perron)', 'var(--trein)', 'var(--blauw)', 'var(--accent)', 'var(--eigentijd)'];
const KAP = 6.5;           // hoger dan dit loopt de kromme het beeld uit
const HELLING_MAX = 4;     // bereik van de hellingliniaal bij de cirkel

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

function naamVan(j) {
  return j === 0 ? 'aarde' : 'trap ' + j;
}

export function render(doel) {
  let beta = 0.6;        // snelheid van elke trap, gemeten vanaf de trap eronder
  let aantal = 3;        // aantal trappen boven de aarde
  let kader = 0;         // vanuit wie je kijkt: 0 is de aarde
  let cirkel = false;    // de vergelijking met gewone hellingen

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Een snelheid is een helling</summary>' +
    '<p>In een ruimtetijd-diagram is de snelheid de helling van een wereldlijn. ' +
    'Hellingen tel je niet op: twee wegen van elk 60% achter elkaar geven geen ' +
    'weg van 120%. Wat je optelt zijn de <b>hoeken</b>. In de ruimtetijd is dat ' +
    'net zo, alleen meet je de hoek daar langs een hyperbool in plaats van langs ' +
    'een cirkel. Je ziet hem als het <b>oppervlak van de wig</b> tussen twee ' +
    'wereldlijnen.</p>' +
    '<p style="margin-top:7px">De bovenste liniaal is die hoek, de onderste de ' +
    'snelheid. Dezelfde snelheid lees je in het diagram af op de dunne lijn ' +
    'ct = 1: daar snijdt elke wereldlijn op x = \u03b2.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Raketten op elkaar: hoek en snelheid op twee linialen, en de wereldlijnen eronder',
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
    '<div class="paneel-kop"><h3>Trappen</h3>' +
    '<div class="knoppen" id="op-aantal"></div></div>' +
    '<div class="regelaar">' +
    '  <label for="op-beta">Snelheid van elke trap: <b id="op-beta-w"></b></label>' +
    '  <input type="range" id="op-beta" min="0.1" max="0.8" step="0.01" value="0.6" />' +
    '</div>' +
    '<h3 style="margin-top:10px">Kijk vanuit</h3>' +
    '<div class="knoppen" id="op-kader" style="min-height:96px;align-content:flex-start"></div>' +
    '<div class="knoppen" style="margin-top:8px">' +
    '  <button class="knop" id="op-cirkel">Vergelijk met een cirkel</button>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const tabelPaneel = document.createElement('div');
  tabelPaneel.className = 'paneel';
  // De tabbladen worden ingedeeld op de hoogte bij het laden. Met vier trappen
  // is er een rij en een regel knoppen meer dan met drie, dus de ruimte
  // daarvoor is er vanaf het begin: anders past het later niet meer.
  tabelPaneel.innerHTML = '<div id="op-tabel" style="min-height:196px"></div>';
  zijkolom.appendChild(tabelPaneel);

  const formulePaneel = document.createElement('div');
  formulePaneel.className = 'paneel';
  formulePaneel.innerHTML = '<h3>Waarom een hoek</h3><div class="formules" id="op-formules"></div>';
  zijkolom.appendChild(formulePaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De optelregel volgt Einstein, "Relativity", hoofdstuk 6 en 13, in eigen ' +
    'woorden weergegeven. De lezing als hoek, met het oppervlak van de wig, is ' +
    'een meetkundige aanvulling daarop en sluit aan op de ijk-hyperbolen uit ' +
    'het Minkowski-diagram Pro.';
  zijkolom.appendChild(bron);

  const aantalVak = paneel.querySelector('#op-aantal');
  const kaderVak = paneel.querySelector('#op-kader');
  const betaSchuif = paneel.querySelector('#op-beta');
  const betaW = paneel.querySelector('#op-beta-w');
  const cirkelKnop = paneel.querySelector('#op-cirkel');
  const tabelVak = tabelPaneel.querySelector('#op-tabel');
  const formuleVak = formulePaneel.querySelector('#op-formules');
  const open = new Set();

  /** Alles wat uit de stand volgt, op één plek uitgerekend. */
  function opzet() {
    const stap = cirkel ? Math.atan(beta) : F.rapiditeit(beta);
    const trappen = [];
    for (let j = 0; j <= aantal; j++) {
      const hoek = (j - kader) * stap;
      const voorbij = cirkel && Math.abs(hoek) >= Math.PI / 2 - 1e-9;
      trappen.push({
        j: j, naam: naamVan(j), kleur: KLEUREN[j], hoek: hoek, voorbij: voorbij,
        vaart: cirkel ? Math.tan(hoek) : F.snelheidBijRapiditeit(hoek),
        gewoon: (j - kader) * beta,
      });
    }
    return {
      stap: stap, trappen: trappen,
      hMin: trappen[0].hoek, hMax: trappen[aantal].hoek,
    };
  }

  function hoekTekst(hoek) {
    return cirkel ? F.nl(hoek * 180 / Math.PI, 0) + '\u00b0' : F.nl(hoek, 2);
  }
  function vaartTekst(t) {
    if (t.voorbij) return 'voorbij loodrecht';
    return cirkel ? F.nl(t.vaart, 2) : F.nl(t.vaart, Math.abs(t.vaart) > 0.995 ? 4 : 2) + 'c';
  }

  function merk(labels, spec, plekken) {
    spec.verschuif = ladder(spec, plekken || [[0, 0]]);
    labels.voegToe(spec);
  }

  // --- De twee linialen -----------------------------------------------------
  function tekenLinialen(labels, o) {
    const L = LINIAAL;
    const breed = L.rechts - L.links;
    // Hoek: gelijke stappen, met een halve stap lucht aan weerszijden
    const hA = o.hMin - o.stap / 2, hB = o.hMax + o.stap / 2;
    const hoekX = function (h) { return L.links + (h - hA) / (hB - hA) * breed; };
    // Snelheid: alleen het deel van de liniaal dat gebruikt wordt
    const grens = cirkel ? HELLING_MAX : 1;
    const lo = o.hMin < -1e-9 ? -grens : 0;
    const hi = o.hMax > 1e-9 ? grens : 0;
    const vaartX = function (v) { return L.links + (v - lo) / (hi - lo) * breed; };

    merk(labels, {
      tekst: cirkel ? 'hoek: elke trap dezelfde stap van ' + hoekTekst(o.stap)
                    : 'hoek \u03c6 tussen de wereldlijnen: elke trap dezelfde stap van ' + hoekTekst(o.stap),
      x: VLAK.links, y: L.kop, grootte: 15, kleur: 'var(--tekst)', gewicht: 650,
      anker: 'start', prioriteit: 96,
    });
    merk(labels, {
      tekst: cirkel ? 'helling: de stappen groeien, zonder grens'
                    : 'snelheid: dezelfde stappen, samengeperst tegen c',
      x: VLAK.links, y: L.onder, grootte: 15, kleur: 'var(--tekst)', gewicht: 650,
      anker: 'start', prioriteit: 96,
    });

    [L.hoek, L.vaart].forEach(function (y) {
      svg.appendChild(T.el('line', {
        x1: L.links, y1: y, x2: L.rechts, y2: y, stroke: 'var(--perron)', 'stroke-width': 2,
      }));
      labels.blokkeerLijn({ x1: L.links, y1: y, x2: L.rechts, y2: y, dikte: 14 });
    });

    // Maatstreepjes op de snelheidsliniaal
    const streepjes = cirkel ? [-4, -3, -2, -1, 0, 1, 2, 3, 4] : [-1, -0.5, 0, 0.5, 1];
    streepjes.forEach(function (v) {
      if (v < lo - 1e-9 || v > hi + 1e-9) return;
      const x = vaartX(v);
      const eind = !cirkel && Math.abs(Math.abs(v) - 1) < 1e-9;
      svg.appendChild(T.el('line', {
        x1: x, y1: L.vaart - (eind ? 13 : 6), x2: x, y2: L.vaart + (eind ? 13 : 6),
        stroke: eind ? 'var(--licht)' : 'var(--perron)', 'stroke-width': eind ? 3 : 1.5,
      }));
      // De c staat naast het eind van de liniaal, niet erboven: daar komen de
      // lijnen van de snelste trappen samen en is geen plaats.
      if (eind) {
        merk(labels, {
          tekst: v < 0 ? '\u2212c' : 'c', x: x + (v < 0 ? -16 : 16), y: L.vaart + 5, grootte: 15,
          anker: v < 0 ? 'end' : 'start', kleur: 'var(--licht)', gewicht: 700, prioriteit: 92,
        });
      } else {
        merk(labels, {
          tekst: cirkel ? String(v) : F.nl(v, 1), x: x, y: L.vaart - 18, grootte: 13,
          anker: 'middle', kleur: 'var(--tekst-zacht)', prioriteit: 24,
        });
      }
    });

    // Elke trap: een stip op beide linialen, en de lijn ertussen
    o.trappen.forEach(function (t) {
      const xa = hoekX(t.hoek);
      const binnen = !t.voorbij && t.vaart >= lo - 1e-9 && t.vaart <= hi + 1e-9;
      const xb = binnen ? vaartX(t.vaart)
                        : (t.hoek > 0 ? L.rechts : L.links);
      svg.appendChild(T.el('line', {
        x1: xa, y1: L.hoek, x2: xb, y2: L.vaart,
        stroke: t.kleur, 'stroke-width': 1.6, opacity: 0.55,
        'stroke-dasharray': binnen ? null : '4 4',
      }));
      labels.blokkeerSchuin({ x1: xa, y1: L.hoek, x2: xb, y2: L.vaart, dikte: 5 });
      svg.appendChild(T.el('circle', {
        cx: xa, cy: L.hoek, r: 7, fill: t.kleur, stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      if (binnen) {
        svg.appendChild(T.el('circle', {
          cx: xb, cy: L.vaart, r: 7, fill: t.kleur, stroke: 'var(--kaart)', 'stroke-width': 2,
        }));
      } else {
        // Buiten de liniaal: een pijlpunt aan het eind
        const r = t.hoek > 0 ? 1 : -1;
        svg.appendChild(T.el('path', {
          d: 'M ' + (xb + 10 * r) + ' ' + L.vaart + ' L ' + (xb - 4 * r) + ' ' + (L.vaart - 8) +
             ' L ' + (xb - 4 * r) + ' ' + (L.vaart + 8) + ' Z',
          fill: t.kleur,
        }));
      }
      merk(labels, {
        tekst: t.naam, x: xa, y: L.namen, grootte: 14.5, kleur: t.kleur, gewicht: 650,
        anker: 'middle', prioriteit: 90 - t.j,
      });
      merk(labels, {
        tekst: (cirkel ? '' : '\u03c6 = ') + hoekTekst(t.hoek), x: xa, y: L.waarden,
        grootte: 13.5, kleur: t.kleur, anker: 'middle', prioriteit: 80 - t.j,
      });
      // Tegen c aan liggen de stippen dicht op elkaar: dan gaat het getal een
      // regel lager, en als ook dat niet past staat het nog in de tabel.
      merk(labels, {
        tekst: vaartTekst(t), x: xb, y: L.vaart + 26, grootte: 13.5, kleur: t.kleur,
        gewicht: 650, anker: 'middle', prioriteit: 60 + Math.abs(t.j - kader) * 3,
      }, [[0, 0], [0, 18], [0, 36], [-46, 18], [-46, 36], [-92, 36], [46, 18], [46, 36]]);
    });

    // Wat gewoon optellen voor de verste trap zou geven
    const ver = o.trappen.reduce(function (a, b) {
      return Math.abs(b.j - kader) >= Math.abs(a.j - kader) ? b : a;
    });
    if (Math.abs(ver.j - kader) >= 2) {
      const som = ver.gewoon;
      const past = som >= lo - 1e-9 && som <= hi + 1e-9;
      const x = past ? vaartX(som) : (som > 0 ? L.rechts : L.links);
      if (past) {
        svg.appendChild(T.el('path', {
          d: 'M ' + x + ' ' + (L.vaart - 9) + ' L ' + (x + 8) + ' ' + L.vaart + ' L ' + x + ' ' +
             (L.vaart + 9) + ' L ' + (x - 8) + ' ' + L.vaart + ' Z',
          fill: 'var(--kaart)', stroke: 'var(--gebeurtenis)', 'stroke-width': 2,
        }));
      }
      // Tussen de linialen kruisen de verbindingslijnen elkaar, dus de tekst
      // staat op een vaste plek rechts onderaan; de ruit wijst de plaats aan.
      merk(labels, {
        tekst: 'gewoon opgeteld: ' + F.nl(som, 2) + (cirkel ? '' : 'c') +
               (past ? ' \u25c7' : ' (buiten de liniaal)'),
        x: VLAK.rechts, y: L.onder, grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 650,
        anker: 'end', prioriteit: 94,
      });
    }
  }

  // --- Het diagram: ruimtetijd -----------------------------------------------
  function tekenRuimtetijd(labels, o) {
    const uiterste = Math.max(Math.abs(o.hMin), Math.abs(o.hMax));
    const top = Math.max(1.7, Math.min(Math.cosh(uiterste) * 1.12, KAP));
    const rand = Math.sqrt(top * top - 1);        // waar de kromme het beeld uit loopt
    const nodigR = o.hMax > 1e-9 ? Math.min(Math.sinh(o.hMax), rand) + 0.35 : 0.9;
    const nodigL = o.hMin < -1e-9 ? Math.min(Math.sinh(-o.hMin), rand) + 0.35 : 0.9;
    const hoog = VLAK.onder - VLAK.boven - 8;
    const s = Math.min(hoog / top, (VLAK.rechts - VLAK.links) / (nodigL + nodigR), 230);
    const over = (VLAK.rechts - VLAK.links) - (nodigL + nodigR) * s;
    const xO = VLAK.links + over / 2 + nodigL * s;
    const yO = VLAK.onder;
    const X = function (x) { return xO + x * s; };
    const Y = function (ct) { return yO - ct * s; };
    const yTop = Y(top);

    const knip = T.el('clipPath', { id: 'op-vlak' });
    knip.appendChild(T.el('rect', {
      x: VLAK.links, y: yTop, width: VLAK.rechts - VLAK.links, height: yO - yTop,
    }));
    svg.appendChild(knip);
    const laag = T.el('g', { 'clip-path': 'url(#op-vlak)' });
    svg.appendChild(laag);

    // De wiggen, om en om gekleurd met de kleur van de trap die hem toevoegt
    for (let j = 0; j < aantal; j++) {
      const a = o.trappen[j].hoek, b = o.trappen[j + 1].hoek;
      let d = 'M ' + X(0) + ' ' + Y(0);
      for (let i = 0; i <= 28; i++) {
        const u = a + (b - a) * i / 28;
        d += ' L ' + X(Math.sinh(u)).toFixed(1) + ' ' + Y(Math.cosh(u)).toFixed(1);
      }
      laag.appendChild(T.el('path', { d: d + ' Z', fill: o.trappen[j + 1].kleur, opacity: 0.17 }));
    }

    // Lichtlijnen
    [-1, 1].forEach(function (r) {
      laag.appendChild(T.el('line', {
        x1: X(0), y1: Y(0), x2: X(r * top), y2: Y(top),
        stroke: 'var(--licht)', 'stroke-width': 1.6, 'stroke-dasharray': '7 5',
      }));
      labels.blokkeerSchuin({ x1: X(0), y1: Y(0), x2: X(r * top), y2: Y(top), dikte: 8 });
    });

    // De ijk-hyperbool: elk punt erop is één eenheid eigen tijd na het vertrek
    const uMax = Math.acosh(top);
    const punten = [];
    for (let i = 0; i <= 120; i++) {
      const u = -uMax + 2 * uMax * i / 120;
      punten.push(X(Math.sinh(u)).toFixed(1) + ',' + Y(Math.cosh(u)).toFixed(1));
    }
    laag.appendChild(T.el('polyline', {
      points: punten.join(' '), fill: 'none', stroke: 'var(--blauw)', 'stroke-width': 2.6,
    }));

    // Assen
    svg.appendChild(T.el('line', {
      x1: VLAK.links, y1: yO, x2: VLAK.rechts, y2: yO, stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({ x1: VLAK.links, y1: yO, x2: VLAK.rechts, y2: yO, dikte: 12 });
    merk(labels, {
      tekst: 'x', x: VLAK.rechts - 6, y: yO + 30, grootte: 15, kleur: 'var(--perron)',
      gewicht: 650, anker: 'end', prioriteit: 50,
    });

    // De lijn ct = 1: daar lees je de snelheid af, tussen de twee lichtlijnen
    laag.appendChild(T.el('line', {
      x1: X(-1), y1: Y(1), x2: X(1), y2: Y(1),
      stroke: 'var(--tekst-zacht)', 'stroke-width': 1.2,
    }));

    // De wereldlijnen
    o.trappen.forEach(function (t) {
      const eigen = t.j === kader;
      const xe = X(top * Math.tanh(t.hoek));
      laag.appendChild(T.el('line', {
        x1: X(0), y1: Y(0), x2: xe, y2: yTop,
        stroke: t.kleur, 'stroke-width': eigen ? 3.6 : 2.6,
      }));
      labels.blokkeerSchuin({ x1: X(0), y1: Y(0), x2: xe, y2: yTop, dikte: 7 });
      // Waar hij ct = 1 snijdt: de snelheid, als plaats af te lezen
      laag.appendChild(T.el('circle', {
        cx: X(Math.tanh(t.hoek)), cy: Y(1), r: 3.4, fill: t.kleur,
      }));
      const ch = Math.cosh(t.hoek), sh = Math.sinh(t.hoek);
      const inBeeld = ch <= top;
      const px = inBeeld ? X(sh) : X((top - 0.25) * Math.tanh(t.hoek));
      const py = inBeeld ? Y(ch) : Y(top - 0.25);
      if (inBeeld) {
        laag.appendChild(T.el('circle', {
          cx: px, cy: py, r: 6.5, fill: t.kleur, stroke: 'var(--kaart)', 'stroke-width': 2,
        }));
        labels.blokkeer({ links: px - 9, boven: py - 9, breedte: 18, hoogte: 18 });
      }
      const spec = {
        tekst: inBeeld ? t.naam : t.naam + ' \u2197', x: px + 13, y: py + 5, grootte: 14.5,
        kleur: t.kleur, gewicht: 650, anker: 'start', prioriteit: 88 - Math.abs(t.j - kader),
      };
      // Bij een lage snelheid liggen de stippen dicht bijeen: dan kunnen de
      // namen alleen nog onder elkaar, links en rechts van de bundel.
      const b = schatBreedte(spec.tekst, spec.grootte) + 26;
      const plekken = [[0, 0], [-b, 0]];
      [1, 2, 3, 4, 5, 6].forEach(function (k) {
        plekken.push([0, 22 * k], [-b, 22 * k], [0, -22 * k], [-b, -22 * k]);
      });
      plekken.push([30, 22], [30, 44], [60, 44], [40, -66], [-b - 40, -66], [40, 88], [-b - 40, 88]);
      // En als laatste het boveneind van de eigen lijn: daar waaieren de
      // lijnen het verst uit, en bij weinig trappen is er lucht boven.
      [10, 30, 50, 70].forEach(function (op) {
        if (yTop - op < VLAK.boven + 12) return;
        plekken.push([xe - (b - 26) / 2 - spec.x, yTop - op - spec.y]);
      });
      merk(labels, spec, plekken);
    });

    // In elke wig: de hoek die hij toevoegt. Bij de punt is een wig te smal
    // voor tekst, dus het label zoekt langs de wig naar buiten een plek.
    for (let j = 0; j < aantal; j++) {
      const m = (o.trappen[j].hoek + o.trappen[j + 1].hoek) / 2;
      const plek = function (f) {
        return [X(Math.sinh(m) * f), Y(Math.cosh(m) * f) + 5];
      };
      const kern = plek(0.8);
      const plekken = [0.8, 0.9, 0.7, 0.6, 0.95].filter(function (f) {
        return Math.cosh(m) * f < top - 0.15;
      }).map(function (f) { const p = plek(f); return [p[0] - kern[0], p[1] - kern[1]]; });
      if (!plekken.length) continue;
      merk(labels, {
        tekst: '+' + hoekTekst(o.stap), x: kern[0], y: kern[1],
        grootte: 13.5, kleur: o.trappen[j + 1].kleur, gewicht: 650, anker: 'middle',
        prioriteit: 40 - j,
      }, plekken);
    }

    // Onder de as is het rustig; in het diagram zelf kruist zo'n lange regel
    // altijd wel een wereldlijn.
    merk(labels, {
      tekst: 'elke wig is even groot: oppervlak \u00bd \u00b7 ' + hoekTekst(o.stap),
      x: VLAK.links, y: yO + 30, grootte: 14, kleur: 'var(--tekst)', gewicht: 650,
      anker: 'start', prioriteit: 68,
    });
    // Buiten de lichtkegel lopen geen wereldlijnen: daar is plaats
    merk(labels, {
      tekst: 'lichtlijn', x: X(top * 0.5) + 14, y: Y(top * 0.5) + 20, grootte: 13,
      kleur: 'var(--licht)', cursief: true, anker: 'start', prioriteit: 30,
    }, [[0, 0], [0, 20], [20, 20], [0, 40], [40, 40], [-40, 40], [-80, 80], [-120, 120],
        [-160, 160], [-200, 200]]);
    // Rechts van de kegel als daar plaats is, anders links
    const aflees = {
      tekst: 'ct = 1: hier lees je \u03b2 af', x: X(1) + 14, y: Y(1) + 5, grootte: 13,
      kleur: 'var(--tekst-zacht)', cursief: true, anker: 'start', prioriteit: 34,
    };
    if (aflees.x + schatBreedte(aflees.tekst, aflees.grootte) > BREEDTE - 6) {
      aflees.x = X(-1) - 14;
      aflees.anker = 'end';
    }
    merk(labels, aflees, [[0, 0], [0, 20], [0, -20], [0, 40]]);
    merk(labels, {
      tekst: '\u03c4 = 1 jaar', x: X(0) - 10, y: Y(1) - 12, grootte: 13,
      kleur: 'var(--blauw)', cursief: true, anker: 'end', prioriteit: 32,
    }, [[0, 0], [0, -20], [0, -40], [-20, -40], [96, -20], [96, -40], [96, -60]]);
  }

  // --- Het diagram: de cirkel ter vergelijking ---------------------------------
  function tekenCirkel(labels, o) {
    const cx = 480, cy = 616, r = 226;
    const P = function (hoek, straal) {
      return { x: cx + Math.sin(hoek) * straal, y: cy - Math.cos(hoek) * straal };
    };
    for (let j = 0; j < aantal; j++) {
      const a = o.trappen[j].hoek, b = o.trappen[j + 1].hoek;
      let d = 'M ' + cx + ' ' + cy;
      for (let i = 0; i <= 28; i++) {
        const p = P(a + (b - a) * i / 28, r);
        d += ' L ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }
      svg.appendChild(T.el('path', { d: d + ' Z', fill: o.trappen[j + 1].kleur, opacity: 0.17 }));
    }
    svg.appendChild(T.el('circle', {
      cx: cx, cy: cy, r: r, fill: 'none', stroke: 'var(--blauw)', 'stroke-width': 2.6,
    }));
    // Assen door het middelpunt
    svg.appendChild(T.el('line', {
      x1: VLAK.links, y1: cy, x2: VLAK.rechts, y2: cy, stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    svg.appendChild(T.el('line', {
      x1: cx, y1: cy + r + 26, x2: cx, y2: cy - r - 26, stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    labels.blokkeerLijn({ x1: VLAK.links, y1: cy, x2: VLAK.rechts, y2: cy, dikte: 8 });
    // De raaklijn bovenaan: daar lees je de helling af
    svg.appendChild(T.el('line', {
      x1: VLAK.links, y1: cy - r, x2: VLAK.rechts, y2: cy - r,
      stroke: 'var(--tekst-zacht)', 'stroke-width': 1.2,
    }));
    labels.blokkeerLijn({ x1: VLAK.links, y1: cy - r, x2: VLAK.rechts, y2: cy - r, dikte: 6 });

    o.trappen.forEach(function (t) {
      const eigen = t.j === kader;
      const p = P(t.hoek, r), ver = P(t.hoek, r * 1.1);
      svg.appendChild(T.el('line', {
        x1: cx, y1: cy, x2: ver.x, y2: ver.y, stroke: t.kleur, 'stroke-width': eigen ? 3.6 : 2.6,
      }));
      labels.blokkeerSchuin({ x1: cx, y1: cy, x2: ver.x, y2: ver.y, dikte: 7 });
      svg.appendChild(T.el('circle', {
        cx: p.x, cy: p.y, r: 6.5, fill: t.kleur, stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      labels.blokkeer({ links: p.x - 9, boven: p.y - 9, breedte: 18, hoogte: 18 });
      // Snijpunt met de raaklijn, zolang de lijn nog omhoog wijst
      const xr = cx + Math.tan(t.hoek) * r;
      if (!t.voorbij && xr > VLAK.links && xr < VLAK.rechts) {
        svg.appendChild(T.el('line', {
          x1: ver.x, y1: ver.y, x2: xr, y2: cy - r, stroke: t.kleur, 'stroke-width': 1.2,
          'stroke-dasharray': '4 4',
        }));
        svg.appendChild(T.el('circle', { cx: xr, cy: cy - r, r: 3.6, fill: t.kleur }));
      }
      const naam = P(t.hoek, r + 34);
      const rechts = Math.sin(t.hoek) >= -1e-9;
      const spec = {
        tekst: t.naam, x: naam.x, y: naam.y + 5, grootte: 14.5, kleur: t.kleur, gewicht: 650,
        anker: rechts ? 'start' : 'end', prioriteit: 88 - Math.abs(t.j - kader),
      };
      // Naar buiten langs de eigen lijn, en dan om en om een regel hoger of lager
      const z = rechts ? 1 : -1;
      const plekken = [[0, 0], [0, 22], [0, -22], [20 * z, 22], [20 * z, -22],
                       [0, 44], [0, -44], [40 * z, 0], [40 * z, 44], [40 * z, -44]];
      [1, 2, 3, 4].forEach(function (k) {
        const ver = P(t.hoek, r + 34 + 30 * k);
        plekken.push([ver.x - naam.x, ver.y - naam.y], [ver.x - naam.x, ver.y - naam.y + 22],
                     [ver.x - naam.x, ver.y - naam.y - 22]);
      });
      merk(labels, spec, plekken);
    });

    for (let j = 0; j < aantal; j++) {
      const m = (o.trappen[j].hoek + o.trappen[j + 1].hoek) / 2;
      const p = P(m, r * 0.62);
      merk(labels, {
        tekst: '+' + hoekTekst(o.stap), x: p.x, y: p.y + 5, grootte: 13.5,
        kleur: o.trappen[j + 1].kleur, gewicht: 650, anker: 'middle', prioriteit: 40 - j,
      }, [[0, 0], [0, -18], [0, 18]]);
    }
    merk(labels, {
      tekst: 'elke wig even groot: dezelfde hoek, hetzelfde oppervlak',
      x: VLAK.links, y: VLAK.onder + 30, grootte: 14, kleur: 'var(--tekst)', gewicht: 650,
      anker: 'start', prioriteit: 68,
    });
    merk(labels, {
      tekst: 'raaklijn: hier lees je de helling af', x: VLAK.links, y: cy - r - 16,
      grootte: 13, kleur: 'var(--tekst-zacht)', cursief: true, anker: 'start', prioriteit: 34,
    }, [[0, 0], [0, 34], [640, 0], [640, 34]]);
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const labels = T.maakLabelPlaatser();
    tekenLinialen(labels, o);
    svg.appendChild(T.el('line', {
      x1: VLAK.links, y1: 312, x2: VLAK.rechts, y2: 312, stroke: 'var(--rand)', 'stroke-width': 2,
    }));
    if (cirkel) tekenCirkel(labels, o); else tekenRuimtetijd(labels, o);
    svg.appendChild(labels.tekenAlles());

    vaan.textContent = (cirkel ? 'cirkel, gezien vanuit ' : 'gezien vanuit ') +
      (kader === 0 ? 'de aarde' : naamVan(kader));
    vaan.style.color = KLEUREN[kader];
    vulTabel(o);
    vulFormules(o);
  }

  function vulTabel(o) {
    const rijen = o.trappen.map(function (t) {
      return '<tr><td><span class="stip" style="background:' + t.kleur + '"></span>' + t.naam + '</td>' +
        '<td>' + hoekTekst(t.hoek) + '</td>' +
        // Kort, want een cel die over twee regels loopt maakt de tabel hoger
        '<td>' + (t.voorbij ? 'voorbij' : vaartTekst(t)) + '</td>' +
        '<td>' + F.nl(t.gewoon, 2) + (cirkel ? '' : 'c') + '</td></tr>';
    }).join('');
    tabelVak.innerHTML =
      '<table class="tabel"><caption>Gezien vanuit ' + (kader === 0 ? 'de aarde' : naamVan(kader)) +
      '</caption><thead><tr><th>Wie</th><th>hoek</th><th>' + (cirkel ? 'helling' : 'snelheid') +
      '</th><th>gewoon opgeteld</th></tr></thead><tbody>' + rijen + '</tbody></table>';
  }

  function vulFormules(o) {
    const b = F.nl(beta, 2);
    const twee = F.snelheidOptellen(beta, beta);
    const helling = Math.tan(2 * Math.atan(beta));
    const kaarten = [
      {
        naam: 'De optelregel',
        formule: '\u03b2 = (\u03b2\u2081 + \u03b2\u2082) / (1 + \u03b2\u2081\u00b7\u03b2\u2082)',
        som: '(' + b + ' + ' + b + ') / (1 + ' + b + '\u00b7' + b + ') = ' + F.nl(twee, 4),
        waarom:
          'De tweede trap meet zijn snelheid met de linialen en klokken van de ' +
          'eerste. Die linialen zijn voor de aarde korter en die klokken lopen ' +
          'ongelijk: hetzelfde stuk weg telt dus voor minder. De noemer is die ' +
          'correctie. Hij is altijd net groot genoeg om de uitkomst onder 1 te ' +
          'houden: tel 1 op bij welke snelheid ook en er komt weer 1 uit.',
      },
      {
        naam: 'Dezelfde regel als hoek',
        formule: '\u03b2 = tanh \u03c6 \u00a0\u00a0 \u03c6 = \u03c6\u2081 + \u03c6\u2082',
        som: 'tanh(' + F.nl(F.rapiditeit(beta), 4) + ' + ' + F.nl(F.rapiditeit(beta), 4) + ') = ' +
             F.nl(F.snelheidBijRapiditeit(2 * F.rapiditeit(beta)), 4),
        waarom:
          'Geef elke snelheid de hoek \u03c6 waarvoor tanh \u03c6 = \u03b2. Dan zegt de optelregel ' +
          'niets anders dan dat die hoeken gewoon optellen. In het diagram is \u03c6 het ' +
          'dubbele oppervlak van de wig tussen de ct-as, de wereldlijn en de kromme ' +
          '(ct)\u00b2 \u2212 x\u00b2 = 1. Van kader wisselen schuift alle wereldlijnen langs die ' +
          'kromme op, en laat elk oppervlak zoals het was.',
      },
      {
        naam: 'Het verschil met de cirkel',
        formule: 'helling = (h\u2081 + h\u2082) / (1 \u2212 h\u2081\u00b7h\u2082)',
        som: '(' + b + ' + ' + b + ') / (1 \u2212 ' + b + '\u00b7' + b + ') = ' + F.nl(helling, 4),
        waarom:
          'Voor gewone hellingen geldt bijna dezelfde regel, met een min waar de ' +
          'ruimtetijd een plus heeft. Dat ene teken maakt het verschil tussen een ' +
          'cirkel en een hyperbool. Met de min kan de noemer nul worden: de helling ' +
          'wordt oneindig en je draait door, voorbij loodrecht. Met de plus wordt de ' +
          'noemer alleen maar groter, en blijft de snelheid voor altijd onder c.',
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

  // --- Bediening ---------------------------------------------------------------
  function bouwAantal() {
    aantalVak.innerHTML = '';
    [1, 2, 3, 4].forEach(function (n) {
      const knop = document.createElement('button');
      knop.className = 'knop klein' + (n === aantal ? ' aan' : '');
      knop.id = 'op-aantal-' + n;
      knop.textContent = String(n);
      knop.addEventListener('click', function () {
        aantal = n;
        // Een trap die niet meer meedoet kan geen kader zijn
        if (kader > aantal) kader = 0;
        bouwAantal();
        bouwKader();
        teken();
      });
      aantalVak.appendChild(knop);
    });
  }
  function bouwKader() {
    kaderVak.innerHTML = '';
    for (let j = 0; j <= aantal; j++) {
      const knop = document.createElement('button');
      knop.className = 'knop klein' + (j === kader ? ' aan' : '');
      knop.id = 'op-kader-' + j;
      knop.textContent = j === 0 ? 'Aarde' : 'Trap ' + j;
      knop.addEventListener('click', function () {
        kader = j;
        bouwKader();
        teken();
      });
      kaderVak.appendChild(knop);
    }
  }
  betaSchuif.addEventListener('input', function () {
    beta = parseFloat(betaSchuif.value);
    betaW.textContent = F.nl(beta, 2) + 'c';
    teken();
  });
  cirkelKnop.addEventListener('click', function () {
    cirkel = !cirkel;
    cirkelKnop.classList.toggle('aan', cirkel);
    teken();
  });

  betaW.textContent = F.nl(beta, 2) + 'c';
  bouwAantal();
  bouwKader();
  teken();
}
