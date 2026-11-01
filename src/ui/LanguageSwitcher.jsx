import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

export default function LanguageSwitcher({ language, onLanguageChange, style = {}, scale = 1 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const px = (v) => `${Math.round(v * scale)}px`;

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
          borderRadius: px(6),
          padding: `${px(4)} ${px(8)}`,
          cursor: 'pointer',
          fontSize: px(18),
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
            marginTop: px(4),
            display: 'flex',
            flexDirection: 'column',
            gap: px(4),
            background: '#222',
            borderRadius: px(6),
            padding: px(4),
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
                borderRadius: px(6),
                padding: `${px(4)} ${px(8)}`,
                cursor: 'pointer',
                fontSize: px(18),
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
