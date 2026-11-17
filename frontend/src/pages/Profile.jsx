import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useUser } from "../user";
import { Status } from "../components/Skeleton";
import { isSoundEnabled, playSound, press, setSoundEnabled, tap } from "../sound";

export default function Profile() {
  const user = useUser();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    api("/words")
      .then((rows) => {
        if (!ignore) setWords(rows);
      })
      .catch(() => {
        if (!ignore) setError("So'zlar yuklanmadi.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [tick]);

  function toggleSound() {
    const next = !soundOn;
    if (next) {
      setSoundEnabled(true);
      setSoundOn(true);
      playSound("click");
    } else {
      playSound("off");
      setSoundEnabled(false);
      setSoundOn(false);
    }
    press();
  }

  async function remove(id) {
    tap("click");
    const previous = words;
    setWords(words.filter((item) => item.id !== id));
    try {
      await api("/words/" + id, { method: "DELETE" });
    } catch (err) {
      setWords(previous);
    }
  }

  return (
    <main className="page">
      <p className="mark">Hisob</p>
      <h1 className="hello">{user?.first_name || "Mehmon"}</h1>
      {user?.username ? <p className="hello-sub">@{user.username}</p> : null}
      <div className="switch-row">
        <span>Tugma ovozlari</span>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={soundOn}
          aria-label="Tugma ovozlari"
          data-silent
          onClick={toggleSound}
        >
          <span />
        </button>
      </div>
      {user?.is_admin ? (
        <Link className="btn block admin-link" to="/admin" onClick={() => tap("click")}>
          Admin panel
        </Link>
      ) : null}

      <h2 className="section-title">Mening so'zlarim</h2>
      {loading ? <div className="skel skel-line lg" /> : null}
      <Status error={error} onRetry={() => setTick((value) => value + 1)} />
      {!loading && !error && words.length === 0 ? (
        <p className="empty-inline">Hali so'z yo'q. Epizod matnidagi so'zni bosing.</p>
      ) : null}
      <ul className="word-list">
        {words.map((item) => (
          <li key={item.id} className="word-row">
            <span>
              <strong>{item.word}</strong>
              <small>{item.translation || "tarjima yo'q"}</small>
            </span>
            <button type="button" className="text-btn" onClick={() => remove(item.id)}>
              O'chirish
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
