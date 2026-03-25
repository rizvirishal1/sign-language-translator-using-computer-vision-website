import Camera from "../../components/Camera/Camera.jsx";
import LanguageSelector from "../../components/LanguageSelector/TranslateBtn.jsx";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useRef } from "react";
import StatusBar from "../../components/StatusBar/StatusBar.jsx";
import styles from "./sign2text.module.scss";

export default function Sign2Text() {
    const [isDynamic, setIsDynamic] = useState(false);
    const [mode, setMode] = useState("mode A");
    const [fps, setFps] = useState(0);
    const [cameraState, setCameraState] = useState({
        letter: "",
        confidence: 0,
        word: "",
        translation: "",
        lang_name: "English",
    });

    const requestRef = useRef();
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        const calculateFPS = () => {
            const now = performance.now();
            frameCount.current += 1;
            if (now - lastTime.current >= 1000) {
                setFps(frameCount.current);
                frameCount.current = 0;
                lastTime.current = now;
            }
            requestRef.current = requestAnimationFrame(calculateFPS);
        };
        requestRef.current = requestAnimationFrame(calculateFPS);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const handleModeToggle = (mode) => {
        setIsDynamic(mode === "dynamic");
    };

    const handleToggleMainMode = (mainMode) => {
        setMode(mainMode);
    };

    const handleStateUpdate = (newState) => {
        setCameraState(newState);
    };

    return (
        <div className={styles.sign2text}>
            <div className={styles.horizontalContainer}>
                <div className={styles.camera}>
                    <div className={styles.cameraHeader}>
                        {mode === "mode A" && (
                            <div className={styles.modeBtnGrup}>
                                <button
                                    className={`${styles.staticBtn} ${!isDynamic ? styles.staticBtnSelected : ""}`}
                                    onClick={() => handleModeToggle("static")}
                                >
                                    Static
                                </button>
                                <button
                                    className={`${styles.dynamicBtn} ${isDynamic ? styles.dynamicBtnSelected : ""}`}
                                    onClick={() => handleModeToggle("dynamic")}
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
                        <span>Word/letter</span>
                        <span>Confidence</span>
                        <div className={styles.fpsCounter}>
                            <p>{fps} FPS</p>
                        </div>
                    </div>
                    <Camera onStateUpdate={handleStateUpdate} />
                </div>

                <div className={styles.rightGrid}>
                    <div className={styles.mainModelSelection}>
                        <span>Select the Mode</span>
                        <div className={styles.mainModeBtnGroup}>
                            <button
                                className={`${styles.mainModeBtn} ${mode === "mode A" ? styles.mainModeBtnActive : ""}`}
                                onClick={() => handleToggleMainMode("mode A")}
                            >
                                Mode A - Static & Dynamic
                            </button>
                            <button
                                className={`${styles.mainModeBtn} ${mode === "mode B" ? styles.mainModeBtnActive : ""}`}
                                onClick={() => handleToggleMainMode("mode B")}
                            >
                                Mode B - Dynamic Only
                            </button>
                        </div>
                    </div>

                    <div className={styles.languageTranslation}>
                        <LanguageSelector />
                        <button className={styles.translateBtn}>Translate</button>
                    </div>

                    {/* Word Card — lifted from Camera */}
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Word</span>
                        <span className={`${styles.statValue} ${styles.word}`}>
                            {cameraState.word || "_"}
                        </span>
                    </div>

                    {/* Translation Card — lifted from Camera */}
                    <div className={styles.statCard}>
                        <div className={styles.transHeader}>
                            <span className={styles.statLabel}>Translation</span>
                            <span className={styles.langPill}>{cameraState.lang_name}</span>
                        </div>
                        <span
                            className={`${styles.statValue} ${styles.translation} ${
                                cameraState.translation === "Translating..." ? styles.translating : ""
                            }`}
                        >
                            {cameraState.translation || "—"}
                        </span>
                    </div>

                    <div className={styles.speakButton}>
                        <button className={styles.speakBtn} title="Speak">
                            <SpeakerWaveIcon className={styles.icon} /> Speak
                        </button>
                    </div>

                    <div className={styles.glossBox}>
                        <h3>Gloss:</h3>
                        <p>Gloss will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}