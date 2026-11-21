// fysica.js — alle relativistische berekeningen op één plek.
// Eenheden: c = 1 tenzij anders vermeld. Snelheden als fractie beta = v/c.
// Alle functies zijn puur: zelfde invoer geeft altijd zelfde uitvoer.

export const C_MS = 299792458; // lichtsnelheid in m/s

/** Lorentzfactor gamma = 1/sqrt(1-beta^2). Gooit bij |beta| >= 1. */
export function gamma(beta) {
  if (!Number.isFinite(beta) || Math.abs(beta) >= 1) {
    throw new RangeError(`beta moet tussen -1 en 1 liggen, kreeg ${beta}`);
  }
  return 1 / Math.sqrt(1 - beta * beta);
}

/** 1/gamma = sqrt(1-beta^2). Dit is ook de lengtecontractiefactor. */
export function factor(beta) {
  return 1 / gamma(beta);
}

/** Tijdsdilatatie: coordinaattijd t bij eigen tijd tau. */
export function tijdsdilatatie(tau, beta) {
  return gamma(beta) * tau;
}

/** Lengtecontractie: waargenomen lengte bij eigen lengte L0. */
export function lengtecontractie(L0, beta) {
  return L0 / gamma(beta);
}

/** Relativistische snelheidsoptelling (c = 1). */
export function snelheidOptellen(b1, b2) {
  const noemer = 1 + b1 * b2;
  if (Math.abs(noemer) < 1e-15) return NaN;
  return (b1 + b2) / noemer;
}

/** Rapiditeit: de hyperbolische hoek die bij een snelheid hoort. Snelheden
 *  tellen niet op, deze hoeken wel: tanh(a + b) is precies de
 *  relativistische som van tanh(a) en tanh(b). */
export function rapiditeit(beta) {
  return Math.atanh(beta);
}

/** De snelheid die bij een hyperbolische hoek hoort. */
export function snelheidBijRapiditeit(hoek) {
  return Math.tanh(hoek);
}

/** Snelheid van een object (beta_obj) gezien vanuit een kader dat zelf
 *  met beta_ref beweegt. */
export function naarKader(betaObj, betaRef) {
  const noemer = 1 - betaObj * betaRef;
  if (Math.abs(noemer) < 1e-12) return NaN;
  return (betaObj - betaRef) / noemer;
}

/** Welk tijdstip op plaats xDoel is, voor een waarnemer met snelheid beta,
 *  gelijktijdig met de gebeurtenis (t, x)? Volgt uit t' = gamma(t - beta*x):
 *  gelijke t' betekent gelijke t - beta*x. c = 1. */
export function gelijktijdigOp(t, x, beta, xDoel = 0) {
  return t - beta * (x - xDoel);
}

/** Lorentz-transformatie van een gebeurtenis (t, x) naar een kader dat
 *  met beta beweegt. Geeft {t, x} in het nieuwe kader. c = 1. */
export function lorentz(t, x, beta) {
  const g = gamma(beta);
  return { t: g * (t - beta * x), x: g * (x - beta * t) };
}

/** Omgekeerde Lorentz-transformatie: van het bewegende kader terug. */
export function lorentzTerug(tAccent, xAccent, beta) {
  const g = gamma(beta);
  return { t: g * (tAccent + beta * xAccent), x: g * (xAccent + beta * tAccent) };
}

/** Invariant ruimtetijdinterval ds^2 = t^2 - x^2 (c = 1).
 *  > 0 tijdachtig, = 0 lichtachtig, < 0 ruimteachtig. */
export function interval(t, x) {
  return t * t - x * x;
}

/** Soort interval als tekst. */
export function intervalSoort(t, x, tolerantie = 1e-9) {
  const ds2 = interval(t, x);
  if (ds2 > tolerantie) return 'tijdachtig';
  if (ds2 < -tolerantie) return 'ruimteachtig';
  return 'lichtachtig';
}

/** Licht dat vertrekt op t = 0, x = 0 achter iets aan dat met beta wegvliegt
 *  en op dat moment een voorsprong heeft: wanneer en waar haalt het licht het
 *  in? Geeft {t, x}; c = 1. Bij een voorsprong L/gamma is x precies L maal de
 *  dopplerfactor. */
export function lichtHaaltIn(voorsprong, beta) {
  const t = voorsprong / (1 - beta);
  return { t: t, x: t };
}

/** Lichtsnelheid in kilometers per microseconde, voor de muonen. */
export const C_KM_PER_US = C_MS / 1e9;

/** Gemiddelde levensduur van een muon in rust, in microseconden. */
export const MUON_LEVENSDUUR_US = 2.1969811;

/** De snelheid (als fractie van c) die bij een lorentzfactor hoort. */
export function betaBijGamma(g) {
  return Math.sqrt(1 - 1 / (g * g));
}

/** Welk deel van een groep instabiele deeltjes nog bestaat nadat er op hun
 *  eigen klok een tijd verstreken is; levensduur is de gemiddelde levensduur
 *  in rust, in dezelfde eenheid. */
export function overleving(eigenTijd, levensduur) {
  return Math.exp(-eigenTijd / levensduur);
}

/** Relativistische dopplerfactor. naderend = true geeft blauwverschuiving. */
export function doppler(beta, naderend = true) {
  const g = gamma(beta); // valideert beta
  void g;
  return naderend
    ? Math.sqrt((1 + beta) / (1 - beta))
    : Math.sqrt((1 - beta) / (1 + beta));
}

/** Klokstand van een klok op positie xAccent in het bewegende kader,
 *  afgelezen vanaf het ruststelsel op tijdstip t.
 *  tau(x') = t/gamma - beta*x'   — de tweede term is de desynchronisatie. */
export function klokstand(t, xAccent, beta) {
  return t / gamma(beta) - beta * xAccent;
}

/** Moment waarop de ruststelsel-klok de (berekende) achterklok inhaalt.
 *  Volgt uit t/gamma + beta*L/2 = t. Geeft Infinity bij beta = 0. */
export function inhaalmoment(beta, L) {
  if (beta === 0) return Infinity;
  const g = gamma(beta);
  const noemer = 1 - 1 / g;
  if (Math.abs(noemer) < 1e-15) return Infinity;
  return (beta * L / 2) / noemer;
}

/** Nette stapgrootte voor asverdeling: 1, 2 of 5 maal een macht van 10. */
export function netteStap(ruweStap) {
  if (!Number.isFinite(ruweStap) || ruweStap <= 0) return 1;
  const macht = Math.pow(10, Math.floor(Math.log10(ruweStap)));
  const genormaliseerd = ruweStap / macht;
  let keuze;
  if (genormaliseerd <= 1) keuze = 1;
  else if (genormaliseerd <= 2) keuze = 2;
  else if (genormaliseerd <= 5) keuze = 5;
  else keuze = 10;
  return keuze * macht;
}

/** Getal in Nederlands formaat: punt wordt komma. */
export function nl(waarde, decimalen = 2) {
  if (!Number.isFinite(waarde)) {
    return Number.isNaN(waarde) ? 'n.v.t.' : '\u221e';
  }
  return waarde.toFixed(decimalen).replace('.', ',');
}
