import { useEffect, useState } from "react";
import { api } from "../api";
import { formatTime } from "../format";
import { LEVELS } from "../levels";
import { usePlayer } from "../player/PlayerContext";
import PodcastCard from "../components/PodcastCard";
import { Status } from "../components/Skeleton";
import { press, tap } from "../sound";

export default function Search() {
  const player = usePlayer();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("");
  const [podcasts, setPodcasts] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const ready = text.trim() || level;

  useEffect(() => {
    if (!ready) {
      setPodcasts([]);
      setEpisodes([]);
      setError("");
      setSearched(false);
      return undefined;
    }
    let ignore = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (text.trim()) params.set("q", text.trim());
      if (level) params.set("level", level);
      try {
        const data = await api("/search?" + params.toString());
        if (ignore) return;
        setPodcasts(data.podcasts || []);
        setEpisodes(data.episodes || []);
      } catch (err) {
        if (!ignore) setError("Qidiruv ishlamadi.");
      } finally {
        if (!ignore) {
          setLoading(false);
          setSearched(true);
        }
      }
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [text, level, ready]);

  async function play(episode) {
    press();
    try {
      const list = await api("/podcasts/" + episode.podcast_id + "/episodes");
      const current = list.find((item) => item.id === episode.id) || episode;
      player.playEpisode(current, list);
    } catch (err) {
      player.playEpisode(episode, [episode]);
    }
  }

  return (
    <main className="page">
      <p className="mark">Topish</p>
      <h1 className="hello">Qidiruv</h1>
      <label className="field" htmlFor="search-q">
        Podcast yoki epizod nomi
      </label>
      <input
        className="text-input"
        id="search-q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Masalan, Morning"
        autoComplete="off"
      />

      <div className="chips search-chips" role="group" aria-label="Daraja">
        <button type="button" className="chip" aria-pressed={level === ""} onClick={() => { tap("click"); setLevel(""); }}>
          Barchasi
        </button>
        {LEVELS.map((item) => (
          <button key={item} type="button" className="chip" aria-pressed={level === item} onClick={() => { tap("click"); setLevel(item); }}>
            {item}
          </button>
        ))}
      </div>

      {!ready ? <p className="empty-inline">Nom yozing yoki daraja tanlang.</p> : null}
      {ready && !searched ? <p className="empty-inline">Qidirilmoqda...</p> : null}
      {loading && searched ? <p className="empty-inline">Qidirilmoqda...</p> : null}
      <Status error={error} />

      {ready && searched && !loading && podcasts.length === 0 && episodes.length === 0 && !error ? (
        <p className="empty-inline">Hech narsa topilmadi.</p>
      ) : null}

      {podcasts.length > 0 ? <h2 className="section-title">Podcastlar</h2> : null}
      <div className="rows">
        {podcasts.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} layout="row" />
        ))}
      </div>

      {episodes.length > 0 ? <h2 className="section-title">Epizodlar</h2> : null}
      <div className="ep-list">
        {episodes.map((episode) => (
          <button key={episode.id} type="button" className="ep" data-silent onClick={() => play(episode)}>
            <span className="ep-meta">
              <span className="ep-title">{episode.title}</span>
              <span className="ep-sub">
                {episode.podcast_level ? episode.podcast_level + " · " : ""}
                {episode.podcast_title} · {formatTime(episode.duration)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
