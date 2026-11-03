import { countUp } from "../components/count-up.js";
import { getPropertyLocations, getPropertyTypes } from "../properties/property-api.js";

export function initFiguresSection() {
  const section = document.querySelector(".figures");
  if (!section) return;

  const areasEl = section.querySelector('[data-figure="areas"]');
  const typesEl = section.querySelector('[data-figure="types"]');
  const regionsEl = section.querySelector('[data-figure="regions"]');
  const phonesEl = section.querySelector('[data-figure="phones"]');

  if (regionsEl) countUp(regionsEl, 3);
  if (phonesEl) countUp(phonesEl, 2);

  void Promise.all([getPropertyLocations(), getPropertyTypes()]).then(([locations, types]) => {
    if (areasEl) {
      if (locations.ok && locations.data.length > 0) {
        countUp(areasEl, locations.data.length);
      } else {
        areasEl.textContent = "—";
      }
    }
    if (typesEl) {
      if (types.ok && types.data.length > 0) {
        countUp(typesEl, types.data.length);
      } else {
        typesEl.textContent = "—";
      }
    }
  });
}
