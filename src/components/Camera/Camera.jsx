import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import styles from "./camera.module.scss";

const FLASK_BASE = "http://localhost:5000";
const FRAME_RATE_MS = 100;

export default function Camera({ onStateUpdate }) {
  const [state, setState] = useState({
    letter: "",
    confidence: 0,
    word: "",
    translation: "",
    lang_name: "English",
  });

  const [connected, setConnected] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(FLASK_BASE);

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));
    socketRef.current.on("state_update", (data) => {
      setState(data);
      onStateUpdate?.(data); // bubble state up to Sign2Text
    });

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera access denied:", err));

    const frameInterval = setInterval(() => {
      if (videoRef.current && canvasRef.current && socketRef.current?.connected) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.6);
        socketRef.current.emit("process_frame", { image: imageDataUrl });
      }
    }, FRAME_RATE_MS);

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const key = e.key.toLowerCase();
      if (["1","2","3","4","5","6","7","8","9","a","b"].includes(key)) {
        socketRef.current.emit("control", { action: "lang", value: key });
      } else if (key === "c") {
        socketRef.current.emit("control", { action: "clear" });
      } else if (key === "backspace") {
        socketRef.current.emit("control", { action: "backspace" });
      } else if (key === " ") {
        e.preventDefault();
        socketRef.current.emit("control", { action: "speak" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(frameInterval);
      socketRef.current?.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const confidencePct = Math.round((state.confidence || 0) * 100);
  const barColor =
    confidencePct >= 95 ? "#00dc50" : confidencePct >= 70 ? "#ffd200" : "#dc3c00";

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />

      <div className={styles.header}>
        <span className={styles.title}>Sign Language Recognition</span>
        <span className={`${styles.badge} ${connected ? styles.online : styles.offline}`}>
          {connected ? "● Live API" : "○ API Offline"}
        </span>
      </div>

      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.videoFeed}
          style={{ transform: "scaleX(-1)", width: "100%", height: "auto" }}
        />
      </div>

      {/* Only Letter + Confidence remain in Camera */}
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
      </div>

      <div className={styles.hints}>
        <span>C = Clear</span>
        <span>Backspace = Delete</span>
        <span>Space = Speak</span>
        <span>1–9 / a–b = Language</span>
      </div>
    </div>
  );
}