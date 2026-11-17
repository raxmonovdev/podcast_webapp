import { Link } from "react-router-dom";
import Cover from "./Cover";
import { tap } from "../sound";

export default function PodcastCard({ podcast, layout = "card" }) {
  if (layout === "row") {
    return (
      <Link to={"/podcast/" + podcast.id} className="pod-row" onClick={() => tap("click")}>
        <Cover src={podcast.cover_url} alt="" className="pod-row-cover" />
        <span className="pod-row-text">
          <strong>{podcast.title}</strong>
          <small>
            {podcast.level ? podcast.level + " · " : ""}
            {podcast.author}
          </small>
        </span>
      </Link>
    );
  }

  return (
    <Link to={"/podcast/" + podcast.id} className="pod-card" onClick={() => tap("click")}>
      <span className="cover-wrap">
        <Cover src={podcast.cover_url} alt="" className="pod-cover" />
        {podcast.level ? <span className="badge">{podcast.level}</span> : null}
      </span>
      <h3>{podcast.title}</h3>
      <p>{podcast.author}</p>
    </Link>
  );
}
