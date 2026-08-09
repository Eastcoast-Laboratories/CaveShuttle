import React from 'react';
import './LegalPages.css';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getAccountDeletionTranslations } from '../i18n/accountDeletion.js';

// Account deletion page reachable via #account-deletion hash.
// Required by Google Play Data Safety policy.
export default function AccountDeletion({ onBack }) {
  const { language } = useLanguage();
  const t = getAccountDeletionTranslations(language);
  const emailHref = 'mailto:caveshuttle-support@it.z11.de?subject=' + encodeURIComponent(t.emailSubject);

  return (
    <div className="modal-page">
      <div className="modal-page-inner">
        <button className="back-button" onClick={onBack}>
          {t.back}
        </button>

        <h1>{t.title}</h1>

        <p>
          {t.introBefore} <strong>community.caveshuttle.z11.de</strong> {t.introAfter}
        </p>

        <h2>{t.step1Title}</h2>
        <ol>
          <li>
            {t.step1Item1Before} <a href={emailHref}>caveshuttle-support@it.z11.de</a>
            {' '}{t.step1Item1Mid} <strong>„{t.emailSubject}"</strong>.
          </li>
          <li>
            {t.step1Item2Before} <strong>{t.usernameLabel}</strong> {t.step1Item2Mid} <strong>{t.emailAddrLabel}</strong>
            {' '}{t.step1Item2After}
          </li>
          <li>
            {t.step1Item3Before} <strong>14 {language === 'de' ? 'Tagen' : 'days'}</strong>{t.step1Item3After}
          </li>
        </ol>

        <h2>{t.step2Title}</h2>
        <p>{t.step2Intro}</p>
        <ul>
          {t.step2Items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h2>{t.step3Title}</h2>
        <p>{t.step3Intro}</p>
        <ul>
          <li>
            <strong>{t.step3Item1Label}</strong>{t.step3Item1Text}
          </li>
          <li>
            <strong>{t.step3Item2Label}</strong>{t.step3Item2Text}
          </li>
        </ul>

        <h2>{t.step4Title}</h2>
        <p>{t.step4Text1}</p>
        <p>
          {t.step4Text2Before} <strong>{t.resetLabel}</strong> {t.step4Text2After}
        </p>

        <h2>{t.step5Title}</h2>
        <p>{t.step5Text}</p>

        <h2>{t.contactTitle}</h2>
        <p>
          {t.contactName}<br />
          {t.contactOrg}<br />
          {t.contactStreet}<br />
          {t.contactCity}<br />
          {t.contactEmailLabel} <a href={emailHref}>caveshuttle-support@it.z11.de</a>
        </p>
      </div>
    </div>
  );
}
