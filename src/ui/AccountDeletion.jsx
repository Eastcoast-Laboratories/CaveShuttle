import React from 'react';
import './LegalPages.css';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getAccountDeletionTranslations } from '../i18n/accountDeletion.js';

// Account deletion page reachable via #account-deletion hash.
// Required by Google Play Data Safety policy.
export default function AccountDeletion({ onBack }) {
  const { language } = useLanguage();
  const t = getAccountDeletionTranslations(language);
  const emailHref = 'mailto:' + t.contactEmail;

  return (
    <div className="modal-page">
      <div className="modal-page-inner">
        <button className="back-button" onClick={onBack}>
          {t.back}
        </button>

        <h1>{t.title}</h1>

        <p>{t.intro}</p>

        <p>
          <a
            href={t.deleteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              color: '#fff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontFamily: '"Commodore 64", "Courier New", monospace',
              fontSize: 'clamp(12px, 3vw, 18px)',
            }}
          >
            {t.deleteLinkText}
          </a>
        </p>

        <p style={{ color: '#aaa', fontSize: '14px' }}>
          {t.localDataHint}
        </p>

        <h2>{t.contactTitle}</h2>
        <p>
          {t.contactEmailLabel} <a href={emailHref}>{t.contactEmail}</a>
        </p>
      </div>
    </div>
  );
}
