import React from 'react';
import styles from './statusbar.module.scss';

// Set props: size controls the visible ring.
// CHANGE: glowScale reduced from 1.3 to 1.1 because the glow is minimal.
const StatusBar = ({ size = 40, glowScale = 1.5 }) => {
    const containerSize = size * glowScale;
    const strokeWidth = 5;

    // Base SVG radius on the intended size, not the container size
    const radius = (size - strokeWidth) / 2;
    const center = containerSize / 2;

    // Circumference calculation for the animation math
    const circumference = 2 * Math.PI * radius;

    return (
        <div
            className={styles.container}
            style={{ width: containerSize, height: containerSize }}
            role="progressbar"
            aria-label="Loading"
        >
            <svg
                className={styles.svgWrapper}
                viewBox={`0 0 ${containerSize} ${containerSize}`}
            >
                {/* Dark track ring */}
                <circle
                    className={styles.track}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Animated minimal glowing progress ring */}
                <circle
                    className={styles.ring}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    // Starts rotated 90deg left so progress begins at 12 o'clock
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{
                        // Pass the circumference variable to SCSS as a custom property
                        '--circumference': circumference
                    }}
                />
            </svg>
        </div>
    );
};

export default StatusBar;