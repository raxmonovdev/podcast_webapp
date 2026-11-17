import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./Icons";
import { tap } from "../sound";
import { saveTheme } from "../telegram";

function readTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const onTheme = (event) => {
      setTheme(event.detail === "light" ? "light" : "dark");
    };
    window.addEventListener("podcast-theme", onTheme);
    return () => window.removeEventListener("podcast-theme", onTheme);
  }, []);

  function toggle() {
    tap("click");
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
  }

  return (
    <button type="button" className="theme-btn" aria-label="Rejimni almashtirish" onClick={toggle}>
      <span key={theme} className="theme-ico">
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
