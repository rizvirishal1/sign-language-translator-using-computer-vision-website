import { ArrowPathIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from "react";
import styles from "./text2sign.module.scss";

const signDictionary = {
    // alphabets A - Z
    'A': 'webp',
    'B': 'webp',
    'C': 'webp',
    'D': 'webp',
    'E': 'webp',
    'F': 'webp',
    'G': 'webp',
    'H': 'webp',
    'I': 'webp',
    'J': 'webp',
    'K': 'webp',
    'L': 'webp',
    'M': 'webp',
    'N': 'webp',
    'O': 'webp',
    'P': 'webp',
    'Q': 'webp',
    'R': 'webp',
    'S': 'webp',
    'T': 'webp',
    'U': 'webp',
    'V': 'webp',
    'W': 'webp',
    'X': 'webp',
    'Y': 'webp',
    'Z': 'webp',
    // numbers
    '0': 'webp',
    '1': 'webp',
    '2': 'webp',
    '3': 'webp',
    '4': 'webp',
    '5': 'webp',
    '6': 'webp',
    '7': 'webp',
    '8': 'webp',
    '9': 'webp',
    // words
    'YOU': 'webp',
    'AFTERNOON': 'webm',
    'AGAIN': 'webm',
    'BAD': 'webm',
    'BOY': 'webm',
    'BYE': 'webm',
    'CORRECT': 'webm',
    'DAY': 'webm',
    'DEAF': 'webm',
    'DIFFICULT': 'webm',
    'EASY': 'webm',
    'EXCUSE ME': 'webm',
    'FATHER': 'webm',
    'FEAR': 'webm',
    'FOOD': 'webm',
    'FRIDAY': 'webm',
    'GIRL': 'webm',
    'GOOD': 'webm',
    'HE': 'webm',
    'HEARING': 'webm',
    'HELLO': 'webm',
    'HOW ARE YOU': 'webm',
    'HOW': 'webm',
    'HUNGRY': 'webm',
    'I AM FINE': 'webm',
    'INDIA': 'webm',
    'LANGUAGE': 'webm',
    'MAN': 'webm',
    'MONDAY': 'webm',
    'MORNING': 'webm',
    'MOTHER': 'webm',
    'NIGHT': 'webm',
    'NO': 'webm',
    'PLACE': 'webm',
    'PLEASE': 'webm',
    'REMEMBER': 'webm',
    'SATURDAY': 'webm',
    'SHE': 'webm',
    'SIGN': 'webm',
    'SORRY': 'webm',
    'STRONG': 'webm',
    'SUNDAY': 'webm',
    'TEACHER': 'webm',
    'THANK YOU': 'webm',
    'THIRSTY': 'webm',
    'THIS': 'webm',
    'THURSDAY': 'webm',
    'TIME': 'webm',
    'TUESDAY': 'webm',
    'UNDERSTAND': 'webm',
    'HAPPY': 'webm',
    'SAD': 'webm',
    'WATER': 'webm',
    'WEAK': 'webm',
    'WEDNESDAY': 'webm',
    'WELCOME': 'webm',
    'WHAT': 'webm',
    'WHEN': 'webm',
    'WHERE': 'webm',
    'WHICH': 'webm',
    'WHO': 'webm',
    'WHY': 'webm',
    'WOMAN': 'webm',
    'WRONG': 'webm',
    'YES': 'webm'
};

export default function Text2Sign() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [wordsArray, setWordsArray] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [fade, setFade] = useState(false); // Controls the fade animation

    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                finalTranscript += event.results[i][0].transcript;
            }
            setTranscript(finalTranscript);
        };
        recognitionRef.current.onend = () => setIsListening(false);
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleTranslate = () => {
        if (!transcript.trim()) return;
        setWordsArray([]); // Clear current

        const cleanedWords = transcript.toUpperCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
        const playlist = [];

        for (const word of cleanedWords) {
            if (signDictionary[word]) {
                playlist.push({ text: word, type: signDictionary[word] });
            } else {
                for (const letter of word.split('')) {
                    playlist.push({ text: letter, type: signDictionary[letter] || 'webp' });
                }
            }
        }

        setWordsArray(playlist);
        setCurrentIndex(0);
        setFade(true); // Trigger fade in for first item
    };

    // Control the transition logic
    useEffect(() => {
        if (currentIndex >= 0 && currentIndex < wordsArray.length) {
            const currentItem = wordsArray[currentIndex];

            // If it's an image, set a 500ms timer
            if (currentItem.type === 'webp') {
                const timer = setTimeout(() => {
                    nextSign();
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [currentIndex, wordsArray]);

    const nextSign = () => {
        setFade(false); // Start fade out
        setTimeout(() => {
            setCurrentIndex((prev) => {
                if (prev + 1 < wordsArray.length) {
                    setFade(true); // Start fade in for next
                    return prev + 1;
                }
                return -1; // Finished
            });
        }, 300); // Wait for fade out duration before switching
    };

    const handleReplay = () => {
        if (wordsArray.length > 0) {
            setCurrentIndex(0);
            setFade(true);
        }
    };

    return (
        <div className={styles.text2sign}>
            <div className={styles.horizontalContainer}>
                <div className={styles.inputContainer}>
                    <button className={styles.speakBtn} onClick={toggleListening}>
                        <MicrophoneIcon className={styles.icon} />
                        {isListening ? 'Stop Listening' : 'Speak'}
                    </button>
                    <textarea
                        className={styles.textInput}
                        placeholder="Enter text..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                    />
                    <button className={styles.translateBtn} onClick={handleTranslate}>Translate</button>
                    <div className={styles.glossBox}>
                        <h3>Gloss:</h3>
                        <p>{wordsArray.length > 0 ? wordsArray.map(item => item.text).join(' ').toUpperCase() : 'Gloss will appear here.'}</p>
                    </div>
                </div>

                <div className={styles.signContainer}>
                    <div className={styles.videoBox}>
                        {currentIndex >= 0 && currentIndex < wordsArray.length ? (
                            <div className={`${styles.mediaWrapper} ${fade ? styles.fadeIn : styles.fadeOut}`}>
                                {wordsArray[currentIndex].type === 'webp' ? (
                                    <img
                                        src={`/signs/${wordsArray[currentIndex].text}.webp`}
                                        alt={wordsArray[currentIndex].text}
                                    />
                                ) : (
                                    <video
                                        key={wordsArray[currentIndex].text} // Key forces reload for same-word repeats
                                        src={`/signs/${wordsArray[currentIndex].text}.webm`}
                                        autoPlay
                                        muted
                                        onEnded={nextSign} // Trigger next only when video finishes
                                    />
                                )}
                            </div>
                        ) : (
                            <p>Translated sign language will appear here.</p>
                        )}
                    </div>
                    <button className={styles.replayBtn} onClick={handleReplay}>
                        <ArrowPathIcon className={styles.icon} /> Replay
                    </button>
                </div>
            </div>
        </div>
    );
}