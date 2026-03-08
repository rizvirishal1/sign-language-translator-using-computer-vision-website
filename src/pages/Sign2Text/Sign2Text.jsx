//imports…
import Camera from "../../components/Camera/Camera.jsx";
import LanguageSelector from "../../components/LanguageSelector/TranslateBtn.jsx";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
//styles
import styles from "./sign2text.module.scss"

export default function Sign2Text() {

    return (
        <div className={styles.sign2text}>
            <div className={styles.horizontalContainer}>
                <div className={styles.camera}>
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