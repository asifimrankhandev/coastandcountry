import { countUp } from "../components/count-up.js";
import { getPropertyLocations, getPropertyTypes } from "../properties/property-api.js";

/**
 * Animates the "at a glance" figures. Fixed business facts count up straight away; the
 * two catalogue figures come from the live feed and keep their "—" if it is unavailable,
 * so the page never shows a number that is not true.
 */
export function initFiguresSection() {
  const section = document.querySelector(".figures");
  if (!section) return;

  /** @param {string} name */
  const figure = (name) => section.querySelector(`[data-figure="${name}"]`);

  for (const name of ["regions", "phones"]) {
    const element = figure(name);
    const value = Number(element?.textContent);
    if (element instanceof HTMLElement && Number.isFinite(value)) countUp(element, value);
  }

  void Promise.all([getPropertyLocations(), getPropertyTypes()]).then(([locations, types]) => {
    const areas = figure("areas");
    const kinds = figure("types");
    if (areas instanceof HTMLElement && locations.ok && locations.data.length > 0) {
      countUp(areas, locations.data.length);
    }
    if (kinds instanceof HTMLElement && types.ok && types.data.length > 0) {
      countUp(kinds, types.data.length);
    }
  });
}
