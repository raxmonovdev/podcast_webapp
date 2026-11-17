import Cover from "./Cover";
import { PauseIcon, PlayIcon } from "./Icons";
import { usePlayer } from "../player/PlayerContext";
import { press, tap } from "../sound";

export default function MiniPlayer() {
  const player = usePlayer();
  const episode = player.episode;
  if (!episode) return null;

  const pct = player.duration ? Math.min(100, (player.currentTime / player.duration) * 100) : 0;

  return (
    <div className="mini">
      <button type="button" className="mini-open" onClick={() => { tap("click"); player.openFull(); }}>
        <Cover src={episode.cover_url} alt="" className="mini-cover" />
        <span className="mini-text">
          <strong>{episode.title}</strong>
          <small>{player.error || episode.podcast_title}</small>
        </span>
      </button>
      <button
        type="button"
        className="icon-btn"
        data-silent
        onClick={() => { press(); player.toggle(); }}
        aria-label={player.playing ? "Pauza" : "Eshitish"}
      >
        {player.playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="mini-progress" style={{ width: pct + "%" }} />
    </div>
  );
}
