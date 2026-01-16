// src/pages/EventManager/CreateEventWizard/wizardStorage.js
export const WizardSS = {
  get(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    sessionStorage.removeItem(key);
  },
  clearAll() {
    ["mainEvent", "subEvents", "internalResources", "externalResources", "tasks", "directors"].forEach((k) =>
      sessionStorage.removeItem(k)
    );
  },
};
