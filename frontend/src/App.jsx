import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "./api";
import BottomNav from "./components/BottomNav";
import MiniPlayer from "./components/MiniPlayer";
import Player from "./components/Player";
import { SkeletonHome, Status } from "./components/Skeleton";
import ThemeToggle from "./components/ThemeToggle";
import Admin from "./pages/Admin";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import PodcastPage from "./pages/PodcastPage";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import { PlayerProvider, usePlayer } from "./player/PlayerContext";
import { playSound } from "./sound";
import { UserProvider } from "./user";

function TopBar() {
  return (
    <div className="topbar">
      <ThemeToggle />
    </div>
  );
}

function Shell({ user }) {
  const player = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const back = tg?.BackButton;
    if (!back) return;

    const canBack = playerRef.current.fullOpen || location.pathname !== "/";
    if (canBack) back.show();
    else back.hide();

    const onBack = () => {
      const current = playerRef.current;
      if (current.fullOpen) {
        current.closeFull();
        return;
      }
      if (location.pathname !== "/") navigate("/");
    };

    back.onClick(onBack);
    return () => back.offClick(onBack);
  }, [player.fullOpen, location.pathname, navigate]);

  const className = player.episode && !player.fullOpen ? "app has-mini" : "app";

  return (
    <div className={className}>
      {player.fullOpen ? null : <TopBar />}
      <div aria-hidden={player.fullOpen || undefined}>
        <UserProvider value={user}>
          <div key={location.pathname} className="page-fade">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/podcast/:id" element={<PodcastPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </UserProvider>
      </div>
      {player.episode && !player.fullOpen ? <MiniPlayer /> : null}
      {player.fullOpen ? null : <BottomNav />}
      {player.fullOpen ? <Player /> : null}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onPointerDown(event) {
      const el = event.target.closest("button, [role='button'], a, [data-sound]");
      if (!el || el.hasAttribute("data-silent")) return;
      playSound(el.dataset.sound || "click");
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    let ignore = false;
    api("/auth", { method: "POST" })
      .then((data) => {
        if (!ignore) setUser(data);
      })
      .catch((err) => {
        if (ignore) return;
        setError(
          err.status === 401
            ? "Kirish tasdiqlanmadi. .env da ALLOW_DEV_AUTH=true ekanini tekshiring."
            : "Serverga ulanib bo'lmadi. Avval backendni ishga tushiring."
        );
      })
      .finally(() => {
        if (!ignore) setReady(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="app">
        <TopBar />
        <div className="page">
          <SkeletonHome />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <TopBar />
        <div className="page">
          <Status error={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <PlayerProvider>
      <BrowserRouter>
        <Shell user={user} />
      </BrowserRouter>
    </PlayerProvider>
  );
}
