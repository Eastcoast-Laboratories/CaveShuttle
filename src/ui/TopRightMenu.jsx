import React, { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import HamburgerMenu from './HamburgerMenu';
import { ENABLE_LEVEL_EDITOR } from '../core/constants.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getMenuTranslations } from '../i18n/menu.js';
import './TopRightMenu.css';

// Unified, reusable top-right control bar for all non-game screens.
// Contains the language switcher, the level editor button and the hamburger
// button, and owns the HamburgerMenu overlay state. Close-sensitive actions
// (level buttons, back to menu, open editor, tutorial) automatically close the
// menu. All remaining settings are forwarded via hamburgerProps (DRY).
export default function TopRightMenu({ language, onLanguageChange, onOpenLevelEditor, makeLevelButtons, onBackToMenu, onShowTutorial, hamburgerProps = {} }) {
  const { language: lang } = useLanguage();
  const t = getMenuTranslations(lang);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const showEditor = ENABLE_LEVEL_EDITOR && onOpenLevelEditor;

  return (
    <>
      <div className={`top-right-menu${open ? ' open' : ''}`}>
        <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
        {showEditor && (
          <button className="trm-icon-btn trm-editor-btn" onClick={onOpenLevelEditor} title={t.levelEditor}>
            ✎
          </button>
        )}
        <button
          id="top-right-hamburger-button"
          className="trm-icon-btn trm-hamburger-btn"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      <HamburgerMenu
        isOpen={open}
        onClose={close}
        levelButtons={makeLevelButtons ? makeLevelButtons(close) : []}
        onBackToMenu={() => { close(); if (onBackToMenu) onBackToMenu(); }}
        onOpenLevelEditor={showEditor ? () => { close(); onOpenLevelEditor(); } : undefined}
        onShowTutorial={() => { close(); if (onShowTutorial) onShowTutorial(); }}
        {...hamburgerProps}
      />
    </>
  );
}
