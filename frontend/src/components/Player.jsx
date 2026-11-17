import Cover from "./Cover";
import { CloseIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./Icons";
import { formatTime } from "../format";
import { usePlayer } from "../player/PlayerContext";
import { press, tap } from "../sound";

export default function Player() {
  const player = usePlayer();
  const episode = player.episode;
  if (!episode) return null;

  return (
    <section className="player" role="dialog" aria-label="Pleyer">
      <img className="player-bg" src={episode.cover_url} alt="" />
      <div className="player-scrim" />
      <div className="player-body">
        <div className="player-top">
          <button type="button" className="icon-btn light" onClick={() => { tap("click"); player.closeFull(); }} aria-label="Yopish">
            <CloseIcon />
          </button>
        </div>

        <Cover src={episode.cover_url} alt="" className="player-cover" />
        <p className="player-show">{episode.podcast_title}</p>
        <h2 className="player-title">{episode.title}</h2>

        <label className="seek-wrap">
          <span className="visually-hidden">Jarayon</span>
          <input
            className="seek"
            type="range"
            min="0"
            max={player.duration || 0}
            step="0.1"
            value={Math.min(player.currentTime, player.duration || 0)}
            style={{ "--seek": (player.duration ? (player.currentTime / player.duration) * 100 : 0) + "%" }}
            onChange={(event) => player.seek(Number(event.target.value))}
          />
        </label>
        <div className="times">
          <span>{formatTime(player.currentTime)}</span>
          <span>{formatTime(player.duration)}</span>
        </div>

        <div className="transport">
          <button type="button" className="round" data-silent onClick={() => { press(); player.prev(); }} disabled={!player.hasPrev} aria-label="Oldingi epizod">
            <PrevIcon />
          </button>
          <button type="button" className="round" data-silent onClick={() => { press(); player.skip(-15); }} aria-label="15 soniya orqaga">
            −15
          </button>
          <button type="button" className="round" data-silent onClick={() => { press(); player.skip(-5); }} aria-label="Oxirgi 5 soniyani qayta eshitish">
            ⟲5
          </button>
          <button type="button" className="play-main" data-silent onClick={() => { press(); player.toggle(); }} aria-label={player.playing ? "Pauza" : "Eshitish"}>
            {player.playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button type="button" className="round" data-silent onClick={() => { press(); player.skip(15); }} aria-label="15 soniya oldinga">
            +15
          </button>
          <button type="button" className="round" data-silent onClick={() => { press(); player.next(); }} disabled={!player.hasNext} aria-label="Keyingi epizod">
            <NextIcon />
          </button>
        </div>

        <div className="speeds" role="group" aria-label="Tezlik">
          {player.rates.map((item) => (
            <button
              key={item}
              type="button"
              data-silent
              aria-pressed={player.rate === item}
              onClick={() => { press(); player.changeRate(item); }}
            >
              {item === 1 ? "1x" : item + "x"}
            </button>
          ))}
        </div>

        {player.error ? <p className="player-error">{player.error}</p> : null}
      </div>
    </section>
  );
}
