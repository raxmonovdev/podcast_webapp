import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { formatTime } from "../format";
import { usePlayer } from "../player/PlayerContext";
import Cover from "../components/Cover";
import Transcript from "../components/Transcript";
import WordDialog from "../components/WordDialog";
import { Status } from "../components/Skeleton";
import { press, tap } from "../sound";

export default function PodcastPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const player = usePlayer();
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [favError, setFavError] = useState("");
  const [tick, setTick] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [show, list] = await Promise.all([
          api("/podcasts/" + id),
          api("/podcasts/" + id + "/episodes"),
        ]);
        if (ignore) return;
        setPodcast(show);
        setEpisodes(list);
      } catch (err) {
        if (!ignore) setError(err.status === 404 ? "Podcast topilmadi." : "Ma'lumot yuklanmadi.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, tick]);

  async function toggleFavorite() {
    if (!podcast || busy) return;
    if (podcast.is_favorite) tap("click");
    else tap("success");
    setBusy(true);
    setFavError("");
    const next = !podcast.is_favorite;
    setPodcast({ ...podcast, is_favorite: next });
    try {
      if (next) {
        await api("/favorites", {
          method: "POST",
          body: JSON.stringify({ podcast_id: podcast.id }),
        });
      } else {
        await api("/favorites/" + podcast.id, { method: "DELETE" });
      }
    } catch (err) {
      setPodcast({ ...podcast, is_favorite: !next });
      setFavError("Saqlab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  function play(episode) {
    press();
    player.playEpisode(episode, episodes);
  }

  return (
    <main className="page">
      <button type="button" className="back" onClick={() => { tap("click"); navigate("/"); }}>
        ‹ Orqaga
      </button>
      {loading ? <div className="skel skel-hero" aria-hidden="true" /> : null}
      <Status error={error} onRetry={() => setTick((value) => value + 1)} />

      {podcast ? (
        <>
          <header className="hero">
            <Cover src={podcast.cover_url} alt="" className="hero-cover" />
            <p className="mark">{podcast.category_name}</p>
            {podcast.level ? <span className="badge badge-inline">{podcast.level}</span> : null}
            <h1>{podcast.title}</h1>
            <p className="hero-author">{podcast.author}</p>
          </header>
          <p className="desc">{podcast.description}</p>
          <button
            type="button"
            className={podcast.is_favorite ? "btn block fav-on" : "btn block"}
            data-sound={podcast.is_favorite ? "off" : "success"}
            onClick={toggleFavorite}
            disabled={busy}
          >
            {podcast.is_favorite ? "Sevimlilardan olish" : "Sevimlilarga qo'shish"}
          </button>
          {favError ? <p className="form-error">{favError}</p> : null}

          <h2 className="section-title">Epizodlar</h2>
          <div className="ep-list">
            {episodes.map((episode, index) => {
              const active = player.episode?.id === episode.id;
              const open = openId === episode.id;
              return (
                <div key={episode.id} className={active ? "ep-block active" : "ep-block"}>
                  <div className="ep">
                    <button type="button" className="ep-main" data-silent onClick={() => play(episode)}>
                      <span className="ep-index">{active && player.playing ? "►" : index + 1}</span>
                      <span className="ep-meta">
                        <span className="ep-title">{episode.title}</span>
                        <span className="ep-sub">{formatTime(episode.duration)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      aria-expanded={open}
                      onClick={() => { tap("click"); setOpenId(open ? null : episode.id); }}
                    >
                      {open ? "Yopish" : "Matn"}
                    </button>
                  </div>
                  {open ? (
                    <div className="transcript">
                      <Transcript
                        text={episode.transcript}
                        onWord={(value) => setPicked({ word: value, episodeId: episode.id })}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <WordDialog
            word={picked ? picked.word : ""}
            episodeId={picked ? picked.episodeId : 0}
            onClose={() => setPicked(null)}
          />
        </>
      ) : null}
    </main>
  );
}
