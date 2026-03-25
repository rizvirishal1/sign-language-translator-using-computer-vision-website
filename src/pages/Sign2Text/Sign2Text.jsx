import Camera from "../../components/Camera/Camera.jsx";
import LanguageSelector, { LANGUAGES } from "../../components/LanguageSelector/TranslateBtn.jsx";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useRef, useCallback } from "react";
import StatusBar from "../../components/StatusBar/StatusBar.jsx";
import styles from "./sign2text.module.scss";

// ── Build lookup maps from the LANGUAGES registry ─────────────────
const KEY_TO_CODE = Object.fromEntries(LANGUAGES.map((l) => [l.key, l.code]));
const CODE_TO_NAME = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.name]));
const CODE_TO_TTS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.ttsLang]));

const GT_CODE_MAP = {
    zh: "zh-CN", 
};

/**
 * Robust Translation Function
 * Layer 1: Google Translate (Unofficial)
 * Layer 2: MyMemory API (Fallback for better reliability with Indic languages)
 */
async function translateText(word, targetCode) {
    if (!word || targetCode === "en") return word;

    const gtLang = GT_CODE_MAP[targetCode] ?? targetCode;

    // --- Attempt 1: Google Translate (Primary) ---
    try {
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${gtLang}&dt=t&q=${encodeURIComponent(word)}`;
        const res = await fetch(googleUrl);
        if (res.ok) {
            const data = await res.json();
            const translated = data?.[0]?.map((chunk) => chunk?.[0]).filter(Boolean).join("").trim();
            if (translated && translated.toLowerCase() !== word.toLowerCase()) {
                return translated;
            }
        }
    } catch (err) {
        console.warn("[Google Translate Error]", err);
    }

    // --- Attempt 2: MyMemory API (Secondary Fallback) ---
    // Excellent for Malayalam (ml), Tamil (ta), Hindi (hi), etc.
    try {
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|${targetCode}`;
        const res = await fetch(myMemoryUrl);
        if (res.ok) {
            const data = await res.json();
            const translated = data.responseData?.translatedText;
            if (translated && !translated.includes("MYMEMORY WARNING")) {
                return translated;
            }
        }
    } catch (err) {
        console.warn("[MyMemory Error]", err);
    }

    return word; // Ultimate fallback: return original English word
}

// ── Web Speech API TTS helper ──────────────────────────────────────
function speakText(text, langCode) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = CODE_TO_TTS[langCode] ?? "en-US";
    utt.rate = 0.95;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
}

export default function Sign2Text() {
    const [isDynamic, setIsDynamic] = useState(false);
    const [mode, setMode] = useState("mode A");
    const [fps, setFps] = useState(0);
    const [selectedLang, setSelectedLang] = useState("en");
    const [translation, setTranslation] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);

    const [cameraState, setCameraState] = useState({
        letter: "",
        confidence: 0,
        word: "",
    });

    const socketRef = useRef(null);
    const requestRef = useRef();
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    const translateRef = useRef(null);

    // ── FPS counter ──────────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            const now = performance.now();
            frameCount.current += 1;
            if (now - lastTime.current >= 1000) {
                setFps(frameCount.current);
                frameCount.current = 0;
                lastTime.current = now;
            }
            requestRef.current = requestAnimationFrame(tick);
        };
        requestRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // ── Auto-translate Logic ─────────────────────────────────────
    useEffect(() => {
        const word = cameraState.word;

        if (!word) {
            setTranslation("");
            setIsTranslating(false);
            return;
        }

        if (selectedLang === "en") {
            setTranslation(word);
            setIsTranslating(false);
            return;
        }

        // Debounce: Wait 400ms after user stops "signing" to translate
        clearTimeout(translateRef.current);
        setIsTranslating(true);

        translateRef.current = setTimeout(async () => {
            const result = await translateText(word, selectedLang);
            setTranslation(result);
            setIsTranslating(false);
        }, 400);

        return () => clearTimeout(translateRef.current);
    }, [cameraState.word, selectedLang]);

    // ── Keyboard shortcuts ────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            const key = e.key;

            if (KEY_TO_CODE[key]) {
                setSelectedLang(KEY_TO_CODE[key]);
                return;
            }

            if (key === " ") {
                e.preventDefault();
                const textToSpeak = translation || cameraState.word;
                speakText(textToSpeak, selectedLang);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [translation, cameraState.word, selectedLang]);

    const handleModeToggle = (m) => setIsDynamic(m === "dynamic");
    const handleToggleMainMode = (m) => setMode(m);
    const handleStateUpdate = useCallback((s) => setCameraState(s), []);
    const handleLanguageChange = (code) => setSelectedLang(code);

    const handleSpeak = () => {
        const textToSpeak = translation || cameraState.word;
        speakText(textToSpeak, selectedLang);
    };

    const langName = CODE_TO_NAME[selectedLang] ?? "English";
    const displayTranslation = isTranslating ? "Translating..." : translation || "—";

    return (
        <div className={styles.sign2text}>
            <div className={styles.horizontalContainer}>
                {/* ── Left: Camera panel ─────────────────────────── */}
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

                    <Camera
                        onStateUpdate={handleStateUpdate}
                        socketRef={socketRef}
                    />
                </div>

                {/* ── Right: Controls & output cards ─────────────── */}
                <div className={styles.rightGrid}>
                    <div className={styles.mainModelSelection}>
                        <span>Select the Mode</span>
                        <div className={styles.mainModeBtnGroup}>
                            <button
                                className={`${styles.mainModeBtn} ${mode === "mode A" ? styles.mainModeBtnActive : ""}`}
                                onClick={() => handleToggleMainMode("mode A")}
                            >
                                Mode A – Static &amp; Dynamic
                            </button>
                            <button
                                className={`${styles.mainModeBtn} ${mode === "mode B" ? styles.mainModeBtnActive : ""}`}
                                onClick={() => handleToggleMainMode("mode B")}
                            >
                                Mode B – Dynamic Only
                            </button>
                        </div>
                    </div>

                    <div className={styles.languageTranslation}>
                        <LanguageSelector
                            selectedLanguage={selectedLang}
                            onLanguageChange={handleLanguageChange}
                        />
                        <button
                            className={styles.translateBtn}
                            onClick={async () => {
                                if (cameraState.word && selectedLang !== "en") {
                                    setIsTranslating(true);
                                    const res = await translateText(cameraState.word, selectedLang);
                                    setTranslation(res);
                                    setIsTranslating(false);
                                }
                            }}
                        >
                            Translate
                        </button>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Word</span>
                        <span className={`${styles.statValue} ${styles.word}`}>
                            {cameraState.word || "_"}
                        </span>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.transHeader}>
                            <span className={styles.statLabel}>Translation</span>
                            <span className={styles.langPill}>{langName}</span>
                        </div>
                        <span
                            className={`${styles.statValue} ${styles.translation} ${
                                isTranslating ? styles.translating : ""
                            }`}
                        >
                            {displayTranslation}
                        </span>
                    </div>

                    <div className={styles.speakButton}>
                        <button
                            className={styles.speakBtn}
                            title="Speak (or press Space)"
                            onClick={handleSpeak}
                        >
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