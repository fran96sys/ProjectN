import { $, escapeHTML } from "../utils/helpers.js";
import { plants, categories } from "../services/data-service.js";
import { currentUser } from "../services/auth-service.js";
import { plantCard } from "../components/plant-card.js";
export const initHome = () => {
  const all = plants(),
    category = $("#category-filter"),
    community = $("#community-filter");
  categories().forEach((c) =>
    category.insertAdjacentHTML("beforeend", `<option>${c}</option>`),
  );
  [...new Set(all.map((p) => p.community))]
    .sort()
    .forEach((c) =>
      community.insertAdjacentHTML(
        "beforeend",
        `<option>${escapeHTML(c)}</option>`,
      ),
    );
  const render = () => {
    const q = $("#plant-search").value.toLowerCase().trim(),
      filtered = all.filter(
        (p) =>
          [
            p.commonName,
            p.category,
            p.medicinalUse,
            p.community,
            p.scientificName,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q) &&
          (!category.value || p.category === category.value) &&
          (!community.value || p.community === community.value),
      );
    $("#results-count").textContent =
      `${filtered.length} ${filtered.length === 1 ? "planta encontrada" : "plantas encontradas"}`;
    $("#plants-grid").innerHTML = filtered.map(plantCard).join("");
    $("#plants-empty-state").classList.toggle("d-none", !!filtered.length);
    if (!filtered.length)
      $("#plants-empty-state").innerHTML =
        '<div class="empty-state"><i class="bi bi-search-heart"></i><h3>No encontramos resultados</h3><p>Prueba con otra búsqueda o limpia los filtros.</p></div>';
  };
  ["input", "change"].forEach((type) => {
    $("#plant-search").addEventListener(type, render);
    category.addEventListener(type, render);
    community.addEventListener(type, render);
  });
  $("#clear-filters").onclick = () => {
    $("#plant-search").value = "";
    category.value = "";
    community.value = "";
    render();
  };
  $("#hero-plant-count").textContent = all.length;
  const logged = !!currentUser();
  [
    "hero-contribute-link",
    "catalog-contribute-link",
    "contribution-link",
  ].forEach((x) => {
    $(`#${x}`).href = logged
      ? "agregar.html"
      : x === "contribution-link"
        ? "register.html"
        : "login.html";
  });
  render();
};
