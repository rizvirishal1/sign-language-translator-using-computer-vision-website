import React from "react";
import styles from "./translatebtn.module.scss";

// ── Language registry ──────────────────────────────────────────────
// Exported so Sign2Text can reference the same list for shortcuts / pill label.
export const LANGUAGES = [
    { code: "en", name: "English",  flag: "🇺🇸", key: "1", ttsLang: "en-US" },
    { code: "ml", name: "Malayalam",flag: "🇮🇳", key: "2", ttsLang: "ml-IN" },
    { code: "ar", name: "Arabic",   flag: "🇸🇦", key: "3", ttsLang: "ar-SA" },
    { code: "zh", name: "Chinese",  flag: "🇨🇳", key: "4", ttsLang: "zh-CN" },
    { code: "es", name: "Español",  flag: "🇪🇸", key: "5", ttsLang: "es-ES" },
    { code: "ta", name: "Tamil",    flag: "🇮🇳", key: "6", ttsLang: "ta-IN" },
    { code: "hi", name: "Hindi",    flag: "🇮🇳", key: "7", ttsLang: "hi-IN" },
    { code: "te", name: "Telugu",   flag: "🇮🇳", key: "8", ttsLang: "te-IN" },
];

/**
 * LanguageSelector
 *
 * Props:
 *   selectedLanguage  – language code string  (controlled by Sign2Text)
 *   onLanguageChange  – (code: string) => void
 */
export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
    return (
        <div className={styles.languageSelector}>
            <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag}  {lang.name}  [{lang.key}]
                    </option>
                ))}
            </select>
        </div>
    );
}