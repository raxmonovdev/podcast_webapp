export function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  if (hours > 0) return hours + ":" + String(minutes).padStart(2, "0") + ":" + secs;
  return minutes + ":" + secs;
}
