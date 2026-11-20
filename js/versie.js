// versie.js — het versienummer dat de app linksonder laat zien.
//
// Bij elke uitgave op twee plekken ophogen: hier, en in de naam van de cache
// bovenaan sw.js. Die twee horen gelijk te zijn. De app vergelijkt ze zelf:
// ze haalt sw.js vers van het net, en staat daar een hoger nummer in dan hier,
// dan draait er nog oude code en verschijnt de knop om te herladen. Vergeet je
// dit bestand, dan blijft die knop dus staan; vergeet je sw.js, dan verschijnt
// hij nooit.
export const VERSIE = 19;
export const DATUM = '20 november 2026';
