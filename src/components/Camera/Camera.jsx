import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import StatusBar from "../../components/StatusBar/StatusBar.jsx";
import styles from "./camera.module.scss";

const FLASK_BASE   = "http://localhost:5000";
const FRAME_RATE_MS = 100;

/**
 * Camera
 *
 * Responsibilities (trimmed):
 *  - Capture webcam frames and stream them to the Flask WebSocket server.
 *  - Receive state_update events and forward them to the parent via onStateUpdate.
 *  - Display the detected letter and confidence bar.
 *  - Handle keyboard shortcuts for word editing (C = clear, Backspace = delete).
 *    Language selection and Speak are now managed by Sign2Text.
 *
 * Props:
 *   onStateUpdate  – (state) => void  – bubbles { letter, confidence, word } up
 *   socketRef      – React ref passed in from Sign2Text so the parent can also
 *                    emit control events (clear / backspace) when needed.
 *                    If omitted, Camera manages its own internal socket ref.
 *   isDynamic      – bool   – controls Dynamic mode StatusBar visibility
 *   mode           – string – "mode A" shows static/dynamic toggle
 *   fps            – number – FPS value to display
 *   onModeToggle   – (mode: "static"|"dynamic") => void
 */
export default function Camera({
    onStateUpdate,
    socketRef: externalSocketRef,
    isDynamic = false,
    mode = "mode A",
    fps = 0,
    onModeToggle,
}) {
    const [state, setState] = useState({
        letter:     "",
        confidence: 0,
        word:       "",
    });

    const [connected, setConnected]     = useState(false);
    const videoRef          = useRef(null);
    const canvasRef         = useRef(null);
    const internalSocketRef = useRef(null);

    // Use the externally injected ref if provided (so Sign2Text can share the socket)
    const socketRef = externalSocketRef ?? internalSocketRef;

    useEffect(() => {
        // ── Socket setup ──
        socketRef.current = io(FLASK_BASE);
        socketRef.current.on("connect",    () => setConnected(true));
        socketRef.current.on("disconnect", () => setConnected(false));
        socketRef.current.on("state_update", (data) => {
            setState(data);
            onStateUpdate?.(data);
        });

        // ── Webcam access ──
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch((err) => console.error("Camera access denied:", err));

        // ── Frame capture loop ──
        const frameInterval = setInterval(() => {
            if (
                videoRef.current  &&
                canvasRef.current &&
                socketRef.current?.connected
            ) {
                const canvas  = canvasRef.current;
                const context = canvas.getContext("2d");
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL("image/jpeg", 0.6);
                socketRef.current.emit("process_frame", { image: imageDataUrl });
            }
        }, FRAME_RATE_MS);

        // ── Keyboard shortcuts: word editing only ──
        // Language (1–8) and Speak (Space) are handled by Sign2Text.
        const handleKeyDown = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            const key = e.key.toLowerCase();

            if (key === "c") {
                socketRef.current?.emit("control", { action: "clear" });
            } else if (key === "backspace") {
                e.preventDefault();
                socketRef.current?.emit("control", { action: "backspace" });
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        // ── Cleanup ──
        return () => {
            clearInterval(frameInterval);
            socketRef.current?.disconnect();
            window.removeEventListener("keydown", handleKeyDown);
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const confidencePct = Math.round((state.confidence || 0) * 100);
    const barColor =
        confidencePct >= 95 ? "#00dc50" :
        confidencePct >= 70 ? "#ffd200" : "#dc3c00";

    return (
        <div className={styles.wrapper}>
            {/* Hidden canvas used for frame capture */}
            <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />

            {/* ── Header (replaces old .title span) ── */}
            <div className={styles.header}>
                {mode === "mode A" && (
                    <div className={styles.modeBtnGroup}>
                        <button
                            className={`${styles.staticBtn} ${!isDynamic ? styles.staticBtnSelected : ""}`}
                            onClick={() => onModeToggle?.("static")}
                        >
                            Static
                        </button>
                        <button
                            className={`${styles.dynamicBtn} ${isDynamic ? styles.dynamicBtnSelected : ""}`}
                            onClick={() => onModeToggle?.("dynamic")}
                        >
                            Dynamic
                        </button>
                    </div>
                )}

                {isDynamic && (
                    <div className={styles.ringStatusBar}>
                        <StatusBar />
                    </div>
                )}

                <span className={styles.headerLabel}>Word/letter</span>
                <span className={styles.headerLabel}>Confidence</span>

                <div className={styles.fpsCounter}>
                    <p>{fps} FPS</p>
                </div>

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

            {/* Letter + Confidence */}
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
                <span>1–8 = Language</span>
            </div>
        </div>
    );
}