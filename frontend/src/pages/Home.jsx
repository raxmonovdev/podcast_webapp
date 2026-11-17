import { useEffect, useState } from "react";
import { api } from "../api";
import { inTelegram } from "../telegram";
import { formatTime } from "../format";
import { usePlayer } from "../player/PlayerContext";
import { useUser } from "../user";
import Cover from "../components/Cover";
import PodcastCard from "../components/PodcastCard";
import { SkeletonHome, Status } from "../components/Skeleton";
import { LEVELS } from "../levels";
import { press, tap } from "../sound";

export default function Home() {
  const user = useUser();
  const player = usePlayer();
  const [categories, setCategories] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [category, setCategory] = useState(null);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (level) params.set("level", level);
      const query = params.toString() ? "?" + params.toString() : "";
      try {
        const [cats, pods, eps] = await Promise.all([
          api("/categories"),
          api("/podcasts" + query),
          api("/episodes/latest" + query),
        ]);
        if (ignore) return;
        setCategories(cats);
        setPodcasts(pods);
        setEpisodes(eps);
      } catch (err) {
        if (ignore) return;
        setError(
          err.status === 401
            ? "Kirish tasdiqlanmadi. .env da ALLOW_DEV_AUTH=true ekanini tekshiring."
            : "Ma'lumot yuklanmadi. Backend 8000-portda ishlayaptimi?"
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [category, level, tick]);

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
      <p className="mark">English Podcast</p>
      <h1 className="hello">Salom, {user?.first_name || "do'st"}</h1>
      <p className="hello-sub">
        {inTelegram() ? "Inglizcha eshiting, o'zbekcha o'qing." : "Brauzerda sinov rejimi."}
      </p>

      {loading ? <SkeletonHome /> : null}
      <Status error={error} onRetry={() => setTick((value) => value + 1)} />

      {!loading && !error ? (
        <>
          <h2 className="section-title">Kategoriyalar</h2>
          <div className="chips" role="group" aria-label="Kategoriyalar">
            <button type="button" className="chip" aria-pressed={category === null} onClick={() => { tap("click"); setCategory(null); }}>
              Barchasi
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className="chip"
                aria-pressed={category === item.id}
                onClick={() => { tap("click"); setCategory(item.id); }}
              >
                {item.name}
              </button>
            ))}
          </div>

          <h2 className="section-title">Daraja</h2>
          <div className="chips" role="group" aria-label="Daraja">
            <button type="button" className="chip" aria-pressed={level === ""} onClick={() => { tap("click"); setLevel(""); }}>
              Barchasi
            </button>
            {LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                aria-pressed={level === item}
                onClick={() => { tap("click"); setLevel(item); }}
              >
                {item}
              </button>
            ))}
          </div>

          <h2 className="section-title">Yangi epizodlar</h2>
          <div className="h-row">
            {episodes.map((episode) => {
              const active = player.episode?.id === episode.id;
              return (
                <button key={episode.id} type="button" className={active ? "ep-card active" : "ep-card"} data-silent onClick={() => play(episode)}>
                  <Cover src={episode.cover_url} alt="" className="ep-cover" />
                  <span className="ep-card-title">{episode.title}</span>
                  <span className="ep-card-sub">
                    {episode.podcast_level ? episode.podcast_level + " · " : ""}
                    {episode.podcast_title} · {formatTime(episode.duration)}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="section-title">Mashhur podcastlar</h2>
          {podcasts.length === 0 ? <p className="empty-inline">Bu filtrda podcast yo'q.</p> : null}
          <div className="grid">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
