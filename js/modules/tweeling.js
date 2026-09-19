// tweeling.js — de tweelingparadox, met de gelijktijdigheidslijn van de
// reiziger als hoofdrolspeler: bij de omkeer slaat die lijn door, en daarmee
// springt er op aarde een stuk tijd voorbij dat de reiziger nooit meemaakt.
//
// Daarnaast de tweede helft van het verhaal: de lichtsignalen zelf. Wat de
// reiziger berékent springt bij de omkeer, maar wat hij zíet verandert
// geleidelijk — op de heenweg komen de aardtikken uitgerekt binnen, op de
// terugweg samengeperst. Tel die twee stukken op en er komt precies dezelfde
// eindstand uit, zonder ergens een sprong. De sprong is een boekhoudkeuze,
// geen gebeurtenis die iemand meemaakt.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Tweelingparadox';
export const onderschrift =
  'Waar de tijd blijft die de reiziger overslaat \u2014 te zien aan de lijn die bij de omkeer doorslaat.';

const BREEDTE = 960;
const HOOGTE = 940;
const MARGE = { boven: 38, onder: 50, links: 66, rechts: 70 };

/** Dezelfde breedteschatting als de labelplaatser in teken.js. */
function schatBreedte(tekst, grootte) {
  const hoofdletters = (tekst.match(/[A-Z\u00c0-\u00de]/g) || []).length;
  return (tekst.length + hoofdletters * 0.22) * grootte * 0.58;
}

/** Houdt alleen de uitwijkplekken over die helemaal binnen de viewBox vallen. */
function ladder(spec, plekken) {
  const uit = plekken.filter(function (p) {
    const b = schatBreedte(spec.tekst, spec.grootte);
    let links = spec.x + p[0];
    if (spec.anker === 'middle') links -= b / 2;
    else if (spec.anker === 'end') links -= b;
    const y = spec.y + p[1];
    return links >= 3 && links + b <= BREEDTE - 3 &&
           y - spec.grootte * 0.8 >= 3 && y + spec.grootte * 0.25 <= HOOGTE - 3;
  });
  if (uit.length) return uit;
  const b = schatBreedte(spec.tekst, spec.grootte);
  let links = spec.x;
  if (spec.anker === 'middle') links -= b / 2;
  else if (spec.anker === 'end') links -= b;
  let dx = 0;
  if (links < 3) dx = 3 - links;
  else if (links + b > BREEDTE - 3) dx = BREEDTE - 3 - b - links;
  return [[dx, 0]];
}

export function render(doel) {
  let beta = 0.8;
  let T_keer = 5;          // aardjaren tot het keerpunt
  let fractie = 0;         // waar in de reis, in aardtijd (0..1 van 2T)
  let speelt = false;
  let wachtTot = 0;        // even stilstaan op het keerpunt tijdens afspelen
  let toonAarde = true;    // lichtsignalen van de aarde naar het schip
  let toonSchip = false;   // lichtsignalen van het schip naar de aarde

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>De tijd die niemand meemaakt</summary>' +
    '<p>De rode lijn is het <b>nu</b> van de reiziger: alles wat voor h\u00e9m op dit ' +
    'moment gebeurt. Onderweg loopt die lijn schuin, en de aardklok blijft ' +
    'achter. Bij de omkeer wisselt de reiziger van kader en <b>slaat de lijn ' +
    'door</b> \u2014 in \u00e9\u00e9n klap schuift het paarse stuk aardtijd voorbij, zonder dat ' +
    'de reiziger er ook maar \u00e9\u00e9n tik van meemaakt. Precies dat stuk maakt het ' +
    'verschil bij thuiskomst.</p>' +
    '<p style="margin-top:7px">Zet <b>Aarde seint</b> aan en het andere verhaal ' +
    'komt erbij: de lichtsignalen zelf. Die springen nergens. Op de heenweg komen ' +
    'ze uitgerekt binnen, op de terugweg samengeperst, en samen leveren ze precies ' +
    'de volle aardtijd op.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Minkowski-diagram van de tweelingparadox met de meebewegende gelijktijdigheidslijn',
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
    '<h3>De reis</h3>' +
    '<div class="regelaar">' +
    '  <label for="tw-beta">Snelheid: <b id="tw-beta-waarde"></b></label>' +
    '  <input type="range" id="tw-beta" min="0.2" max="0.95" step="0.01" value="0.8" />' +
    '</div>' +
    '<div class="regelaar">' +
    '  <label for="tw-duur">Keerpunt na: <b id="tw-duur-waarde"></b></label>' +
    '  <input type="range" id="tw-duur" min="2" max="8" step="0.5" value="5" />' +
    '</div>' +
    '<div class="regelaar">' +
    '  <label for="tw-tijd">Onderweg: <b id="tw-tijd-waarde"></b></label>' +
    '  <input type="range" id="tw-tijd" min="0" max="1" step="0.002" value="0" />' +
    '</div>' +
    '<div class="knoppen">' +
    '  <button class="knop" id="tw-speel">Afspelen</button>' +
    '  <button class="knop klein" id="tw-begin">Begin</button>' +
    '  <button class="knop klein" id="tw-keer">Keerpunt</button>' +
    '  <button class="knop klein" id="tw-eind">Thuis</button>' +
    '</div>' +
    '<div class="knoppen" style="margin-top:8px">' +
    '  <button class="knop klein aan" id="tw-sein-aarde">Aarde seint</button>' +
    '  <button class="knop klein" id="tw-sein-schip">Schip seint</button>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const klokPaneel = document.createElement('div');
  klokPaneel.className = 'paneel';
  klokPaneel.innerHTML = '<h3>De twee klokken</h3><div id="tw-klokken"></div>';
  zijkolom.appendChild(klokPaneel);

  const zienPaneel = document.createElement('div');
  zienPaneel.className = 'paneel';
  zienPaneel.innerHTML = '<h3>Wat je werkelijk ziet</h3><div id="tw-zien"></div>';
  zijkolom.appendChild(zienPaneel);

  const vragenPaneel = document.createElement('div');
  vragenPaneel.className = 'paneel';
  vragenPaneel.innerHTML =
    '<h3>Vragen bij het diagram</h3><div class="formules" id="tw-vragen"></div>';
  zijkolom.appendChild(vragenPaneel);
  const vragenVak = vragenPaneel.querySelector('#tw-vragen');
  const openVragen = new Set();

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De omkeer als wisseling van kader volgt Takeuchi, "An Illustrated Guide to ' +
    'Relativity", hoofdstuk 7; het idee dat alleen de reiziger van kader wisselt ' +
    'staat bij Einstein, "Relativity", hoofdstuk 18. Het onderscheid tussen wat je ' +
    'berekent en wat je daadwerkelijk ziet komt van Epstein, "Relativity ' +
    'Visualized", het hoofdstuk over de dopplerverschuiving \u2014 alles in eigen ' +
    'woorden weergegeven.';
  zijkolom.appendChild(bron);

  const betaSchuif = paneel.querySelector('#tw-beta');
  const betaWaarde = paneel.querySelector('#tw-beta-waarde');
  const duurSchuif = paneel.querySelector('#tw-duur');
  const duurWaarde = paneel.querySelector('#tw-duur-waarde');
  const tijdSchuif = paneel.querySelector('#tw-tijd');
  const tijdWaarde = paneel.querySelector('#tw-tijd-waarde');
  const speelKnop = paneel.querySelector('#tw-speel');
  const beginKnop = paneel.querySelector('#tw-begin');
  const keerKnop = paneel.querySelector('#tw-keer');
  const eindKnop = paneel.querySelector('#tw-eind');
  const klokVak = klokPaneel.querySelector('#tw-klokken');
  const zienVak = zienPaneel.querySelector('#tw-zien');
  const seinAardeKnop = paneel.querySelector('#tw-sein-aarde');
  const seinSchipKnop = paneel.querySelector('#tw-sein-schip');

  function merk(labels, tekst, x, y, kleur, opties) {
    const o = opties || {};
    const spec = {
      tekst: tekst, x: x, y: y, grootte: o.grootte || 14.5, kleur: kleur,
      gewicht: o.gewicht || 600, prioriteit: o.prioriteit || 60,
      anker: o.anker || 'start', cursief: !!o.cursief,
    };
    spec.verschuif = ladder(spec, o.plekken ||
      [[0, 0], [0, 20], [0, -20], [0, 40], [0, -40], [0, 60], [0, -60]]);
    labels.voegToe(spec);
  }

  /** Alles wat de reis beschrijft, uit beta en de duur tot het keerpunt. */
  function opzet() {
    const g = F.gamma(beta);
    const tTotaal = 2 * T_keer;
    const t = fractie * tTotaal;
    const heen = t <= T_keer;
    const opKeerpunt = Math.abs(t - T_keer) < 1e-9;
    // De reiziger is op x = beta*t op de heenreis en op beta*(2T - t) terug
    const x = heen ? beta * t : beta * (tTotaal - t);
    // Eigen tijd: beide etappes gaan even snel, dus gewoon t/gamma
    const tau = t / g;
    // Welke aardgebeurtenis noemt de reiziger 'nu'? Die met dezelfde t' in zijn
    // eigen kader. Voor een klok op x = 0 geldt t' = gamma * t_aarde.
    const bNu = heen ? beta : -beta;
    const tAarde = F.lorentz(t, x, bNu).t / g;
    // Vlak voor en vlak na de omkeer: daartussen zit de sprong
    const voorSprong = F.lorentz(T_keer, beta * T_keer, beta).t / g;
    const naSprong = F.lorentz(T_keer, beta * T_keer, -beta).t / g;

    // --- Wat er werkelijk te zien is -------------------------------------
    // Het signaal dat de reiziger nu binnenkrijgt vertrok van de aarde op
    // tAarde - x: het legde precies zijn eigen afstand x af. Uitwerken geeft
    // t(1-beta) op de heenweg en t(1+beta) - 2*beta*T op de terugweg.
    const zietAarde = heen ? t * (1 - beta) : t * (1 + beta) - 2 * beta * T_keer;
    // Andersom: welk moment van het schip ziet de aarde nu? De aarde ziet de
    // omkeer pas op t = T(1+beta), want dat licht moet nog helemaal terug.
    const tOmkeerGezien = T_keer * (1 + beta);
    const tVertrek = t <= tOmkeerGezien
      ? t / (1 + beta)
      : (t - 2 * beta * T_keer) / (1 - beta);
    const xVertrek = tVertrek <= T_keer
      ? beta * tVertrek
      : beta * (tTotaal - tVertrek);
    return {
      g: g, tTotaal: tTotaal, t: t, x: x, tau: tau, heen: heen,
      opKeerpunt: opKeerpunt, bNu: bNu, tAarde: tAarde,
      voorSprong: voorSprong, naSprong: naSprong,
      sprong: naSprong - voorSprong,
      kWeg: F.doppler(beta, false), kNaar: F.doppler(beta, true),
      zietAarde: zietAarde, tOmkeerGezien: tOmkeerGezien,
      tVertrek: tVertrek, xVertrek: xVertrek, zietSchip: tVertrek / g,
    };
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const tekenH = HOOGTE - MARGE.boven - MARGE.onder;

    // Gelijke schaal in x en ct, zodat licht onder 45 graden staat. Het venster
    // ligt om de wereldlijn van de reiziger heen gecentreerd.
    const ctMin = -0.06 * o.tTotaal;
    const ctMax = 1.06 * o.tTotaal;
    const xSpan = (ctMax - ctMin) * tekenB / tekenH;
    const xMin = beta * T_keer / 2 - xSpan / 2;
    const xMax = xMin + xSpan;

    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [xMin, xMax], yBereik: [ctMin, ctMax],
      marge: MARGE,
    });
    const labels = T.maakLabelPlaatser();
    const yAs = schaal.naarX(0), xAs = schaal.naarY(0);
    const linkerRand = schaal.naarX(xMin), rechterRand = schaal.naarX(xMax);
    const bovenRand = schaal.naarY(ctMax), onderRand = schaal.naarY(ctMin);

    // Linksboven staat het vaantje als HTML over de tekening heen
    labels.blokkeer({ links: 0, boven: 0, breedte: 250, hoogte: 34 });

    const defs = T.el('defs');
    const clip = T.el('clipPath', { id: 'tw-vlak' });
    clip.appendChild(T.el('rect', {
      x: linkerRand, y: bovenRand,
      width: rechterRand - linkerRand, height: onderRand - bovenRand,
    }));
    defs.appendChild(clip);
    svg.appendChild(defs);
    const lijnen = T.el('g', { 'clip-path': 'url(#tw-vlak)' });
    svg.appendChild(lijnen);

    lijnen.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)' }));

    // --- De aarde: een rechte wereldlijn met een tik per jaar ---------------
    lijnen.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(0), x2: yAs, y2: schaal.naarY(o.tTotaal),
      stroke: 'var(--perron)', 'stroke-width': 3.5,
    }));
    labels.blokkeerLijn({
      x1: yAs, y1: schaal.naarY(0), x2: yAs, y2: schaal.naarY(o.tTotaal), dikte: 16,
    });
    const stap = F.netteStap(o.tTotaal / 9);
    for (let k = stap; k <= o.tTotaal + 1e-9; k += stap) {
      svg.appendChild(T.el('line', {
        x1: yAs - 7, y1: schaal.naarY(k), x2: yAs + 7, y2: schaal.naarY(k),
        stroke: 'var(--perron)', 'stroke-width': 1.6,
      }));
      merk(labels, F.nl(k, stap < 1 ? 1 : 0), yAs - 15, schaal.naarY(k) + 5, 'var(--perron)',
           { grootte: 13.5, gewicht: 400, anker: 'end', prioriteit: 44,
             plekken: [[0, 0], [-16, 0], [-32, 0], [40, 0], [58, 0]] });
    }

    // --- Het stuk aardtijd dat bij de omkeer voorbijspringt -----------------
    lijnen.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(o.voorSprong), x2: yAs, y2: schaal.naarY(o.naSprong),
      stroke: 'var(--accent)', 'stroke-width': 11, 'stroke-linecap': 'butt',
      opacity: o.t >= T_keer ? 0.95 : 0.35,
    }));

    // --- De reiziger: heen en terug -----------------------------------------
    [[0, 0, beta * T_keer, T_keer], [beta * T_keer, T_keer, 0, o.tTotaal]].forEach(function (p) {
      lijnen.appendChild(T.el('line', {
        x1: schaal.naarX(p[0]), y1: schaal.naarY(p[1]),
        x2: schaal.naarX(p[2]), y2: schaal.naarY(p[3]),
        stroke: 'var(--trein)', 'stroke-width': 3.5, 'stroke-linejoin': 'round',
      }));
      labels.blokkeerSchuin({
        x1: schaal.naarX(p[0]), y1: schaal.naarY(p[1]),
        x2: schaal.naarX(p[2]), y2: schaal.naarY(p[3]), dikte: 12,
      });
    });
    // Tik per eigen jaar van de reiziger: die liggen verder uit elkaar in
    // aardtijd, en dat is precies de tijdsdilatatie langs de wereldlijn.
    for (let k = stap; k * o.g <= o.tTotaal - 1e-9; k += stap) {
      const tk = k * o.g;
      const xk = tk <= T_keer ? beta * tk : beta * (o.tTotaal - tk);
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xk), cy: schaal.naarY(tk), r: 4,
        fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 1.2,
      }));
    }

    // --- De lichtsignalen ----------------------------------------------------
    // Waar raakt een lichtsignaal dat op aardtijd k vertrekt de reiziger in?
    // Op de heenweg loopt het hem achterna: t = k/(1-beta). Is hij al gekeerd,
    // dan komt hij het tegemoet: t = (k + 2*beta*T)/(1+beta).
    function vangst(k) {
      const grens = T_keer * (1 - beta);
      return k <= grens ? k / (1 - beta) : (k + 2 * beta * T_keer) / (1 + beta);
    }
    function straal(xa, ta, xb, tb, kleur, dikte, dek) {
      lijnen.appendChild(T.el('line', {
        x1: schaal.naarX(xa), y1: schaal.naarY(ta),
        x2: schaal.naarX(xb), y2: schaal.naarY(tb),
        stroke: kleur, 'stroke-width': dikte, opacity: dek,
        'stroke-linecap': 'round',
      }));
    }
    if (toonAarde) {
      for (let k = 0; k <= o.tTotaal - 1e-9; k += stap) {
        const tk = vangst(k);
        if (tk > o.tTotaal + 1e-9) continue;
        const xk = tk <= T_keer ? beta * tk : beta * (o.tTotaal - tk);
        straal(0, k, xk, tk, 'var(--blauw)', 1.3, 0.5);
      }
      // Het signaal dat op dit moment binnenkomt, dik en zonder doorzicht
      straal(0, o.zietAarde, o.x, o.t, 'var(--blauw)', 2.4, 0.95);
      svg.appendChild(T.el('circle', {
        cx: yAs, cy: schaal.naarY(o.zietAarde), r: 6.5,
        fill: 'var(--kaart)', stroke: 'var(--blauw)', 'stroke-width': 2.6,
      }));
      merk(labels, 'gezien: ' + F.nl(o.zietAarde, 2), yAs - 16,
           schaal.naarY(o.zietAarde) + 5, 'var(--blauw)',
           { anker: 'end', grootte: 14.5, gewicht: 650, prioriteit: 78,
             plekken: [[0, 0], [0, -20], [0, 20], [0, -40], [0, 40], [150, 0]] });
    }
    if (toonSchip) {
      for (let k = stap; k * o.g <= o.tTotaal - 1e-9; k += stap) {
        const tk = k * o.g;
        const xk = tk <= T_keer ? beta * tk : beta * (o.tTotaal - tk);
        straal(xk, tk, 0, tk + xk, 'var(--trein)', 1.3, 0.5);
      }
      straal(o.xVertrek, o.tVertrek, 0, o.t, 'var(--trein)', 2.4, 0.95);
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(o.xVertrek), cy: schaal.naarY(o.tVertrek), r: 6.5,
        fill: 'var(--kaart)', stroke: 'var(--trein)', 'stroke-width': 2.6,
      }));
      merk(labels, 'aarde ziet: ' + F.nl(o.zietSchip, 2),
           schaal.naarX(o.xVertrek) + 15, schaal.naarY(o.tVertrek) + 5, 'var(--trein)',
           { grootte: 14.5, gewicht: 650, prioriteit: 76,
             plekken: [[0, 0], [0, -20], [0, 20], [-185, 0], [0, -40], [0, 40],
                       [-185, -20], [-185, 20], [44, 0], [44, -22], [44, 22],
                       [-240, 0], [0, -62], [0, 62], [-240, -24], [-240, 24],
                       [92, 0], [92, -26], [92, 26], [0, -86], [0, 86],
                       [-300, 0], [140, 0], [-300, 30], [140, 30]] });
    }

    // --- Het nu van de reiziger ---------------------------------------------
    function nuLijnVan(bRichting, tGebeurtenis, xGebeurtenis, kleur, dikte, streep) {
      return T.nuLijn(schaal, {
        beta: bRichting, x0: xGebeurtenis, t0: tGebeurtenis,
        kleur: kleur, dikte: dikte, streep: streep,
      });
    }
    if (o.opKeerpunt) {
      // Op het keerpunt bestaan beide nu-lijnen; wat ertussen ligt slaat de
      // reiziger over. Dat gebied krijgt kleur, zodat de sprong te zien is.
      // Alleen de wig aan de kant van de aarde: daar liggen de gebeurtenissen
      // die van 'nog niet' naar 'allang geweest' springen.
      const hoeken = [
        [beta * T_keer, T_keer],
        [xMin, o.voorSprong + beta * xMin],
        [xMin, o.naSprong - beta * xMin],
      ].map(function (p) { return schaal.naarX(p[0]) + ',' + schaal.naarY(p[1]); }).join(' ');
      lijnen.appendChild(T.el('polygon', {
        points: hoeken, fill: 'var(--accent)', opacity: 0.16,
      }));
      lijnen.appendChild(nuLijnVan(beta, T_keer, beta * T_keer, 'var(--gebeurtenis)', 1.6, '7 5'));
      lijnen.appendChild(nuLijnVan(-beta, T_keer, beta * T_keer, 'var(--gebeurtenis)', 2.2, null));
    } else {
      lijnen.appendChild(nuLijnVan(o.bNu, o.t, o.x, 'var(--gebeurtenis)', 2.2, '9 5'));
    }

    // De twee stippen: waar de reiziger is, en welk aardmoment hij 'nu' noemt
    svg.appendChild(T.el('circle', {
      cx: schaal.naarX(o.x), cy: schaal.naarY(o.t), r: 8,
      fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 2,
    }));
    labels.blokkeer({
      links: schaal.naarX(o.x) - 11, boven: schaal.naarY(o.t) - 11, breedte: 22, hoogte: 22,
    });
    merk(labels, 'reiziger: ' + F.nl(o.tau, 2) + ' jaar', schaal.naarX(o.x) + 14,
         schaal.naarY(o.t) + 5, 'var(--trein)',
         { grootte: 15, gewicht: 650, prioriteit: 93,
           plekken: [[0, 0], [0, -22], [0, 22], [-190, 0], [0, -44], [0, 44], [-190, -22],
                     [0, -66], [0, 66], [-190, 22]] });

    if (!o.opKeerpunt) {
      svg.appendChild(T.el('circle', {
        cx: yAs, cy: schaal.naarY(o.tAarde), r: 7.5,
        fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      merk(labels, 'aarde: ' + F.nl(o.tAarde, 2) + ' jaar', yAs + 14, schaal.naarY(o.tAarde) + 5,
           'var(--gebeurtenis)', { grootte: 15, gewicht: 650, prioriteit: 92,
             plekken: [[0, 0], [0, -22], [0, 22], [-180, 0], [0, -44], [0, 44], [-180, 22],
                       [0, -66], [0, 66]] });
    } else {
      [o.voorSprong, o.naSprong].forEach(function (tt) {
        svg.appendChild(T.el('circle', {
          cx: yAs, cy: schaal.naarY(tt), r: 7.5,
          fill: 'var(--gebeurtenis)', stroke: 'var(--kaart)', 'stroke-width': 2,
        }));
      });
      merk(labels, 'van ' + F.nl(o.voorSprong, 2), yAs + 14, schaal.naarY(o.voorSprong) + 5,
           'var(--gebeurtenis)', { grootte: 14.5, gewicht: 650, prioriteit: 82,
             plekken: [[0, 0], [0, 22], [0, -22], [-150, 0], [0, 44]] });
      merk(labels, 'naar ' + F.nl(o.naSprong, 2), yAs + 14, schaal.naarY(o.naSprong) + 5,
           'var(--gebeurtenis)', { grootte: 14.5, gewicht: 650, prioriteit: 81,
             plekken: [[0, 0], [0, -22], [0, 22], [-160, 0], [0, -44]] });
    }

    // Het overgeslagen stuk benoemen, halverwege de paarse balk
    merk(labels, 'sprong: ' + F.nl(o.sprong, 2) + ' jaar', yAs - 18,
         schaal.naarY((o.voorSprong + o.naSprong) / 2) + 5, 'var(--accent)',
         { anker: 'end', grootte: 15, gewicht: 650, prioriteit: 80,
           plekken: [[0, 0], [0, -24], [0, 24], [0, -48], [0, 48], [-70, 0]] });

    // Namen bij de twee wereldlijnen
    merk(labels, 'aarde', yAs - 15, schaal.naarY(o.tTotaal) + 30, 'var(--perron)',
         { anker: 'end', grootte: 16, gewicht: 650, prioriteit: 86,
           plekken: [[0, 0], [0, 24], [0, 48], [-40, 0], [0, -26], [-40, 24]] });
    // De naam komt op de etappe waar de reiziger nu NIET is, zodat hij nooit
    // vecht met het label bij de stip zelf.
    const naamT = o.heen ? T_keer * 1.5 : T_keer * 0.5;
    const naamX = naamT <= T_keer ? beta * naamT : beta * (o.tTotaal - naamT);
    merk(labels, 'reiziger', schaal.naarX(naamX) + (o.heen ? 18 : 18),
         schaal.naarY(naamT) + 5, 'var(--trein)',
         { grootte: 16, gewicht: 650, prioriteit: 87,
           plekken: [[0, 0], [0, -24], [0, 24], [30, 0], [0, -48], [0, 48], [-150, 0]] });
    merk(labels, 'keerpunt', schaal.naarX(beta * T_keer) + 16, schaal.naarY(T_keer) + 27,
         'var(--tekst-zacht)', { grootte: 13, gewicht: 400, prioriteit: 36,
           plekken: [[0, 0], [0, 22], [0, -66], [-150, 0], [0, 44]] });

    // Begin- en eindgebeurtenis
    [[0, 'vertrek'], [o.tTotaal, 'terug bij elkaar']].forEach(function (p) {
      svg.appendChild(T.gebeurtenis(schaal, {
        t: p[0], x: 0, kleur: 'var(--eigentijd)', straal: 6,
      }));
      labels.blokkeer({ links: yAs - 11, boven: schaal.naarY(p[0]) - 11, breedte: 22, hoogte: 22 });
      merk(labels, p[1], yAs + 14, schaal.naarY(p[0]) + (p[0] === 0 ? 20 : -14), 'var(--eigentijd)',
           { grootte: 13.5, gewicht: 600, prioriteit: 50,
             plekken: [[0, 0], [0, 20], [0, -20], [-150, 0], [0, 40], [0, -40],
                       [-150, 20], [-150, -20], [0, 60], [150, 0], [150, 20]] });
    });

    svg.appendChild(labels.tekenAlles());

    vaan.textContent = o.opKeerpunt ? 'het keerpunt: de lijn slaat door'
      : (o.t >= o.tTotaal - 1e-9 ? 'weer samen op aarde'
        : (o.heen ? 'op de heenreis' : 'op de terugreis'));
    vaan.style.color = o.opKeerpunt ? 'var(--accent)' : 'var(--tekst-zacht)';
    tijdWaarde.textContent = F.nl(o.t, 2) + ' jaar aardtijd';
    vulKlokken(o);
    vulZien(o);
    vulVragen(o);
  }

  function vulKlokken(o) {
    const eindAarde = o.tTotaal, eindReiziger = o.tTotaal / o.g;
    const kaarten =
      '<div class="waarden">' +
      '<div class="waarde-kaart"><div class="k">Aarde, nu volgens de reiziger</div>' +
      '<div class="v" style="color:var(--gebeurtenis)">' + F.nl(o.tAarde, 2) + '</div></div>' +
      '<div class="waarde-kaart"><div class="k">Reiziger, eigen tijd</div>' +
      '<div class="v" style="color:var(--trein)">' + F.nl(o.tau, 2) + '</div></div>' +
      '</div>';
    const boekhouding =
      '<div class="boekhouding">' +
      '<div><span>heen, meegeteld</span><b>' + F.nl(o.voorSprong, 2) + '</b></div>' +
      '<div class="sprong"><span>sprong bij de omkeer</span><b>' + F.nl(o.sprong, 2) + '</b></div>' +
      '<div><span>terug, meegeteld</span><b>' + F.nl(eindAarde - o.naSprong, 2) + '</b></div>' +
      '<div class="som"><span>samen op aarde</span><b>' + F.nl(eindAarde, 2) + '</b></div>' +
      '<div class="som"><span>de reiziger zelf</span><b>' + F.nl(eindReiziger, 2) + '</b></div>' +
      '</div>' +
      '<p class="duiding">Van de ' + F.nl(eindAarde, 2) + ' aardjaren maakt de reiziger er ' +
      F.nl(eindReiziger, 2) + ' mee. De ' + F.nl(o.sprong, 2) + ' jaar van de sprong zitten ' +
      'niet in zijn boekhouding: die gebeurtenissen liggen v\u00f3\u00f3r zijn nieuwe nu.</p>';
    klokVak.innerHTML = kaarten + boekhouding;
  }

  /** Wat er daadwerkelijk binnenkomt, tegenover wat er berekend wordt. */
  function vulZien(o) {
    const eindReiziger = o.tTotaal / o.g;
    // De reiziger kijkt de halve reis lang naar een uitgerekt beeld en de
    // andere halve reis naar een samengeperst beeld; de aarde ziet de omkeer
    // pas veel later, en kijkt dus veel langer naar het trage beeld.
    const heenGezien = T_keer * (1 - beta);
    const terugGezien = o.tTotaal - heenGezien;
    const deelAarde = o.tOmkeerGezien / o.tTotaal;
    const kaarten =
      '<div class="waarden">' +
      '<div class="waarde-kaart"><div class="k">Aardklok, zoals gezien</div>' +
      '<div class="v" style="color:var(--blauw)">' + F.nl(o.zietAarde, 2) + '</div></div>' +
      '<div class="waarde-kaart"><div class="k">Schip, zoals de aarde ziet</div>' +
      '<div class="v" style="color:var(--trein)">' + F.nl(o.zietSchip, 2) + '</div></div>' +
      '</div>';
    const boekhouding =
      '<div class="boekhouding">' +
      '<div><span>beeld nu</span><b>' +
      (o.heen ? F.nl(o.kWeg, 3) + '\u00d7 traag' : F.nl(o.kNaar, 3) + '\u00d7 snel') +
      '</b></div>' +
      '<div><span>heenweg: aardtijd gezien</span><b>' + F.nl(heenGezien, 2) + '</b></div>' +
      '<div><span>terugweg: aardtijd gezien</span><b>' + F.nl(terugGezien, 2) + '</b></div>' +
      '<div class="som"><span>samen gezien</span><b>' + F.nl(o.tTotaal, 2) + '</b></div>' +
      '<div class="som"><span>de reiziger zelf</span><b>' + F.nl(eindReiziger, 2) + '</b></div>' +
      '</div>' +
      '<p class="duiding">Geen sprong te bekennen: het beeld gaat van ' +
      F.nl(o.kWeg, 3) + '\u00d7 traag naar ' + F.nl(o.kNaar, 3) + '\u00d7 snel op het moment ' +
      'dat de reiziger keert, en samen komen die twee stukken uit op de volle ' +
      F.nl(o.tTotaal, 2) + ' aardjaren. De asymmetrie zit in het kijken zelf: de ' +
      'reiziger ziet de omkeer halverwege, de aarde pas op t = ' +
      F.nl(o.tOmkeerGezien, 2) + ' \u2014 ' + F.nl(deelAarde * 100, 0) + '% van de reis. ' +
      'Daarom ziet de aarde het schip veel l\u00e1nger vertraagd dan andersom, en dat ' +
      'is precies waar de symmetrie breekt.</p>';
    zienVak.innerHTML = kaarten + boekhouding;
  }

  /** De vragen die bij dit diagram horen, met de getallen van nu erin. */
  function vulVragen(o) {
    const eindReiziger = o.tTotaal / o.g;
    const kaarten = [
      ['Waarom is de reis niet symmetrisch?',
       'de aarde blijft in \u00e9\u00e9n kader, de reiziger niet',
       '\u03b3 = ' + F.nl(o.g, 3) + ', dus ' + F.nl(o.tTotaal, 2) + ' tegen ' +
       F.nl(eindReiziger, 2) + ' jaar',
       'Onderweg m\u00e1g de reiziger zeggen dat de aardklok achterloopt, en de aarde ' +
       'mag hetzelfde zeggen over hem. Dat is geen tegenspraak zolang ze uit ' +
       'elkaar gaan. Maar om terug te komen moet er \u00e9\u00e9n van de twee van kader ' +
       'wisselen, en dat doet alleen de reiziger. Die wisseling is te voelen \u2014 hij ' +
       'wordt in zijn stoel gedrukt \u2014 en daarmee is de symmetrie weg.'],
      ['Wat is die sprong precies?',
       'sprong = 2\u00b7\u03b2\u00b2\u00b7T',
       '2 \u00b7 ' + F.nl(beta * beta, 3) + ' \u00b7 ' + F.nl(T_keer, 1) + ' = ' +
       F.nl(o.sprong, 2) + ' jaar',
       'V\u00f3\u00f3r de omkeer noemt de reiziger aardjaar ' + F.nl(o.voorSprong, 2) +
       ' "nu"; erna aardjaar ' + F.nl(o.naSprong, 2) + '. Hij is geen seconde ' +
       'ouder geworden, maar zijn nu-lijn is gekanteld, en die snijdt de ' +
       'wereldlijn van de aarde nu ergens anders. De sprong is een verandering ' +
       'in de indeling van de ruimtetijd, niet iets wat op aarde gebeurt.'],
      ['Waarom springt het beeld dan niet mee?',
       'k = \u221a((1\u2212\u03b2)/(1+\u03b2)) \u2192 \u221a((1+\u03b2)/(1\u2212\u03b2))',
       F.nl(o.kWeg, 3) + ' \u2192 ' + F.nl(o.kNaar, 3) +
       ' (product ' + F.nl(o.kWeg * o.kNaar, 1) + ')',
       'Licht dat al onderweg is, blijft onderweg. Op het moment van de omkeer ' +
       'verandert alleen het tempo waarin de beelden binnenkomen: van ' +
       F.nl(o.kWeg, 3) + '\u00d7 naar ' + F.nl(o.kNaar, 3) + '\u00d7. Het beeld zelf loopt ' +
       'gewoon door waar het was. Dat is het verschil tussen wat je berekent \u2014 ' +
       'waar corrigeer ik de lichtlooptijd weg \u2014 en wat er in je oog valt.'],
      ['Waarom klopt de optelsom van de beelden?',
       '(T/\u03b3)\u00b7k_weg + (T/\u03b3)\u00b7k_naar = 2T',
       F.nl(T_keer / o.g, 2) + '\u00b7' + F.nl(o.kWeg, 3) + ' + ' +
       F.nl(T_keer / o.g, 2) + '\u00b7' + F.nl(o.kNaar, 3) + ' = ' + F.nl(o.tTotaal, 2),
       'De reiziger kijkt op zijn eigen klok even lang naar het ene als naar het ' +
       'andere beeld: ' + F.nl(T_keer / o.g, 2) + ' jaar elk. De twee ' +
       'dopplerfactoren zijn elkaars omgekeerde, en opgeteld leveren ze precies ' +
       '2\u03b3 op. Vermenigvuldig dat met T/\u03b3 en je houdt 2T over \u2014 elke tik van de ' +
       'aardklok is \u00e9\u00e9n keer gezien, geen enkele twee keer, geen enkele gemist.'],
      ['Waarom duurt het trage beeld voor de aarde zoveel langer?',
       'de aarde ziet de omkeer pas op t = T(1+\u03b2)',
       F.nl(T_keer, 1) + ' \u00b7 ' + F.nl(1 + beta, 2) + ' = ' +
       F.nl(o.tOmkeerGezien, 2) + ' van de ' + F.nl(o.tTotaal, 2) + ' jaar',
       'Het licht van de omkeer moet nog de hele afstand ' +
       F.nl(beta * T_keer, 2) + ' terugleggen. De aarde ziet het schip dus ' +
       F.nl(o.tOmkeerGezien, 2) + ' jaar lang vertraagd en maar ' +
       F.nl(o.tTotaal - o.tOmkeerGezien, 2) + ' jaar versneld. De reiziger ' +
       'daarentegen ziet allebei precies even lang. Dezelfde dopplerfactoren, ' +
       'heel andere verdeling \u2014 en dat is de hele paradox.'],
      ['Wat is het verschil tussen "berekend" en "gezien"?',
       'gezien = berekend \u2212 lichtlooptijd',
       'nu: gezien ' + F.nl(o.zietAarde, 2) + ' tegen berekend ' +
       F.nl(o.tAarde, 2),
       'Wat je ziet komt met vertraging binnen: het licht moest eerst de afstand ' +
       'overbruggen. Trek je die looptijd eraf, dan hou je over wat er "nu" op ' +
       'aarde gebeurt volgens jouw kader \u2014 dat is de rode lijn. Die aftreksom ' +
       'hangt af van je kader, en daarom springt het berekende getal bij de ' +
       'omkeer wel en het geziene niet.'],
    ];
    vragenVak.innerHTML = kaarten.map(function (k, i) {
      return '<details class="formule"' + (openVragen.has(i) ? ' open' : '') +
        ' data-nr="' + i + '"><summary><span class="naam">' + k[0] + '</span></summary>' +
        '<div class="formule-inhoud"><div class="formule-regel">' + k[1] + '</div>' +
        '<div class="som">' + k[2] + '</div>' +
        '<p class="waarom">' + k[3] + '</p></div></details>';
    }).join('');
    vragenVak.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        const nr = Number(d.getAttribute('data-nr'));
        if (d.open) openVragen.add(nr); else openVragen.delete(nr);
      });
    });
  }

  // --- Bediening ----------------------------------------------------------
  function zet(f) {
    fractie = f;
    tijdSchuif.value = String(f);
    teken();
  }
  betaSchuif.addEventListener('input', function () {
    beta = parseFloat(betaSchuif.value);
    betaWaarde.textContent = F.nl(beta, 2) + 'c';
    teken();
  });
  duurSchuif.addEventListener('input', function () {
    T_keer = parseFloat(duurSchuif.value);
    duurWaarde.textContent = F.nl(T_keer, 1) + ' jaar';
    teken();
  });
  tijdSchuif.addEventListener('input', function () {
    fractie = parseFloat(tijdSchuif.value);
    teken();
  });
  beginKnop.addEventListener('click', function () { zet(0); });
  keerKnop.addEventListener('click', function () { zet(0.5); });
  eindKnop.addEventListener('click', function () { zet(1); });
  seinAardeKnop.addEventListener('click', function () {
    toonAarde = !toonAarde;
    seinAardeKnop.classList.toggle('aan', toonAarde);
    teken();
  });
  seinSchipKnop.addEventListener('click', function () {
    toonSchip = !toonSchip;
    seinSchipKnop.classList.toggle('aan', toonSchip);
    teken();
  });
  speelKnop.addEventListener('click', function () {
    speelt = !speelt;
    speelKnop.classList.toggle('aan', speelt);
    speelKnop.textContent = speelt ? 'Pauze' : 'Afspelen';
    if (speelt) {
      if (fractie >= 0.999) fractie = 0;
      loop(null);
    }
  });

  let vorige = null;
  function loop(nu) {
    if (!speelt) { vorige = null; return; }
    // De module kan intussen vervangen zijn; dan stopt de lus vanzelf
    if (!svg.isConnected) { speelt = false; vorige = null; return; }
    if (nu !== null && vorige !== null) {
      if (nu < wachtTot) {
        // Even stilstaan op het keerpunt, anders is de sprong niet te zien
        vorige = nu;
        requestAnimationFrame(loop);
        return;
      }
      const vorigeFractie = fractie;
      fractie = Math.min(1, fractie + (nu - vorige) / 9000);
      // Precies op het keerpunt blijven hangen en daar even wachten
      if (vorigeFractie < 0.5 && fractie > 0.5) {
        fractie = 0.5;
        wachtTot = nu + 1400;
      }
      tijdSchuif.value = String(fractie);
      teken();
      if (fractie >= 1) {
        speelt = false;
        speelKnop.classList.remove('aan');
        speelKnop.textContent = 'Afspelen';
        vorige = null;
        return;
      }
    }
    vorige = nu;
    requestAnimationFrame(loop);
  }

  betaWaarde.textContent = F.nl(beta, 2) + 'c';
  duurWaarde.textContent = F.nl(T_keer, 1) + ' jaar';
  teken();
}
