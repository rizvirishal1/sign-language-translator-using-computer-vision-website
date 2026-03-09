import { useState } from 'react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import styles from './title.module.scss';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const Title = () => {
    const [isSwapped, setIsSwapped] = useState(false);
    const [animState, setAnimState] = useState(''); // '' | 'out' | 'in'
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Set the initial state based on the current path
        if (location.pathname === '/text2sign') {
            setIsSwapped(true);
            setLeftText("Text");
            setRightText("Sign");
        } else {
            setIsSwapped(false);
            setLeftText("Sign");
            setRightText("Text");
        }
    }, [location.pathname]);


    const handleToggle = () => {
        // Prevent clicking again while the animation is running
        if (animState !== '') return;

        // Step 1: Trigger the "animate out" phase
        setAnimState('out');

        // Step 2: Swap the text in the background and trigger "animate in"
        setTimeout(() => {
            setIsSwapped(prev => !prev);
            setAnimState('in');

            // Update the text based on the new state
            if (!isSwapped) {
                setLeftText("Text");
                setRightText("Sign");
                navigate('/text2sign');
            } else {
                setLeftText("Sign");
                setRightText("Text");
                navigate('/sign2text');
            }

            // Step 3: Reset to idle state after the animation finishes
            setTimeout(() => {
                setAnimState('');
            }, 400); // 400ms matches the CSS animation duration
        }, 400);
    };


    return (
        <div className={styles.container}>
            {/* The grid wrapper keeps everything perfectly anchored */}
            <div className={`${styles.gridWrapper} ${animState ? styles[animState] : ''}`}>

                <div className={styles.leftCol}>
                    <span className={styles.animatedText + ' ' + styles.leftElement}>
                        {leftText}
                    </span>
                </div>

                <button
                    className={`${styles.toggleBtn} ${isSwapped ? styles.rotated : ''}`}
                    onClick={handleToggle}
                    aria-label="Swap positions"
                >
                    <ArrowsRightLeftIcon className={styles.icon} />
                </button>

                <div className={styles.rightCol}>
                    <span className={styles.animatedText + ' ' + styles.rightElement}>
                        {rightText}
                    </span>
                </div>

            </div>
        </div>
    );
};

export default Title;