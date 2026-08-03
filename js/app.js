import { seed } from "./services/data-service.js";
import { renderLayout, restoreTheme } from "./components/layout.js";
import { setLoading } from "./utils/helpers.js";
import { initHome } from "./controllers/home-controller.js";
import { initLogin, initRegister } from "./controllers/auth-controller.js";
import {
  initPlantForm,
  initPlantDetail,
  initCollection,
} from "./controllers/plant-controller.js";
import { initProfile } from "./controllers/profile-controller.js";
import { initAdmin } from "./controllers/admin-controller.js";
await seed();
restoreTheme();
renderLayout();
const page = document.body.dataset.page;
(
  ({
    home: initHome,
    login: initLogin,
    register: initRegister,
    add: initPlantForm,
    detail: initPlantDetail,
    profile: initProfile,
    myPlants: () => initCollection("mine"),
    favorites: () => initCollection("favorites"),
    admin: initAdmin,
  })[page] || (() => {})
)();
window.AOS?.init({
  once: true,
  duration: 600,
  offset: 40,
  disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
});
setTimeout(() => setLoading(false), 250);
