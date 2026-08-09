import React from 'react';

// Reusable two-button de/en language switcher.
export default function LanguageSwitcher({ language, onLanguageChange, style = {} }) {
  return (
    <div style={{ display: 'flex', gap: '8px', ...style }}>
      {['de', 'en'].map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          style={{
            background: language === lang ? '#00ff88' : '#333',
            color: language === lang ? '#000' : '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {lang === 'de' ? '🇩🇪' : '🇬🇧'}
        </button>
      ))}
    </div>
  );
}
