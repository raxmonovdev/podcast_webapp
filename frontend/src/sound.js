// Tugma ovozi Web Audio bilan. Fayl yo'q. Pleyer boshqaruvi ovoz chaqirmaydi.

let ctx = null;
let enabled = readEnabled();

function readEnabled() {
  try {
    const saved = localStorage.getItem("sound_enabled");
    if (saved !== null) return JSON.parse(saved);
    // Eski kalit. Yo'q bo'lsa ovoz yoqilgan hisoblanadi.
    const old = localStorage.getItem("podcast-button-sound");
    if (old === "0") return false;
    if (old === "1") return true;
  } catch (err) {
    // Saqlash yopiq bo'lsa, ovoz yoqilgan turadi.
  }
  return true;
}

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq, endFreq = freq, duration = 0.12, volume = 0.07, type = "sine", delay = 0 }) {
  const c = getCtx();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

const SOUNDS = {
  click: () => tone({ freq: 520, endFreq: 780, duration: 0.09 }),
  tab: () => tone({ freq: 660, duration: 0.12, volume: 0.06 }),
  success: () => {
    tone({ freq: 660, duration: 0.14 });
    tone({ freq: 880, duration: 0.2, delay: 0.09 });
  },
  off: () => tone({ freq: 440, endFreq: 330, duration: 0.1, volume: 0.06 }),
};

export function playSound(name = "click") {
  if (!enabled) return;
  try {
    if (SOUNDS[name]) SOUNDS[name]();
  } catch (err) {
    // Audio bloklansa, tugma baribir ishlaydi.
  }
}

export function isSoundEnabled() {
  return enabled;
}

export function soundEnabled() {
  return enabled;
}

export function setSoundEnabled(value) {
  enabled = value;
  try {
    localStorage.setItem("sound_enabled", JSON.stringify(value));
  } catch (err) {
    // Saqlanmasa, shu seansdagi holat baribir tugmada turadi.
  }
}

function hapticFeedback() {
  const webApp = window.Telegram && window.Telegram.WebApp;
  return webApp && webApp.HapticFeedback;
}

export function hapticLight() {
  const feedback = hapticFeedback();
  if (!feedback || !feedback.impactOccurred) return;
  try {
    feedback.impactOccurred("light");
  } catch (err) {
    // Eski mijozda jim o'tamiz.
  }
}

export function hapticSuccess() {
  const feedback = hapticFeedback();
  if (!feedback || !feedback.notificationOccurred) return;
  try {
    feedback.notificationOccurred("success");
  } catch (err) {
    // Eski mijozda jim o'tamiz.
  }
}

// Tebranish. Ovozni umumiy tinglovchi chaladi, shuning uchun bu yerda chalinmaydi.
export function tap(name) {
  if (name === "success") hapticSuccess();
  else hapticLight();
}

// Podcast ustida: faqat tebranish.
export function press() {
  hapticLight();
}
