import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api";

const PlayerContext = createContext(null);
const RATES = [0.5, 0.75, 1, 1.25, 1.5];

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const episodeRef = useRef(null);
  const queueRef = useRef([]);
  const rateRef = useRef(1);
  const jumpRef = useRef(() => {});
  const saveRef = useRef(() => {});
  const lastSaveAt = useRef(0);
  const lastSavedSecond = useRef(-1);

  const [episode, setEpisode] = useState(null);
  const [queue, setQueue] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [fullOpen, setFullOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Audio shu yerda yashaydi. Sahifa almashsa ham element o'chmaydi, eshitish to'xtamaydi.
    const audio = new Audio();
    audio.preload = "auto";
    audio.playsInline = true;
    audioRef.current = audio;
    let alive = true;

    const onTime = () => {
      const seconds = audio.currentTime || 0;
      setCurrentTime(seconds);
      // Har 5 soniyada to'xtagan joyni yozamiz. Sahifa yopilsa ham keyin shu yerdan davom etadi.
      if (Date.now() - lastSaveAt.current > 5000) {
        lastSaveAt.current = Date.now();
        saveRef.current(seconds);
      }
    };
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      saveRef.current(audio.currentTime || 0);
    };
    // Oxiriga yetganda keyingi epizod. Funksiya ref da, eskirib qolmaydi.
    const onEnded = () => {
      saveRef.current(0);
      jumpRef.current(1);
    };
    const onError = () => {
      if (!alive || !audio.src || audio.src.indexOf("http") !== 0) return;
      setError("Audio ochilmadi. Havolani tekshiring.");
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      alive = false;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  function load(track, list) {
    const audio = audioRef.current;
    if (!audio || !track) return;
    setError("");
    setEpisode(track);
    setQueue(list);
    episodeRef.current = track;
    queueRef.current = list;
    setCurrentTime(0);
    setDuration(track.duration || 0);
    lastSavedSecond.current = -1;
    audio.playbackRate = rateRef.current;
    audio.src = track.audio_url;
    const startAt = Number(track.resume_at) || 0;

    const startPlayback = () => {
      if (startAt > 2) {
        const max = Number.isFinite(audio.duration) ? audio.duration : startAt + 1;
        if (startAt < max - 3) {
          audio.currentTime = startAt;
          setCurrentTime(startAt);
        }
      }
      const pending = audio.play();
      if (pending) {
        pending.catch(() => {
          setPlaying(false);
          setError("Audio boshlanmadi. Eshitish tugmasini bosing.");
        });
      }
    };
    if (audio.readyState >= 1) startPlayback();
    else audio.addEventListener("loadedmetadata", startPlayback, { once: true });
  }

  saveRef.current = (seconds) => {
    const current = episodeRef.current;
    if (!current) return;
    const position = Math.max(0, Math.floor(seconds || 0));
    if (position === lastSavedSecond.current) return;
    lastSavedSecond.current = position;
    api("/progress", {
      method: "POST",
      body: JSON.stringify({ episode_id: current.id, position_seconds: position }),
    }).catch(() => {});
  };

  jumpRef.current = (step) => {
    const list = queueRef.current;
    const current = episodeRef.current;
    if (!current) return;
    const index = list.findIndex((item) => item.id === current.id);
    const next = list[index + step];
    if (!next) return;
    playEpisode(next, list);
  };

  async function playEpisode(track, list) {
    if (episodeRef.current && episodeRef.current.id === track.id) {
      toggle();
      return;
    }
    let resumeAt = 0;
    try {
      const saved = await api("/progress/" + track.id);
      resumeAt = saved.position_seconds || 0;
    } catch (err) {
      resumeAt = 0;
    }
    load({ ...track, resume_at: resumeAt }, list);
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio || !episodeRef.current) return;
    if (audio.paused) {
      audio.play().catch(() => setError("Audio boshlanmadi. Eshitish tugmasini bosing."));
    } else {
      audio.pause();
    }
  }

  function seek(seconds) {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : seconds;
    const next = Math.min(Math.max(0, seconds), max);
    audio.currentTime = next;
    setCurrentTime(next);
    saveRef.current(next);
  }

  function skip(delta) {
    const audio = audioRef.current;
    seek((audio ? audio.currentTime : 0) + delta);
  }

  function changeRate(next) {
    rateRef.current = next;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  const index = queue.findIndex((item) => item.id === episode?.id);

  const value = {
    episode,
    queue,
    playing,
    currentTime,
    duration,
    rate,
    rates: RATES,
    fullOpen,
    error,
    hasPrev: index > 0,
    hasNext: index >= 0 && index < queue.length - 1,
    playEpisode,
    toggle,
    seek,
    skip,
    changeRate,
    next: () => jumpRef.current(1),
    prev: () => jumpRef.current(-1),
    openFull: () => setFullOpen(true),
    closeFull: () => setFullOpen(false),
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("PlayerProvider yo'q");
  return ctx;
}
