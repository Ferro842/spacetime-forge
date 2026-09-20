// loods.js — de staaf in de loods, oftewel de ladderparadox.
//
// Een staaf van 10 m vliegt met 0,9c door een loods van 6 m. Voor de loods is
// de staaf ingekort tot 4,4 m, dus past hij, en kunnen beide deuren tegelijk
// dicht. Voor de staaf is de loods ingekort tot 2,6 m, dus past hij niet —
// maar gaan de deuren ook niet tegelijk dicht: de uitgang gaat als eerste
// dicht en weer open, ruim voordat de staaf er is, en de ingang pas veel
// later, als de staaf er al voorbij is.
//
// Beide verhalen zijn waar. Wat ze scheidt is niet de lengte maar de
// gelijktijdigheid: twee deuren die in het ene kader samen dichtgaan, doen dat
// in het andere kader na elkaar. Het verschil is precies gamma*beta*D.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Staaf in de loods';
export const onderschrift =
  'Een staaf die te lang is voor de loods past er toch in \u2014 en toch niet. ' +
  'Wissel van kader en kijk waar het verschil zit: niet in de lengte, in de klok.';

const BREEDTE = 960;
const HOOGTE = 940;
// Het toneel en het Minkowski-diagram gebruiken dezelfde marges en hetzelfde
// x-venster, zodat de loods recht boven zijn eigen wereldlijnen staat.
const MARGE = { links: 72, rechts: 58 };

// Twee banden onder elkaar. In het grote beeld valt het toneel weg en krijgt
// het diagram het hele vlak.
const TONEEL = { titel: 28, naam: 50, dak: 72, vloer: 176, maat: 214, grond: 238 };
const ONDER = { titel: 250, boven: 274, onder: 904, tik: 928 };
const ONDER_GROOT = { titel: 28, boven: 62, onder: 904, tik: 928 };

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
  const y = Math.max(spec.grootte * 0.8 + 3,
                     Math.min(HOOGTE - 3 - spec.grootte * 0.25, spec.y));
  return [[dx, y - spec.y]];
}

export function render(doel) {
  let beta = 0.9;          // snelheid van de staaf ten opzichte van de loods
  let L = 10;              // eigen lengte van de staaf, in meter
  let D = 6;               // eigen lengte van de loods, in meter
  let fractie = 0;         // waar op de tijdlijn van het gekozen kader
  let kader = 'loods';     // of 'staaf'
  let groot = false;       // het diagram over het hele vlak
  let toonSignaal = false; // lichtsignaal van de uitgangssluiting
  let toonBeide = true;    // de gelijktijdigheid van beide kaders tegelijk
  let speelt = false;
  let laatsteTik = 0;

  /** De grenzen van de onderste band, afhankelijk van het gekozen beeld. */
  function band() { return groot ? ONDER_GROOT : ONDER; }

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Twee verhalen die allebei waar zijn</summary>' +
    '<p>In het <b>loodskader</b> is de staaf ingekort en past hij: beide deuren ' +
    'kunnen tegelijk even dicht met de staaf erin. In het <b>staafkader</b> is de ' +
    'loods ingekort en past hij niet \u2014 maar daar gaan de deuren ook niet tegelijk ' +
    'dicht. Eerst de uitgang, ruim voordat de staaf er is; veel later de ingang, ' +
    'als de staaf er al voorbij is. Niemand raakt iets. Wissel van kader en volg ' +
    'de twee gebeurtenissen in het diagram: ze wisselen van <b>volgorde</b>, niet ' +
    'van plaats.</p>' +
    '<p style="margin-top:7px">Met <b>Beide kaders</b> staan allebei de sneden in ' +
    '\u00e9\u00e9n diagram. Door dezelfde twee stippen legt de loods \u00e9\u00e9n lijn \u2014 voor haar ' +
    'gebeuren ze tegelijk \u2014 en de staaf twee lijnen, met de hele doorvaart ' +
    'ertussen. Niet de gebeurtenissen verschillen, maar de manier waarop je de ' +
    'ruimtetijd in \u201cmomenten\u201d snijdt.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'De staaf die door de loods vliegt, met het bijbehorende ' +
                  'Minkowski-diagram in het gekozen kader',
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
    '    <label for="lo-beta">Snelheid van de staaf: <b id="lo-beta-w"></b></label>' +
    '    <input type="range" id="lo-beta" min="0.3" max="0.95" step="0.01" value="0.9" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="lo-staaf">Eigen lengte van de staaf: <b id="lo-staaf-w"></b></label>' +
    '    <input type="range" id="lo-staaf" min="4" max="14" step="0.5" value="10" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="lo-loods">Eigen lengte van de loods: <b id="lo-loods-w"></b></label>' +
    '    <input type="range" id="lo-loods" min="3" max="12" step="0.5" value="6" />' +
    '  </div>' +
    '  <div class="regelaar">' +
    '    <label for="lo-tijd">Tijd in dit kader: <b id="lo-tijd-w"></b></label>' +
    '    <input type="range" id="lo-tijd" min="0" max="1" step="0.001" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="lo-speel">Afspelen</button>' +
    '    <button class="knop klein" id="lo-begin">Begin</button>' +
    '    <button class="knop klein" id="lo-uit">Uitgang dicht</button>' +
    '    <button class="knop klein" id="lo-in">Ingang dicht</button>' +
    '  </div>' +
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein aan" id="lo-kader-loods">Loodskader</button>' +
    '    <button class="knop klein" id="lo-kader-staaf">Staafkader</button>' +
    '    <button class="knop klein" id="lo-groot">Groot</button>' +
    '    <button class="knop klein aan" id="lo-beide">Beide kaders</button>' +
    '    <button class="knop klein" id="lo-signaal">Signaal</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const volgordePaneel = document.createElement('div');
  volgordePaneel.className = 'paneel';
  volgordePaneel.innerHTML =
    '<h3>De twee volgordes</h3><div id="lo-volgorde"></div>';
  zijkolom.appendChild(volgordePaneel);

  const vragenPaneel = document.createElement('div');
  vragenPaneel.className = 'paneel';
  vragenPaneel.innerHTML =
    '<h3>Vragen bij het diagram</h3><div class="formules" id="lo-vragen"></div>';
  zijkolom.appendChild(vragenPaneel);
  const vragenVak = vragenPaneel.querySelector('#lo-vragen');
  const openVragen = new Set();

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'De paradox en de twee diagrammen ernaast volgen Takeuchi, "An Illustrated ' +
    'Guide to Relativity", hoofdstuk 6; dat een star lichaam in de relativiteit ' +
    'niet bestaat staat bij Epstein, "Relativity Visualized", het hoofdstuk over ' +
    'de lengtecontractie \u2014 in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  const schuifBeta = paneel.querySelector('#lo-beta');
  const betaW = paneel.querySelector('#lo-beta-w');
  const schuifStaaf = paneel.querySelector('#lo-staaf');
  const staafW = paneel.querySelector('#lo-staaf-w');
  const schuifLoods = paneel.querySelector('#lo-loods');
  const loodsW = paneel.querySelector('#lo-loods-w');
  const schuifTijd = paneel.querySelector('#lo-tijd');
  const tijdW = paneel.querySelector('#lo-tijd-w');
  const speelKnop = paneel.querySelector('#lo-speel');
  const beginKnop = paneel.querySelector('#lo-begin');
  const uitKnop = paneel.querySelector('#lo-uit');
  const inKnop = paneel.querySelector('#lo-in');
  const loodsKaderKnop = paneel.querySelector('#lo-kader-loods');
  const staafKaderKnop = paneel.querySelector('#lo-kader-staaf');
  const grootKnop = paneel.querySelector('#lo-groot');
  const signaalKnop = paneel.querySelector('#lo-signaal');
  const beideKnop = paneel.querySelector('#lo-beide');
  const volgordeVak = volgordePaneel.querySelector('#lo-volgorde');

  /**
   * Een label met een eigen ladder van uitwijkplekken.
   *
   * Met opties.binnen = [boven, onder] blijft het label binnen die strook. Dat
   * is nodig voor de labels van het diagram: zonder die grens kan er een label
   * omhoog uitwijken tot in het toneel erboven, en dan staat er tekst over een
   * heel ander plaatje heen.
   */
  function merk(labels, tekst, x, y, kleur, opties) {
    const o = opties || {};
    const spec = {
      tekst: tekst, x: x, y: y, grootte: o.grootte || 14.5, kleur: kleur,
      gewicht: o.gewicht || 600, prioriteit: o.prioriteit || 50,
      anker: o.anker || 'start', cursief: !!o.cursief,
    };
    let plekken = o.plekken ||
      [[0, 0], [0, 20], [0, -20], [0, 40], [0, -40], [0, 60], [0, -60]];
    if (o.binnen) {
      const past = plekken.filter(function (plek) {
        const yy = y + plek[1];
        return yy - spec.grootte * 0.8 >= o.binnen[0] &&
               yy + spec.grootte * 0.25 <= o.binnen[1];
      });
      if (past.length) plekken = past;
    }
    spec.verschuif = ladder(spec, plekken);
    labels.voegToe(spec);
  }

  /**
   * Alles wat uit beta, L en D volgt, meteen omgerekend naar het gekozen
   * kader. De tijden zonder streepje horen bij de loods; wat in het gekozen
   * kader ligt, staat in de gebeurtenissen g*.
   */
  function opzet() {
    const g = F.gamma(beta);
    const Lkort = L / g;                 // staaf gemeten in het loodskader
    const Dkort = D / g;                 // loods gemeten in het staafkader
    const tA = D / beta;                 // voorkant bij de uitgang
    const tB = Lkort / beta;             // achterkant voorbij de ingang
    const tUit = (D + Lkort) / beta;     // achterkant voorbij de uitgang
    const past = Lkort <= D + 1e-12;
    const tc = (tA + tB) / 2;            // de deuren gaan dicht
    // Zolang de staaf binnen is mogen de deuren dicht. Iets korter dan dat
    // venster, zodat er aan beide kanten lucht overblijft; past de staaf niet,
    // dan een vaste korte tijd, en dan raakt de deur de staaf ook echt.
    const duur = past ? Math.min(0.6 * (tA - tB), 0.14 * tUit) : 0.06 * tUit;

    /** Van het loodskader naar het gekozen kader. */
    function naar(t, x) {
      return kader === 'loods' ? { t: t, x: x } : F.lorentz(t, x, beta);
    }
    const vLoods = kader === 'loods' ? 0 : -beta;
    const vStaaf = kader === 'loods' ? beta : 0;

    // De vaste punten van de vier wereldlijnen, in het gekozen kader
    const pIngang = naar(0, 0);
    const pUitgang = naar(0, D);
    const pVoor = naar(0, 0);
    const pAchter = naar(0, -Lkort);

    // De gebeurtenissen die het verhaal dragen
    const gDeurUit = naar(tc, D);
    const gDeurIn = naar(tc, 0);
    const gVoorUit = naar(tA, D);
    const gAchterIn = naar(tB, 0);

    // Wanneer staat elke deur dicht, in de tijd van het gekozen kader?
    const uitDicht = [naar(tc - duur / 2, D).t, naar(tc + duur / 2, D).t];
    const inDicht = [naar(tc - duur / 2, 0).t, naar(tc + duur / 2, 0).t];

    // Het lichtsignaal van de uitgangssluiting naar de achterkant: eerder kan
    // de achterkant er niets van weten, en dus ook niet remmen of uitwijken.
    const tSig = (D + tc + Lkort) / (1 + beta);
    const gSigStart = gDeurUit;
    const gSigEind = naar(tSig, beta * tSig - Lkort);

    // --- Het venster ------------------------------------------------------
    // Alleen de gebeurtenissen die het verhaal dragen bepalen het venster. De
    // wereldlijnen zelf lopen door tot voorbij de rand en worden afgeknipt:
    // zou je hun uiteinden meetellen, dan zoomt het beeld ver uit omdat een
    // bewegend voorwerp in de andere kader-tijd enorm veel ruimte beslaat.
    const hoeken = [
      [0, 0], [tB, 0], [tA, D], [tUit, D], [tc, 0], [tc, D],
      [tSig, beta * tSig - Lkort],
    ];
    let xLo = Infinity, xHi = -Infinity, tLo = Infinity, tHi = -Infinity;
    hoeken.forEach(function (p) {
      const q = naar(p[0], p[1]);
      if (q.x < xLo) xLo = q.x;
      if (q.x > xHi) xHi = q.x;
      if (q.t < tLo) tLo = q.t;
      if (q.t > tHi) tHi = q.t;
    });
    const xRuim = (xHi - xLo) * 0.07, tRuim = (tHi - tLo) * 0.07;
    let xMin = xLo - xRuim, xMax = xHi + xRuim;
    let ctMin = tLo - tRuim, ctMax = tHi + tRuim;
    // Gelijke schaal in x en ct, anders lopen de lichtlijnen niet onder 45°.
    // Wat te klein is, wordt naar beide kanten bijgetrokken.
    const plotH = band().onder - band().boven;
    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const verhouding = tekenB / plotH;
    if (xMax - xMin < (ctMax - ctMin) * verhouding) {
      const extra = ((ctMax - ctMin) * verhouding - (xMax - xMin)) / 2;
      xMin -= extra; xMax += extra;
    } else {
      const extra = ((xMax - xMin) / verhouding - (ctMax - ctMin)) / 2;
      ctMin -= extra; ctMax += extra;
    }

    const tNu = ctMin + fractie * (ctMax - ctMin);
    /** Waar staat een object met snelheid v op tijdstip t in dit kader? */
    function plek(p, v, t) { return p.x + v * (t - p.t); }

    return {
      g: g, Lkort: Lkort, Dkort: Dkort, tA: tA, tB: tB, tUit: tUit,
      past: past, tc: tc, duur: duur,
      // De twee sluitingen, afgelezen op de klok van elk kader. Deze getallen
      // hangen niet af van welk kader er getekend wordt: dat is juist de clou.
      tLoodsSluit: tc,
      tStaafUit: g * (tc - beta * D),
      tStaafIn: g * tc,
      naar: naar, plek: plek, vLoods: vLoods, vStaaf: vStaaf,
      pIngang: pIngang, pUitgang: pUitgang, pVoor: pVoor, pAchter: pAchter,
      gDeurUit: gDeurUit, gDeurIn: gDeurIn, gVoorUit: gVoorUit,
      gAchterIn: gAchterIn, gSigStart: gSigStart, gSigEind: gSigEind,
      uitDicht: uitDicht, inDicht: inDicht,
      xMin: xMin, xMax: xMax, ctMin: ctMin, ctMax: ctMax, tNu: tNu,
      // Wat meet dit kader zelf aan de twee voorwerpen?
      hierStaaf: kader === 'loods' ? Lkort : L,
      hierLoods: kader === 'loods' ? D : Dkort,
      // Het verschil tussen de twee sluitingen, in de tijd van dit kader
      sluitVerschil: gDeurIn.t - gDeurUit.t,
    };
  }

  /** Staat deze deur dicht op dit moment? */
  function dicht(venster, t) {
    return t >= Math.min(venster[0], venster[1]) - 1e-12 &&
           t <= Math.max(venster[0], venster[1]) + 1e-12;
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const o = opzet();
    const b = band();
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [o.xMin, o.xMax], yBereik: [o.ctMin, o.ctMax],
      marge: { links: MARGE.links, rechts: MARGE.rechts,
               boven: b.boven, onder: HOOGTE - b.onder },
    });
    const labels = T.maakLabelPlaatser();
    const linkerRand = schaal.naarX(o.xMin), rechterRand = schaal.naarX(o.xMax);

    // Linksboven staat het vaantje als HTML over de tekening heen
    labels.blokkeer({ links: 0, boven: 0, breedte: 260, hoogte: 30 });

    const defs = T.el('defs');
    const clip = T.el('clipPath', { id: 'lo-vlak' });
    clip.appendChild(T.el('rect', {
      x: linkerRand, y: b.boven, width: rechterRand - linkerRand,
      height: b.onder - b.boven,
    }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    if (!groot) tekenToneel(labels, schaal, o);
    tekenDiagram(labels, schaal, o, b);

    svg.appendChild(labels.tekenAlles());

    // --- Vaantje en schuifwaarde -------------------------------------------
    const uitNu = dicht(o.uitDicht, o.tNu), inNu = dicht(o.inDicht, o.tNu);
    let stand;
    if (uitNu && inNu) stand = 'beide deuren dicht';
    else if (uitNu) stand = 'alleen de uitgang dicht';
    else if (inNu) stand = 'alleen de ingang dicht';
    else stand = kader === 'loods' ? 'deuren open' : 'deuren open';
    vaan.textContent = stand;
    vaan.style.color = (uitNu || inNu) ? 'var(--gebeurtenis)' : 'var(--tekst-zacht)';
    tijdW.textContent = F.nl(o.tNu, 2) + (kader === 'loods' ? ' m ct' : ' m ct\u2032');
    vulWaarden(o);
    vulVolgorde(o);
    vulVragen(o);
  }

  /**
   * Het toneel: de loods en de staaf van bovenaf, op het gekozen moment.
   * Het x-venster is hetzelfde als dat van het diagram eronder, dus alles
   * staat recht boven zijn eigen wereldlijn.
   */
  function tekenToneel(labels, schaal, o) {
    const xIngang = o.plek(o.pIngang, o.vLoods, o.tNu);
    const xUitgang = o.plek(o.pUitgang, o.vLoods, o.tNu);
    const xVoor = o.plek(o.pVoor, o.vStaaf, o.tNu);
    const xAchter = o.plek(o.pAchter, o.vStaaf, o.tNu);
    const uitNu = dicht(o.uitDicht, o.tNu), inNu = dicht(o.inDicht, o.tNu);

    // Het vaantje staat linksboven over de tekening heen, dus begint deze
    // titel daar rechts van.
    merk(labels, kader === 'loods' ? 'gezien vanuit de loods' : 'gezien vanuit de staaf',
         296, TONEEL.titel, 'var(--tekst-zacht)',
         { grootte: 13, gewicht: 650, prioriteit: 94,
           plekken: [[0, 0], [0, 16], [-20, 0], [40, 0]] });

    // De grond
    svg.appendChild(T.el('line', {
      x1: MARGE.links - 10, y1: TONEEL.grond,
      x2: BREEDTE - MARGE.rechts + 10, y2: TONEEL.grond,
      stroke: 'var(--rand-sterk)', 'stroke-width': 2,
    }));

    // De loods: twee zijwanden en een dak, met de deuren aan de uiteinden
    const pIn = schaal.naarX(xIngang), pUit = schaal.naarX(xUitgang);
    svg.appendChild(T.el('rect', {
      x: pIn, y: TONEEL.dak, width: Math.max(pUit - pIn, 2),
      height: TONEEL.vloer - TONEEL.dak,
      fill: 'var(--kaart-2)', stroke: 'var(--perron)', 'stroke-width': 2.4,
    }));
    labels.blokkeer({
      links: pIn, boven: TONEEL.dak,
      breedte: Math.max(pUit - pIn, 2), hoogte: TONEEL.vloer - TONEEL.dak,
    });
    [[pIn, inNu, 'ingang'], [pUit, uitNu, 'uitgang']].forEach(function (deur) {
      const px = deur[0];
      if (deur[1]) {
        // Dicht: een volle schuif over de hele opening
        svg.appendChild(T.el('rect', {
          x: px - 4, y: TONEEL.dak, width: 8, height: TONEEL.vloer - TONEEL.dak,
          fill: 'var(--gebeurtenis)', stroke: 'var(--gebeurtenis)', 'stroke-width': 2,
        }));
      } else {
        // Open: de schuif staat opzij, boven en onder een stompje
        [[TONEEL.dak, 13], [TONEEL.vloer - 13, 13]].forEach(function (stuk) {
          svg.appendChild(T.el('rect', {
            x: px - 3, y: stuk[0], width: 6, height: stuk[1],
            fill: 'var(--perron)', opacity: 0.55,
          }));
        });
      }
    });

    // De staaf
    const pA = schaal.naarX(xAchter), pV = schaal.naarX(xVoor);
    const staafY = (TONEEL.dak + TONEEL.vloer) / 2 - 11;
    svg.appendChild(T.el('rect', {
      x: pA, y: staafY, width: Math.max(pV - pA, 2), height: 22, rx: 7,
      fill: 'var(--trein-vlak)', stroke: 'var(--trein)', 'stroke-width': 2.6,
    }));
    labels.blokkeer({
      links: pA, boven: staafY, breedte: Math.max(pV - pA, 2), hoogte: 22,
    });
    // Een pijl die aangeeft welke kant het bewegende voorwerp op gaat. Hij
    // staat onder de vloer, want voor de staaf langs zou hij door een dichte
    // deur heen steken.
    function richting(px, v, kleur) {
      if (Math.abs(v) < 1e-9) return;
      const y = TONEEL.vloer + 9;
      const eind = px + (v > 0 ? 34 : -34);
      svg.appendChild(T.el('line', {
        x1: px, y1: y, x2: eind, y2: y, stroke: kleur, 'stroke-width': 2,
      }));
      svg.appendChild(T.el('polygon', {
        points: [eind + ',' + y, (eind - (v > 0 ? 9 : -9)) + ',' + (y - 4),
                 (eind - (v > 0 ? 9 : -9)) + ',' + (y + 4)].join(' '),
        fill: kleur,
      }));
    }
    richting((pA + pV) / 2, o.vStaaf, 'var(--trein)');
    richting((pIn + pUit) / 2, o.vLoods, 'var(--perron)');

    // Maatlijnen met de lengte die dit kader meet
    function maat(x1, x2, y, tekst, kleur, prioriteit) {
      const a = Math.min(x1, x2), c = Math.max(x1, x2);
      svg.appendChild(T.el('line', {
        x1: a, y1: y, x2: c, y2: y, stroke: kleur, 'stroke-width': 1.4,
      }));
      [a, c].forEach(function (px) {
        svg.appendChild(T.el('line', {
          x1: px, y1: y - 5, x2: px, y2: y + 5, stroke: kleur, 'stroke-width': 1.4,
        }));
      });
      merk(labels, tekst, (a + c) / 2, y - 8, kleur,
           { anker: 'middle', grootte: 14, gewicht: 650, prioriteit: prioriteit,
             plekken: [[0, 0], [0, -18], [0, 22], [0, -36], [0, 40],
                       [-90, 0], [90, 0], [-90, -18], [90, -18]] });
    }
    maat(pIn, pUit, TONEEL.naam, 'loods ' + F.nl(o.hierLoods, 2) + ' m',
         'var(--perron)', 86);
    maat(pA, pV, TONEEL.maat, 'staaf ' + F.nl(o.hierStaaf, 2) + ' m',
         'var(--trein)', 85);

    // Het oordeel van dit kader
    const pastHier = o.hierStaaf <= o.hierLoods + 1e-12;
    merk(labels,
         pastHier
           ? 'hier past de staaf: ' + F.nl(o.hierStaaf, 2) + ' m in ' + F.nl(o.hierLoods, 2) + ' m'
           : 'hier past de staaf niet: ' + F.nl(o.hierStaaf, 2) + ' m in ' + F.nl(o.hierLoods, 2) + ' m',
         BREEDTE - MARGE.rechts, TONEEL.titel,
         pastHier ? 'var(--eigentijd)' : 'var(--gebeurtenis)',
         { anker: 'end', grootte: 14.5, gewicht: 700, prioriteit: 93,
           plekken: [[0, 0], [0, 17]] });
  }

  /** Het Minkowski-diagram in het gekozen kader. */
  function tekenDiagram(labels, schaal, o, b) {
    const lijnen = T.el('g', { 'clip-path': 'url(#lo-vlak)' });
    svg.appendChild(lijnen);
    const linkerRand = schaal.naarX(o.xMin), rechterRand = schaal.naarX(o.xMax);
    // Labels van het diagram blijven binnen de band, anders vallen ze in het
    // toneel erboven of tussen de getallen eronder.
    const inBand = [b.boven - 2, b.onder + 6];
    function merkD(tekst, x, y, kleur, opties) {
      merk(labels, tekst, x, y, kleur, Object.assign({ binnen: inBand }, opties));
    }

    // In het grote beeld staat deze titel op de hoogte van het vaantje, dus
    // schuift hij daar rechts van; in het kleine beeld staat hij verderop
    // omlaag en mag hij gewoon links beginnen.
    merk(labels, kader === 'loods'
           ? 'Minkowski-diagram in het loodskader'
           : 'Minkowski-diagram in het staafkader',
         groot ? 296 : MARGE.links, b.titel, 'var(--tekst-zacht)',
         { grootte: 13, gewicht: 650, prioriteit: 94,
           plekken: [[0, 0], [0, 16], [-20, 0], [40, 0], [90, 0]] });

    /** Een wereldstrook tussen twee objecten met dezelfde snelheid. */
    function strook(p1, p2, v, kleur, dek) {
      const hoeken = [
        [o.plek(p1, v, o.ctMin), o.ctMin], [o.plek(p2, v, o.ctMin), o.ctMin],
        [o.plek(p2, v, o.ctMax), o.ctMax], [o.plek(p1, v, o.ctMax), o.ctMax],
      ];
      lijnen.appendChild(T.el('polygon', {
        points: hoeken.map(function (h) {
          return schaal.naarX(h[0]) + ',' + schaal.naarY(h[1]);
        }).join(' '),
        fill: kleur, opacity: dek,
      }));
    }
    strook(o.pIngang, o.pUitgang, o.vLoods, 'var(--perron)', 0.09);
    strook(o.pAchter, o.pVoor, o.vStaaf, 'var(--trein)', 0.16);

    /** Een wereldlijn van rand tot rand, en meteen geblokkeerd voor labels. */
    function lijn(p, v, kleur, dikte) {
      const x1 = schaal.naarX(o.plek(p, v, o.ctMin)), y1 = schaal.naarY(o.ctMin);
      const x2 = schaal.naarX(o.plek(p, v, o.ctMax)), y2 = schaal.naarY(o.ctMax);
      lijnen.appendChild(T.el('line', {
        x1: x1, y1: y1, x2: x2, y2: y2, stroke: kleur, 'stroke-width': dikte,
      }));
      if (Math.abs(v) < 1e-9) labels.blokkeerLijn({ x1: x1, y1: y1, x2: x2, y2: y2, dikte: 13 });
      else labels.blokkeerSchuin({ x1: x1, y1: y1, x2: x2, y2: y2, dikte: 13 });
    }
    lijn(o.pIngang, o.vLoods, 'var(--perron)', 2.6);
    lijn(o.pUitgang, o.vLoods, 'var(--perron)', 2.6);
    lijn(o.pAchter, o.vStaaf, 'var(--trein)', 2.6);
    lijn(o.pVoor, o.vStaaf, 'var(--trein)', 2.6);

    // De stukken waarop een deur dicht staat, dik over de wereldlijn heen
    [[o.pIngang, o.inDicht], [o.pUitgang, o.uitDicht]].forEach(function (deur) {
      const van = Math.min(deur[1][0], deur[1][1]), tot = Math.max(deur[1][0], deur[1][1]);
      lijnen.appendChild(T.el('line', {
        x1: schaal.naarX(o.plek(deur[0], o.vLoods, van)), y1: schaal.naarY(van),
        x2: schaal.naarX(o.plek(deur[0], o.vLoods, tot)), y2: schaal.naarY(tot),
        stroke: 'var(--gebeurtenis)', 'stroke-width': 8, 'stroke-linecap': 'butt',
        opacity: 0.85,
      }));
    });

    // Het lichtsignaal van de uitgangssluiting naar de achterkant
    if (toonSignaal) {
      lijnen.appendChild(T.el('line', {
        x1: schaal.naarX(o.gSigStart.x), y1: schaal.naarY(o.gSigStart.t),
        x2: schaal.naarX(o.gSigEind.x), y2: schaal.naarY(o.gSigEind.t),
        stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-dasharray': '7 5',
      }));
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(o.gSigEind.x), cy: schaal.naarY(o.gSigEind.t), r: 6,
        fill: 'var(--kaart)', stroke: 'var(--accent)', 'stroke-width': 2.4,
      }));
      // Dit label hangt aan een punt op de schuine wereldlijn van de
      // achterkant, met de lichtlijn er schuin doorheen. Alleen ruim opzij is
      // er plek, dus de ladder loopt naar beide kanten ver uit.
      const sigTekst = 'nieuws komt hier aan';
      const sigBreed = schatBreedte(sigTekst, 13.5);
      // Het punt ligt op het kruispunt van twee geblokkeerde lijnen: de
      // lichtlijn en de wereldlijn van de achterkant. Vlak ernaast is dus
      // niets vrij; pas een eind erboven of eronder loopt geen van beide
      // lijnen nog door het tekstvak heen.
      const sigPlekken = [];
      [0, 30, -30, 62, -62, 96, -96, 132, -132, 172, -172, 210, -210]
        .forEach(function (dy) {
          // Recht boven of onder het punt, en anders met de rand van het vak
          // op een reeks afstanden ernaast, aan beide kanten.
          sigPlekken.push([0, dy]);
          [16, 54, 100, 155, 220, 300].forEach(function (rand) {
            sigPlekken.push([rand + sigBreed / 2, dy]);
            sigPlekken.push([-rand - sigBreed / 2, dy]);
          });
        });
      merkD(sigTekst, schaal.naarX(o.gSigEind.x), schaal.naarY(o.gSigEind.t) + 5,
            'var(--accent)',
            { anker: 'middle', grootte: 13.5, gewicht: 600, prioriteit: 68,
              plekken: sigPlekken });
    }

    /**
     * Zet een label bij een lijn met helling b door (x0, t0), op een stuk waar
     * die lijn ook echt in het vlak loopt: bij een schuine lijn ligt de zijrand
     * er vaak naast, want hij verlaat het beeld door de boven- of onderrand.
     *
     * De uitwijkplekken vormen een raster rond de lijn: opschuiven langs de
     * lijn, en per plek ook een paar stappen er loodrecht vanaf. Alleen langs
     * de lijn is niet genoeg, want de wereldlijnen kruisen hem onder een vlakke
     * hoek en dan blijft het label kilometers lang in hun blokkade hangen.
     */
    function labelOpLijn(tekst, kleur, prioriteit, b, x0, t0, deel) {
      let xVan = o.xMin, xTot = o.xMax;
      if (Math.abs(b) > 1e-9) {
        const xBij = function (t) { return x0 + (t - t0) / b; };
        const r1 = xBij(o.ctMin), r2 = xBij(o.ctMax);
        xVan = Math.max(xVan, Math.min(r1, r2));
        xTot = Math.min(xTot, Math.max(r1, r2));
      } else if (t0 < o.ctMin || t0 > o.ctMax) {
        return;
      }
      if (xTot <= xVan) return;
      const xLab = xVan + (xTot - xVan) * deel;
      const lang = Math.hypot(1, b);
      const langsX = 1 / lang, langsY = -b / lang;
      const dwarsX = -langsY, dwarsY = langsX;
      const plekken = [];
      // Eerst helemaal langs de lijn schuiven en pas daarna ervan af: een label
      // dat op zijn eigen lijn blijft liggen hoort er zichtbaar bij, een label
      // dat honderd pixels ernaast hangt wijst nergens meer naar.
      [0, 26, -26, 50, -50, 76, -76, 104, -104].forEach(function (zij) {
        [0, 60, -60, 130, -130, 210, -210, 300, -300, 400, -400, 520, -520]
          .forEach(function (langs) {
            plekken.push([langsX * langs + dwarsX * zij,
                          langsY * langs + dwarsY * zij]);
          });
      });
      merkD(tekst, schaal.naarX(xLab), schaal.naarY(t0 + b * (xLab - x0)) - 11, kleur,
            { anker: 'middle', grootte: 13.5, gewicht: 650, prioriteit: prioriteit,
              plekken: plekken });
    }

    // --- Beide kaders tegelijk ----------------------------------------------
    // Dezelfde twee stippen, twee keer doorsneden. De loods legt er één lijn
    // doorheen: voor haar vallen de sluitingen samen. De staaf legt er twee
    // lijnen doorheen, gamma*beta*D uit elkaar, met de hele doorvaart ertussen.
    // Welk kader het diagram ook tekent, die verhouding blijft hetzelfde —
    // alleen de scheefte van het beeld verandert.
    if (toonBeide) {
      // Gestippeld, niet gestreept. Bij 0,9c staat een wereldlijn onder 48° en
      // een snede onder 42°: die twee zijn op helling alleen niet uit elkaar te
      // houden. Een stippellijn leest als "geen voorwerp maar een moment", en
      // dat verschil moet het beeld dragen.
      function snede(b, punt, kleur, tekst, prioriteit, deel) {
        lijnen.appendChild(T.nuLijn(schaal, {
          beta: b, x0: punt.x, t0: punt.t,
          kleur: kleur, dikte: 1.9, streep: '2 6',
        }));
        labelOpLijn(tekst, kleur, prioriteit, b, punt.x, punt.t, deel);
      }
      // De snede van de loods door beide sluitingen — één lijn
      snede(o.vLoods, o.gDeurIn, 'var(--perron)',
            'loods: t = ' + F.nl(o.tLoodsSluit, 2), 82, 0.30);
      // En de twee sneden van de staaf, één per sluiting
      snede(o.vStaaf, o.gDeurUit, 'var(--trein)',
            'staaf: t\u2032 = ' + F.nl(o.tStaafUit, 2), 81, 0.62);
      snede(o.vStaaf, o.gDeurIn, 'var(--trein)',
            'staaf: t\u2032 = ' + F.nl(o.tStaafIn, 2), 80, 0.38);
    }

    // Het nu van het andere kader, door de voorkant van de staaf
    const bAnder = kader === 'loods' ? o.vStaaf : o.vLoods;
    const xVoorNu = o.plek(o.pVoor, o.vStaaf, o.tNu);
    lijnen.appendChild(T.nuLijn(schaal, {
      beta: bAnder, x0: xVoorNu, t0: o.tNu,
      kleur: 'var(--blauw)', dikte: 1.6, streep: '8 5',
    }));
    labelOpLijn(kader === 'loods' ? 'nu volgens de staaf' : 'nu volgens de loods',
                'var(--blauw)', 74, bAnder, xVoorNu, o.tNu,
                bAnder >= 0 ? 0.78 : 0.22);

    // Het nu van dit kader zelf: horizontaal
    lijnen.appendChild(T.el('line', {
      x1: linkerRand, y1: schaal.naarY(o.tNu), x2: rechterRand, y2: schaal.naarY(o.tNu),
      stroke: 'var(--gebeurtenis)', 'stroke-width': 2.2,
    }));
    labels.blokkeerLijn({
      x1: linkerRand, y1: schaal.naarY(o.tNu), x2: rechterRand, y2: schaal.naarY(o.tNu),
      dikte: 12,
    });
    // De nu-lijn is zelf geblokkeerd, dus moet het label er ruim boven of ruim
    // onder blijven: vlak ernaast botst het altijd met zijn eigen lijn.
    merkD('nu', linkerRand + 7, schaal.naarY(o.tNu) - 16, 'var(--gebeurtenis)',
          { grootte: 13.5, gewicht: 700, prioriteit: 60,
           plekken: [[0, 0], [0, -9], [0, 32], [0, 41], [0, -22], [44, 0], [44, 32],
                     [92, 0], [92, 32], [0, -35], [0, 54], [140, 0]] });

    // --- De gebeurtenissen ------------------------------------------------
    const punten = [
      [o.gDeurUit, 'uitgang dicht', 'var(--gebeurtenis)', 92, 8],
      [o.gDeurIn, 'ingang dicht', 'var(--gebeurtenis)', 91, 8],
      [o.gVoorUit, 'voorkant bij de uitgang', 'var(--eigentijd)', 70, 6],
      [o.gAchterIn, 'achterkant voorbij de ingang', 'var(--eigentijd)', 69, 6],
    ];
    punten.forEach(function (p) {
      const px = schaal.naarX(p[0].x), py = schaal.naarY(p[0].t);
      if (py < b.boven - 4 || py > b.onder + 4) return;
      svg.appendChild(T.el('circle', {
        cx: px, cy: py, r: p[4], fill: p[2],
        stroke: 'var(--kaart)', 'stroke-width': 2,
      }));
      labels.blokkeer({ links: px - p[4] - 3, boven: py - p[4] - 3,
                        breedte: (p[4] + 3) * 2, hoogte: (p[4] + 3) * 2 });
      const breed = schatBreedte(p[1], 14.5);
      // Naar de kant waar nog ruimte is, en anders langs de eigen hoogte
      const plekken = [];
      [0, -21, 21, -42, 42, -64, 64, -88, 88].forEach(function (dy) {
        plekken.push([13, dy]);
        plekken.push([-13 - breed, dy]);
      });
      [56, 110, 170, 240, 320].forEach(function (dx) {
        [0, -24, 24, -48, 48, -78, 78, -112, 112].forEach(function (dy) {
          plekken.push([dx, dy]);
          plekken.push([-dx - breed, dy]);
        });
      });
      merkD(p[1], px, py + 5, p[2],
            { grootte: 14.5, gewicht: 650, prioriteit: p[3], plekken: plekken });
    });

    // --- De maatverdeling langs de randen ----------------------------------
    const stapCt = F.netteStap((o.ctMax - o.ctMin) / 9);
    for (let k = Math.ceil(o.ctMin / stapCt) * stapCt; k <= o.ctMax; k += stapCt) {
      const py = schaal.naarY(k);
      svg.appendChild(T.el('line', {
        x1: linkerRand - 7, y1: py, x2: linkerRand, y2: py,
        stroke: 'var(--licht)', 'stroke-width': 1.5,
      }));
      merk(labels, F.nl(k, stapCt < 1 ? 1 : 0), linkerRand - 11, py + 5,
           'var(--tekst-zacht)',
           { anker: 'end', grootte: 13, gewicht: 400, prioriteit: 30,
             plekken: [[0, 0], [0, -15], [0, 15]] });
    }
    const stapX = F.netteStap((o.xMax - o.xMin) / 10);
    for (let k = Math.ceil(o.xMin / stapX) * stapX; k <= o.xMax; k += stapX) {
      const px = schaal.naarX(k);
      svg.appendChild(T.el('line', {
        x1: px, y1: b.onder, x2: px, y2: b.onder + 7,
        stroke: 'var(--licht)', 'stroke-width': 1.5,
      }));
      merk(labels, F.nl(k, stapX < 1 ? 1 : 0), px, b.tik, 'var(--tekst-zacht)',
           { anker: 'middle', grootte: 13, gewicht: 400, prioriteit: 25,
             plekken: [[0, 0], [0, 14], [-26, 0], [26, 0]] });
    }
    svg.appendChild(T.el('line', {
      x1: linkerRand, y1: b.boven, x2: linkerRand, y2: b.onder,
      stroke: 'var(--licht)', 'stroke-width': 1.4,
    }));
    svg.appendChild(T.el('line', {
      x1: linkerRand, y1: b.onder, x2: rechterRand, y2: b.onder,
      stroke: 'var(--licht)', 'stroke-width': 1.4,
    }));
    // De twee asnamen staan op een vaste plek in de marge en gaan daarom niet
    // door de labelplaatser heen: ze horen er altijd te staan. Hun vak wordt
    // wel geblokkeerd, zodat een getal ervoor wijkt in plaats van eronder.
    function asNaam(tekst, px, py, anker) {
      svg.appendChild(T.el('text', {
        x: px, y: py, 'font-size': 13.5, fill: 'var(--tekst-zacht)',
        'text-anchor': anker, 'font-weight': 650,
      }, tekst));
      const breed = schatBreedte(tekst, 13.5);
      labels.blokkeer({
        links: anker === 'end' ? px - breed : px, boven: py - 13,
        breedte: breed, hoogte: 18,
      });
    }
    asNaam(kader === 'loods' ? 'ct (m)' : 'ct\u2032 (m)', linkerRand - 8, b.boven + 13, 'end');
    asNaam(kader === 'loods' ? 'x (m)' : 'x\u2032 (m)', rechterRand, b.onder + 20, 'end');

    // De namen bij de wereldlijnen, hoog in het vlak. Elke naam wijkt uit langs
    // zijn eigen lijn en anders naar de kant waar geen strook ligt.
    const hoog = o.ctMin + (o.ctMax - o.ctMin) * 0.90;
    /** Uitwijkplekken voor een naam naast een wereldlijn met snelheid v. */
    function langsLijn(kant) {
      const plekken = [];
      [0, 22, -22, 44, -44, 68, -68, 96, -96].forEach(function (dy) {
        plekken.push([0, dy]);
      });
      [40, 80, 130, 190].forEach(function (dx) {
        [0, 24, -24, 48, -48].forEach(function (dy) {
          plekken.push([kant * dx, dy]);
          plekken.push([-kant * dx, dy]);
        });
      });
      return plekken;
    }
    merkD('ingang', schaal.naarX(o.plek(o.pIngang, o.vLoods, hoog)) - 11,
          schaal.naarY(hoog), 'var(--perron)',
          { anker: 'end', grootte: 14, gewicht: 650, prioriteit: 64,
            plekken: langsLijn(-1) });
    merkD('uitgang', schaal.naarX(o.plek(o.pUitgang, o.vLoods, hoog)) + 11,
          schaal.naarY(hoog), 'var(--perron)',
          { grootte: 14, gewicht: 650, prioriteit: 63, plekken: langsLijn(1) });
    // De naam van de staaf staat midden in zijn strook, maar die strook is bij
    // een hoge snelheid smal en helemaal geblokkeerd door de twee wereldlijnen.
    // Daarom ook plekken net buiten de strook, links en rechts.
    const staafHoog = o.ctMin + (o.ctMax - o.ctMin) * 0.78;
    const pxA = schaal.naarX(o.plek(o.pAchter, o.vStaaf, staafHoog));
    const pxV = schaal.naarX(o.plek(o.pVoor, o.vStaaf, staafHoog));
    const midden = (pxA + pxV) / 2, halfBreed = Math.abs(pxV - pxA) / 2;
    const staafPlekken = [];
    [0, 24, -24, 50, -50, 76, -76].forEach(function (dy) {
      staafPlekken.push([0, dy]);
    });
    [26, 70, 120].forEach(function (extra) {
      [0, 26, -26, 52, -52].forEach(function (dy) {
        staafPlekken.push([halfBreed + extra, dy]);
        staafPlekken.push([-halfBreed - extra, dy]);
      });
    });
    merkD('staaf', midden, schaal.naarY(staafHoog), 'var(--trein)',
          { anker: 'middle', grootte: 14.5, gewicht: 650, prioriteit: 66,
            plekken: staafPlekken });
  }

  /** De vier kerncijfers boven de uitleg. */
  function vulWaarden(o) {
    const tegelijk = Math.abs(o.sluitVerschil) < 1e-9;
    const pastHier = o.hierStaaf <= o.hierLoods + 1e-12;
    const kaarten = [
      ['\u03b3', F.nl(o.g, 3), 'var(--tekst)'],
      ['Staaf in dit kader', F.nl(o.hierStaaf, 2) + ' m', 'var(--trein)'],
      ['Loods in dit kader', F.nl(o.hierLoods, 2) + ' m', 'var(--perron)'],
      ['Deuren tegelijk dicht?', tegelijk ? 'ja' : 'nee, ' + F.nl(Math.abs(o.sluitVerschil), 2) + ' m ct ertussen',
       tegelijk ? 'var(--eigentijd)' : 'var(--gebeurtenis)'],
    ];
    void pastHier;
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
  }

  /** De twee volgordes naast elkaar: hetzelfde paar gebeurtenissen, andere tijd. */
  function vulVolgorde(o) {
    const g = o.g;
    // Altijd beide kaders laten zien, ongeacht welk kader er getekend wordt.
    const loodsUit = o.tLoodsSluit, loodsIn = o.tLoodsSluit;
    const staafUit = o.tStaafUit;
    const staafIn = o.tStaafIn;
    const rij = function (naam, waarde, klasse) {
      return '<div' + (klasse ? ' class="' + klasse + '"' : '') + '><span>' + naam +
             '</span><b>' + waarde + '</b></div>';
    };
    volgordeVak.innerHTML =
      '<div class="boekhouding">' +
      '<div class="kop"><span>in het loodskader</span><b>t</b></div>' +
      rij('uitgang dicht', F.nl(loodsUit, 2)) +
      rij('ingang dicht', F.nl(loodsIn, 2)) +
      rij('verschil', '0,00', 'som') +
      '</div>' +
      '<div class="boekhouding" style="margin-top:10px">' +
      '<div class="kop"><span>in het staafkader</span><b>t\u2032</b></div>' +
      rij('uitgang dicht', F.nl(staafUit, 2)) +
      rij('ingang dicht', F.nl(staafIn, 2)) +
      rij('verschil = \u03b3\u00b7\u03b2\u00b7D', F.nl(g * beta * D, 2), 'sprong') +
      '</div>' +
      '<p class="duiding">Twee deuren die in de loods samen dichtgaan, doen dat ' +
      'voor de staaf ' + F.nl(g * beta * D, 2) + ' m ct na elkaar \u2014 en in die ' +
      'volgorde: eerst de uitgang, dan de ingang. Dat getal hangt niet van de ' +
      'staaf af, alleen van de <b>afstand tussen de deuren</b> en de snelheid. ' +
      'Twee klokken die in het ene kader gelijk lopen, lopen in het andere ' +
      '\u03b3\u00b7\u03b2\u00b7D uit de pas: dat is dezelfde desynchronisatie als bij de trein ' +
      'met de lichtflits.</p>';
  }

  /** De vragen die bij dit diagram horen, met de getallen van nu erin. */
  function vulVragen(o) {
    const g = o.g;
    const kaarten = [
      ['Waar zit de paradox precies?',
       'past wel (' + F.nl(o.Lkort, 2) + ' \u2264 ' + F.nl(D, 2) + ') \u00e9n past niet (' +
       F.nl(L, 2) + ' > ' + F.nl(o.Dkort, 2) + ')',
       'beide uitspraken zijn waar in hun eigen kader',
       'De loods meet de staaf ' + F.nl(o.Lkort, 2) + ' m en zegt: hij past. De ' +
       'staaf meet de loods ' + F.nl(o.Dkort, 2) + ' m en zegt: hij past niet. Er ' +
       'is geen derde partij die uitmaakt wie gelijk heeft, want "de staaf is ' +
       'helemaal binnen" betekent: de achterkant is binnen \u00e9n de voorkant is ' +
       'binnen \u2014 op hetzelfde moment. En juist dat "op hetzelfde moment" is wat ' +
       'de twee kaders verschillend invullen.'],
      ['Waarom \u00e9\u00e9n lijn door beide stippen, en twee?',
       'de loods snijdt horizontaal, de staaf onder helling \u03b2',
       'loods: t = ' + F.nl(o.tLoodsSluit, 2) + ' \u00a0\u00a0 staaf: t\u2032 = ' +
       F.nl(o.tStaafUit, 2) + ' en ' + F.nl(o.tStaafIn, 2),
       'Een "moment" is geen ding in de ruimtetijd maar een snede erdoorheen, en ' +
       'elk kader snijdt onder zijn eigen hoek. Zet <b>Beide kaders</b> aan en je ' +
       'ziet allebei de sneden door dezelfde twee stippen: de loods legt er ' +
       '\u00e9\u00e9n lijn doorheen, dus voor haar gebeuren ze tegelijk. De staaf legt er ' +
       'twee lijnen doorheen, en tussen die twee ligt de hele doorvaart. De ' +
       'stippen bewegen niet mee \u2014 die liggen vast. Alleen de sneden draaien.'],
      ['Wat gebeurt er nu eigenlijk met de deuren?',
       'ze gaan even dicht en meteen weer open',
       'dicht gedurende ' + F.nl(o.duur, 2) + ' m ct in het loodskader',
       'Het zijn schuiven die dichtklappen en weer opengaan. In het loodskader ' +
       'gebeurt dat aan beide kanten tegelijk, met de staaf ertussen. In het ' +
       'staafkader klapt de uitgang dicht en weer open als de voorkant er nog ' +
       F.nl(g * (D - beta * o.tc), 2) + ' m vandaan is, en de ingang pas als de ' +
       'achterkant er ' + F.nl(g * beta * o.tc - L, 2) + ' m voorbij is. Niets ' +
       'raakt iets, in geen van beide verhalen.'],
      ['Hoe kan de volgorde van twee gebeurtenissen omdraaien?',
       'de twee sluitingen zijn ruimteachtig gescheiden',
       'afstand ' + F.nl(D, 2) + ' m, tijdsverschil 0 \u2192 ds\u00b2 = ' +
       F.nl(-D * D, 1),
       'Alleen bij een ruimteachtig interval kan de volgorde wisselen, en dat ' +
       'is hier het geval: in de loods liggen de twee sluitingen ' + F.nl(D, 2) +
       ' m van elkaar en nul tijd. Geen signaal kan ze verbinden, dus is er geen ' +
       'oorzakelijk verband dat een volgorde zou afdwingen. Precies daarom mag de ' +
       'ene waarnemer de uitgang eerst zien dichtgaan en de andere de ingang.'],
      ['Waarom is \u03b3\u00b7\u03b2\u00b7D het tijdsverschil?',
       't\u2032 = \u03b3(t \u2212 \u03b2\u00b7x), met dezelfde t en \u0394x = D',
       '\u0394t\u2032 = \u2212\u03b3\u00b7\u03b2\u00b7D = \u2212' + F.nl(g * beta * D, 2) +
       ' (dus de uitgang eerst)',
       'Zet twee gebeurtenissen met dezelfde t en een afstand D in de ' +
       'Lorentz-transformatie. De t valt weg en er blijft \u2212\u03b3\u00b7\u03b2\u00b7D over. Het ' +
       'minteken zegt welke kant het op valt: de gebeurtenis die verder in de ' +
       'rijrichting ligt \u2014 hier de uitgang \u2014 krijgt de kleinste t\u2032 en gebeurt ' +
       'dus eerst. Hoe verder de deuren uit elkaar staan, hoe groter het gat.'],
      ['Waarom kan de staaf niet gewoon stoppen als de deur dichtgaat?',
       'niets is star: nieuws gaat nooit sneller dan het licht',
       'de achterkant weet het pas ' +
       F.nl(o.gSigEind.t - o.gSigStart.t, 2) + ' m ct later',
       'Zet <b>Signaal</b> aan. Als de uitgang dichtgaat terwijl de staaf er nog ' +
       'in zit, kan de voorkant tot stilstand komen \u2014 maar de achterkant weet ' +
       'daar niets van tot het bericht er is, en dat bericht gaat op zijn snelst ' +
       'met de lichtsnelheid. Tot die tijd rijdt de achterkant vrolijk door. Een ' +
       'volkomen star voorwerp zou nieuws oneindig snel doorgeven en bestaat ' +
       'daarom niet. Dat is geen technisch bezwaar maar een gevolg van de ' +
       'lichtkegel.'],
      ['Waarom staan de twee wereldlijnen van de staaf scheef?',
       'x = \u03b2\u00b7t + constante',
       'helling \u03b2 = ' + F.nl(beta, 2) + ', breedte van de strook ' +
       F.nl(o.Lkort, 2) + ' m in het loodskader',
       'Een voorwerp met snelheid \u03b2 volgt in het diagram een schuine lijn. Twee ' +
       'uiteinden geven twee parallelle lijnen, en daartussen ligt de hele ' +
       'geschiedenis van de staaf: zijn wereldstrook. De breedte die je meet ' +
       'hangt af van hoe je die strook doorsnijdt. Snij horizontaal (de loods) en ' +
       'je meet ' + F.nl(o.Lkort, 2) + ' m; snij langs de blauwe lijn (de staaf ' +
       'zelf) en je meet ' + F.nl(L, 2) + ' m. Zelfde strook, andere snede.'],
      ['Waarom staat de tijd hier in meters?',
       'ct in plaats van t, met c = 1',
       '1 m ct = de tijd waarin licht \u00e9\u00e9n meter aflegt',
       'Zolang je tijd in seconden en afstand in meters meet, staat er een factor ' +
       '300 000 000 tussen en past er niets op \u00e9\u00e9n tekening. Vermenigvuldig de ' +
       'tijd met c en hij komt in meters uit: dan loopt licht onder precies 45\u00b0 ' +
       'en zijn de twee assen echt vergelijkbaar. Alle lengtes in dit diagram, ' +
       'horizontaal en verticaal, staan in dezelfde eenheid.'],
      ['Wat als de staaf \u00e9cht niet past?',
       'schuif de loods korter dan ' + F.nl(o.Lkort, 2) + ' m',
       o.past ? 'nu past hij nog: ' + F.nl(o.Lkort, 2) + ' \u2264 ' + F.nl(D, 2)
              : 'nu past hij niet: ' + F.nl(o.Lkort, 2) + ' > ' + F.nl(D, 2),
       'Dan is er geen enkel moment waarop de staaf helemaal binnen is, ook niet ' +
       'voor de loods: de voorkant is de uitgang al voorbij voordat de achterkant ' +
       'de ingang bereikt. In het diagram zie je dat de gebeurtenis "voorkant bij ' +
       'de uitgang" dan l\u00e1ger ligt dan "achterkant voorbij de ingang". Dichtgaande ' +
       'deuren raken de staaf dan in elk kader \u2014 en daar is niets paradoxaal aan.'],
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
  function werkBij() {
    betaW.textContent = F.nl(beta, 2) + 'c';
    staafW.textContent = F.nl(L, 1) + ' m';
    loodsW.textContent = F.nl(D, 1) + ' m';
    teken();
  }

  /** Zet de tijdschuif op een bepaald moment in het gekozen kader. */
  function gaNaar(t) {
    const o = opzet();
    const f = (t - o.ctMin) / (o.ctMax - o.ctMin);
    fractie = Math.max(0, Math.min(1, f));
    schuifTijd.value = String(fractie);
    werkBij();
  }

  function stap(nu) {
    if (!speelt) return;
    // De module kan intussen weggeklikt zijn; dan stopt de animatie vanzelf.
    if (!svg.isConnected) { speelt = false; return; }
    const dt = Math.min((nu - laatsteTik) / 1000, 0.1);
    laatsteTik = nu;
    fractie = Math.min(1, fractie + dt / 9);      // negen seconden voor het geheel
    schuifTijd.value = String(fractie);
    werkBij();
    if (fractie >= 1) {
      speelt = false;
      speelKnop.textContent = 'Afspelen';
      speelKnop.classList.remove('aan');
      return;
    }
    requestAnimationFrame(stap);
  }

  schuifBeta.addEventListener('input', function () {
    beta = parseFloat(schuifBeta.value);
    werkBij();
  });
  schuifStaaf.addEventListener('input', function () {
    L = parseFloat(schuifStaaf.value);
    werkBij();
  });
  schuifLoods.addEventListener('input', function () {
    D = parseFloat(schuifLoods.value);
    werkBij();
  });
  schuifTijd.addEventListener('input', function () {
    fractie = parseFloat(schuifTijd.value);
    werkBij();
  });
  speelKnop.addEventListener('click', function () {
    speelt = !speelt;
    speelKnop.textContent = speelt ? 'Pauze' : 'Afspelen';
    speelKnop.classList.toggle('aan', speelt);
    if (speelt) {
      if (fractie >= 0.999) fractie = 0;
      laatsteTik = performance.now();
      requestAnimationFrame(stap);
    }
  });
  beginKnop.addEventListener('click', function () {
    fractie = 0;
    schuifTijd.value = '0';
    werkBij();
  });
  uitKnop.addEventListener('click', function () { gaNaar(opzet().gDeurUit.t); });
  inKnop.addEventListener('click', function () { gaNaar(opzet().gDeurIn.t); });

  function kiesKader(welk) {
    if (kader === welk) return;
    // Hetzelfde moment aanhouden lukt niet: de tijdas is een andere. Wel de
    // relatieve plek op de nieuwe tijdas, zodat het beeld niet wegspringt.
    kader = welk;
    loodsKaderKnop.classList.toggle('aan', welk === 'loods');
    staafKaderKnop.classList.toggle('aan', welk === 'staaf');
    werkBij();
  }
  loodsKaderKnop.addEventListener('click', function () { kiesKader('loods'); });
  staafKaderKnop.addEventListener('click', function () { kiesKader('staaf'); });
  grootKnop.addEventListener('click', function () {
    groot = !groot;
    grootKnop.classList.toggle('aan', groot);
    werkBij();
  });
  beideKnop.addEventListener('click', function () {
    toonBeide = !toonBeide;
    beideKnop.classList.toggle('aan', toonBeide);
    werkBij();
  });
  signaalKnop.addEventListener('click', function () {
    toonSignaal = !toonSignaal;
    signaalKnop.classList.toggle('aan', toonSignaal);
    werkBij();
  });

  werkBij();
}
