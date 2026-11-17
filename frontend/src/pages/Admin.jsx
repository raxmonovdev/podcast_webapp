import { useEffect, useState } from "react";
import { api } from "../api";
import { useUser } from "../user";
import { Status } from "../components/Skeleton";
import { LEVELS } from "../levels";
import { tap } from "../sound";

const emptyPodcast = {
  title: "",
  author: "",
  description: "",
  cover_url: "",
  category_id: "",
  level: "A1",
};

const emptyEpisode = {
  title: "",
  audio_url: "",
  duration: "",
  transcript: "",
};

export default function Admin() {
  const user = useUser();
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [podcastForm, setPodcastForm] = useState(emptyPodcast);
  const [episodeForm, setEpisodeForm] = useState(emptyEpisode);
  const [episodePodcastId, setEpisodePodcastId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user?.is_admin) {
      setLoading(false);
      return undefined;
    }
    let ignore = false;
    setLoading(true);
    setError("");
    Promise.all([api("/admin/stats"), api("/categories"), api("/admin/podcasts")])
      .then(([nextStats, nextCategories, nextPodcasts]) => {
        if (ignore) return;
        setStats(nextStats);
        setCategories(nextCategories);
        setPodcasts(nextPodcasts);
        setEpisodePodcastId((current) => current || (nextPodcasts[0] ? String(nextPodcasts[0].id) : ""));
        setPodcastForm((current) => ({
          ...current,
          category_id: current.category_id || (nextCategories[0] ? String(nextCategories[0].id) : ""),
        }));
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Admin ma'lumoti yuklanmadi.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user, tick]);

  function setPodcastField(key, value) {
    setPodcastForm((current) => ({ ...current, [key]: value }));
  }

  function setEpisodeField(key, value) {
    setEpisodeForm((current) => ({ ...current, [key]: value }));
  }

  async function addPodcast(event) {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      await api("/admin/podcasts", {
        method: "POST",
        body: JSON.stringify({
          ...podcastForm,
          category_id: Number(podcastForm.category_id),
        }),
      });
      setPodcastForm({
        ...emptyPodcast,
        category_id: categories[0] ? String(categories[0].id) : "",
      });
      tap("click");
      setNotice("Podcast saqlandi.");
      setTick((value) => value + 1);
    } catch (err) {
      setError(err.message || "Podcast saqlanmadi.");
    }
  }

  async function removePodcast(id) {
    if (!window.confirm("Bu podcast va epizodlari o'chsinmi?")) return;
    tap("click");
    setError("");
    try {
      await api("/admin/podcasts/" + id, { method: "DELETE" });
      setTick((value) => value + 1);
    } catch (err) {
      setError(err.message || "O'chirib bo'lmadi.");
    }
  }

  async function addEpisode(event) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (!episodePodcastId) {
      setError("Avval podcast tanlang.");
      return;
    }
    try {
      await api("/admin/podcasts/" + episodePodcastId + "/episodes", {
        method: "POST",
        body: JSON.stringify({
          title: episodeForm.title,
          audio_url: episodeForm.audio_url,
          transcript: episodeForm.transcript,
          duration: Number(episodeForm.duration) || 0,
        }),
      });
      setEpisodeForm(emptyEpisode);
      tap("click");
      setNotice("Epizod saqlandi.");
      setTick((value) => value + 1);
    } catch (err) {
      setError(err.message || "Epizod saqlanmadi.");
    }
  }

  async function removeEpisode(id) {
    if (!window.confirm("Bu epizod o'chsinmi?")) return;
    tap("click");
    setError("");
    try {
      await api("/admin/episodes/" + id, { method: "DELETE" });
      setTick((value) => value + 1);
    } catch (err) {
      setError(err.message || "O'chirib bo'lmadi.");
    }
  }

  if (!user?.is_admin) {
    return (
      <main className="page">
        <p className="mark">Admin</p>
        <h1 className="hello">Kirish yo'q</h1>
        <p className="empty-inline">Bu bo'lim faqat @raxmonovdev uchun.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="mark">Admin</p>
      <h1 className="hello">@raxmonovdev</h1>
      <p className="hello-sub">Podcast, daraja va transcript.</p>

      {loading ? <div className="skel skel-line lg" /> : null}
      <Status error={error} onRetry={() => setTick((value) => value + 1)} />
      {notice ? <p className="admin-notice">{notice}</p> : null}

      {stats ? (
        <section className="admin-stats">
          <p>
            Foydalanuvchilar <strong>{stats.user_count}</strong>
          </p>
          <h2 className="section-title">Eng ko'p eshitilgan</h2>
          {stats.top_podcasts.length === 0 ? (
            <p className="empty-inline">Hali eshitilgan podcast yo'q.</p>
          ) : (
            <ul className="word-list">
              {stats.top_podcasts.map((item) => (
                <li key={item.id} className="word-row">
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.listens} marta</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <form className="admin-form" onSubmit={addPodcast}>
        <h2 className="section-title">Podcast qo'shish</h2>
        <label className="field">
          Nom
          <input className="text-input" value={podcastForm.title} onChange={(event) => setPodcastField("title", event.target.value)} required />
        </label>
        <label className="field">
          Muallif
          <input className="text-input" value={podcastForm.author} onChange={(event) => setPodcastField("author", event.target.value)} required />
        </label>
        <label className="field">
          Tavsif
          <textarea className="text-input area" value={podcastForm.description} onChange={(event) => setPodcastField("description", event.target.value)} />
        </label>
        <label className="field">
          Kategoriya
          <select className="text-input" value={podcastForm.category_id} onChange={(event) => setPodcastField("category_id", event.target.value)} required>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Daraja
          <select className="text-input" value={podcastForm.level} onChange={(event) => setPodcastField("level", event.target.value)}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Muqova manzili
          <input className="text-input" value={podcastForm.cover_url} placeholder="/covers/life.svg" onChange={(event) => setPodcastField("cover_url", event.target.value)} />
        </label>
        <button className="btn block" type="submit">
          Podcastni saqlash
        </button>
      </form>

      <form className="admin-form" onSubmit={addEpisode}>
        <h2 className="section-title">Epizod qo'shish</h2>
        <label className="field">
          Podcast
          <select className="text-input" value={episodePodcastId} onChange={(event) => setEpisodePodcastId(event.target.value)} required>
            {podcasts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Epizod nomi
          <input className="text-input" value={episodeForm.title} onChange={(event) => setEpisodeField("title", event.target.value)} required />
        </label>
        <label className="field">
          Audio manzili
          <input className="text-input" value={episodeForm.audio_url} placeholder="https://" onChange={(event) => setEpisodeField("audio_url", event.target.value)} required />
        </label>
        <label className="field">
          Davomiylik, soniya
          <input className="text-input" inputMode="numeric" value={episodeForm.duration} onChange={(event) => setEpisodeField("duration", event.target.value)} />
        </label>
        <label className="field">
          Transcript
          <textarea className="text-input area" value={episodeForm.transcript} onChange={(event) => setEpisodeField("transcript", event.target.value)} />
        </label>
        <button className="btn block" type="submit">
          Epizodni saqlash
        </button>
      </form>

      <h2 className="section-title">Podcastlar</h2>
      <ul className="word-list">
        {podcasts.map((item) => (
          <li key={item.id} className="admin-pod">
            <div className="word-row">
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.level} · {item.category_name} · {item.author}
                </small>
              </span>
              <button type="button" className="text-btn" onClick={() => removePodcast(item.id)}>
                O'chirish
              </button>
            </div>
            {item.episodes.map((episode) => (
              <div key={episode.id} className="admin-ep">
                <span>{episode.title}</span>
                <button type="button" className="text-btn" onClick={() => removeEpisode(episode.id)}>
                  O'chirish
                </button>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </main>
  );
}
