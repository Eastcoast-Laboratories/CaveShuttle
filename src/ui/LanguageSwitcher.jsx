import React, { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

export default function LanguageSwitcher({ language, onLanguageChange, style = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
        }}
      >
        {current.flag}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: '#222',
            borderRadius: '6px',
            padding: '4px',
            zIndex: 1000,
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code);
                setOpen(false);
              }}
              style={{
                background: language === lang.code ? '#00ff88' : '#333',
                color: language === lang.code ? '#000' : '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              {lang.flag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
