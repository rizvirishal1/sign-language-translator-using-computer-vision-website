import Camera from "../../components/Camera/Camera.jsx";
import LanguageSelector, { LANGUAGES } from "../../components/LanguageSelector/TranslateBtn.jsx";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useRef, useCallback } from "react";
import StatusBar from "../../components/StatusBar/StatusBar.jsx";
import styles from "./sign2text.module.scss";

// ── Build lookup maps from the LANGUAGES registry ─────────────────
// key digit → language code   e.g. "1" → "en"
const KEY_TO_CODE = Object.fromEntries(LANGUAGES.map((l) => [l.key, l.code]));
// language code → display name  e.g. "ml" → "Malayalam"
const CODE_TO_NAME = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.name]));
// language code → BCP-47 tag for Web Speech API  e.g. "hi" → "hi-IN"
const CODE_TO_TTS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.ttsLang]));

// ── Google Translate (unofficial, no API key) ─────────────────────
// Uses the same public endpoint as translate.google.com.
// Returns a clean single-word / short-phrase translation — far more
// accurate than MyMemory for Indian languages (ml, hi, ta, te, ar…).
//
// Language codes that differ from our internal codes:
const GT_CODE_MAP = {
    zh: "zh-CN",   // MyMemory uses "zh", Google needs "zh-CN"
};

async function translateText(word, targetCode) {
    if (!word || targetCode === "en") return word;

    const gtLang = GT_CODE_MAP[targetCode] ?? targetCode;
    const url =
        `https://translate.googleapis.com/translate_a/single` +
        `?client=gtx&sl=en&tl=${gtLang}&dt=t&q=${encodeURIComponent(word)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    // Response shape: [ [ ["translated","original",…], … ], … ]
    const translated = data?.[0]
        ?.map((chunk) => chunk?.[0])
        .filter(Boolean)
        .join("")
        .trim();

    return translated || word;   // fallback: show original
}

// ── Web Speech API TTS helper ──────────────────────────────────────
function speakText(text, langCode) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();                   // stop any current speech
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = CODE_TO_TTS[langCode] ?? "en-US";
    utt.rate   = 0.95;
    utt.pitch  = 1.0;
    window.speechSynthesis.speak(utt);
}

// ──────────────────────────────────────────────────────────────────

export default function Sign2Text() {
    const [isDynamic,       setIsDynamic]       = useState(false);
    const [mode,            setMode]            = useState("mode A");
    const [fps,             setFps]             = useState(0);
    const [selectedLang,    setSelectedLang]    = useState("en");   // language code
    const [translation,     setTranslation]     = useState("");
    const [isTranslating,   setIsTranslating]   = useState(false);

    // cameraState holds { letter, confidence, word } from the backend
    const [cameraState, setCameraState] = useState({
        letter:     "",
        confidence: 0,
        word:       "",
    });

    // Shared socket ref — passed into Camera so Sign2Text can also emit controls
    const socketRef    = useRef(null);
    const requestRef   = useRef();
    const frameCount   = useRef(0);
    const lastTime     = useRef(performance.now());
    const translateRef = useRef(null);  // debounce timer handle

    // ── FPS counter ──────────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            const now = performance.now();
            frameCount.current += 1;
            if (now - lastTime.current >= 1000) {
                setFps(frameCount.current);
                frameCount.current = 0;
                lastTime.current   = now;
            }
            requestRef.current = requestAnimationFrame(tick);
        };
        requestRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // ── Auto-translate whenever word or selected language changes ─
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

        // Debounce: wait 350 ms after the last keystroke / letter append
        clearTimeout(translateRef.current);
        setIsTranslating(true);

        translateRef.current = setTimeout(async () => {
            try {
                const result = await translateText(word, selectedLang);
                setTranslation(result);
            } catch (err) {
                console.warn("[Translation error]", err);
                setTranslation(word);  // fallback: show original
            } finally {
                setIsTranslating(false);
            }
        }, 350);

        return () => clearTimeout(translateRef.current);
    }, [cameraState.word, selectedLang]);

    // ── Keyboard shortcuts ────────────────────────────────────────
    // Language: 1–8 (maps via KEY_TO_CODE)
    // Speak:    Space
    // Clear / Backspace are handled inside Camera (sent over socket)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            const key = e.key;

            // Language selection (keys 1–8)
            if (KEY_TO_CODE[key]) {
                setSelectedLang(KEY_TO_CODE[key]);
                return;
            }

            // Speak (Space)
            if (key === " ") {
                e.preventDefault();
                const textToSpeak = translation || cameraState.word;
                speakText(textToSpeak, selectedLang);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [translation, cameraState.word, selectedLang]);

    // ── Handlers ──────────────────────────────────────────────────
    const handleModeToggle      = (m) => setIsDynamic(m === "dynamic");
    const handleToggleMainMode  = (m) => setMode(m);
    const handleStateUpdate     = useCallback((s) => setCameraState(s), []);
    const handleLanguageChange  = (code) => setSelectedLang(code);

    const handleSpeak = () => {
        const textToSpeak = translation || cameraState.word;
        speakText(textToSpeak, selectedLang);
    };

    // Derived display values
    const langName        = CODE_TO_NAME[selectedLang] ?? "English";
    const displayTranslation =
        isTranslating ? "Translating…" : translation || "—";

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

                    {/*
                      Pass socketRef so Sign2Text's keyboard shortcuts can share
                      the same WebSocket connection as Camera's frame emitter.
                    */}
                    <Camera
                        onStateUpdate={handleStateUpdate}
                        socketRef={socketRef}
                    />
                </div>

                {/* ── Right: Controls & output cards ─────────────── */}
                <div className={styles.rightGrid}>

                    {/* Mode selector */}
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

                    {/* Language selector row */}
                    <div className={styles.languageTranslation}>
                        <LanguageSelector
                            selectedLanguage={selectedLang}
                            onLanguageChange={handleLanguageChange}
                        />
                        {/* The "Translate" button forces an immediate re-translate */}
                        <button
                            className={styles.translateBtn}
                            onClick={() => {
                                // Clear debounce and run translation immediately
                                clearTimeout(translateRef.current);
                                if (cameraState.word && selectedLang !== "en") {
                                    setIsTranslating(true);
                                    translateText(cameraState.word, selectedLang)
                                        .then((r) => setTranslation(r))
                                        .catch(() => setTranslation(cameraState.word))
                                        .finally(() => setIsTranslating(false));
                                }
                            }}
                        >
                            Translate
                        </button>
                    </div>

                    {/* Word card */}
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Word</span>
                        <span className={`${styles.statValue} ${styles.word}`}>
                            {cameraState.word || "_"}
                        </span>
                    </div>

                    {/* Translation card — lang pill reflects selected language */}
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

                    {/* Speak button */}
                    <div className={styles.speakButton}>
                        <button
                            className={styles.speakBtn}
                            title="Speak (or press Space)"
                            onClick={handleSpeak}
                        >
                            <SpeakerWaveIcon className={styles.icon} /> Speak
                        </button>
                    </div>

                    {/* Gloss box */}
                    <div className={styles.glossBox}>
                        <h3>Gloss:</h3>
                        <p>Gloss will appear here.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}