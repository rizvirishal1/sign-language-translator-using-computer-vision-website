//imports…
import Camera from "../../components/Camera/Camera.jsx";
import LanguageSelector from "../../components/LanguageSelector/TranslateBtn.jsx";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useRef } from "react";
//styles
import styles from "./sign2text.module.scss"

export default function Sign2Text() {
    const [isDynamic, setIsDynamic] = useState(false);
    const [fps, setFps] = useState(0);
    const requestRef = useRef();
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        const calculateFPS = () => {
            const now = performance.now();
            frameCount.current += 1;

            // If 1 second (1000ms) has passed, update the React state
            if (now - lastTime.current >= 1000) {
                setFps(frameCount.current);

                // Reset the counters for the next second
                frameCount.current = 0;
                lastTime.current = now;
            }

            // Loop it for the next frame
            requestRef.current = requestAnimationFrame(calculateFPS);
        };

        // Start the loop
        requestRef.current = requestAnimationFrame(calculateFPS);

        // Cleanup the loop when the component unmounts
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const handleModeToggle = (mode) => {
        setIsDynamic(mode === 'dynamic');
    };

    return (
        <div className={styles.sign2text}>
            <div className={styles.horizontalContainer}>
                <div className={styles.camera}>
                    <div className={styles.cameraHeader}>
                        <button
                            className={`${styles.staticBtn} ${!isDynamic ? styles.staticBtnSelected : ''}`} onClick={() => handleModeToggle('static')}
                        >
                            Static
                        </button>
                        <button
                            className={`${styles.dynamicBtn} ${isDynamic ? styles.dynamicBtnSelected : ''}`}
                            onClick={() => handleModeToggle('dynamic')}
                        >
                            Dynamic
                        </button>
                        <div className={styles.fpsCounter}>
                            <p>{fps} FPS</p>
                        </div>
                    </div>
                    <Camera />
                </div>
                <div className={styles.rightGrid}>
                    <div className={styles.languageTranslation}>
                        <LanguageSelector />

                        <button className={styles.translateBtn}>Translate</button>
                    </div>
                    <div className={styles.translatedText}>
                        <p>Translated text will appear here.</p>

                    </div>

                    <div className={styles.speakButton}>
                        <button className={styles.speakBtn} title="Speak">
                            <SpeakerWaveIcon className={styles.icon} /> Speak
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}