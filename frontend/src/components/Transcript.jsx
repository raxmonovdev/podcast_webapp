import { tap } from "../sound";

// Ingliz matnini so'zlarga bo'ladi. So'z tugma, tinish belgisi oddiy matn.
export default function Transcript({ text, onWord }) {
  const parts = String(text || "").split(/([A-Za-z]+(?:'[A-Za-z]+)?)/);
  if (!text) return <p className="empty-inline">Bu epizodda matn yo'q.</p>;

  return (
    <p className="transcript-text">
      {parts.map((part, index) => {
        if (!/^[A-Za-z]/.test(part)) return <span key={index}>{part}</span>;
        return (
          <button key={index} type="button" className="word" onClick={() => { tap("click"); onWord(part); }}>
            {part}
          </button>
        );
      })}
    </p>
  );
}
