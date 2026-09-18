// teken.js — gedeelde SVG-helpers voor alle modules.
// Werkt met een vaste viewBox, zodat alles meeschaalt met het scherm
// maar de onderlinge verhoudingen (en dus de labelposities) vastliggen.

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Maak een SVG-element met attributen in één keer. */
export function el(naam, attrs = {}, tekst = null) {
  const node = document.createElementNS(SVG_NS, naam);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    node.setAttribute(k, String(v));
  }
  if (tekst !== null) node.textContent = tekst;
  return node;
}

/**
 * Maakt een schaalobject dat natuurkundige coördinaten omzet naar
 * SVG-coördinaten binnen een vaste viewBox.
 *
 * xBereik/yBereik: [min, max] in natuurkundige eenheden
 * marge: {boven, onder, links, rechts} in viewBox-eenheden
 */
export function maakSchaal({ breedte, hoogte, xBereik, yBereik, marge }) {
  const m = Object.assign({ boven: 40, onder: 50, links: 60, rechts: 40 }, marge);
  const tekenB = breedte - m.links - m.rechts;
  const tekenH = hoogte - m.boven - m.onder;
  const [x0, x1] = xBereik;
  const [y0, y1] = yBereik;

  return {
    breedte, hoogte, marge: m, xBereik, yBereik,
    naarX: (x) => m.links + ((x - x0) / (x1 - x0)) * tekenB,
    naarY: (y) => hoogte - m.onder - ((y - y0) / (y1 - y0)) * tekenH,
    // Terug van SVG naar natuurkundige coördinaten (voor sleep-interactie)
    vanX: (px) => x0 + ((px - m.links) / tekenB) * (x1 - x0),
    vanY: (py) => y0 + ((hoogte - m.onder - py) / tekenH) * (y1 - y0),
    tekenB, tekenH,
  };
}

/**
 * Labelplaatser met botsingsdetectie.
 *
 * Verzamelt gewenste labelposities, controleert of ze elkaar overlappen,
 * en verschuift of verbergt labels die botsen. Roep plaats() aan voor elk
 * label en teken() als je klaar bent.
 *
 * Belangrijk over de grenzen van deze aanpak: de breedte van tekst wordt
 * geschat op basis van het aantal tekens en de lettergrootte, niet exact
 * gemeten. Dat is bewust — echt meten vereist de tekst eerst in de DOM te
 * zetten, wat traag is bij live slepen. De schatting is ruim genomen, dus
 * hij overschat eerder dan dat hij onderschat.
 */
export function maakLabelPlaatser({ minAfstand = 4, tekenBreedteFactor = 0.58 } = {}) {
  const wachtrij = [];
  const blokkades = [];   // vakken die al bezet zijn door lijnen, assen, stippen

  function schatBreedte(tekst, grootte) {
    return tekst.length * grootte * tekenBreedteFactor;
  }

  function vakVan(spec, dx, dy) {
    const b = schatBreedte(spec.tekst, spec.grootte);
    const h = spec.grootte;
    const px = spec.x + dx, py = spec.y + dy;
    let links = px;
    if (spec.anker === 'middle') links = px - b / 2;
    else if (spec.anker === 'end') links = px - b;
    return {
      links, rechts: links + b,
      boven: py - h * 0.8, onder: py + h * 0.25,
      x: px, y: py,
    };
  }

  function botst(a, b) {
    return !(a.rechts + minAfstand < b.links ||
             b.rechts + minAfstand < a.links ||
             a.onder + minAfstand < b.boven ||
             b.onder + minAfstand < a.boven);
  }

  return {
    /**
     * Markeer een rechthoek als bezet, zodat labels er niet overheen komen.
     * Gebruik dit voor assen, wereldlijnen en gebeurtenis-stippen.
     * Voor een lijn: geef een dunne rechthoek langs de lijn.
     */
    blokkeer({ links, boven, breedte, hoogte }) {
      blokkades.push({
        links, rechts: links + breedte,
        boven, onder: boven + hoogte,
      });
    },

    /** Markeer een horizontale of verticale lijn als bezet. */
    blokkeerLijn({ x1, y1, x2, y2, dikte = 14 }) {
      const h = dikte / 2;
      blokkades.push({
        links: Math.min(x1, x2) - h, rechts: Math.max(x1, x2) + h,
        boven: Math.min(y1, y2) - h, onder: Math.max(y1, y2) + h,
      });
    },

    /**
     * Zet een label in de wachtrij. Plaatsing gebeurt pas bij oplossen(),
     * zodat labels met hoge prioriteit altijd voorrang krijgen ongeacht
     * de volgorde waarin ze zijn toegevoegd.
     */
    voegToe(spec) {
      const volledig = Object.assign({
        grootte: 14, kleur: 'var(--tekst)', anker: 'start',
        gewicht: 400, prioriteit: 0, cursief: false,
        verschuif: [[0, 0], [0, -17], [0, 17], [0, -34], [0, 34], [0, -51], [0, 51]],
      }, spec);
      wachtrij.push(volledig);
      return volledig;
    },

    /**
     * Lost alle botsingen op en geeft de definitieve posities terug.
     * Hoogste prioriteit eerst; wie geen vrije plek vindt, wordt verborgen.
     */
    oplossen() {
      const gesorteerd = [...wachtrij].sort((a, b) => b.prioriteit - a.prioriteit);
      const bezet = [...blokkades];
      const uitkomst = new Map();

      for (const spec of gesorteerd) {
        let geplaatst = null;
        for (const [dx, dy] of spec.verschuif) {
          const vak = vakVan(spec, dx, dy);
          if (!bezet.some((b) => botst(vak, b))) {
            bezet.push(vak);
            geplaatst = { ...spec, x: vak.x, y: vak.y, zichtbaar: true };
            break;
          }
        }
        uitkomst.set(spec, geplaatst || { ...spec, zichtbaar: false });
      }
      // Terug in de oorspronkelijke volgorde, zodat de tekenvolgorde klopt
      return wachtrij.map((s) => uitkomst.get(s));
    },

    /** Zet een opgelost label om in een SVG-element (null bij verborgen). */
    teken(resultaat) {
      if (!resultaat || !resultaat.zichtbaar) return null;
      return el('text', {
        x: resultaat.x, y: resultaat.y,
        'font-size': resultaat.grootte,
        fill: resultaat.kleur,
        'text-anchor': resultaat.anker,
        'font-weight': resultaat.gewicht,
        'font-style': resultaat.cursief ? 'italic' : null,
      }, resultaat.tekst);
    },

    /** Tekent alles in één keer in een groep. */
    tekenAlles() {
      const groep = el('g', { class: 'labels' });
      for (const r of this.oplossen()) {
        const node = this.teken(r);
        if (node) groep.appendChild(node);
      }
      return groep;
    },

    aantalInWachtrij() { return wachtrij.length; },
  };
}

/** Tekent een lichtkegel (45 graden lijnen) vanuit een punt. */
export function lichtkegel(schaal, { t0 = 0, x0 = 0, kleur = 'var(--licht)', naarVerleden = false } = {}) {
  const groep = el('g', { class: 'lichtkegel' });
  const [, tMax] = schaal.yBereik;
  const reik = tMax - t0;
  const paden = [
    [[x0, t0], [x0 + reik, t0 + reik]],
    [[x0, t0], [x0 - reik, t0 + reik]],
  ];
  if (naarVerleden) {
    const [tMin] = schaal.yBereik;
    const terug = t0 - tMin;
    paden.push([[x0, t0], [x0 + terug, t0 - terug]]);
    paden.push([[x0, t0], [x0 - terug, t0 - terug]]);
  }
  for (const [[xa, ta], [xb, tb]] of paden) {
    groep.appendChild(el('line', {
      x1: schaal.naarX(xa), y1: schaal.naarY(ta),
      x2: schaal.naarX(xb), y2: schaal.naarY(tb),
      stroke: kleur, 'stroke-width': 1.5, 'stroke-dasharray': '6 4',
    }));
  }
  return groep;
}

/** Tekent een wereldlijn: een rechte lijn met helling beta door (x0, t0). */
export function worldline(schaal, { beta, x0 = 0, t0 = 0, kleur, dikte = 2, streep = null }) {
  const [tMin, tMax] = schaal.yBereik;
  const xa = x0 + beta * (tMin - t0);
  const xb = x0 + beta * (tMax - t0);
  return el('line', {
    x1: schaal.naarX(xa), y1: schaal.naarY(tMin),
    x2: schaal.naarX(xb), y2: schaal.naarY(tMax),
    stroke: kleur, 'stroke-width': dikte,
    'stroke-dasharray': streep,
    'stroke-linecap': 'round',
  });
}

/** Tekent een gelijktijdigheidslijn (helling beta) door een punt. */
export function nuLijn(schaal, { beta, x0 = 0, t0 = 0, kleur, dikte = 1.5, streep = '8 5' }) {
  const [xMin, xMax] = schaal.xBereik;
  const ta = t0 + beta * (xMin - x0);
  const tb = t0 + beta * (xMax - x0);
  return el('line', {
    x1: schaal.naarX(xMin), y1: schaal.naarY(ta),
    x2: schaal.naarX(xMax), y2: schaal.naarY(tb),
    stroke: kleur, 'stroke-width': dikte, 'stroke-dasharray': streep,
  });
}

/** Markeert een gebeurtenis met een stip. */
export function gebeurtenis(schaal, { t, x, kleur, straal = 7, vorm = 'cirkel' }) {
  const px = schaal.naarX(x), py = schaal.naarY(t);
  if (vorm === 'ruit') {
    return el('rect', {
      x: px - straal, y: py - straal, width: straal * 2, height: straal * 2,
      fill: kleur, transform: `rotate(45 ${px} ${py})`,
      stroke: 'var(--kaart)', 'stroke-width': 1.5,
    });
  }
  return el('circle', {
    cx: px, cy: py, r: straal, fill: kleur,
    stroke: 'var(--kaart)', 'stroke-width': 1.5,
  });
}

/**
 * Koppelt pinch-zoom en pannen aan een SVG.
 * Gebruikt addEventListener met passive:false, want React's eigen
 * touch-events zijn soms passive en dan blokkeert preventDefault()
 * de paginascroll niet — met als gevolg dat verticaal pannen hapert.
 */
export function koppelZoomEnPan(svgNode, { opWijziging, minZoom = 0.3, maxZoom = 8 }) {
  let zoom = 1, panX = 0, panY = 0;
  let sleept = false, laatsteX = 0, laatsteY = 0, knijpAfstand = null;

  function meld() {
    opWijziging({ zoom, panX, panY });
  }
  function schaalFactor() {
    const rect = svgNode.getBoundingClientRect();
    if (!rect.width) return 1;
    const vb = svgNode.viewBox.baseVal;
    return (vb && vb.width ? vb.width : rect.width) / rect.width;
  }

  function start(e) {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      knijpAfstand = Math.hypot(dx, dy);
    } else {
      const p = e.touches ? e.touches[0] : e;
      sleept = true; laatsteX = p.clientX; laatsteY = p.clientY;
    }
  }
  function beweeg(e) {
    if (e.touches && e.touches.length === 2 && knijpAfstand) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const nieuw = Math.hypot(dx, dy);
      zoom = Math.min(maxZoom, Math.max(minZoom, zoom * (nieuw / knijpAfstand)));
      knijpAfstand = nieuw;
      meld();
    } else if (sleept) {
      e.preventDefault();
      const p = e.touches ? e.touches[0] : e;
      const s = schaalFactor();
      panX += (p.clientX - laatsteX) * s;
      panY += (p.clientY - laatsteY) * s;
      laatsteX = p.clientX; laatsteY = p.clientY;
      meld();
    }
  }
  function stop(e) {
    if (!e.touches || e.touches.length < 2) knijpAfstand = null;
    if (!e.touches || e.touches.length === 0) sleept = false;
  }

  svgNode.addEventListener('touchstart', start, { passive: false });
  svgNode.addEventListener('touchmove', beweeg, { passive: false });
  svgNode.addEventListener('touchend', stop, { passive: false });
  svgNode.addEventListener('touchcancel', stop, { passive: false });
  svgNode.addEventListener('mousedown', start);
  svgNode.addEventListener('mousemove', beweeg);
  svgNode.addEventListener('mouseup', stop);
  svgNode.addEventListener('mouseleave', stop);

  return {
    reset() { zoom = 1; panX = 0; panY = 0; meld(); },
    huidig() { return { zoom, panX, panY }; },
    ontkoppel() {
      svgNode.removeEventListener('touchstart', start);
      svgNode.removeEventListener('touchmove', beweeg);
      svgNode.removeEventListener('touchend', stop);
      svgNode.removeEventListener('touchcancel', stop);
    },
  };
}
