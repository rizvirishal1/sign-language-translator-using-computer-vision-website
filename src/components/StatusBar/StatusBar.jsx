import React from 'react';
import styles from './statusbar.module.scss';

/**
 * StatusBar
 *
 * Props:
 *   size        – ring diameter in px (default 40)
 *   glowScale   – container multiplier for glow room (default 1.5)
 *   fill        – current buffer frames filled (default 0)
 *   total       – total frames needed for a full buffer (default 30)
 *
 * When fill === 0 and total === 0 (static mode), the ring stays empty.
 * When fill > 0, the ring fills proportionally to fill/total.
 * When fill === total, the ring is completely full (bright).
 */
const StatusBar = ({ size = 40, glowScale = 1.5, fill = 0, total = 30 }) => {
    const containerSize = size * glowScale;
    const strokeWidth   = 5;
    const radius        = (size - strokeWidth) / 2;
    const center        = containerSize / 2;
    const circumference = 2 * Math.PI * radius;

    // Ratio from 0.0 to 1.0
    const ratio  = total > 0 ? Math.min(fill / total, 1.0) : 0;
    // dashoffset = circumference means empty, 0 means full
    const offset = circumference * (1 - ratio);

    // Colour: grey when empty → cyan when full
    const ringColor = ratio >= 1.0
        ? "#00ffff"                      // fully filled — bright cyan
        : ratio > 0
            ? "#b2ffff"                  // filling — light cyan
            : "#444444";                 // empty — dim grey

    return (
        <div
            className={styles.container}
            style={{ width: containerSize, height: containerSize }}
            role="progressbar"
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Buffer ${Math.round(ratio * 100)}%`}
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

                {/* Real buffer progress ring — no animation, driven by props */}
                <circle
                    className={styles.ring}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    stroke={ringColor}
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{
                        strokeDasharray:  circumference,
                        strokeDashoffset: offset,
                        transition:       "stroke-dashoffset 0.1s linear, stroke 0.2s ease",
                    }}
                />
            </svg>
        </div>
    );
};

export default StatusBar;