// register.js — houdt bij welke modules er zijn.
const modules = [];

export function registreer(item) {
  modules.push(item);
}

export function moduleLijst() {
  return modules;
}
