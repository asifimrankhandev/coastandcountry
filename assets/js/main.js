import { initScrollReveal } from "./components/scroll-reveal.js";
import { initSiteHeader } from "./components/site-header.js";
import { initSiteMenu } from "./components/site-menu.js";

// Shared by every page. Module scripts run after the document is parsed.
initSiteHeader();
initSiteMenu();
initScrollReveal();
