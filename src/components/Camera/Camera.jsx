import React, { useRef, useEffect, useState } from 'react';
import styles from './camera.module.scss';

const Camera = () => {
    const videoRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let stream = null;

        const startCamera = async () => {
            try {
                // Request video access from the user
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' } // Prefers the front-facing camera on mobile
                });

                // Attach the stream to our video element
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing the camera:", err);
                setError("Unable to access the camera. Please check your browser permissions.");
            }
        };

        startCamera();

        // Cleanup: Stop all video tracks when the component is unmounted
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className={styles.container}>
            {error ? (
                <p className={styles.error}>{error}</p>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={styles.videoFeed}
                />
            )}
        </div>
    );
};

export default Camera;