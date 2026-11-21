// versnellen.js — een raket die gas blijft geven.
//
// Wie aan boord een constante versnelling voelt, volgt in het diagram een
// hyperbool: steeds dichter naar de lichtlijn, zonder hem te raken. De hoek
// uit "Snelheden optellen" groeit daarbij gelijkmatig met de eigen tijd.
//
// Drie dingen om te zien. De reiziger wint tijd: zijn jaren liggen steeds
// verder uit elkaar. Er is een horizon: berichten van thuis die te laat
// vertrekken halen hem nooit in, en zijn "nu" draait om één vast punt, zodat
// de aardklok voor hem bevriest. En twee raketten die met hetzelfde gas
// vertrekken trekken het touw tussen hen stuk.
//
// Het plaatje is voor elke versnelling hetzelfde; alleen de maten veranderen.
// Getekend wordt daarom in eenheden van 1/a, en de getallen staan in jaren en
// lichtjaren.
import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Versnellen';
export const onderschrift =
  'Een raket die gas blijft geven komt steeds dichter bij de lichtsnelheid en ' +
  'haalt hem nooit. Onderweg krijgt hij een horizon, en breekt er een touw.';

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    aan: { '#vs-seinen': false, '#vs-nu': false, '#vs-touw': false },
    stel: { '#vs-a': 1, '#vs-tijd': 0 },
  },
  stappen: [
    {
      kop: 'Gas erop, en erop houden',
      tekst:
        'Een raket vertrekt en houdt 1 g aan: aan boord voelt het als thuis. Na ' +
        '1 jaar op zijn eigen klok gaat hij 0,77c en is hij 0,56 lichtjaar ver. ' +
        'Op aarde is dan 1,19 jaar verstreken.',
      stel: { '#vs-tijd': 0.469 },
    },
    {
      kop: 'Steeds sneller, nooit c',
      tekst:
        'Na 2 jaar aan boord: 0,97c, en bijna 3 lichtjaar ver. De lijn buigt ' +
        'naar de lichtlijn en raakt hem niet. Elk jaar aan boord telt dezelfde ' +
        'hoek op, zoals de trappen bij het optellen van snelheden.',
      stel: { '#vs-tijd': 0.938 },
    },
    {
      kop: 'De reiziger wint tijd',
      tekst:
        'Na ruim 2 jaar aan boord is hij 3,5 lichtjaar ver, en is er op aarde ' +
        '4,3 jaar voorbij. De stippen zijn zijn eigen halve jaren: ze liggen ' +
        'steeds verder uit elkaar. Hou je dit 10 jaar vol, dan ben je bijna ' +
        '15 000 lichtjaar ver.',
      stel: { '#vs-tijd': 1 },
    },
    {
      kop: 'Berichten van thuis',
      tekst:
        'De aarde seint om de paar maanden. De eerste berichten halen de raket ' +
        'in, steeds later. Wat na 0,97 jaar vertrekt haalt hem nooit meer in en ' +
        'loopt eeuwig achter hem aan. Die grens is zijn horizon.',
      aan: { '#vs-seinen': true },
      stel: { '#vs-tijd': 1 },
    },
    {
      kop: 'De aarde bevriest',
      tekst:
        'De blauwe lijn is wat de raket "nu" noemt. Hij draait om \u00e9\u00e9n vast punt, ' +
        'en schuift op de lijn van de aarde steeds minder op. Volgens de raket ' +
        'komt de aardklok nooit voorbij 0,97 jaar.',
      aan: { '#vs-nu': true },
      stel: { '#vs-tijd': 0.938 },
    },
    {
      kop: 'Twee raketten en een touw',
      tekst:
        'Twee raketten vertrekken tegelijk met hetzelfde gas, met een touw ' +
        'ertussen. Voor de aarde blijft hun afstand gelijk. Voor de raketten ' +
        'zelf groeit hij: na 1 jaar al 1,9 keer. Het touw breekt. Een star ' +
        'lichaam kan zo niet versnellen.',
      aan: { '#vs-touw': true },
      stel: { '#vs-tijd': 0.469 },
    },
  ],
};

const BREEDTE = 960;
const HOOGTE = 940;
const VLAK = { links: 84, rechts: 920, boven: 132, onder: 856 };
// Het venster in eenheden van 1/a, en hoe ver de hoek a*tau mag oplopen
// (verder dan dit kruipt alles tegen de lichtlijn aan en is er niets meer te zien)
const X0 = -1.3, X1 = 4.9;
const HOEK_MAX = 2.2;
const TUSSEN = 0.5;        // afstand tussen de twee raketten, in eenheden van 1/a

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
  let aG = 1;             // versnelling aan boord, in g
  let fractie = 0;        // hoe ver de reis is: hoek = fractie * HOEK_MAX
  let toonSeinen = true;
  let toonNu = true;
  let toonTouw = false;
  let speelt = false;

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Waarom een kromme lijn?</summary>' +
    '<p>Een raket die gas geeft voelt aan boord steeds dezelfde duw. Elk ' +
    'ogenblik komt er dus dezelfde <b>hoek</b> bij, de hoek uit de module over ' +
    'het optellen van snelheden, en niet dezelfde snelheid. De wereldlijn wordt ' +
    'daardoor een hyperbool die naar de lichtlijn toe buigt en hem nooit raakt.</p>' +
    '<p style="margin-top:7px">Die hyperbool heeft een middelpunt, een eind ' +
    'achter het vertrekpunt. Daar draait het "nu" van de raket omheen, en de ' +
    'schuine lijn erdoor is zijn <b>horizon</b>: wat daarachter gebeurt bereikt ' +
    'hem niet, zolang hij gas blijft geven. Meer gas verandert het plaatje ' +
    'niet, alleen de maten: alles schuift dichter naar het vertrekpunt.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Ruimtetijd-diagram van een raket met constante versnelling',
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
    '    <label for="vs-a">Versnelling aan boord: <b id="vs-a-w"></b></label>' +
    '    <input type="range" id="vs-a" min="0.2" max="2" step="0.1" value="1" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="vs-tijd">Eigen tijd aan boord: <b id="vs-tijd-w"></b></label>' +
    '    <input type="range" id="vs-tijd" min="0" max="1" step="0.001" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="vs-speel">Afspelen</button>' +
    '    <button class="knop" id="vs-begin">Begin</button>' +
    '  </div>' +
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein aan" id="vs-seinen">Berichten</button>' +
    '    <button class="knop klein aan" id="vs-nu">Nu van de raket</button>' +
    '    <button class="knop klein" id="vs-touw">Twee raketten</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const vragenPaneel = document.createElement('div');
  vragenPaneel.className = 'paneel';
  vragenPaneel.innerHTML = '<h3>Vragen bij het versnellen</h3><div class="formules" id="vs-vragen"></div>';
  zijkolom.appendChild(vragenPaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'In eigen woorden. De twee raketten met het touw zijn een denkproef die ' +
    'bekend is geworden door John Bell. De hoek die gelijkmatig groeit is ' +
    'dezelfde als in de module over het optellen van snelheden.';
  zijkolom.appendChild(bron);

  const aSchuif = paneel.querySelector('#vs-a');
  const aW = paneel.querySelector('#vs-a-w');
  const tijdSchuif = paneel.querySelector('#vs-tijd');
  const tijdW = paneel.querySelector('#vs-tijd-w');
  const speelKnop = paneel.querySelector('#vs-speel');
  const seinKnop = paneel.querySelector('#vs-seinen');
  const nuKnop = paneel.querySelector('#vs-nu');
  const touwKnop = paneel.querySelector('#vs-touw');
  const vragenVak = vragenPaneel.querySelector('#vs-vragen');
  const open = new Set();

  // Schaal: gelijke maat voor plaats en tijd, zodat licht onder 45° loopt
  const s = Math.min((VLAK.rechts - VLAK.links) / (X1 - X0), (VLAK.onder - VLAK.boven) / 5.4);
  const T1 = (VLAK.onder - VLAK.boven) / s;
  const X = function (x) { return VLAK.links + (x - X0) * s; };
  const Y = function (t) { return VLAK.onder - t * s; };

  /** Alles wat uit de stand volgt. Lengtes en tijden in jaren en lichtjaren,
   *  behalve wat met een kleine letter e begint: dat is in eenheden van 1/a. */
  function opzet() {
    const a = aG * F.G_LJ_PER_JAAR2;
    const hoek = fractie * HOEK_MAX;
    const tau = hoek / a;
    const r = F.hyperbolischeBeweging(a, tau);
    // Het nu van de achterste raket snijdt de lijn van de voorste op deze hoek
    const hoekVoor = hoek + Math.asinh(TUSSEN * Math.sinh(hoek));
    const dX = TUSSEN + Math.cosh(hoekVoor) - Math.cosh(hoek);
    const dT = Math.sinh(hoekVoor) - Math.sinh(hoek);
    return {
      a: a, hoek: hoek, tau: tau, t: r.t, x: r.x, beta: r.beta, gamma: r.gamma,
      horizon: 1 / a,                       // lichtjaar achter het vertrekpunt, en jaren aardtijd
      aardeNu: r.beta / a,                  // wat de raket "nu op aarde" noemt
      hoekVoor: hoekVoor,
      rek: Math.sqrt(Math.max(0, dX * dX - dT * dT)) / TUSSEN,
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
    const eT = Math.sinh(o.hoek), eX = Math.cosh(o.hoek) - 1;     // de raket, in eenheden van 1/a

    const knip = T.el('clipPath', { id: 'vs-vlak' });
    knip.appendChild(T.el('rect', {
      x: VLAK.links, y: VLAK.boven, width: VLAK.rechts - VLAK.links, height: VLAK.onder - VLAK.boven,
    }));
    svg.appendChild(knip);
    const laag = T.el('g', { 'clip-path': 'url(#vs-vlak)' });
    svg.appendChild(laag);
    const lijn = function (x1, t1, x2, t2, kleur, dikte, streep, dekking) {
      laag.appendChild(T.el('line', {
        x1: X(x1), y1: Y(t1), x2: X(x2), y2: Y(t2), stroke: kleur, 'stroke-width': dikte,
        'stroke-dasharray': streep || null, opacity: dekking || null, 'stroke-linecap': 'round',
      }));
    };
    const kromme = function (verschuiving, tot, kleur, dikte, streep, dekking) {
      const p = [];
      for (let i = 0; i <= 80; i++) {
        const h = tot * i / 80;
        p.push(X(verschuiving + Math.cosh(h) - 1).toFixed(1) + ',' + Y(Math.sinh(h)).toFixed(1));
      }
      laag.appendChild(T.el('polyline', {
        points: p.join(' '), fill: 'none', stroke: kleur, 'stroke-width': dikte,
        'stroke-dasharray': streep || null, opacity: dekking || null, 'stroke-linecap': 'round',
      }));
    };

    // Assen, met maatstreepjes in jaren en lichtjaren
    svg.appendChild(T.el('line', {
      x1: VLAK.links, y1: Y(0), x2: VLAK.rechts, y2: Y(0), stroke: 'var(--perron)', 'stroke-width': 1.5,
    }));
    labels.blokkeerLijn({ x1: VLAK.links, y1: Y(0), x2: VLAK.rechts, y2: Y(0), dikte: 8 });
    const stap = F.netteStap((X1 / o.a) / 6);
    for (let v = stap; v * o.a <= X1 + 1e-9; v += stap) {
      svg.appendChild(T.el('line', {
        x1: X(v * o.a), y1: Y(0), x2: X(v * o.a), y2: Y(0) + 6, stroke: 'var(--perron)', 'stroke-width': 1.2,
      }));
      merk(labels, {
        tekst: F.nl(v, stap < 1 ? 1 : 0), x: X(v * o.a), y: Y(0) + 22, grootte: 12.5,
        kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 20,
      });
    }
    for (let v = stap; v * o.a <= T1 + 1e-9; v += stap) {
      svg.appendChild(T.el('line', {
        x1: X(0) - 6, y1: Y(v * o.a), x2: X(0), y2: Y(v * o.a), stroke: 'var(--perron)', 'stroke-width': 1.2,
      }));
      merk(labels, {
        tekst: F.nl(v, stap < 1 ? 1 : 0), x: X(0) - 10, y: Y(v * o.a) + 4, grootte: 12.5,
        kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 20,
      });
    }
    merk(labels, {
      tekst: 'plaats (lichtjaar) \u2192', x: VLAK.rechts, y: Y(0) + 44, grootte: 14, kleur: 'var(--tekst-zacht)',
      gewicht: 600, anker: 'end', prioriteit: 60,
    });

    // De horizon: de lichtlijn door het middelpunt van de hyperbool
    lijn(-1, 0, T1 - 1, T1, 'var(--accent)', 2, '8 6');
    labels.blokkeerSchuin({ x1: X(-1), y1: Y(0), x2: X(T1 - 1), y2: Y(T1), dikte: 6 });
    laag.appendChild(T.el('circle', {
      cx: X(-1), cy: Y(0), r: 6, fill: 'var(--kaart)', stroke: 'var(--accent)', 'stroke-width': 2.5,
    }));
    // Licht vanaf het vertrek, ter vergelijking
    lijn(0, 0, T1, T1, 'var(--licht)', 1.4, '5 5');

    // Berichten van thuis: wat voor de horizon vertrekt komt aan, de rest niet
    if (toonSeinen) {
      for (let k = 1; k <= 8; k++) {
        const tk = 0.2 * k;                 // vertrektijd, in eenheden van 1/a
        if (tk < 1 - 1e-9) {
          const h = -Math.log(1 - tk);      // de hoek waarop het de raket inhaalt
          lijn(0, tk, Math.cosh(h) - 1, Math.sinh(h), 'var(--eigentijd)', 1.6);
          laag.appendChild(T.el('circle', {
            cx: X(Math.cosh(h) - 1), cy: Y(Math.sinh(h)), r: 3.6, fill: 'var(--eigentijd)',
          }));
        } else {
          lijn(0, tk, T1 - tk, T1, 'var(--gebeurtenis)', 1.6, null, 0.8);
        }
        laag.appendChild(T.el('circle', { cx: X(0), cy: Y(tk), r: 3.4, fill: tk < 1 - 1e-9 ? 'var(--eigentijd)' : 'var(--gebeurtenis)' }));
      }
    }

    // De aarde: recht omhoog
    lijn(0, 0, 0, T1, 'var(--perron)', 3);
    labels.blokkeerLijn({ x1: X(0), y1: Y(0), x2: X(0), y2: VLAK.boven, dikte: 8 });

    // De raket: gestippeld wat nog komt, vol wat geweest is, met een stip per half jaar eigen tijd
    kromme(0, HOEK_MAX, 'var(--trein)', 2, '4 6', 0.5);
    kromme(0, o.hoek, 'var(--trein)', 4.5);
    const tikStap = F.netteStap((HOEK_MAX / o.a) / 6);
    for (let jaar = tikStap; jaar * o.a <= HOEK_MAX + 1e-9; jaar += tikStap) {
      const h = jaar * o.a;
      const geweest = h <= o.hoek + 1e-9;
      laag.appendChild(T.el('circle', {
        cx: X(Math.cosh(h) - 1), cy: Y(Math.sinh(h)), r: 5, fill: geweest ? 'var(--trein)' : 'var(--kaart)',
        stroke: 'var(--trein)', 'stroke-width': 2,
      }));
      if (Math.sinh(h) < T1 - 0.2) {
        merk(labels, {
          tekst: F.nl(jaar, tikStap < 1 ? 1 : 0) + ' jr', x: X(Math.cosh(h) - 1) + 12, y: Y(Math.sinh(h)) + 16,
          grootte: 12.5, kleur: 'var(--trein)', anker: 'start', prioriteit: 30,
        });
      }
    }

    // Het nu van de raket: draait om het middelpunt
    if (toonNu && o.hoek > 0.02) {
      const tot = Math.min(X1, (T1 / o.beta) - 1);
      lijn(-1, 0, tot, o.beta * (tot + 1), 'var(--blauw)', 1.8, '7 5');
      laag.appendChild(T.el('circle', {
        cx: X(0), cy: Y(o.beta), r: 6, fill: 'var(--kaart)', stroke: 'var(--blauw)', 'stroke-width': 2.5,
      }));
    }

    // Twee raketten: de voorste begint een eind verder, met hetzelfde gas
    if (toonTouw) {
      kromme(TUSSEN, HOEK_MAX, 'var(--accent)', 2, '4 6', 0.5);
      kromme(TUSSEN, o.hoek, 'var(--accent)', 4);
      // Voor de aarde: op hetzelfde moment, dezelfde afstand als bij vertrek
      lijn(eX, eT, eX + TUSSEN, eT, 'var(--perron)', 2.5);
      laag.appendChild(T.el('circle', {
        cx: X(eX + TUSSEN), cy: Y(eT), r: 7, fill: 'var(--accent)', stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      // Voor de raket: langs zijn eigen nu, tot waar dat de voorste lijn snijdt
      const vX = TUSSEN + Math.cosh(o.hoekVoor) - 1, vT = Math.sinh(o.hoekVoor);
      lijn(eX, eT, vX, vT, 'var(--gebeurtenis)', 3.5);
      laag.appendChild(T.el('circle', {
        cx: X(vX), cy: Y(vT), r: 6, fill: 'var(--kaart)', stroke: 'var(--gebeurtenis)', 'stroke-width': 2.5,
      }));
    }

    // De raket zelf
    svg.appendChild(T.el('circle', { cx: X(eX), cy: Y(eT), r: 17, fill: 'var(--trein)', opacity: 0.16 }));
    svg.appendChild(T.el('circle', {
      cx: X(eX), cy: Y(eT), r: 9, fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    labels.blokkeer({ links: X(eX) - 14, boven: Y(eT) - 14, breedte: 28, hoogte: 28 });

    // Vaste regels boven het diagram
    merk(labels, {
      tekst: 'Een raket met ' + F.nl(aG, 1) + ' g, gezien vanaf de aarde', x: 30, y: 44, grootte: 15,
      kleur: 'var(--tekst)', gewicht: 700, anker: 'start', prioriteit: 97,
    });
    merk(labels, {
      tekst: 'aan boord ' + F.nl(o.tau, 2) + ' jaar \u00b7 op aarde ' + F.nl(o.t, 2) + ' jaar \u00b7 ' +
             F.nl(o.x, 2) + ' lichtjaar ver \u00b7 ' + F.nl(o.beta, o.beta > 0.995 ? 4 : 2) + 'c',
      x: 30, y: 68, grootte: 14.5, kleur: 'var(--trein)', gewicht: 650, anker: 'start', prioriteit: 96,
    });
    const derde = toonTouw
      ? ['rood: het touw volgens de raketten, ' + F.nl(o.rek, 2) + ' keer zo lang als bij vertrek', 'var(--gebeurtenis)']
      : toonNu && o.hoek > 0.02
        ? ['blauw: volgens de raket is het op aarde nu ' + F.nl(o.aardeNu, 2) + ' jaar, en nooit later dan ' + F.nl(o.horizon, 2), 'var(--blauw)']
        : ['paars: de horizon. Wat na ' + F.nl(o.horizon, 2) + ' jaar van de aarde vertrekt, komt nooit aan', 'var(--accent)'];
    merk(labels, {
      tekst: derde[0], x: 30, y: 92, grootte: 14, kleur: derde[1], gewicht: 650, anker: 'start', prioriteit: 96,
    });
    if (toonSeinen) {
      merk(labels, {
        tekst: 'groen: bericht komt aan \u00b7 rood: nooit', x: BREEDTE - 30, y: 116, grootte: 13.5,
        kleur: 'var(--eigentijd)', gewicht: 650, anker: 'end', prioriteit: 95,
      });
    }

    // Namen in het diagram
    merk(labels, {
      tekst: 'aarde', x: X(0) - 10, y: VLAK.boven + 18, grootte: 14, kleur: 'var(--perron)', gewicht: 650,
      anker: 'end', prioriteit: 70,
    });
    merk(labels, {
      tekst: 'horizon', x: X(T1 * 0.82 - 1) - 12, y: Y(T1 * 0.82) - 6, grootte: 13.5, kleur: 'var(--accent)',
      gewicht: 650, cursief: true, anker: 'end', prioriteit: 50,
    }, [[0, 0], [0, -20], [-30, 0], [30, 40], [60, 80]]);
    merk(labels, {
      tekst: 'vast punt', x: X(-1), y: Y(0) + 24, grootte: 12.5, kleur: 'var(--accent)', cursief: true,
      anker: 'middle', prioriteit: 40,
    });
    merk(labels, {
      tekst: 'lichtlijn', x: X(T1 * 0.9) + 10, y: Y(T1 * 0.9) + 22, grootte: 12.5, kleur: 'var(--licht)',
      cursief: true, anker: 'start', prioriteit: 30,
    }, [[0, 0], [-20, 30], [-60, 60], [-100, 100]]);
    if (toonTouw) {
      // Met twee raketten staat de naam links van de achterste, uit de weg van het touw
      merk(labels, {
        tekst: 'achterste', x: X(eX) - 20, y: Y(eT) + 6, grootte: 14.5, kleur: 'var(--trein)',
        gewicht: 650, anker: 'end', prioriteit: 80,
      }, [[0, 0], [0, -22], [0, 22], [-20, -34]]);
      merk(labels, {
        tekst: 'voorste', x: X(eX + TUSSEN) + 16, y: Y(eT) + 20, grootte: 14.5, kleur: 'var(--accent)',
        gewicht: 650, anker: 'start', prioriteit: 78,
      }, [[0, 0], [0, 22], [20, 34], [0, -22]]);
    } else {
      merk(labels, {
        tekst: 'raket', x: X(eX) + 20, y: Y(eT) + 6, grootte: 14.5, kleur: 'var(--trein)',
        gewicht: 650, anker: 'start', prioriteit: 80,
      }, [[0, 0], [0, 22], [0, -22], [20, 34], [-80, -26], [-80, 0], [40, 50]]);
    }

    svg.appendChild(labels.tekenAlles());

    aW.textContent = F.nl(aG, 1) + ' g';
    tijdW.textContent = F.nl(o.tau, 2) + ' jaar';
    const kaarten = [
      ['Aan boord', F.nl(o.tau, 2) + ' jaar', 'var(--trein)'],
      ['Op aarde', F.nl(o.t, 2) + ' jaar', 'var(--perron)'],
      ['Afstand', F.nl(o.x, 2) + ' lj', 'var(--tekst)'],
      ['Snelheid', F.nl(o.beta, o.beta > 0.995 ? 4 : 3) + 'c', 'var(--trein)'],
      ['"Nu op aarde" voor de raket', F.nl(o.aardeNu, 3) + ' jaar', 'var(--blauw)'],
      ['Horizon, achter het vertrek', F.nl(o.horizon, 2) + ' lj', 'var(--accent)'],
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
        naam: 'Waarom haalt hij c nooit?',
        formule: 'hoek = a \u00b7 \u03c4 \u00a0\u00a0 snelheid = tanh(hoek)',
        som: F.nl(o.a, 3) + ' \u00b7 ' + F.nl(o.tau, 2) + ' = ' + F.nl(o.hoek, 3) + ' \u2192 ' + F.nl(o.beta, 4) + 'c',
        waarom:
          'Aan boord voelt elke seconde gas hetzelfde, dus elke seconde komt er dezelfde hoek ' +
          'bij: de hoek die bij het optellen van snelheden gewoon optelt. Die hoek kan zo groot ' +
          'worden als je wilt. Maar de snelheid die erbij hoort kruipt naar 1 toe en komt er ' +
          'nooit. In het diagram zie je dat als een lijn die naar de lichtlijn buigt.',
      },
      {
        naam: 'Wat is die horizon?',
        formule: 'afstand tot het vaste punt: 1/a',
        som: '1 / ' + F.nl(o.a, 3) + ' = ' + F.nl(o.horizon, 2) + ' lichtjaar, en evenveel jaren',
        waarom:
          'De paarse lijn is licht dat precies op de grens zit: het komt steeds dichter bij de ' +
          'raket en haalt hem nooit in. Alles wat boven die lijn vertrekt blijft voor altijd ' +
          'achter. De raket kan dus een deel van de wereld niet meer zien, niet omdat het ver ' +
          'weg is maar omdat hij blijft versnellen. Stopt hij met gas geven, dan is de horizon ' +
          'weg en haalt al het licht hem alsnog in.',
      },
      {
        naam: 'Waarom breekt het touw?',
        formule: 'voor de aarde blijft de afstand gelijk',
        som: 'voor de raketten: ' + F.nl(o.rek, 2) + ' keer de afstand bij vertrek',
        waarom:
          'Beide raketten doen precies hetzelfde, dus voor de aarde blijven ze even ver uit ' +
          'elkaar. Maar een touw dat met die snelheid beweegt is voor de aarde gekrompen. Om ' +
          'toch die hele afstand te overbruggen moet het uitrekken. Voor de raketten zelf is ' +
          'het nog eenvoudiger: langs hun eigen "nu" gemeten loopt de voorste steeds verder ' +
          'vooruit. Wil je een lang schip heel houden, dan moet de voorkant minder gas geven ' +
          'dan de achterkant.',
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
    tijdSchuif.value = String(fractie);
    teken();
  }
  aSchuif.addEventListener('input', function () { aG = parseFloat(aSchuif.value); teken(); });
  tijdSchuif.addEventListener('input', function () { fractie = parseFloat(tijdSchuif.value); teken(); });
  paneel.querySelector('#vs-begin').addEventListener('click', function () { stopSpelen(); zetTijd(0); });
  seinKnop.addEventListener('click', function () {
    toonSeinen = !toonSeinen; seinKnop.classList.toggle('aan', toonSeinen); teken();
  });
  nuKnop.addEventListener('click', function () {
    toonNu = !toonNu; nuKnop.classList.toggle('aan', toonNu); teken();
  });
  touwKnop.addEventListener('click', function () {
    toonTouw = !toonTouw; touwKnop.classList.toggle('aan', toonTouw); teken();
  });

  // Slepen: de raket volgt de hoogte van je vinger, dus de tijd op aarde
  T.koppelSleep(svg, BREEDTE, HOOGTE, {
    opStart: function () { stopSpelen(); return 'raket'; },
    opSleep: function (punt) {
      const t = Math.max(0, (VLAK.onder - punt.y) / s);
      zetTijd(Math.asinh(t) / HOEK_MAX);
    },
  });

  let vorigeTik = null;
  function stap(nu) {
    if (!speelt) { vorigeTik = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorigeTik = null; return; }
    if (vorigeTik !== null) {
      fractie = Math.min(1, fractie + Math.min(nu - vorigeTik, 100) / 9000);
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
    speelKnop.textContent = 'Pauze';
    speelKnop.classList.add('aan');
    if (fractie >= 0.999) fractie = 0;
    vorigeTik = null;
    requestAnimationFrame(stap);
  });

  teken();
}
