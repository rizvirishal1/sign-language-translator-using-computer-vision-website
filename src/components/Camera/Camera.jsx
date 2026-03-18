import { useState, useEffect } from "react";
import styles from "./camera.module.scss";

const FLASK_BASE = "http://localhost:5000";
const STATE_POLL_MS = 500; // Throttled to 2 times a second
const FRAME_POLL_MS = 120; // ~8 FPS (Increase to 200+ if hardware still struggles)

export default function Camera() {
  const [state, setState] = useState({
    letter: "",
    confidence: 0,
    word: "",
    translation: "",
    lang_name: "English",
  });
  const [connected, setConnected] = useState(false);
  const [frameSrc, setFrameSrc] = useState("");

  // ── Poll /state JSON ──────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(`${FLASK_BASE}/state`, { cache: "no-store" });
        if (!res.ok) throw new Error(`state ${res.status}`);
        const data = await res.json();
        if (alive) { 
          setState(data); 
          setConnected(true); 
        }
      } catch (e) {
        if (alive) setConnected(false);
      }
    };
    poll();
    const id = setInterval(poll, STATE_POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // ── Controlled Frame Rate Fetcher ──────────────────────────────
  useEffect(() => {
    let active = true;
    let timerId;

    const fetchFrame = async () => {
      if (!active) return;
      try {
        const res = await fetch(`${FLASK_BASE}/latest_frame?t=${Date.now()}`);
        if (res.ok) {
          const blob = await res.blob();
          
          // Only process if it's a real image frame
          if (blob.size > 100) {
            // Convert Blob to Base64 automatically
            const reader = new FileReader();
            reader.onloadend = () => {
              // reader.result is a stable base64 string that React can render safely
              if (active) setFrameSrc(reader.result);
            };
            reader.readAsDataURL(blob);
          }
        }
      } catch (e) {
        // Silently ignore network errors to prevent console spam
      }
      
      if (active) {
        timerId = setTimeout(fetchFrame, FRAME_POLL_MS);
      }
    };

    fetchFrame();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, []);

  const confidencePct = Math.round((state.confidence || 0) * 100);
  const barColor =
    confidencePct >= 95 ? "#00dc50" : confidencePct >= 70 ? "#ffd200" : "#dc3c00";

  return (
    <div className={styles.wrapper}>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Sign Language Recognition</span>
        <span className={`${styles.badge} ${connected ? styles.online : styles.offline}`}>
          {connected ? "● Live" : "○ Offline"}
        </span>
      </div>

      {/* Debug bar */}
      <div className={styles.debugBar}>
        🔍 {connected ? `Connected. Frame Throttle: ${FRAME_POLL_MS}ms` : "Waiting for backend connection..."}
      </div>

      {/* Video Container */}
      <div className={styles.videoContainer}>
        {(!connected || !frameSrc) && (
          <div className={styles.placeholder}>
            <div className={styles.spinner} />
            <p>Waiting for camera feed…</p>
          </div>
        )}
        
        {frameSrc && (
          <img
            src={frameSrc}
            alt="camera feed"
            className={styles.videoFeed}
            // Notice: The key attribute is REMOVED so it stops flickering/turning black!
            style={{ display: connected ? "block" : "none" }}
          />
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsPanel}>
        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Detected Letter</span>
            <span className={`${styles.statValue} ${styles.letter}`}>
              {state.letter || "—"}
            </span>
          </div>
          <div className={`${styles.statCard} ${styles.confCard}`}>
            <span className={styles.statLabel}>Confidence</span>
            <div className={styles.confBarWrap}>
              <div className={styles.confBarTrack}>
                <div
                  className={styles.confBarFill}
                  style={{ width: `${confidencePct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className={styles.confPct} style={{ color: barColor }}>
                {confidencePct}%
              </span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Word</span>
          <span className={`${styles.statValue} ${styles.word}`}>
            {state.word || "_"}
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.transHeader}>
            <span className={styles.statLabel}>Translation</span>
            <span className={styles.langPill}>{state.lang_name}</span>
          </div>
          <span className={`${styles.statValue} ${styles.translation} ${
            state.translation === "Translating..." ? styles.translating : ""
          }`}>
            {state.translation || "—"}
          </span>
        </div>
      </div>

      {/* Hints */}
      <div className={styles.hints}>
        <span>C = Clear</span>
        <span>Backspace = Delete</span>
        <span>Space = Speak</span>
        <span>1–9 / a–b = Language</span>
        <span>Q / Esc = Quit</span>
      </div>
    </div>
  );
}