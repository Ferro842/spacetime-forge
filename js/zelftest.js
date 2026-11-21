// zelftest.js — de app controleert zichzelf, op het apparaat waar ze draait.
//
// Vier soorten controles, in de volgorde waarin ze op het scherm komen:
//
//   1. Natuurkunde: de functies uit fysica.js tegen elkaar en tegen de
//      Lorentz-transformatie. Wat in twee kaders hetzelfde moet zijn, wordt in
//      twee kaders uitgerekend.
//   2. Bestanden: staat elke module in de offline-lijst van sw.js, bestaat elk
//      bestand uit die lijst, en zijn de twee versienummers gelijk.
//   3. Verhalen: vindt elke stap van elk verhaal zijn knoppen en schuiven nog.
//   4. Geheugen: komt elke stand uit een verhaal ongeschonden terug als hij
//      bewaard en weer teruggezet wordt (zoals bij herladen of via een link).
//
// Daarnaast een blok met wat dit apparaat over zichzelf meldt. Dat zijn geen
// controles maar metingen: handig om door te geven als iets zich hier anders
// gedraagt dan verwacht.
import * as F from './fysica.js';
import { pasStapToe } from './uitlegmodus.js';
import { leesStand, verschil, zetStand } from './geheugen.js';
import { VERSIE, DATUM } from './versie.js';

const lijst = document.getElementById('uitslag');
const kop = document.getElementById('samenvatting');
const werkbank = document.getElementById('werkbank');
let goed = 0, fout = 0;

function blok(titel) {
  const h = document.createElement('h3');
  h.textContent = titel;
  lijst.appendChild(h);
}
function regel(ok, tekst, toelichting) {
  const d = document.createElement('div');
  d.className = 'regel ' + (ok === null ? 'weet' : ok ? 'goed' : 'fout');
  const merk = document.createElement('span');
  merk.className = 'merk';
  merk.textContent = ok === null ? '\u00b7' : ok ? '\u2713' : '\u2717';
  d.appendChild(merk);
  const t = document.createElement('span');
  t.textContent = tekst + (toelichting ? ' \u2014 ' + toelichting : '');
  d.appendChild(t);
  lijst.appendChild(d);
  if (ok === true) goed++;
  if (ok === false) fout++;
}
const bijna = function (a, b) { return Math.abs(a - b) < 1e-9 * (1 + Math.abs(a) + Math.abs(b)); };
/** Even de browser aan het woord laten, zodat het scherm meeloopt. */
const adem = function () { return new Promise(function (klaar) { setTimeout(klaar, 0); }); };

// --- 1. Natuurkunde ------------------------------------------------------------
function natuurkunde() {
  blok('Natuurkunde');
  const snelheden = [];
  for (let b = -0.95; b < 0.951; b += 0.05) snelheden.push(Math.round(b * 100) / 100);

  // Lorentz heen en terug, en het interval dat daarbij gelijk blijft
  let n = 0, mis = 0;
  snelheden.forEach(function (b) {
    for (let t = -3; t <= 3; t += 1.5) for (let x = -3; x <= 3; x += 1.5) {
      n++;
      const q = F.lorentz(t, x, b), terug = F.lorentzTerug(q.t, q.x, b);
      if (!bijna(terug.t, t) || !bijna(terug.x, x)) mis++;
      if (!bijna(F.interval(q.t, q.x), F.interval(t, x))) mis++;
    }
  });
  regel(mis === 0, 'Lorentz-transformatie heen en terug, interval blijft gelijk', n + ' gevallen');

  // Snelheden optellen is hoeken optellen
  n = 0; mis = 0;
  for (let b = 0.05; b < 0.951; b += 0.05) {
    let v = 0;
    for (let j = 1; j <= 5; j++) {
      v = F.snelheidOptellen(v, b); n++;
      if (!bijna(v, F.snelheidBijRapiditeit(j * F.rapiditeit(b)))) mis++;
      if (!bijna(F.naarKader(v, b), F.snelheidBijRapiditeit((j - 1) * F.rapiditeit(b)))) mis++;
    }
  }
  regel(mis === 0, 'Snelheden optellen is hoeken optellen, vanuit elk kader', n + ' gevallen');

  // Tweeling: wat je ziet telt op tot wat er is
  n = 0; mis = 0;
  for (let b = 0.1; b < 0.951; b += 0.05) {
    n++;
    const T = 5, g = F.gamma(b);
    const heen = (T / g) * F.doppler(b, false), terug = (T / g) * F.doppler(b, true);
    if (!bijna(heen + terug, 2 * T)) mis++;                       // de reiziger ziet de hele aardtijd
    if (!bijna(F.doppler(b, true) * F.doppler(b, false), 1)) mis++;
    if (!bijna(F.gelijktijdigOp(T, b * T, -b) - F.gelijktijdigOp(T, b * T, b), 2 * b * b * T)) mis++;  // de sprong
  }
  regel(mis === 0, 'Tweeling: gezien op de heenweg plus terugweg is de hele aardtijd; de sprong is 2\u00b7\u03b2\u00b2\u00b7T', n + ' snelheden');

  // Staaf in de loods: tegelijk in de loods is gamma*beta*D uit elkaar voor de staaf
  n = 0; mis = 0;
  for (let b = 0.3; b < 0.951; b += 0.05) for (let D = 3; D <= 12; D += 3) {
    n++;
    const a = F.lorentz(7, 0, b), c = F.lorentz(7, D, b);
    if (!bijna(a.t - c.t, F.gamma(b) * b * D)) mis++;
    if (!bijna(F.lengtecontractie(10, b), 10 / F.gamma(b))) mis++;
  }
  regel(mis === 0, 'Loods: twee sluitingen tegelijk liggen voor de staaf \u03b3\u00b7\u03b2\u00b7D uit elkaar', n + ' gevallen');

  // Kever: in beide kaders dezelfde uitkomst, en de reikwijdte is L maal de dopplerfactor
  n = 0; mis = 0;
  for (let b = 0.3; b < 0.951; b += 0.05) for (let L = 6; L <= 14; L += 2) for (let D = 8; D <= 40; D += 4) {
    n++;
    const g = F.gamma(b), tP = (D - L / g) / b, S = F.lichtHaaltIn(L / g, b);
    const Pn = F.lorentz(tP, D, b), Sn = F.lorentz(S.t, S.x, b);
    if (!bijna(S.x, L * F.doppler(b, true)) || !bijna(Pn.x, L) || !bijna(Sn.x, L) || !bijna(Sn.t, L)) mis++;
    if (Math.abs(D - S.x) > 1e-9 && ((tP < S.t) !== (Pn.t < Sn.t))) mis++;
  }
  regel(mis === 0, 'Kever: geplet of niet is in beide kaders hetzelfde; reikwijdte is steel maal dopplerfactor', n + ' gevallen');

  // Epstein: elk pad is na t jaar t lang, ook het geknikte
  n = 0; mis = 0;
  for (let b = 0.05; b < 0.991; b += 0.05) for (let t = 0; t <= 10; t += 0.5) {
    n++;
    const g = F.gamma(b), T = 5;
    const x = t <= T ? b * t : b * (2 * T - t), tau = t / g;
    const len = t <= T ? Math.hypot(x, tau) : Math.hypot(b * T, T / g) + Math.hypot(b * T - x, tau - T / g);
    if (!bijna(len, t) || !bijna(Math.hypot(b * t, tau), t)) mis++;
  }
  regel(mis === 0, 'Epstein: elk pad is na t jaar precies t lang', n + ' gevallen');

  // Telegraaf: het antwoord komt aan op t - beta*x
  n = 0; mis = 0;
  for (let b = -0.9; b < 0.901; b += 0.1) for (let x = 0.5; x <= 2.5; x += 0.5) for (let t = 0.2; t <= 1; t += 0.2) {
    n++;
    if (!bijna(F.gelijktijdigOp(t, x, b), t - b * x)) mis++;
    const hier = F.lorentz(F.gelijktijdigOp(t, x, b), 0, b), daar = F.lorentz(t, x, b);
    if (!bijna(hier.t, daar.t)) mis++;
  }
  regel(mis === 0, 'Telegraaf: het antwoord is voor het relais gelijktijdig met de vraag', n + ' gevallen');
  aanvullendeNatuurkunde();
}

// Controles voor modules die later zijn toegevoegd komen hier bij
function aanvullendeNatuurkunde() {
  // Zien en meten: het licht dat nu aankomt vertrok toen het voorwerp daar was
  let nz = 0, mz = 0;
  for (let b = 0; b < 0.96; b += 0.05) for (let x = -6; x <= 9; x += 1.5) for (let d = 1; d <= 5; d += 2) {
    nz++;
    const q = F.gezienePlaats(x, d, b);
    if (!bijna(q.vertraging, Math.hypot(q.x, d))) mz++;                          // zo lang is het licht onderweg
    if (!bijna(q.x + b * q.vertraging, x)) mz++;                                  // en zo ver vloog het voorwerp door
  }
  for (let b = 0.1; b < 0.96; b += 0.1) {
    nz++;
    const g = F.gamma(b), ver = 1e6, lang = 2 / g;
    // van heel ver recht op je af: de staaf maal de dopplerfactor; van je weg: gedeeld erdoor
    const komt = F.gezienePlaats(-ver + lang / 2, 3, b).x - F.gezienePlaats(-ver - lang / 2, 3, b).x;
    const gaat = F.gezienePlaats(ver + lang / 2, 3, b).x - F.gezienePlaats(ver - lang / 2, 3, b).x;
    if (Math.abs(komt - 2 * Math.sqrt((1 + b) / (1 - b))) > 1e-4) mz++;
    if (Math.abs(gaat - 2 * Math.sqrt((1 - b) / (1 + b))) > 1e-4) mz++;
    // een kubus ver weg, recht voor je: zijvlak 1/gamma, achtervlak beta, samen een draaiing
    const xa = b * ver - 0.5 / g, xv = b * ver + 0.5 / g;
    const zij = F.gezienePlaats(xv, ver, b).x - F.gezienePlaats(xa, ver, b).x;
    const achter = F.gezienePlaats(xa, ver, b).x - F.gezienePlaats(xa, ver + 1, b).x;
    if (Math.abs(zij - 1 / g) > 1e-4 || Math.abs(achter - b) > 1e-4) mz++;
    if (Math.abs(zij * zij + achter * achter - 1) > 1e-3) mz++;
  }
  regel(mz === 0, 'Zien en meten: lichtvertraging klopt, van ver de dopplerfactor, en een kubus draait over de hoek met sinus \u03b2', nz + ' gevallen');
  // Versnellen: hyperbool om een vast punt, en een horizon
  let nv = 0, mv = 0;
  for (let a = 0.2; a <= 2.01; a += 0.3) for (let tau = 0.1; tau * a <= 2.9; tau += 0.3) {
    nv++;
    const r = F.hyperbolischeBeweging(a, tau), r2 = F.hyperbolischeBeweging(a, tau + 1e-6);
    if (!bijna(Math.pow(r.x + 1 / a, 2) - r.t * r.t, 1 / (a * a))) mv++;          // hyperbool om (-1/a, 0)
    if (Math.abs((r2.x - r.x) / (r2.t - r.t) - r.beta) > 1e-5) mv++;              // snelheid is de helling
    if (!bijna(r.beta, F.snelheidBijRapiditeit(a * tau))) mv++;                    // de hoek groeit gelijkmatig
    if (!bijna(F.gelijktijdigOp(r.t, r.x, r.beta), r.beta / a)) mv++;              // zijn nu op aarde blijft onder 1/a
    const tk = 0.5 / a, h = -Math.log(1 - a * tk);                                  // een bericht van voor de horizon
    const aankomst = F.hyperbolischeBeweging(a, h / a);
    if (!bijna(aankomst.t - tk, aankomst.x)) mv++;                                  // het licht haalt hem daar in
  }
  regel(mv === 0, 'Versnellen: hyperbool om een vast punt, nu-lijn blijft onder 1/a, berichten komen aan waar het hoort', nv + ' gevallen');
  // Energie en impuls: de massa is in elk kader dezelfde, ook die van een som
  let ne = 0, me = 0;
  for (let b = 0; b < 0.91; b += 0.1) for (let k = -0.6; k < 0.61; k += 0.2) {
    ne++;
    const g = b > 0 ? F.gamma(b) : 1;
    const a = { E: F.energie(1, b), p: F.impuls(1, b) };
    if (!bijna(F.invarianteMassa(a.E, a.p), 1)) me++;
    if (b < 0.11 && Math.abs((a.E - 1) - 0.5 * b * b) > b * b * b * b) me++;       // Newton bij lage snelheid
    const som = function (tegen) {
      const q1 = F.lorentz(a.E, a.p, k), q2 = F.lorentz(tegen.E, tegen.p, k);
      return F.invarianteMassa(q1.t + q2.t, q1.x + q2.x);
    };
    if (!bijna(som({ E: F.energie(1, -b), p: F.impuls(1, -b) }), 2 * g)) me++;     // frontaal
    if (!bijna(som({ E: 1, p: 0 }), Math.sqrt(2 * (1 + g)))) me++;                 // stilstaand doel
  }
  regel(me === 0, 'Energie en impuls: massa is in elk kader gelijk; frontaal 2\u03b3, op een doel \u221a(2+2\u03b3)', ne + ' gevallen');
  // Muonen: de eigen tijd van de val is in beide verhalen dezelfde
  let n = 0, mis = 0;
  for (let g = 1.5; g <= 40; g += 2.5) for (let H = 1; H <= 20; H += 3) {
    n++;
    const b = F.betaBijGamma(g), c = F.C_KM_PER_US;
    if (!bijna(F.gamma(b), g)) mis++;
    const aarde = (H / (b * c)) / g;          // lange val, trage klok
    const muon = (H / g) / (b * c);           // dunne lucht, gewone klok
    if (!bijna(aarde, muon)) mis++;
    if (!bijna(F.overleving(2 * aarde, 2.2), Math.pow(F.overleving(aarde, 2.2), 2))) mis++;
  }
  regel(mis === 0, 'Muonen: trage klok en dunne lucht geven dezelfde eigen tijd', n + ' gevallen');
}

// --- 2. Bestanden --------------------------------------------------------------
let modules = [];
async function bestanden() {
  blok('Bestanden en versie');
  let index = '', sw = '';
  try {
    index = await (await fetch('index.html', { cache: 'no-store' })).text();
    sw = await (await fetch('sw.js', { cache: 'no-store' })).text();
  } catch (e) {
    regel(null, 'Geen verbinding: de bestanden zijn niet vers op te halen', 'de rest van de zelftest gebruikt wat er in de offline-opslag zit');
    try {
      index = await (await fetch('index.html')).text();
      sw = await (await fetch('sw.js')).text();
    } catch (e2) { /* dan zonder */ }
  }
  const zoek = /\{\s*id:\s*'([^']+)',\s*naam:\s*'([^']+)',\s*pad:\s*'([^']+)'/g;
  let m;
  while ((m = zoek.exec(index)) !== null) modules.push({ id: m[1], naam: m[2], pad: m[3] });
  regel(modules.length > 0, 'Modules gevonden in index.html', String(modules.length));

  const inLijst = (sw.match(/'\.\/[^']*'/g) || []).map(function (s) { return s.slice(1, -1); });
  const ontbreekt = modules.filter(function (mod) { return inLijst.indexOf(mod.pad) < 0; });
  regel(ontbreekt.length === 0, 'Elke module staat in de offline-lijst van sw.js',
    ontbreekt.map(function (mod) { return mod.pad; }).join(', '));

  const nummer = /spacetime-forge-v(\d+)/.exec(sw);
  regel(!!nummer && Number(nummer[1]) === VERSIE, 'Versienummer in sw.js gelijk aan js/versie.js',
    'sw.js ' + (nummer ? nummer[1] : '?') + ', versie.js ' + VERSIE + ' (' + DATUM + ')');

  let weg = [];
  for (let i = 0; i < inLijst.length; i++) {
    if (inLijst[i] === './') continue;
    try {
      const antwoord = await fetch(inLijst[i], { cache: 'no-store' });
      if (!antwoord.ok) weg.push(inLijst[i]);
    } catch (e) { weg.push(inLijst[i] + ' (niet bereikbaar)'); }
  }
  regel(weg.length === 0, 'Elk bestand uit de offline-lijst bestaat', inLijst.length - 1 + ' bestanden' + (weg.length ? ', ontbreekt: ' + weg.join(', ') : ''));
}

// --- 3 en 4. Verhalen en geheugen ------------------------------------------------
function tekenVers(mod) {
  werkbank.innerHTML = '';
  mod.render(werkbank);
}
async function verhalenEnGeheugen() {
  blok('Verhalen en geheugen');
  for (let i = 0; i < modules.length; i++) {
    const wie = modules[i];
    let mod;
    try {
      // Het pad is opgegeven vanaf de pagina, niet vanaf dit bestand
      mod = await import(new URL(wie.pad, document.baseURI).href);
    } catch (e) {
      regel(false, wie.naam + ': module laadt niet', String(e && e.message ? e.message : e));
      continue;
    }
    if (!mod.verhaal || !mod.verhaal.stappen || !mod.verhaal.stappen.length) {
      regel(false, wie.naam + ': geen verhaal voor de uitlegmodus');
      continue;
    }
    if (mod.route) {
      const menu = modules.filter(function (x) { return x.id !== wie.id; }).map(function (x) { return x.id; });
      const inRoute = mod.route.map(function (r) { return r.id; });
      regel(menu.join(' ') === inRoute.join(' '), wie.naam + ': de leerroute volgt het menu',
        menu.join(' ') === inRoute.join(' ') ? inRoute.length + ' modules'
                                             : 'menu: ' + menu.join(', ') + ' \u00b7 route: ' + inRoute.join(', '));
    }
    const stappen = mod.verhaal.stappen;
    const gemist = [], scheef = [];
    let kapot = null;
    for (let s = 0; s < stappen.length && !kapot; s++) {
      try {
        tekenVers(mod);
        const begin = leesStand(werkbank);
        const mist = pasStapToe(werkbank, mod.verhaal.basis, stappen[s]);
        if (mist.length) gemist.push('stap ' + (s + 1) + ': ' + mist.join(', '));
        const nu = leesStand(werkbank);
        const bewaard = verschil(begin, nu);
        tekenVers(mod);
        zetStand(werkbank, bewaard);
        const terug = leesStand(werkbank);
        const anders = Object.keys(nu).filter(function (k) { return nu[k] !== terug[k]; });
        if (anders.length) scheef.push('stap ' + (s + 1) + ': ' + anders.join(', '));
      } catch (e) {
        kapot = 'stap ' + (s + 1) + ': ' + String(e && e.message ? e.message : e);
      }
    }
    werkbank.innerHTML = '';
    if (kapot) { regel(false, wie.naam + ': fout bij het tekenen', kapot); continue; }
    regel(gemist.length === 0, wie.naam + ': elke stap vindt zijn knoppen',
      gemist.length ? gemist.join(' \u00b7 ') : stappen.length + ' stappen');
    regel(scheef.length === 0, wie.naam + ': elke stand komt uit het geheugen terug',
      scheef.join(' \u00b7 '));
    await adem();
  }
}

// --- Dit apparaat ----------------------------------------------------------------
function apparaat() {
  blok('Dit apparaat (metingen, geen controles)');
  const meld = function (naam, waarde) { regel(null, naam + ': ' + waarde); };
  meld('Venster', window.innerWidth + ' \u00d7 ' + window.innerHeight + ', devicePixelRatio ' + window.devicePixelRatio);
  let staand = false;
  try { staand = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { /* onbekend */ }
  meld('Gestart vanaf het beginscherm', staand ? 'ja' : 'nee');
  let opslag = 'nee';
  try {
    localStorage.setItem('spacetime-forge-proef', '1');
    opslag = localStorage.getItem('spacetime-forge-proef') === '1' ? 'ja' : 'nee';
    localStorage.removeItem('spacetime-forge-proef');
  } catch (e) { opslag = 'nee (' + (e && e.name ? e.name : 'geweigerd') + ')'; }
  meld('Lokale opslag werkt', opslag);
  let bewaard = 'niets';
  try {
    const ruw = JSON.parse(localStorage.getItem('spacetime-forge') || 'null');
    if (ruw) bewaard = 'laatste module ' + ruw.module + ', stand van ' + Object.keys(ruw.standen || {}).length + ' modules';
  } catch (e) { bewaard = 'niet te lezen'; }
  meld('Wat de app hier onthouden heeft', bewaard);
  meld('Deelvenster (navigator.share)', typeof navigator.share === 'function' ? 'aanwezig' : 'afwezig');
  meld('Klembord (navigator.clipboard)', navigator.clipboard && typeof navigator.clipboard.writeText === 'function' ? 'aanwezig' : 'afwezig');
  meld('Aanwijzer-events (pen en vinger)', typeof window.PointerEvent === 'function' ? 'aanwezig' : 'afwezig');
  meld('Aanraakpunten', String(navigator.maxTouchPoints || 0));
  const sw = navigator.serviceWorker;
  meld('Service worker', !sw ? 'niet beschikbaar' : sw.controller ? 'actief op deze pagina' : 'beschikbaar, nog niet actief');
  meld('Browser meldt zich als', navigator.userAgent);
}

async function draai() {
  goed = 0; fout = 0; modules = [];
  lijst.innerHTML = '';
  kop.textContent = 'Bezig\u2026';
  kop.className = '';
  try {
    natuurkunde();
    await adem();
    await bestanden();
    await verhalenEnGeheugen();
  } catch (e) {
    regel(false, 'De zelftest zelf liep vast', String(e && e.message ? e.message : e));
  }
  apparaat();
  kop.textContent = fout === 0
    ? 'Alles in orde: ' + goed + ' controles, versie ' + VERSIE
    : fout + ' van de ' + (goed + fout) + ' controles mislukt, versie ' + VERSIE;
  kop.className = fout === 0 ? 'goed' : 'fout';
}

document.getElementById('opnieuw').addEventListener('click', draai);
draai();
