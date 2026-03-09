//imports…
//styles
import styles from "./text2sign.module.scss"

export default function Text2Sign() {

    return (
        <div className={styles.text2sign}>
            <div className={styles.horizontalContainer}>
                <div className={styles.inputContainer}>
                    <textarea className={styles.textInput} placeholder="Enter text to translate to sign language..."></textarea>
                    <button className={styles.translateBtn}>Translate</button>
                    <div className={styles.glossBox}>
                        <h3>Gloss:</h3>
                        <p>Gloss will appear here.</p>
                    </div>
                </div>
                <div className={styles.signContainer}>
                    <p>Translated sign language will appear here.</p>
                </div>
            </div>
        </div>
    );
}