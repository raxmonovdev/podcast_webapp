import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import PodcastCard from "../components/PodcastCard";
import { Status } from "../components/Skeleton";

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await api("/favorites");
        if (!ignore) setItems(rows);
      } catch (err) {
        if (!ignore) setError("Sevimlilar yuklanmadi.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [tick]);

  return (
    <main className="page">
      <p className="mark">Saqlangan</p>
      <h1 className="hello">Sevimlilar</h1>
      {loading ? <div className="skel skel-line lg" /> : null}
      <Status error={error} onRetry={() => setTick((value) => value + 1)} />
      {!loading && !error && items.length === 0 ? (
        <div className="empty">
          <p>Hali sevimli podcast yo'q.</p>
          <Link to="/" className="btn">
            Podcastlarni ko'rish
          </Link>
        </div>
      ) : null}
      <div className="rows">
        {items.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} layout="row" />
        ))}
      </div>
    </main>
  );
}
