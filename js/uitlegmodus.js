// uitlegmodus.js — de app als uitlegbord, voor als je het aan iemand laat zien.
//
// Het menu en de zijkolom verdwijnen, de tekening krijgt de volle hoogte, en
// ernaast staat één stap van een verhaal in grote letters. Met Vorige en
// Volgende loop je erdoorheen; elke stap zet de module zelf in de goede stand.
// Over de tekening ligt een tekenlaag voor vinger of pen.
//
// Een module levert zijn verhaal als gegevens, niet als code:
//
//   export const verhaal = {
//     basis:   { aan: {...}, stel: {...}, tik: [...] },   // geldt voor elke stap
//     stappen: [{ kop, tekst, aan, stel, tik }, ...],
//   };
//
//   aan    knop -> true/false   schakelaar met de klasse 'aan' in de gewenste stand
//   stel   veld -> waarde       schuif of tekstveld; getal, tekst, of { deel: 0..1 }
//                               van het bereik van de schuif
//   tik    [knop, ...]          knoppen die gewoon ingedrukt worden, in volgorde
//   stand  { ... }              voor wat geen knop heeft, zoals een punt dat je
//                               alleen kunt verslepen. Komt bij de module aan als
//                               het event 'verhaal-stand' op haar .diagram-vak.
//
// Een knop of veld wijs je aan met een selector die met '#' begint ('#lo-beta',
// '#mk-kader button:nth-child(2)'), of een knop met zijn opschrift.
//
// Volgorde binnen een stap: eerst de tik van de basis (die kiest de opzet,
// bijvoorbeeld het aantal objecten), dan aan, stel en stand, en als laatste de
// tik van de stap zelf (een sprongknop mag de tijdschuif dus overstemmen).
// Elke stap begint bij de basis, dus Vorige werkt net zo goed als Volgende.

/** Zoekt een knop op id of op opschrift, binnen de module. */
function zoek(doel, wie) {
  if (wie.charAt(0) === '#') return doel.querySelector(wie);
  const knoppen = doel.querySelectorAll('button');
  for (let i = 0; i < knoppen.length; i++) {
    if (knoppen[i].textContent.trim() === wie) return knoppen[i];
  }
  return null;
}

/** Zet de module in de stand die bij deze stap hoort. Geeft terug wat er niet
 *  gevonden werd, zodat een test dat kan melden. */
export function pasStapToe(doel, basis, stap) {
  const gemist = [];
  const b = basis || {};
  // Een lopende animatie eerst stilzetten, anders vecht die met de stand
  Array.prototype.forEach.call(doel.querySelectorAll('button'), function (k) {
    if (k.textContent.trim() === 'Pauze') k.click();
  });

  function tikAlle(lijst) {
    (lijst || []).forEach(function (wie) {
      const knop = zoek(doel, wie);
      if (!knop) { gemist.push(wie); return; }
      knop.click();
    });
  }
  tikAlle(b.tik);

  const aan = Object.assign({}, b.aan, stap.aan);
  Object.keys(aan).forEach(function (wie) {
    const knop = zoek(doel, wie);
    if (!knop) { gemist.push(wie); return; }
    if (knop.classList.contains('aan') !== aan[wie]) knop.click();
  });

  const stel = Object.assign({}, b.stel, stap.stel);
  Object.keys(stel).forEach(function (wie) {
    const schuif = doel.querySelector(wie);
    if (!schuif) { gemist.push(wie); return; }
    let waarde = stel[wie];
    if (typeof waarde === 'object') {
      const min = parseFloat(schuif.min) || 0, max = parseFloat(schuif.max);
      waarde = min + waarde.deel * (max - min);
    }
    schuif.value = String(waarde);
    schuif.dispatchEvent(new Event('input'));
  });

  const stand = Object.assign({}, b.stand, stap.stand);
  const vak = doel.querySelector('.diagram-vak');
  if (vak && Object.keys(stand).length) {
    vak.dispatchEvent(new CustomEvent('verhaal-stand', { detail: stand }));
  }

  tikAlle(stap.tik);
  return gemist;
}

/**
 * De tekenlaag: een doorzichtig vel over de tekening. Werkt met pointer events,
 * dus met vinger, muis en pen. Zodra er een pen is gezien telt een vinger niet
 * meer mee, zodat je hand op het scherm mag rusten.
 */
function maakTekenlaag(vak) {
  const doek = document.createElement('canvas');
  doek.className = 'tekenlaag';
  vak.appendChild(doek);
  const ctx = doek.getContext('2d');
  let halen = [];          // elke haal: { kleur, punten: [{x, y}] }
  let bezig = null, aanwijzer = null, penGezien = false;
  let kleur = 'var(--gebeurtenis)', actief = false;

  /** Een kleur uit het thema omzetten naar iets wat een canvas begrijpt. */
  function echteKleur(naam) {
    const m = /^var\((--[^)]+)\)$/.exec(naam);
    if (!m) return naam;
    return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  }
  function tekenHaal(haal) {
    const p = haal.punten;
    if (!p.length) return;
    ctx.strokeStyle = echteKleur(haal.kleur);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p.length === 1) {
      ctx.beginPath(); ctx.arc(p[0].x, p[0].y, 2, 0, 2 * Math.PI); ctx.fill();
      return;
    }
    // Vloeiend door de middens van opeenvolgende punten, zodat een snelle haal
    // geen hoekige lijn wordt
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length - 1; i++) {
      ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
    }
    ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    ctx.stroke();
  }
  function herteken() {
    ctx.clearRect(0, 0, doek.width, doek.height);
    halen.forEach(tekenHaal);
  }
  function pasMaat() {
    const maat = vak.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    doek.width = Math.round(maat.width * dpr);
    doek.height = Math.round(maat.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    herteken();
  }
  function puntVan(e) {
    const maat = doek.getBoundingClientRect();
    return { x: e.clientX - maat.left, y: e.clientY - maat.top };
  }
  doek.addEventListener('pointerdown', function (e) {
    if (!actief || bezig) return;
    if (e.pointerType === 'pen') penGezien = true;
    if (penGezien && e.pointerType === 'touch') return;
    e.preventDefault();
    aanwijzer = e.pointerId;
    try { doek.setPointerCapture(aanwijzer); } catch (fout) { /* niet overal nodig */ }
    bezig = { kleur: kleur, punten: [puntVan(e)] };
    halen.push(bezig);
    herteken();
  });
  doek.addEventListener('pointermove', function (e) {
    if (!bezig || e.pointerId !== aanwijzer) return;
    e.preventDefault();
    bezig.punten.push(puntVan(e));
    herteken();
  });
  function klaar(e) {
    if (!bezig || e.pointerId !== aanwijzer) return;
    bezig = null; aanwijzer = null;
  }
  doek.addEventListener('pointerup', klaar);
  doek.addEventListener('pointercancel', klaar);
  window.addEventListener('resize', pasMaat);
  pasMaat();

  return {
    zetActief: function (aan) { actief = aan; doek.classList.toggle('actief', aan); },
    zetKleur: function (k) { kleur = k; },
    wis: function () { halen = []; bezig = null; herteken(); },
    aantal: function () { return halen.length; },
    pasMaat: pasMaat,
    weg: function () {
      window.removeEventListener('resize', pasMaat);
      if (doek.parentNode) doek.parentNode.removeChild(doek);
    },
  };
}

const KLEUREN = ['var(--gebeurtenis)', 'var(--blauw)', 'var(--eigentijd)', 'var(--tekst)'];

/**
 * Start de uitlegmodus voor de module die nu in doel staat. Geeft een functie
 * terug waarmee je hem van buitenaf sluit.
 */
export function startUitlegmodus(doel, verhaal, moduleNaam, opSluit) {
  const vak = doel.querySelector('.diagram-vak');
  const stappen = (verhaal && verhaal.stappen) || [];
  const basis = (verhaal && verhaal.basis) || {};
  let nr = 0;

  document.body.classList.add('uitlegmodus');
  const paneel = document.createElement('div');
  paneel.className = 'verhaal';
  paneel.innerHTML =
    '<div class="verhaal-kop">' +
    '  <div><div class="verhaal-module"></div><div class="verhaal-teller"></div></div>' +
    '  <button class="knop" data-rol="sluit">Sluiten</button>' +
    '</div>' +
    '<div class="verhaal-stippen"></div>' +
    '<div class="verhaal-tekst"><h3></h3><p></p></div>' +
    '<div class="verhaal-teken">' +
    '  <button class="knop" data-rol="teken">Tekenen</button>' +
    '  <div class="verhaal-kleuren"></div>' +
    '  <button class="knop" data-rol="wis">Wis</button>' +
    '</div>' +
    '<div class="verhaal-nav">' +
    '  <button class="knop" data-rol="vorige">\u2190 Vorige</button>' +
    '  <button class="knop aan" data-rol="volgende">Volgende \u2192</button>' +
    '</div>';
  doel.appendChild(paneel);
  const el = function (rol) { return paneel.querySelector('[data-rol="' + rol + '"]'); };
  paneel.querySelector('.verhaal-module').textContent = moduleNaam;

  const laag = maakTekenlaag(vak);
  const kleurVak = paneel.querySelector('.verhaal-kleuren');
  const kleurKnoppen = KLEUREN.map(function (k, i) {
    const knop = document.createElement('button');
    knop.className = 'kleurkeuze' + (i === 0 ? ' aan' : '');
    knop.style.setProperty('--k', k);
    knop.setAttribute('aria-label', 'Tekenkleur ' + (i + 1));
    knop.addEventListener('click', function () {
      laag.zetKleur(k);
      kleurKnoppen.forEach(function (x) { x.classList.toggle('aan', x === knop); });
      if (!tekent) zetTekenen(true);
    });
    kleurVak.appendChild(knop);
    return knop;
  });

  let tekent = false;
  function zetTekenen(aan) {
    tekent = aan;
    laag.zetActief(aan);
    el('teken').classList.toggle('aan', aan);
  }

  const stippen = paneel.querySelector('.verhaal-stippen');
  stappen.forEach(function () { stippen.appendChild(document.createElement('span')); });

  function toon() {
    const stap = stappen[nr];
    laag.wis();
    if (stap) {
      pasStapToe(doel, basis, stap);
      paneel.querySelector('.verhaal-tekst h3').textContent = stap.kop;
      paneel.querySelector('.verhaal-tekst p').textContent = stap.tekst;
      paneel.querySelector('.verhaal-teller').textContent =
        'stap ' + (nr + 1) + ' van ' + stappen.length;
    } else {
      paneel.querySelector('.verhaal-tekst h3').textContent = 'Vrij uitleggen';
      paneel.querySelector('.verhaal-tekst p').textContent =
        'Voor deze module is nog geen verhaal geschreven. Sleep in de tekening en ' +
        'teken erbij wat je wilt laten zien.';
    }
    Array.prototype.forEach.call(stippen.children, function (s, i) {
      s.classList.toggle('aan', i === nr);
      s.classList.toggle('geweest', i < nr);
    });
    el('vorige').disabled = nr === 0;
    el('volgende').disabled = nr >= stappen.length - 1;
    el('volgende').classList.toggle('aan', nr < stappen.length - 1);
  }
  function ga(naar) {
    if (naar < 0 || naar >= stappen.length) return;
    nr = naar;
    toon();
  }
  function toets(e) {
    if (e.key === 'ArrowRight') ga(nr + 1);
    else if (e.key === 'ArrowLeft') ga(nr - 1);
    else if (e.key === 'Escape') sluit();
  }
  function sluit() {
    document.removeEventListener('keydown', toets);
    laag.weg();
    if (paneel.parentNode) paneel.parentNode.removeChild(paneel);
    document.body.classList.remove('uitlegmodus');
    if (opSluit) opSluit();
  }

  el('vorige').addEventListener('click', function () { ga(nr - 1); });
  el('volgende').addEventListener('click', function () { ga(nr + 1); });
  el('sluit').addEventListener('click', sluit);
  el('teken').addEventListener('click', function () { zetTekenen(!tekent); });
  el('wis').addEventListener('click', function () { laag.wis(); });
  document.addEventListener('keydown', toets);

  // De indeling is net veranderd; pas daarna klopt de maat van het tekenvel
  laag.pasMaat();
  toon();
  return sluit;
}
