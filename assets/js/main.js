import { initScrollReveal } from "./components/scroll-reveal.js";
import { initSiteHeader } from "./components/site-header.js";
import { initSiteMenu } from "./components/site-menu.js";
import { initStackSections } from "./components/stack-sections.js";
import { initFeaturedCarousel } from "./home/featured-carousel.js";
import { initFiguresSection } from "./home/figures-section.js";
import { initHeroIntro } from "./home/hero-intro.js";

// Mark document root with .js so progressive CSS and reveal animations activate
document.documentElement.classList.add("js");

function init() {
  initSiteHeader();
  initSiteMenu();
  initStackSections();
  initScrollReveal();
  initHeroIntro();
  initFiguresSection();
  initFeaturedCarousel();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
