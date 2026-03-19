import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import styles from "./camera.module.scss";

const FLASK_BASE = "http://localhost:5000";
const FRAME_RATE_MS = 100; // 10 FPS sent to backend. Video remains smooth 60 FPS locally!

export default function Camera() {
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
    // 1. Initialize WebSocket Connection
    socketRef.current = io(FLASK_BASE);
    
    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));
    socketRef.current.on('state_update', (data) => setState(data));

    // 2. Request Camera Permissions and start local stream
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera access denied:", err));

    // 3. Extract frames and send to backend loop
    const frameInterval = setInterval(() => {
      if (videoRef.current && canvasRef.current && socketRef.current?.connected) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Draw the current video frame onto the canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Compress as JPEG and send to Socket.IO
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        socketRef.current.emit('process_frame', { image: imageDataUrl });
      }
    }, FRAME_RATE_MS);

    // 4. Global Keyboard Listeners for Controls
    const handleKeyDown = (e) => {
      // Prevent interactions if typing in an input field somewhere else
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.key.toLowerCase();
      
      if (['1','2','3','4','5','6','7','8','9','a','b'].includes(key)) {
        socketRef.current.emit('control', { action: 'lang', value: key });
      } else if (key === 'c') {
        socketRef.current.emit('control', { action: 'clear' });
      } else if (key === 'backspace') {
        socketRef.current.emit('control', { action: 'backspace' });
      } else if (key === ' ') {
        e.preventDefault(); // Stop page scrolling
        socketRef.current.emit('control', { action: 'speak' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      clearInterval(frameInterval);
      socketRef.current?.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      // Stop webcam tracks
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const confidencePct = Math.round((state.confidence || 0) * 100);
  const barColor =
    confidencePct >= 95 ? "#00dc50" : confidencePct >= 70 ? "#ffd200" : "#dc3c00";

  return (
    <div className={styles.wrapper}>
      {/* Hidden Canvas used for image extraction */}
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Sign Language Recognition</span>
        <span className={`${styles.badge} ${connected ? styles.online : styles.offline}`}>
          {connected ? "● Live API" : "○ API Offline"}
        </span>
      </div>

      {/* Video Container */}
      <div className={styles.videoContainer}>
        {/* We use a native HTML5 video element now. 
            transform: scaleX(-1) mirrors the video like a webcam app usually does. */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.videoFeed}
          style={{ transform: "scaleX(-1)", width: "100%", height: "auto" }}
        />
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
      </div>
    </div>
  );
}