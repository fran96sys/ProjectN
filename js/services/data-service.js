import { KEYS, CATEGORIES, APP } from "../config.js";
import { read, write } from "../storage/local-storage.js";
import { id, now } from "../utils/helpers.js";
import { currentUser, isAdmin, users } from "./auth-service.js";

export const plants = () => read(KEYS.plants, []);
export const comments = () => read(KEYS.comments, []);
export const favorites = () => read(KEYS.favorites, []);

export const author = (authorId) =>
  users().find((user) => user.id === authorId) || {
    name: "Autor no disponible",
    avatar: "img/default-avatar.svg",
  };

export const plantStats = (plantId) => ({
  comments: comments().filter((comment) => comment.plantId === plantId).length,
  favorites: favorites().filter((favorite) => favorite.plantId === plantId)
    .length,
});

const allowed = (plant) => isAdmin() || plant.authorId === currentUser()?.id;

export const createPlant = (data) => {
  const user = currentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para registrar una planta.");
  }

  const plant = {
    id: id("plt"),
    ...data,
    medicinalProperties: data.medicinalProperties
      .split(",")
      .map((property) => property.trim())
      .filter(Boolean),
    municipality: APP.municipality,
    department: APP.department,
    authorId: user.id,
    createdAt: now(),
    updatedAt: now(),
  };

  write(KEYS.plants, [plant, ...plants()]);
  return plant;
};

export const updatePlant = (plantId, data) => {
  const plant = plants().find((item) => item.id === plantId);

  if (!plant || !allowed(plant)) {
    throw new Error("No tienes permiso para editar esta planta.");
  }

  const updatedPlant = {
    ...plant,
    ...data,
    medicinalProperties:
      typeof data.medicinalProperties === "string"
        ? data.medicinalProperties
            .split(",")
            .map((property) => property.trim())
            .filter(Boolean)
        : plant.medicinalProperties,
    updatedAt: now(),
  };

  write(
    KEYS.plants,
    plants().map((item) => (item.id === plantId ? updatedPlant : item)),
  );

  return updatedPlant;
};

export const deletePlant = (plantId) => {
  const plant = plants().find((item) => item.id === plantId);

  if (!plant || !allowed(plant)) {
    throw new Error("No tienes permiso para eliminar esta planta.");
  }

  write(
    KEYS.plants,
    plants().filter((item) => item.id !== plantId),
  );
  write(
    KEYS.comments,
    comments().filter((comment) => comment.plantId !== plantId),
  );
  write(
    KEYS.favorites,
    favorites().filter((favorite) => favorite.plantId !== plantId),
  );
};

export const addComment = (plantId, content) => {
  const user = currentUser();

  if (!user) {
    throw new Error("Inicia sesión para comentar.");
  }

  if (!content.trim()) {
    throw new Error("Escribe un comentario.");
  }

  const comment = {
    id: id("cmt"),
    plantId,
    userId: user.id,
    content: content.trim(),
    createdAt: now(),
    updatedAt: now(),
  };

  write(KEYS.comments, [...comments(), comment]);
  return comment;
};

export const deleteComment = (commentId) => {
  const comment = comments().find((item) => item.id === commentId);

  if (!comment || (!isAdmin() && comment.userId !== currentUser()?.id)) {
    throw new Error("No tienes permiso para eliminar este comentario.");
  }

  write(
    KEYS.comments,
    comments().filter((item) => item.id !== commentId),
  );
};

export const toggleFavorite = (plantId) => {
  const user = currentUser();

  if (!user) {
    throw new Error("Inicia sesión para guardar favoritas.");
  }

  const existingFavorite = favorites().find(
    (favorite) => favorite.plantId === plantId && favorite.userId === user.id,
  );

  const updatedFavorites = existingFavorite
    ? favorites().filter((favorite) => favorite.id !== existingFavorite.id)
    : [
        ...favorites(),
        {
          id: id("fav"),
          plantId,
          userId: user.id,
          createdAt: now(),
        },
      ];

  write(KEYS.favorites, updatedFavorites);
  return !existingFavorite;
};

export const isFavorite = (plantId) =>
  favorites().some(
    (favorite) =>
      favorite.plantId === plantId && favorite.userId === currentUser()?.id,
  );

export const seed = async () => {
  const settings = read(KEYS.settings, null);

  if (settings?.seeded) {
    return;
  }

  const passwordSalt = "natural-app-demo";
  const encodedPassword = new TextEncoder().encode(`${passwordSalt}:Admin123*`);
  const hash = await crypto.subtle.digest("SHA-256", encodedPassword);
  const passwordHash = [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const admin = {
    id: "usr_admin",
    name: "Administración Natural App",
    email: "admin@villaabecia.bo",
    passwordSalt,
    passwordHash,
    role: "admin",
    avatar: "img/default-avatar.svg",
    bio: "Equipo de administración comunitaria.",
    community: "Villa Abecia",
    createdAt: now(),
    updatedAt: now(),
  };

  const initialPlants = [
    {
      commonName: "Manzanilla",
      scientificName: "Matricaria chamomilla",
      description:
        "Planta aromática tradicionalmente valorada por su suavidad y agradable aroma.",
      medicinalProperties: ["Digestiva", "Antiinflamatoria"],
      medicinalUse: "Malestares digestivos leves y sensación de calma.",
      preparation:
        "Infusionar una cucharadita de flores secas en una taza de agua caliente durante 5 minutos.",
      contraindications:
        "Evitar si existe alergia a plantas de la familia Asteraceae.",
      usedPart: "Flores",
      category: "Digestivas",
      community: "Villa Abecia",
      image: "img/plants/mi-manzanilla.jpg",
    },
    {
      commonName: "Matico",
      scientificName: "Buddleja globosa",
      description:
        "Arbusto de flores anaranjadas conocido en los saberes tradicionales de la región.",
      medicinalProperties: ["Piel", "Cicatrizante"],
      medicinalUse: "Uso externo tradicional para el cuidado de la piel.",
      preparation:
        "Lavar las hojas y preparar una infusión para uso externo cuando esté tibia.",
      contraindications:
        "No aplicar en heridas profundas; consultar a un profesional de salud.",
      usedPart: "Hojas",
      category: "Piel",
      community: "Pampa Grande",
      image: "img/plants/matico.jpg",
    },
    {
      commonName: "Eucalipto",
      scientificName: "Eucalyptus globulus",
      description:
        "Árbol de aroma intenso empleado en preparados tradicionales de vapor.",
      medicinalProperties: ["Respiratoria", "Aromática"],
      medicinalUse:
        "Acompañamiento tradicional en molestias respiratorias leves.",
      preparation:
        "Agregar hojas en agua caliente y aprovechar el vapor con cuidado.",
      contraindications:
        "No ingerir aceite esencial. Mantener lejos de niños pequeños.",
      usedPart: "Hojas",
      category: "Respiratorias",
      community: "Villa Abecia",
      image: "img/plants/eucalipto.jpg",
    },
  ].map((plant, index) => ({
    id: `plt_seed_${index + 1}`,
    ...plant,
    municipality: APP.municipality,
    department: APP.department,
    authorId: admin.id,
    createdAt: now(),
    updatedAt: now(),
  }));

  write(KEYS.users, [admin]);
  write(KEYS.plants, initialPlants);
  write(KEYS.comments, []);
  write(KEYS.favorites, []);
  write(KEYS.settings, {
    theme: "light",
    seeded: true,
    version: 1,
  });
};

export const categories = () => CATEGORIES;
