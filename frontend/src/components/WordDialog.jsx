import { useEffect, useState } from "react";
import { api } from "../api";
import { playSound, tap } from "../sound";

export default function WordDialog({ word, episodeId, onClose }) {
  const [translation, setTranslation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTranslation("");
    setError("");
  }, [word]);

  if (!word) return null;

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/words", {
        method: "POST",
        body: JSON.stringify({
          word: word,
          translation: translation,
          episode_id: episodeId,
        }),
      });
      tap("success");
      playSound("success");
      onClose(true);
    } catch (err) {
      setError("Saqlab bo'lmadi. Qayta urinib ko'ring.");
      setBusy(false);
    }
  }

  return (
    <div className="sheet" role="presentation" onClick={() => { tap("click"); onClose(false); }}>
      <form className="sheet-card" role="dialog" aria-label="So'zni saqlash" onClick={(event) => event.stopPropagation()} onSubmit={save}>
        <p className="mark">So'z</p>
        <h2 className="sheet-word">{word}</h2>
        <label className="field" htmlFor="translation">
          Tarjima (o'zingiz yozing)
        </label>
        <input
          className="text-input"
          id="translation"
          value={translation}
          onChange={(event) => setTranslation(event.target.value)}
          placeholder="Masalan, ertalab"
          maxLength={200}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <div className="sheet-actions">
          <button type="button" className="btn fav-on" onClick={() => { tap("click"); onClose(false); }}>
            Yopish
          </button>
          <button type="submit" className="btn" data-silent disabled={busy}>
            Saqlash
          </button>
        </div>
      </form>
    </div>
  );
}
