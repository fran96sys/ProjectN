import {
  $,
  escapeHTML,
  date,
  notify,
  confirm,
  validateImage,
} from "../utils/helpers.js";
import {
  plants,
  author,
  plantStats,
  comments,
  createPlant,
  updatePlant,
  deletePlant,
  addComment,
  deleteComment,
  toggleFavorite,
  isFavorite,
  categories,
} from "../services/data-service.js";
import { currentUser, isAdmin } from "../services/auth-service.js";
const protectedPage = () => {
  if (!currentUser()) {
    location.href = "login.html";
    return false;
  }
  return true;
};
const formHtml = (plant = {}) =>
  `<form id="plant-form" class="panel p-4" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label required">Nombre común</label><input required class="form-control" name="commonName" value="${escapeHTML(plant.commonName || "")}"></div><div class="col-md-6"><label class="form-label required">Nombre científico</label><input required class="form-control" name="scientificName" value="${escapeHTML(plant.scientificName || "")}"></div><div class="col-12"><label class="form-label required">Descripción</label><textarea required class="form-control" name="description" rows="3">${escapeHTML(plant.description || "")}</textarea></div><div class="col-md-6"><label class="form-label required">Propiedades medicinales</label><input required class="form-control" name="medicinalProperties" placeholder="Ej.: Digestiva, calmante" value="${escapeHTML((plant.medicinalProperties || []).join(", "))}"><div class="form-text">Sepáralas con comas.</div></div><div class="col-md-6"><label class="form-label required">Categoría</label><select required class="form-select" name="category">${categories()
    .map(
      (c) => `<option ${plant.category === c ? "selected" : ""}>${c}</option>`,
    )
    .join(
      "",
    )}</select></div><div class="col-md-6"><label class="form-label required">Parte utilizada</label><input required class="form-control" name="usedPart" value="${escapeHTML(plant.usedPart || "")}"></div><div class="col-md-6"><label class="form-label required">Comunidad</label><input required class="form-control" name="community" value="${escapeHTML(plant.community || "Villa Abecia")}"></div><div class="col-12"><label class="form-label required">Uso medicinal</label><textarea required class="form-control" name="medicinalUse" rows="2">${escapeHTML(plant.medicinalUse || "")}</textarea></div><div class="col-md-6"><label class="form-label required">Preparación</label><textarea required class="form-control" name="preparation" rows="3">${escapeHTML(plant.preparation || "")}</textarea></div><div class="col-md-6"><label class="form-label required">Contraindicaciones</label><textarea required class="form-control" name="contraindications" rows="3">${escapeHTML(plant.contraindications || "")}</textarea></div><div class="col-12"><label class="form-label">Fotografía ${plant.image ? "(deja vacío para conservarla)" : " "}</label><input class="form-control" id="plant-image" type="file" accept="image/*"><img id="image-preview" class="image-preview mt-3 ${plant.image ? "" : "d-none"}" src="${plant.image || ""}" alt="Vista previa de la fotografía"></div><div class="col-12"><div class="medical-note"><i class="bi bi-info-circle me-1"></i> Comparte usos tradicionales con responsabilidad. Esta información no sustituye la orientación de profesionales de salud.</div></div><div class="col-12 text-end"><a class="btn btn-light" href="${plant.id ? `planta.html?id=${plant.id}` : "index.html"}">Cancelar</a> <button class="btn btn-primary" type="submit">${plant.id ? "Guardar cambios" : "Registrar planta"}</button></div></div></form>`;
export const initPlantForm = () => {
  if (!protectedPage()) return;
  const edit = new URLSearchParams(location.search).get("id"),
    plant = edit ? plants().find((p) => p.id === edit) : null;
  if (edit && !plant) {
    location.href = "404.html";
    return;
  }
  $("#plant-form-container").innerHTML = formHtml(plant || {});
  let image = plant?.image || "";
  $("#plant-image").onchange = async (e) => {
    try {
      image = await validateImage(e.target.files[0]);
      const preview = $("#image-preview");
      preview.src = image;
      preview.classList.remove("d-none");
    } catch (err) {
      e.target.value = "";
      window.Swal.fire("Imagen no válida", err.message, "error");
    }
  };
  $("#plant-form").onsubmit = (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.image = image || "img/plants/placeholder.svg";
    try {
      const saved = plant ? updatePlant(plant.id, data) : createPlant(data);
      notify(plant ? "Cambios guardados." : "Planta registrada correctamente.");
      location.href = `planta.html?id=${saved.id}`;
    } catch (err) {
      window.Swal.fire("No fue posible guardar", err.message, "error");
    }
  };
};
const renderComments = (plantId) => {
  $("#comments-list").innerHTML =
    comments()
      .filter((c) => c.plantId === plantId)
      .map((c) => {
        const u = author(c.userId),
          can = isAdmin() || c.userId === currentUser()?.id;
        return `<div class="comment"><img class="avatar" src="${u.avatar}" alt=""><div class="comment__content"><div class="d-flex justify-content-between"><strong>${escapeHTML(u.name)}</strong>${can ? `<button class="icon-action delete-comment" data-id="${c.id}" aria-label="Eliminar comentario"><i class="bi bi-trash"></i></button>` : ""}</div><p class="mb-1">${escapeHTML(c.content)}</p><span class="comment__meta">${date(c.createdAt)}</span></div></div>`;
      })
      .join("") ||
    '<div class="empty-state"><i class="bi bi-chat-square-text"></i><p>Aún no hay comentarios. Sé la primera persona en aportar.</p></div>';
  document.querySelectorAll(".delete-comment").forEach(
    (b) =>
      (b.onclick = async () => {
        if (await confirm("¿Eliminar comentario?")) {
          deleteComment(b.dataset.id);
          renderComments(plantId);
        }
      }),
  );
};
export const initPlantDetail = () => {
  const plant = plants().find(
    (p) => p.id === new URLSearchParams(location.search).get("id"),
  );
  if (!plant) {
    location.href = "404.html";
    return;
  }
  const u = author(plant.authorId),
    stats = plantStats(plant.id),
    me = currentUser(),
    can = isAdmin() || me?.id === plant.authorId;
  document.title = `${plant.commonName} | Natural App Villa Abecia`;
  $("#plant-detail").innerHTML =
    `<div class="container section-space"><a class="text-link" href="index.html"><i class="bi bi-arrow-left"></i> Volver a explorar</a><div class="row g-5 mt-1"><div class="col-lg-5"><img class="plant-detail-image" src="${plant.image}" alt="${escapeHTML(plant.commonName)}"></div><div class="col-lg-7"><span class="plant-card__category">${escapeHTML(plant.category)}</span><h1 class="mt-3 fw-bold">${escapeHTML(plant.commonName)}</h1><p class="fst-italic text-muted">${escapeHTML(plant.scientificName)}</p><p>${escapeHTML(plant.description)}</p><div class="plant-actions mb-4"><button id="favorite-button" class="btn btn-outline-primary"><i class="bi bi-heart${isFavorite(plant.id) ? "-fill" : ""}"></i> ${isFavorite(plant.id) ? "Guardada" : "Guardar favorita"} (${stats.favorites})</button>${can ? `<a class="btn btn-light" href="agregar.html?id=${plant.id}"><i class="bi bi-pencil"></i> Editar</a><button id="delete-plant" class="btn btn-outline-danger">Eliminar</button>` : ""}</div><div class="detail-section"><h2>Propiedades medicinales</h2><div class="category-pills">${plant.medicinalProperties.map((x) => `<span class="category-pill">${escapeHTML(x)}</span>`).join("")}</div></div><div class="detail-section"><h2>Uso medicinal</h2><p>${escapeHTML(plant.medicinalUse)}</p></div><div class="detail-section"><h2>Preparación</h2><p>${escapeHTML(plant.preparation)}</p></div><div class="detail-section"><h2>Parte utilizada</h2><p>${escapeHTML(plant.usedPart)}</p></div><div class="detail-section"><h2>Contraindicaciones</h2><p>${escapeHTML(plant.contraindications)}</p></div><p class="plant-card__meta mt-4">Compartido por ${escapeHTML(u.name)} · ${date(plant.createdAt)} · ${stats.comments} comentarios</p></div></div><section class="row justify-content-center mt-5"><div class="col-lg-9"><h2 class="fw-bold">Conversación comunitaria</h2>${me ? `<form id="comment-form" class="mt-3"><label class="form-label" for="comment-content">Comparte una experiencia o corrección responsable</label><div class="d-flex gap-2"><textarea id="comment-content" class="form-control" rows="2" required></textarea><button class="btn btn-primary align-self-end" type="submit">Comentar</button></div></form>` : '<p><a class="text-link" href="login.html">Inicia sesión</a> para participar en la conversación.</p>'}<div id="comments-list" class="mt-3"></div></div></section></div>`;
  $("#favorite-button").onclick = () => {
    try {
      toggleFavorite(plant.id);
      initPlantDetail();
    } catch (err) {
      location.href = "login.html";
    }
  };
  $("#delete-plant")?.addEventListener("click", async () => {
    if (
      await confirm(
        "¿Eliminar esta planta?",
        "También se eliminarán sus comentarios y favoritos.",
      )
    ) {
      deletePlant(plant.id);
      location.href = "index.html";
    }
  });
  $("#comment-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      addComment(plant.id, $("#comment-content").value);
      $("#comment-content").value = "";
      renderComments(plant.id);
      notify("Comentario publicado.");
    } catch (err) {
      window.Swal.fire("No fue posible comentar", err.message, "error");
    }
  });
  renderComments(plant.id);
};
export const initCollection = (type) => {
  if (!protectedPage()) return;
  const me = currentUser(),
    list =
      type === "favorites"
        ? plants().filter((p) => isFavorite(p.id))
        : plants().filter((p) => p.authorId === me.id);
  $("#collection-title").textContent =
    type === "favorites" ? "Mis plantas favoritas" : "Mis publicaciones";
  $("#collection-copy").textContent =
    type === "favorites"
      ? "Tu selección personal de saberes comunitarios."
      : "Las plantas que has compartido con la comunidad.";
  $("#collection-grid").innerHTML =
    list
      .map(
        (p) =>
          `<div class="col-md-6 col-xl-4"><div class="plant-card"><a href="planta.html?id=${p.id}"><img class="plant-card__image" src="${p.image}" alt=""><div class="plant-card__body"><span class="plant-card__category">${escapeHTML(p.category)}</span><h3>${escapeHTML(p.commonName)}</h3><p class="plant-card__excerpt">${escapeHTML(p.description)}</p></div></a></div></div>`,
      )
      .join("") ||
    '<div class="empty-state"><i class="bi bi-journal-x"></i><h3>Aún no hay plantas aquí</h3><p>Explora el catálogo o agrega tu primer conocimiento.</p><a class="btn btn-primary" href="agregar.html">Agregar planta</a></div>';
};
