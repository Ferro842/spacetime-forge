// epstein.js — de Epstein-cirkel.
// Kernidee: elk voorwerp beweegt altijd met snelheid c door ruimtetijd.
// De vraag is alleen hoeveel daarvan door de ruimte gaat en hoeveel door
// de tijd. Die twee vormen samen een rechthoekige driehoek met schuine
// zijde 1 — vandaar de cirkel.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Epstein-cirkel';
export const onderschrift =
  'Een ander mentaal model: je beweegt altijd met de lichtsnelheid door ruimtetijd. ' +
  'Sleep het punt over de boog en verdeel die snelheid tussen ruimte en tijd. ' +
  'In deel 2 volgt de tweeling diezelfde pijl, tien jaar lang.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    tik: ['#ep-deel-pijl'],
    aan: { '#ep-valkuil': false },
    stel: { '#ep-beta': 0.6, '#ep-tijd': 0 },
  },
  stappen: [
    {
      kop: 'Altijd even snel',
      tekst:
        'Het beeld van Epstein: alles beweegt altijd met dezelfde snelheid, c, door ' +
        'ruimte en tijd samen. De paarse pijl heeft dus een vaste lengte. Sta je ' +
        'stil, dan wijst hij recht omhoog: al je snelheid gaat door de tijd.',
      stel: { '#ep-beta': 0 },
    },
    {
      kop: 'Een heel klein beetje opzij',
      tekst:
        'Het ruimtestation haalt 7,7 kilometer per seconde. Op deze schaal is de ' +
        'pijl niet van recht omhoog te onderscheiden. Daarom merken we in het ' +
        'dagelijks leven niets van relativiteit.',
      tik: ['ISS'],
    },
    {
      kop: 'Echt snel',
      tekst:
        'Bij 0,6c draait de pijl flink opzij. Wat hij naar rechts wint, levert hij ' +
        'omhoog in: door de tijd gaat hij nog maar met 0,80. Je klok loopt op 80 ' +
        'procent.',
    },
    {
      kop: 'Bijna licht',
      tekst:
        'Bij 0,99c ligt de pijl bijna plat. Voor de tijd blijft 0,14 over: je klok ' +
        'kruipt.',
      stel: { '#ep-beta': 0.99 },
    },
    {
      kop: 'Waarom niets sneller kan',
      tekst:
        'De pijl kan draaien, niet groeien. Helemaal plat is licht: alle snelheid ' +
        'door de ruimte, niets meer door de tijd. Verder draaien bestaat niet. Let ' +
        'wel: dit beeld klopt voor het tempo van klokken, niet voor wat ' +
        'gelijktijdig is.',
      stel: { '#ep-beta': 0.99 },
    },
    {
      kop: 'Tien jaar lang dezelfde pijl',
      tekst:
        'Volg nu twee pijlen, jaar na jaar. De aarde wijst recht omhoog, de ' +
        'reiziger schuin, met 0,8c. Na 3 jaar hebben ze even ver gereisd, want ze ' +
        'liggen op dezelfde cirkel. Maar de reiziger is minder hoog gekomen: ' +
        '1,80 jaar op zijn klok.',
      stel: { '#ep-beta': 0.8, '#ep-tijd': 0.3 },
      tik: ['#ep-deel-tweeling'],
    },
    {
      kop: 'Omkeren kost geen lengte',
      tekst:
        'Bij de ster keert hij om. Zijn pad knikt, maar wordt er niet korter van: ' +
        'klap het terug langs de stippellijn en het eindigt weer op de cirkel. ' +
        'Alleen brengt de zijwaartse helft hem nu naar huis.',
      stel: { '#ep-beta': 0.8, '#ep-tijd': 0.8 },
      tik: ['#ep-deel-tweeling'],
    },
    {
      kop: 'Thuis: even ver, niet even hoog',
      tekst:
        'Na 10 jaar zijn beide paden 10 lang. Het rechte komt uit op 10 jaar, het ' +
        'geknikte op 6. Het verschil in leeftijd is hier gewoon een verschil in ' +
        'hoogte: wie opzij gaat, komt minder ver omhoog.',
      stel: { '#ep-beta': 0.8 },
      tik: ['#ep-deel-tweeling', '#ep-eind'],
    },
    {
      kop: 'Waar dit beeld ophoudt',
      tekst:
        'Pas op met gelijke hoogte. Op de hoogte van de reiziger, 3 jaar, staat ' +
        'ook de aarde ergens, maar dat is niemands "nu". De aarde zegt: het is 5 ' +
        'jaar. De reiziger zegt 1,8, en vlak na de omkeer 8,2. Voor wat ' +
        'gelijktijdig is heb je het Minkowski-diagram nodig.',
      aan: { '#ep-valkuil': true },
      stel: { '#ep-beta': 0.8 },
      tik: ['#ep-deel-tweeling', '#ep-keer'],
    },
  ],
};

// Een kwartcirkel is van nature vierkant, dus deze viewBox ook. Is het
// diagramvak breder dan hoog, dan blijft er links en rechts ruimte over;
// dat is hier beter dan een uitgerekte cirkel.
const BREEDTE = 940;
const HOOGTE = 940;

// De reis in het tweede deel: vijf jaar aardtijd heen, vijf terug. Tien jaar
// is dan precies de straal van de kwartcirkel uit het eerste deel.
const T_HEEN = 5;

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
  let sleept = false;
  let deel = 'pijl';        // 'pijl' of 'tweeling'
  let fractie = 0;          // hoe ver de reis is, van 0 tot 1
  let speelt = false;
  let toonValkuil = false;  // de lijn op gelijke hoogte, die niets betekent

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Waarom een cirkel?</summary>' +
    '<p>De snelheid door de ruimte en de snelheid door de tijd vormen samen ' +
    'altijd precies c: v\u00b2 + (c/\u03b3)\u00b2 = c\u00b2. Dat is de stelling van Pythagoras, ' +
    'en dus ligt het punt altijd op een cirkel met straal c. Sta je stil, dan ' +
    'gaat al je snelheid door de tijd. Beweeg je met bijna c, dan blijft er ' +
    'nauwelijks tijd over \u2014 je klok staat vrijwel stil.</p>' +
    '<p style="margin-top:7px"><b>De tweeling</b> volgt die pijl tien jaar lang. ' +
    'Omhoog staat dan de eigen tijd, opzij de plaats, en elk pad is na t jaar ' +
    'precies t lang. Wie opzij gaat komt dus minder hoog. Let op waar dit beeld ' +
    'ophoudt: een punt is hier geen gebeurtenis, en gelijke hoogte betekent ' +
    'gelijke klokstand, niet hetzelfde moment.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    style: 'cursor:grab',
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
    '<div class="knoppen" id="ep-delen">' +
    '  <button class="knop klein aan" id="ep-deel-pijl">1 \u00b7 De pijl</button>' +
    '  <button class="knop klein" id="ep-deel-tweeling">2 \u00b7 De tweeling</button>' +
    '</div>' +
    '<h3 style="margin-top:10px">Snelheid</h3>' +
    '<div class="regelaars">' +
    '  <div class="regelaar">' +
    '    <label for="ep-beta">Snelheid door de ruimte: <b id="ep-beta-w"></b></label>' +
    '    <input type="range" id="ep-beta" min="0" max="0.99" step="0.005" value="0.6" />' +
    '  </div>' +
    '  <div class="knoppen" id="ep-voorbeelden"></div>' +
    '</div>' +
    '<div id="ep-reisvak" style="display:none">' +
    '  <div class="regelaar">' +
    '    <label for="ep-tijd">Tijd op aarde: <b id="ep-tijd-w"></b></label>' +
    '    <input type="range" id="ep-tijd" min="0" max="1" step="0.002" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="ep-speel">Afspelen</button>' +
    '    <button class="knop" id="ep-begin">Begin</button>' +
    '    <button class="knop" id="ep-keer">Keerpunt</button>' +
    '    <button class="knop" id="ep-eind">Thuis</button>' +
    '  </div>' +
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein" id="ep-valkuil">Valkuil: gelijke hoogte</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Het model komt uit Epstein, "Relativity Visualized" \u2014 in eigen woorden ' +
    'weergegeven. De tweeling is hier in datzelfde beeld getekend. De natuurkunde ' +
    'is identiek aan het Minkowski-diagram; alleen de manier van tekenen verschilt.';
  zijkolom.appendChild(bron);

  // Voorbeeldknoppen
  const voorbeelden = [
    { naam: 'Stilstand', b: 0 },
    { naam: 'ISS', b: 7660 / F.C_MS },
    { naam: '0,6c', b: 0.6 },
    { naam: '0,9c', b: 0.9 },
    { naam: '0,99c', b: 0.99 },
  ];
  const knoppenVak = paneel.querySelector('#ep-voorbeelden');
  voorbeelden.forEach(function (v) {
    const k = document.createElement('button');
    k.className = 'knop';
    k.textContent = v.naam;
    k.addEventListener('click', function () {
      beta = v.b;
      schuif.value = String(Math.min(0.99, v.b));
      werkBij();
    });
    knoppenVak.appendChild(k);
  });

  // Vaste geometrie van de cirkel. Links blijft ruimte voor het aslabel,
  // dat naast de tijdas hoort te staan en niet eroverheen.
  const R = 600;                     // straal in viewBox-eenheden
  const ox = 230, oy = HOOGTE - 130; // oorsprong linksonder

  // --- Deel 2: de tweeling ---------------------------------------------------
  const JAAR = R / (2 * T_HEEN);     // viewBox-eenheden per jaar of lichtjaar

  /** Waar de reiziger nu is, in plaats en in eigen tijd. */
  function reis() {
    const g = beta > 0 ? F.gamma(beta) : 1;
    const t = fractie * 2 * T_HEEN;
    const terug = t > T_HEEN;
    const x = terug ? beta * (2 * T_HEEN - t) : beta * t;
    return {
      g: g, t: t, terug: terug, x: x, tau: t / g,
      xKeer: beta * T_HEEN, tauKeer: T_HEEN / g,
      // Teruggeklapt loopt het pad rechtdoor, en eindigt het op de cirkel
      spookX: beta * t,
      // Wat de reiziger op dit moment "nu op aarde" noemt
      nuAarde: F.gelijktijdigOp(t, x, terug ? -beta : beta),
    };
  }

  function merk(labels, spec, plekken) {
    spec.verschuif = ladder(spec, plekken || [[0, 0]]);
    labels.voegToe(spec);
  }

  function tekenTweeling(labels) {
    const r = reis();
    const PX = function (x) { return ox + x * JAAR; };
    const PY = function (tau) { return oy - tau * JAAR; };
    const boog = function (straal) {
      const p = [];
      for (let a = 0; a <= Math.PI / 2 + 1e-9; a += 0.01) {
        p.push((ox + Math.cos(a) * straal).toFixed(1) + ',' + (oy - Math.sin(a) * straal).toFixed(1));
      }
      return p.join(' ');
    };

    // Assen met maatstreepjes om de twee jaar
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox + R * 1.12, y2: oy, stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox, y2: oy - R * 1.12, stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({ x1: ox, y1: oy, x2: ox + R * 1.12, y2: oy, dikte: 12 });
    labels.blokkeerLijn({ x1: ox, y1: oy, x2: ox, y2: oy - R * 1.12, dikte: 12 });
    for (let k = 2; k <= 10; k += 2) {
      svg.appendChild(T.el('line', {
        x1: PX(k), y1: oy - 5, x2: PX(k), y2: oy + 5, stroke: 'var(--perron)', 'stroke-width': 1.5,
      }));
      svg.appendChild(T.el('line', {
        x1: ox - 5, y1: PY(k), x2: ox + 5, y2: PY(k), stroke: 'var(--perron)', 'stroke-width': 1.5,
      }));
      merk(labels, {
        tekst: String(k), x: PX(k), y: oy + 26, grootte: 13, kleur: 'var(--tekst-zacht)',
        anker: 'middle', prioriteit: 40,
      });
      merk(labels, {
        tekst: String(k), x: ox - 14, y: PY(k) + 5, grootte: 13, kleur: 'var(--tekst-zacht)',
        anker: 'end', prioriteit: 40,
      });
    }
    merk(labels, {
      tekst: 'plaats (lichtjaar) \u2192', x: ox + R * 0.55, y: oy + 54,
      grootte: 15, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 600, prioriteit: 85,
    });
    merk(labels, {
      tekst: '\u2191 eigen tijd (jaar)', x: ox - 44, y: oy - R * 0.3,
      grootte: 15, kleur: 'var(--eigentijd)', anker: 'end', gewicht: 600, prioriteit: 78,
    }, [[0, 0], [0, 40], [0, 80], [0, 120], [0, -40], [0, -80], [0, -120], [0, -200], [0, -280]]);

    // De cirkel van tien jaar: dezelfde kwartcirkel als in deel 1
    svg.appendChild(T.el('polyline', {
      points: boog(R), fill: 'none', stroke: 'var(--blauw)',
      'stroke-width': 1.6, 'stroke-dasharray': '6 6', opacity: 0.6,
    }));
    // En de cirkel van nu: zo ver is iedereen gekomen
    const straal = r.t * JAAR;
    if (straal > 2) {
      svg.appendChild(T.el('path', {
        d: 'M ' + ox + ' ' + oy + ' L ' + (ox + straal) + ' ' + oy +
           ' A ' + straal + ' ' + straal + ' 0 0 0 ' + ox + ' ' + (oy - straal) + ' Z',
        fill: 'var(--blauw)', opacity: 0.05,
      }));
      svg.appendChild(T.el('polyline', {
        points: boog(straal), fill: 'none', stroke: 'var(--blauw)', 'stroke-width': 3,
      }));
      // De boog in korte koorden als bezet melden, anders loopt een label erdoor
      for (let a = 0; a < Math.PI / 2 - 1e-9; a += Math.PI / 24) {
        const b = a + Math.PI / 24;
        labels.blokkeerSchuin({
          x1: ox + Math.cos(a) * straal, y1: oy - Math.sin(a) * straal,
          x2: ox + Math.cos(b) * straal, y2: oy - Math.sin(b) * straal, dikte: 4,
        });
      }
    }

    // Licht: alles opzij, niets omhoog
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: PX(r.t), y2: oy,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('circle', { cx: PX(r.t), cy: oy, r: 6, fill: 'var(--gebeurtenis)' }));

    // De aarde: recht omhoog
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox, y2: PY(r.t),
      stroke: 'var(--perron)', 'stroke-width': 5, 'stroke-linecap': 'round',
    }));

    // De reiziger: schuin heen, en na het keerpunt schuin terug
    const knik = r.terug ? ' ' + PX(r.xKeer).toFixed(1) + ',' + PY(r.tauKeer).toFixed(1) : '';
    svg.appendChild(T.el('polyline', {
      points: ox + ',' + oy + knik + ' ' + PX(r.x).toFixed(1) + ',' + PY(r.tau).toFixed(1),
      fill: 'none', stroke: 'var(--trein)', 'stroke-width': 5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }));
    labels.blokkeerSchuin({
      x1: ox, y1: oy, x2: PX(r.terug ? r.xKeer : r.x), y2: PY(r.terug ? r.tauKeer : r.tau), dikte: 10,
    });
    if (r.terug) {
      labels.blokkeerSchuin({
        x1: PX(r.xKeer), y1: PY(r.tauKeer), x2: PX(r.x), y2: PY(r.tau), dikte: 10,
      });
    }
    // Bij een reiziger die nauwelijks beweegt valt er niets terug te klappen
    if (r.terug && beta > 0.03) {
      // Het pad teruggeklapt om de lijn door het keerpunt: het loopt rechtdoor
      // en eindigt op de cirkel. Zo zie je dat de knik geen lengte kost.
      svg.appendChild(T.el('line', {
        x1: PX(r.xKeer), y1: oy, x2: PX(r.xKeer), y2: PY(r.tau) - 16,
        stroke: 'var(--licht)', 'stroke-width': 1.4, 'stroke-dasharray': '3 5',
      }));
      svg.appendChild(T.el('line', {
        x1: PX(r.xKeer), y1: PY(r.tauKeer), x2: PX(r.spookX), y2: PY(r.tau),
        stroke: 'var(--trein)', 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: 0.6,
      }));
      svg.appendChild(T.el('line', {
        x1: PX(r.x), y1: PY(r.tau), x2: PX(r.spookX), y2: PY(r.tau),
        stroke: 'var(--trein)', 'stroke-width': 1.2, 'stroke-dasharray': '3 5', opacity: 0.7,
      }));
      svg.appendChild(T.el('circle', {
        cx: PX(r.spookX), cy: PY(r.tau), r: 7, fill: 'var(--kaart)',
        stroke: 'var(--trein)', 'stroke-width': 2.5,
      }));
      labels.blokkeerSchuin({
        x1: PX(r.xKeer), y1: PY(r.tauKeer), x2: PX(r.spookX), y2: PY(r.tau), dikte: 8,
      });
      merk(labels, {
        tekst: 'teruggeklapt', x: PX(r.spookX) + 14, y: PY(r.tau) - 12,
        grootte: 13, kleur: 'var(--trein)', cursief: true, anker: 'start', prioriteit: 50,
      }, [[0, 0], [0, -20], [-200, -24], [-200, -44], [0, 26], [-200, 30], [-190, 0], [-190, 26],
          [0, 46], [-200, 50], [-100, -30], [-100, 36]]);
    }

    // De valkuil: wie op gelijke hoogte afleest, leest geen gelijktijdigheid af
    if (toonValkuil && r.t > 0.05) {
      svg.appendChild(T.el('line', {
        x1: ox, y1: PY(r.tau), x2: PX(r.x), y2: PY(r.tau),
        stroke: 'var(--gebeurtenis)', 'stroke-width': 2, 'stroke-dasharray': '8 5',
      }));
      svg.appendChild(T.el('circle', {
        cx: ox, cy: PY(r.tau), r: 8, fill: 'var(--kaart)',
        stroke: 'var(--gebeurtenis)', 'stroke-width': 2.5,
      }));
      labels.blokkeerLijn({ x1: ox, y1: PY(r.tau), x2: PX(r.x), y2: PY(r.tau), dikte: 8 });
    }

    // De koppen van de twee paden
    svg.appendChild(T.el('circle', {
      cx: ox, cy: PY(r.t), r: 9, fill: 'var(--perron)', stroke: 'var(--kaart)', 'stroke-width': 3,
    }));
    svg.appendChild(T.el('circle', { cx: PX(r.x), cy: PY(r.tau), r: 18, fill: 'var(--trein)', opacity: 0.16 }));
    svg.appendChild(T.el('circle', {
      cx: PX(r.x), cy: PY(r.tau), r: 11, fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 3,
    }));
    labels.blokkeer({ links: ox - 12, boven: PY(r.t) - 12, breedte: 24, hoogte: 24 });
    labels.blokkeer({ links: PX(r.x) - 20, boven: PY(r.tau) - 20, breedte: 40, hoogte: 40 });

    merk(labels, {
      tekst: 'aarde: ' + F.nl(r.t, 2), x: ox + 16, y: PY(r.t) - 16,
      grootte: 15, kleur: 'var(--perron)', gewicht: 650, anker: 'start', prioriteit: 80,
    }, [[0, 0], [0, -20], [30, -20], [0, -40], [60, -20], [60, -40]]);
    // De eenheid staat op de as; zonder 'jaar' past het label vaker. Rechts
    // van de kop als het kan. Op de terugweg ligt daar het eigen pad en
    // vlak erachter de boog; dan gaat het label erboven of linksboven staan.
    const naamReiziger = {
      tekst: 'reiziger: ' + F.nl(r.tau, 2), x: PX(r.x) + 28, y: PY(r.tau) + 5,
      grootte: 15, kleur: 'var(--trein)', gewicht: 650, anker: 'start', prioriteit: 79,
    };
    const bR = schatBreedte(naamReiziger.tekst, naamReiziger.grootte);
    merk(labels, naamReiziger,
      [[0, 0], [0, 24], [0, -24], [0, -18], [0, 46], [0, -46], [40, 24], [40, 46], [40, -46],
       [-bR / 2 - 28, -36], [-bR / 2 - 28, -58], [-bR - 40, -36], [-bR - 40, -58],
       [-bR - 56, 0], [-bR - 56, -24], [-70, -36], [-70, -58], [80, 46], [80, -46],
       [0, 68], [0, -68], [-bR / 2 - 28, -80], [-bR / 2 - 28, 40], [-bR / 2 - 28, 62]]);
    if (r.t > 0.6) {
      // Links van de stip, binnen de boog, zolang daar plaats is; anders rechts
      const licht = {
        tekst: 'licht: klok staat stil', x: PX(r.t) - 16, y: oy - 16,
        grootte: 13.5, kleur: 'var(--gebeurtenis)', gewicht: 600, anker: 'end', prioriteit: 60,
      };
      if (licht.x - schatBreedte(licht.tekst, licht.grootte) < ox + 14) {
        licht.x = PX(r.t) + 16;
        licht.anker = 'start';
      }
      const bL = schatBreedte(licht.tekst, licht.grootte);
      const rechts = licht.anker === 'end' ? bL + 32 : 0;
      merk(labels, licht, [[0, 0], [0, -20], [-60, 0], [-60, -20], [-140, 0], [-140, -20],
                           [rechts, 0], [rechts, -20], [rechts, -40], [30, -20], [60, -40]]);
    }
    // Wat het beeld zegt, op een vaste plek rechtsboven: daar loopt nooit een
    // pad of een boog, dus deze regels vallen niet weg.
    const regels = [['elk pad is nu ' + F.nl(r.t, 2) + ' lang: allemaal op dezelfde cirkel', 'var(--blauw)']];
    if (fractie > 0.999 && r.t - r.tau > 0.3) {
      regels.push(['weer samen op \u00e9\u00e9n plaats en \u00e9\u00e9n moment, en toch twee punten', 'var(--trein)']);
    }
    if (toonValkuil && r.t > 0.05) {
      regels.push(['rode lijn: gelijke hoogte is gelijke klokstand, niet hetzelfde moment', 'var(--gebeurtenis)']);
    }
    regels.forEach(function (regel, i) {
      merk(labels, {
        tekst: regel[0], x: BREEDTE - 24, y: 40 + 24 * i, grootte: 15, kleur: regel[1],
        gewicht: 650, anker: 'end', prioriteit: 90,
      });
    });
    // Thuis: zelfde plaats, zelfde moment, en toch twee punten
    if (fractie > 0.999 && r.t - r.tau > 0.3) {
      const xb = ox - 46;
      svg.appendChild(T.el('path', {
        d: 'M ' + (xb + 8) + ' ' + PY(r.t) + ' L ' + xb + ' ' + PY(r.t) + ' L ' + xb + ' ' + PY(r.tau) +
           ' L ' + (xb + 8) + ' ' + PY(r.tau),
        fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5,
      }));
      labels.blokkeerLijn({ x1: xb, y1: PY(r.t), x2: xb, y2: PY(r.tau), dikte: 10 });
      merk(labels, {
        tekst: 'verschil: ' + F.nl(r.t - r.tau, 2) + ' jaar', x: xb - 12, y: (PY(r.t) + PY(r.tau)) / 2 + 5,
        grootte: 14.5, kleur: 'var(--accent)', gewicht: 650, anker: 'end', prioriteit: 82,
      }, [[0, 0], [0, -24], [0, 24]]);
    }

    svg.appendChild(labels.tekenAlles());

    tijdW.textContent = F.nl(r.t, 2) + ' jaar';
    const kaarten = toonValkuil ? [
      ['Tijd op aarde', F.nl(r.t, 2) + ' jaar', 'var(--perron)'],
      ['Klok van de reiziger', F.nl(r.tau, 2) + ' jaar', 'var(--trein)'],
      ['Aarde op gelijke hoogte', F.nl(r.tau, 2) + ' jaar', 'var(--gebeurtenis)'],
      ['"Nu op aarde" voor de reiziger', F.nl(r.nuAarde, 2) + ' jaar', 'var(--accent)'],
    ] : [
      ['Tijd op aarde', F.nl(r.t, 2) + ' jaar', 'var(--perron)'],
      ['Klok van de reiziger', F.nl(r.tau, 2) + ' jaar', 'var(--trein)'],
      ['Lengte van elk pad', F.nl(r.t, 2), 'var(--blauw)'],
      ['Verschil in leeftijd', F.nl(r.t - r.tau, 2) + ' jaar', 'var(--accent)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const labels = T.maakLabelPlaatser();
    if (deel === 'tweeling') { tekenTweeling(labels); return; }

    const g = beta > 0 ? F.gamma(beta) : 1;
    const vRuimte = beta;
    const vTijd = 1 / g;
    const px = ox + vRuimte * R;
    const py = oy - vTijd * R;

    // Assen
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox + R * 1.12, y2: oy,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox, y2: oy - R * 1.12,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({ x1: ox, y1: oy, x2: ox + R * 1.12, y2: oy, dikte: 16 });
    labels.blokkeerLijn({ x1: ox, y1: oy, x2: ox, y2: oy - R * 1.12, dikte: 16 });

    labels.voegToe({
      tekst: 'snelheid door de ruimte \u2192', x: ox + R * 0.55, y: oy + 34,
      grootte: 15, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 600, prioriteit: 85,
    });
    // Netjes links naast de tijdas; met 'middle' lag het er half overheen
    labels.voegToe({
      tekst: '\u2191 snelheid door de tijd', x: ox - 16, y: oy - R * 0.55,
      grootte: 15, kleur: 'var(--eigentijd)', anker: 'end', gewicht: 600, prioriteit: 85,
      verschuif: [[0, 0], [0, -26], [0, 26], [0, -52], [0, 52]],
    });

    // Kwartcirkel
    const boog = [];
    for (let a = 0; a <= Math.PI / 2 + 1e-9; a += 0.01) {
      boog.push((ox + Math.cos(a) * R).toFixed(2) + ',' + (oy - Math.sin(a) * R).toFixed(2));
    }
    svg.appendChild(T.el('polyline', {
      points: boog.join(' '), fill: 'none',
      stroke: 'var(--blauw)', 'stroke-width': 3,
    }));

    // Vulling onder de boog
    svg.appendChild(T.el('path', {
      d: 'M ' + ox + ' ' + oy + ' L ' + (ox + R) + ' ' + oy +
         ' A ' + R + ' ' + R + ' 0 0 0 ' + ox + ' ' + (oy - R) + ' Z',
      fill: 'var(--blauw)', opacity: 0.05,
    }));

    // Hulpstippellijnen
    svg.appendChild(T.el('line', {
      x1: px, y1: oy, x2: px, y2: py,
      stroke: 'var(--eigentijd)', 'stroke-width': 1.4, 'stroke-dasharray': '5 4',
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: py, x2: px, y2: py,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 1.4, 'stroke-dasharray': '5 4',
    }));

    // De drie zijden van de driehoek
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: px, y2: oy,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox, y2: py,
      stroke: 'var(--eigentijd)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: px, y2: py,
      stroke: 'var(--accent)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));

    // Het sleeppunt
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 18, fill: 'var(--accent)', opacity: 0.16,
    }));
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 11, fill: 'var(--accent)',
      stroke: 'var(--kaart)', 'stroke-width': 3,
    }));
    labels.blokkeer({ links: px - 22, boven: py - 22, breedte: 44, hoogte: 44 });
    // De schuine zijde blokkeren: bij hoge snelheid loopt hij vlak langs de
    // liggende zijde, en dan komt het label 'v = ...' er anders bovenop. De
    // twee rechte zijden liggen op de assen en zijn daar al geblokkeerd.
    labels.blokkeerSchuin({ x1: ox, y1: oy, x2: px, y2: py, dikte: 12 });
    // Ook de twee stippellijnen naar het punt: ze zijn dun, maar tekst die er
    // dwars overheen loopt leest niet.
    labels.blokkeerLijn({ x1: px, y1: oy, x2: px, y2: py, dikte: 8 });
    labels.blokkeerLijn({ x1: ox, y1: py, x2: px, y2: py, dikte: 8 });

    // Labels bij de zijden. Ze staan in de wig tussen hun eigen zijde en de
    // schuine zijde, en die wig wordt breder naarmate je verder van de
    // oorsprong komt. Uitwijken gaat dus die kant op.
    if (vRuimte > 0.04) {
      const liggendUitwijk = [];
      [0, -22, 26].forEach(function (dy) {
        [0, 90, 180, 270].forEach(function (dx) { liggendUitwijk.push([dx, dy]); });
      });
      labels.voegToe({
        tekst: 'v = ' + F.nl(vRuimte, 3) + 'c',
        x: (ox + px) / 2, y: oy - 16,
        grootte: 15, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 650, prioriteit: 78,
        verschuif: liggendUitwijk,
      });
    }
    // Zelfde verhaal staand: omhoog wordt de wig breder, en bij een heel lage
    // snelheid ligt de schuine zijde zo dicht op de staande dat alleen opzij
    // nog ruimte geeft.
    // Bij een snelheid rond 0,2c is de wig nergens breed genoeg; dan wijkt het
    // label naar de andere kant van de tijdas uit, waar het net zo goed bij
    // zijn eigen zijde staat.
    const staandUitwijk = [];
    [0, -50, -100, -150, -200].forEach(function (dy) {
      [0, 46].forEach(function (dx) { staandUitwijk.push([dx, dy]); });
    });
    [0, -60, 60, -120, 120].forEach(function (dy) { staandUitwijk.push([-128, dy]); });
    labels.voegToe({
      tekst: '1/\u03b3 = ' + F.nl(vTijd, 3),
      x: ox + 16, y: (oy + py) / 2,
      grootte: 15, kleur: 'var(--eigentijd)', gewicht: 650, prioriteit: 78,
      verschuif: staandUitwijk,
    });
    // 'altijd c' hoort bij de schuine zijde en wijkt daarom loodrecht op die
    // zijde uit: staat de driehoek bijna rechtop of bijna plat, dan valt het
    // anders samen met een as of met een van de andere twee labels.
    const richting = Math.atan2(oy - py, px - ox);
    const loodX = -Math.sin(richting), loodY = -Math.cos(richting);
    const langsX = Math.cos(richting), langsY = -Math.sin(richting);
    const schuinUitwijk = [];
    [34, 58, 82].forEach(function (af) {
      [1, -1].forEach(function (kant) {
        [0, 70, -70, 150, -150].forEach(function (langs) {
          schuinUitwijk.push([
            loodX * af * kant + langsX * langs,
            loodY * af * kant + langsY * langs,
          ]);
        });
      });
    });
    labels.voegToe({
      tekst: 'altijd c',
      x: (ox + px) / 2, y: (oy + py) / 2,
      grootte: 15, kleur: 'var(--accent)', anker: 'middle', gewicht: 650, prioriteit: 76,
      verschuif: schuinUitwijk,
    });

    // Vaste punten op de boog
    svg.appendChild(T.el('circle', { cx: ox, cy: oy - R, r: 6, fill: 'var(--eigentijd)' }));
    labels.voegToe({
      tekst: 'stilstand: alle snelheid door de tijd',
      x: ox + 16, y: oy - R - 14,
      grootte: 14, kleur: 'var(--eigentijd)', gewicht: 600, prioriteit: 72,
    });
    svg.appendChild(T.el('circle', { cx: ox + R, cy: oy, r: 6, fill: 'var(--gebeurtenis)' }));
    labels.voegToe({
      tekst: 'licht: klok staat stil',
      x: ox + R - 8, y: oy - 22,
      grootte: 14, kleur: 'var(--gebeurtenis)', anker: 'end', gewicht: 600, prioriteit: 72,
      // Bij bijna-lichtsnelheid staan het sleeppunt en de stippellijn hier
      // vlakbij; dan schuift het label naar links weg van de boog.
      verschuif: [[0, 0], [0, -20], [0, -40], [-70, 0], [-70, -20],
                  [-150, 0], [-150, -20], [-230, 0], [-230, -20]],
    });

    svg.appendChild(labels.tekenAlles());

    // Controle: de som moet exact 1 zijn
    const som = vRuimte * vRuimte + vTijd * vTijd;
    const kaarten = [
      ['Door de ruimte', F.nl(vRuimte, 4) + 'c', 'var(--gebeurtenis)'],
      ['Door de tijd', F.nl(vTijd, 4) + 'c', 'var(--eigentijd)'],
      ['Lorentzfactor \u03b3', F.nl(g, 4), 'var(--blauw)'],
      ['v\u00b2 + (1/\u03b3)\u00b2', F.nl(som, 6), 'var(--accent)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
  }

  // Sleep over de boog: de hoek bepaalt de verdeling
  function verplaats(clientX, clientY) {
    const punt = T.naarViewBox(svg, clientX, clientY, BREEDTE, HOOGTE);
    if (!punt) return;
    if (deel === 'tweeling') {
      // In deel 2 volgt de tijd de hoogte van je vinger: de aarde gaat recht
      // omhoog, dus de hoogte is de aardtijd. Bij het keerpunt klikt hij vast.
      stopSpelen();
      let f = (oy - punt.y) / JAAR / (2 * T_HEEN);
      f = Math.max(0, Math.min(1, f));
      if (Math.abs(f - 0.5) < 0.012) f = 0.5;
      zetTijd(f);
      return;
    }
    let hoek = Math.atan2(oy - punt.y, punt.x - ox);
    hoek = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, hoek));
    beta = Math.max(0, Math.min(0.99, Math.cos(hoek)));
    schuif.value = String(beta);
    werkBij();
  }

  function start(e) {
    sleept = true; svg.style.cursor = 'grabbing';
    const p = e.touches ? e.touches[0] : e;
    verplaats(p.clientX, p.clientY);
  }
  function beweeg(e) {
    if (!sleept) return;
    if (e.preventDefault) e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    verplaats(p.clientX, p.clientY);
  }
  function stop() { sleept = false; svg.style.cursor = 'grab'; }

  svg.addEventListener('touchstart', start, { passive: false });
  svg.addEventListener('touchmove', beweeg, { passive: false });
  svg.addEventListener('touchend', stop, { passive: false });
  svg.addEventListener('touchcancel', stop, { passive: false });
  svg.addEventListener('mousedown', start);
  svg.addEventListener('mousemove', beweeg);
  svg.addEventListener('mouseup', stop);
  svg.addEventListener('mouseleave', stop);

  const schuif = paneel.querySelector('#ep-beta');
  const betaW = paneel.querySelector('#ep-beta-w');

  function werkBij() {
    betaW.textContent = F.nl(beta, 3) + 'c';
    teken();
  }

  schuif.addEventListener('input', function () {
    beta = parseFloat(schuif.value);
    werkBij();
  });

  // --- Bediening van deel 2 ---------------------------------------------------
  const reisVak = paneel.querySelector('#ep-reisvak');
  const tijdSchuif = paneel.querySelector('#ep-tijd');
  const tijdW = paneel.querySelector('#ep-tijd-w');
  const speelKnop = paneel.querySelector('#ep-speel');
  const valkuilKnop = paneel.querySelector('#ep-valkuil');
  const deelKnoppen = {
    pijl: paneel.querySelector('#ep-deel-pijl'),
    tweeling: paneel.querySelector('#ep-deel-tweeling'),
  };

  function zetTijd(f) {
    fractie = f;
    tijdSchuif.value = String(f);
    teken();
  }
  function stopSpelen() {
    speelt = false;
    speelKnop.classList.remove('aan');
    speelKnop.textContent = 'Afspelen';
  }
  function kiesDeel(welk) {
    deel = welk;
    if (welk !== 'tweeling') stopSpelen();
    deelKnoppen.pijl.classList.toggle('aan', welk === 'pijl');
    deelKnoppen.tweeling.classList.toggle('aan', welk === 'tweeling');
    reisVak.style.display = welk === 'tweeling' ? '' : 'none';
    knoppenVak.style.display = welk === 'tweeling' ? 'none' : '';
    svg.style.cursor = welk === 'tweeling' ? 'ns-resize' : 'grab';
    teken();
  }
  deelKnoppen.pijl.addEventListener('click', function () { kiesDeel('pijl'); });
  deelKnoppen.tweeling.addEventListener('click', function () { kiesDeel('tweeling'); });

  tijdSchuif.addEventListener('input', function () {
    fractie = parseFloat(tijdSchuif.value);
    teken();
  });
  paneel.querySelector('#ep-begin').addEventListener('click', function () { stopSpelen(); zetTijd(0); });
  paneel.querySelector('#ep-keer').addEventListener('click', function () { stopSpelen(); zetTijd(0.5); });
  paneel.querySelector('#ep-eind').addEventListener('click', function () { stopSpelen(); zetTijd(1); });
  valkuilKnop.addEventListener('click', function () {
    toonValkuil = !toonValkuil;
    valkuilKnop.classList.toggle('aan', toonValkuil);
    teken();
  });

  let vorigeTik = null;
  function stap(nu) {
    if (!speelt) { vorigeTik = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorigeTik = null; return; }
    if (vorigeTik !== null) {
      // De hele reis in ongeveer acht seconden
      fractie = Math.min(1, fractie + Math.min(nu - vorigeTik, 100) / 8000);
      tijdSchuif.value = String(fractie);
      teken();
      if (fractie >= 1) { stopSpelen(); vorigeTik = null; return; }
    }
    vorigeTik = nu;
    requestAnimationFrame(stap);
  }
  speelKnop.addEventListener('click', function () {
    if (speelt) { stopSpelen(); return; }
    speelt = true;
    speelKnop.classList.add('aan');
    speelKnop.textContent = 'Pauze';
    if (fractie >= 0.999) fractie = 0;
    vorigeTik = null;
    requestAnimationFrame(stap);
  });

  werkBij();
}
