import { initScrollReveal } from "./components/scroll-reveal.js";
import { initSiteHeader } from "./components/site-header.js";
import { initSiteMenu } from "./components/site-menu.js";

// Shared by every page. Module scripts run after the document is parsed.
// Tells the inline fail-safe in the page head that scripts started, so scripted styles stay.
document.documentElement.dataset.scriptsReady = "true";
initSiteHeader();
initSiteMenu();
initScrollReveal();
