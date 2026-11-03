import { initFeaturedCarousel } from "./home/featured-carousel.js";
import { initFiguresSection } from "./home/figures-section.js";
import { initHeroIntro } from "./home/hero-intro.js";

// Homepage sections only. Module scripts run after the document is parsed.
initHeroIntro();
initFiguresSection();
initFeaturedCarousel();
