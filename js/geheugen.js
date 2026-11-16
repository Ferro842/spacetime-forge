// geheugen.js — onthoudt waar je was, en maakt er een link van.
//
// De stand van een module is wat je aan knoppen en schuiven hebt veranderd
// sinds ze geladen werd. Dat verschil is klein, en past daarom zowel in de
// lokale opslag van de browser als in het adres:
//
//   #loods?lo-beta=0.8&lo-beide=uit&lo-tijd=0.35
//
//   schuif of tekstveld   id=waarde
//   schakelknop           id=aan of id=uit
//   wat geen knop heeft   _naam=getal   (zie hieronder)
//
// Een module hoeft hier niets voor te doen, behalve dit: elke knop en schuif
// die tot de stand hoort heeft een id. Wat geen knop heeft (de versleepbare
// gebeurtenis in de lichtkegel) of preciezer is dan zijn schuif (de tijd in
// tweeling, loods en gelijktijdigheid) zet de module als JSON in data-stand op
// haar .diagram-vak, en ze luistert daar naar het event 'verhaal-stand' om het
// terug te krijgen. Zo'n schuif krijgt zelf data-stand="nee". Terugzetten gaat
// via pasStapToe uit uitlegmodus.js: een bewaarde stand is niets anders dan
// een stap zonder tekst.
//
// Een adres met een module erin is altijd de hele waarheid: '#loods' zonder
// meer betekent de beginstand. Het geheugen dient alleen voor het menu en
// voor een start zonder adres (de app vanaf het beginscherm).

import { pasStapToe } from './uitlegmodus.js';

const SLEUTEL = 'spacetime-forge';
const NAAM = /^_?[A-Za-z][A-Za-z0-9_-]{0,39}$/;

/** Een getal zonder de staart van de drijvende komma. */
function rond(tekst, cijfers) {
  const getal = parseFloat(tekst);
  if (!Number.isFinite(getal)) return String(tekst);
  const macht = Math.pow(10, cijfers);
  return String(Math.round(getal * macht) / macht);
}

/** Leest de hele stand van de module af: elke knop en schuif met een id. */
export function leesStand(doel) {
  const stand = {};
  const velden = doel.querySelectorAll('input[id], button[id]');
  Array.prototype.forEach.call(velden, function (el) {
    if (!NAAM.test(el.id) || el.id.charAt(0) === '_') return;
    // Een schuif waarvan de module de waarde zelf preciezer meldt
    if (el.dataset.stand === 'nee') return;
    if (el.tagName === 'BUTTON') {
      // Een lopende animatie hoort niet bij de stand
      if (el.textContent.trim() === 'Pauze') return;
      stand[el.id] = el.classList.contains('aan') ? 'aan' : 'uit';
    } else if (el.type === 'range') {
      stand[el.id] = rond(el.value, 4);
    } else if (el.type === 'text') {
      stand[el.id] = el.value;
    }
  });
  const vak = doel.querySelector('.diagram-vak');
  if (vak && vak.dataset.stand) {
    try {
      const extra = JSON.parse(vak.dataset.stand);
      Object.keys(extra).forEach(function (naam) {
        // Onafgerond: de module meldt dit juist omdat het precies moet. Bij
        // de loods met een staaf die exact past klapt de deur maar op één
        // ogenblik dicht, en dat haal je alleen met alle cijfers terug.
        if (Number.isFinite(extra[naam])) stand['_' + naam] = String(extra[naam]);
      });
    } catch (fout) { /* dan zonder */ }
  }
  return stand;
}

/** Wat er in nu anders is dan in begin, in de volgorde van de pagina. */
export function verschil(begin, nu) {
  const uit = {};
  Object.keys(nu).forEach(function (naam) {
    if (begin[naam] === nu[naam]) return;
    // Een knop die er bij het laden nog niet was en uit staat, zegt niets
    if (!(naam in begin) && nu[naam] === 'uit') return;
    uit[naam] = nu[naam];
  });
  return uit;
}

/** Zet een bewaarde stand terug op een module die net geladen is. */
export function zetStand(doel, stand) {
  const stap = { aan: {}, stel: {}, stand: {} };
  Object.keys(stand).forEach(function (naam) {
    const waarde = String(stand[naam]);
    if (!NAAM.test(naam)) return;
    if (naam.charAt(0) === '_') {
      const getal = parseFloat(waarde);
      if (Number.isFinite(getal)) stap.stand[naam.slice(1)] = getal;
    } else if (waarde === 'aan' || waarde === 'uit') {
      stap.aan['#' + naam] = waarde === 'aan';
    } else {
      stap.stel['#' + naam] = waarde.slice(0, 40);
    }
  });
  // Een stand uit een oudere versie mag naar een knop wijzen die er niet meer
  // is; dat deel vervalt dan gewoon.
  return pasStapToe(doel, {}, stap);
}

/** Module en stand als het stuk van het adres achter de #. */
export function naarHash(id, stand) {
  const delen = new URLSearchParams();
  Object.keys(stand || {}).forEach(function (naam) { delen.append(naam, stand[naam]); });
  const staart = delen.toString();
  return staart ? id + '?' + staart : id;
}

/** Het omgekeerde. Geeft { id, stand }; stand is null als er geen in staat. */
export function uitHash(hash) {
  const kaal = String(hash || '').replace(/^#/, '');
  const knip = kaal.indexOf('?');
  if (knip < 0) return { id: kaal, stand: null };
  const stand = {};
  let aantal = 0;
  new URLSearchParams(kaal.slice(knip + 1)).forEach(function (waarde, naam) {
    if (!NAAM.test(naam) || aantal >= 60) return;
    stand[naam] = waarde.slice(0, 40);
    aantal++;
  });
  return { id: kaal.slice(0, knip), stand: stand };
}

/** Wat er de vorige keer bewaard is: { module, tab, standen: { id: stand } }. */
export function haalOp() {
  const leeg = { module: null, tab: null, standen: {} };
  try {
    const ruw = JSON.parse(localStorage.getItem(SLEUTEL) || 'null');
    if (!ruw || typeof ruw !== 'object') return leeg;
    return {
      module: typeof ruw.module === 'string' ? ruw.module : null,
      tab: typeof ruw.tab === 'string' ? ruw.tab : null,
      standen: ruw.standen && typeof ruw.standen === 'object' ? ruw.standen : {},
    };
  } catch (fout) {
    // Geen opslag (privevenster, vol, geblokkeerd): dan onthoudt de app niets,
    // maar werkt verder gewoon.
    return leeg;
  }
}

export function bewaar(geheugen) {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(geheugen));
    return true;
  } catch (fout) {
    return false;
  }
}
