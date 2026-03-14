//imports…
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
//styles
import styles from "./text2sign.module.scss"

export default function Text2Sign() {

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    // We use a ref to store the recognition instance so it persists across renders
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check for browser support (Chrome, Edge, Safari)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Your browser does not support the Web Speech API. Please try Google Chrome.');
            return;
        }

        // Initialize the Speech Recognition API
        recognitionRef.current = new SpeechRecognition();

        // continuous = true keeps the microphone open even if you pause speaking
        recognitionRef.current.continuous = true;

        // interimResults = true shows the words as you are saying them
        recognitionRef.current.interimResults = true;

        // Event listener for when speech is recognized
        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                finalTranscript += event.results[i][0].transcript;
            }
            setTranscript(finalTranscript);
        };

        // Handle errors (like microphone permission denied)
        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        // Fired when the service disconnects
        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
        // Cleanup function when component unmounts
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            // Clear previous text before starting a new session (optional)
            // setTranscript(''); 
            recognitionRef.current.start();
            setIsListening(true);
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
                        placeholder="Enter text to translate to sign language..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                    >
                    </textarea>
                    <button className={styles.translateBtn}>Translate</button>
                    <div className={styles.glossBox}>
                        <h3>Gloss:</h3>
                        <p>Gloss will appear here.</p>
                    </div>
                </div>
                <div className={styles.signContainer}>
                    <div className={styles.videoBox}>
                        <p>Translated sign language will appear here.</p>
                    </div>
                    <button className={styles.replayBtn}>

                        <ArrowPathIcon className={styles.icon} />
                        Replay
                    </button>
                </div>
            </div>
        </div>
    );
}