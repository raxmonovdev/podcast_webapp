import { tap } from "../sound";

export function Status({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="status" role="alert">
      <p>{error}</p>
      {onRetry ? (
        <button type="button" className="btn" onClick={() => { tap("click"); onRetry(); }}>
          Qayta urinish
        </button>
      ) : null}
    </div>
  );
}

export function SkeletonHome() {
  return (
    <div className="skel-wrap" aria-hidden="true">
      <div className="skel skel-line lg" />
      <div className="skel skel-line" />
      <div className="skel-row">
        <div className="skel skel-chip" />
        <div className="skel skel-chip" />
        <div className="skel skel-chip" />
      </div>
      <div className="skel skel-line md" />
      <div className="skel-row">
        <div className="skel skel-card" />
        <div className="skel skel-card" />
      </div>
      <div className="skel-grid">
        <div className="skel skel-tile" />
        <div className="skel skel-tile" />
      </div>
    </div>
  );
}
