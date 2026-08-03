export const read = (key, fallback = []) => { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw) } catch { return fallback } };
export const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const remove = key => localStorage.removeItem(key);
