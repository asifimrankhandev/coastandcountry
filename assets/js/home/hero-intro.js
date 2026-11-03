/**
 * The intro loader plays for at least LOADER_MIN_MS so it never flashes on a cached visit,
 * and at most LOADER_MAX_MS so a slow connection never blocks the page.
 */
const LOADER_MIN_MS = 250;
const LOADER_MAX_MS = 600;

export function initHeroIntro() {
  const loader = document.querySelector(".page-loader");
  const hero = document.querySelector(".hero");
  if (!hero) return;

  if (!loader) {
    hero.classList.add("is-ready");
    return;
  }

  let photoReady = false;
  let minElapsed = false;
  let finished = false;

  const photo = hero.querySelector(".hero__photo img");
  const heroImg = photo instanceof HTMLImageElement ? photo : null;

  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.add("is-done");
    hero.classList.add("is-ready");
    setTimeout(() => {
      loader.remove();
    }, 500);
  };

  const check = () => {
    if (photoReady && minElapsed) {
      finish();
    }
  };

  const minTimer = setTimeout(() => {
    minElapsed = true;
    check();
  }, LOADER_MIN_MS);

  const maxTimer = setTimeout(() => {
    finish();
  }, LOADER_MAX_MS);

  if (heroImg) {
    if (heroImg.complete && heroImg.naturalWidth > 0) {
      photoReady = true;
      check();
    } else {
      heroImg.addEventListener(
        "load",
        () => {
          photoReady = true;
          check();
        },
        { once: true },
      );
      heroImg.addEventListener(
        "error",
        () => {
          photoReady = true;
          check();
        },
        { once: true },
      );
    }
  } else {
    photoReady = true;
    check();
  }
}
