let themeBound = false;

const THEME_KEY = "theme";
const THEME_BG = { dark: "#14110F", light: "#FFFAF5" };

export function readSavedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "dark" || value === "light") return value;
  } catch (err) {
    // Saqlash yopiq bo'lsa, ilova baribir ochiladi.
  }
  return null;
}

function systemTheme(tg) {
  if (tg && tg.colorScheme) return tg.colorScheme === "light" ? "light" : "dark";
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

function paintTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_BG[theme]);
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    try {
      if (tg.setHeaderColor) tg.setHeaderColor(THEME_BG[theme]);
    } catch (err) {
      // Eski mijozda jim o'tamiz.
    }
    try {
      if (tg.setBackgroundColor) tg.setBackgroundColor(THEME_BG[theme]);
    } catch (err) {
      // Eski mijozda jim o'tamiz.
    }
  }
  window.dispatchEvent(new CustomEvent("podcast-theme", { detail: theme }));
}

function applyTheme(tg) {
  const saved = readSavedTheme();
  paintTheme(saved || systemTheme(tg));
}

// Tugma bosilganda. Tanlov keyingi kirishda Telegramdan ustun.
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    // Saqlanmasa, shu sahifadagi rejim baribir almashadi.
  }
  paintTheme(theme);
}

export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  applyTheme(tg);
  if (!tg) return null;
  tg.ready();
  tg.expand();
  if (!themeBound) {
    tg.onEvent("themeChanged", () => {
      if (readSavedTheme()) return;
      applyTheme(tg);
    });
    themeBound = true;
  }
  return tg;
}

export function inTelegram() {
  return Boolean(window.Telegram?.WebApp?.initData);
}
