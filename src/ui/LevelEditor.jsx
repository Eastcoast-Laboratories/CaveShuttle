import React, { useEffect, useRef, useState } from 'react';
import { parseImportedPackFile } from '../levels/level-pack-import.js';
import { storageKey } from '../core/storage-keys.js';
import { levelEditorTranslations } from '../i18n/levelEditor.js';
import { getAllPacks } from '../levels/levelpacks.js';
import { getInstalledPacks } from '../core/progress-storage.js';
import './level-editor.css';

// CaveShuttle-specific imports are optional via props.
// When embedded in CaveShuttle, App.jsx passes installPackFn and reservedPackIds.
// When standalone, these are undefined and the "Install" button is hidden.

const DRAFT_KEY = storageKey('editorPackDraft');
const LANGUAGE_KEY = 'caveShuttle_language';
const PLAYER_NAME_KEY = storageKey('playerProfile');

/* ######## replacements on standalone editor ########## */
// Local fallback for player name (replaces HighScoreManager dependency)
function getPlayerName() {
  try {
    const stored = localStorage.getItem(PLAYER_NAME_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.name) return parsed.name;
    }
  } catch {}
  return 'Editor';
}

// Local fallback for language (replaces useLanguage dependency)
function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored) return stored;
  } catch {}
  return navigator.language && navigator.language.startsWith('de') ? 'de' : 'en';
}

const PACK_NAME_ADJECTIVES = ['Cavernous', 'Treacherous', 'Crystal', 'Volcanic', 'Frozen', 'Ancient', 'Neon', 'Shadow', 'Crimson', 'Emerald', 'Golden', 'Forgotten'];
const PACK_NAME_NOUNS = ['Depths', 'Expedition', 'Labyrinth', 'Odyssey', 'Frontier', 'Venture', 'Reaches', 'Catacombs', 'Drift', 'Expanse'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePackId() {
  return `pack-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}`;
}

function generatePackName() {
  return `${pick(PACK_NAME_ADJECTIVES)} ${pick(PACK_NAME_NOUNS)}`;
}

function sanitizeLevelName(name) {
  if (!name) return 'level';
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

function defaultDraft() {
  return {
    meta: { id: generatePackId(), name: generatePackName(), version: '1.0', author: getPlayerName(), createdAt: Date.now() },
    levels: {}
  };
}

export default function LevelEditor({ onBack, onEditorTest, onPackImported, installPackFn, isReservedPackIdFn }) {
  const [language, setLanguageState] = useState(getStoredLanguage);
  const t = levelEditorTranslations[language] || levelEditorTranslations.en;
  const setLanguage = (lang) => {
    setLanguageState(lang);
    try { localStorage.setItem(LANGUAGE_KEY, lang); } catch {}
  };
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const [draft, setDraft] = useState(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.meta && parsed.meta.id) return parsed;
      }
      return defaultDraft();
    } catch (error) {
      console.error('[LEVEL_EDITOR_PACK] Failed to load draft', error);
      return defaultDraft();
    }
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_LANGUAGE', lang: language }, '*');
    }
  }, [language]);

  // Alt+T: trigger test level from parent (browser intercepts Alt+T inside iframe)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'TRIGGER_TEST' }, '*');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Send available level packs (built-in + imported) to the iframe editor.
  // Imported packs include their level content so the iframe can load them without fetch.
  useEffect(() => {
    const sendPacks = () => {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;
      const allPacks = getAllPacks();
      const installedPacks = getInstalledPacks();
      const packsData = allPacks.map(pack => {
        const installed = installedPacks.find(p => p.meta.id === pack.id);
        return {
          id: pack.id,
          name: pack.name,
          source: pack.source,
          baseUrl: pack.baseUrl,
          levelCount: pack.meta?.levelCount ?? (installed ? Object.keys(installed.levels).length : 0),
          levels: installed ? installed.levels : null,
        };
      });
      iframeRef.current.contentWindow.postMessage({ type: 'SET_LEVEL_PACKS', packs: packsData }, '*');
    };
    // Send once on mount, and also when iframe loads
    sendPacks();
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', sendPacks);
      return () => iframe.removeEventListener('load', sendPacks);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('[LEVEL_EDITOR_PACK] Failed to save draft', error);
      setError(t.draftTooLarge);
    }
  }, [draft]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data) return;
      if (event.data.type === 'EDITOR_TEST') {
        onEditorTest(event.data.levelData, event.data.wallColor);
      } else if (event.data.type === 'EDITOR_ADD_TO_PACK') {
        const rawName = event.data.levelName || 'level';
        const base = sanitizeLevelName(rawName);
        const uniqueId = (() => {
          if (!draft.levels[base]) return base;
          let i = 2;
          while (draft.levels[`${base}_${i}`]) i += 1;
          return `${base}_${2}`;
        })();
        setDraft(prev => ({
          ...prev,
          levels: {
            ...prev.levels,
            [uniqueId]: event.data.levelData
          }
        }));
        setSidebarOpen(true);
        setMessage(t.addedToPack.replace('{id}', uniqueId));
        setTimeout(() => setMessage(null), 2000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEditorTest, draft.levels]);

  const setMetaField = (field, value) => {
    setDraft(prev => ({ ...prev, meta: { ...prev.meta, [field]: value } }));
  };

  const editLevel = (levelId) => {
    const levelData = draft.levels[levelId];
    if (!levelData || !iframeRef.current) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'LOAD_LEVEL', levelData, levelName: levelId },
      '*'
    );
  };

  const removeLevel = (levelId) => {
    setDraft(prev => {
      const { [levelId]: _, ...rest } = prev.levels;
      return { ...prev, levels: rest };
    });
  };

  const moveLevel = (levelId, direction) => {
    const ids = Object.keys(draft.levels);
    const index = ids.indexOf(levelId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    const reordered = {};
    ids.forEach(id => { reordered[id] = draft.levels[id]; });
    setDraft(prev => ({ ...prev, levels: reordered }));
  };

  const handleOpenPack = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError(null);
    try {
      const fileText = await file.text();
      const parsed = parseImportedPackFile(fileText);
      setDraft({
        meta: { ...defaultDraft().meta, ...parsed.meta, createdAt: parsed.meta.createdAt || Date.now() },
        levels: parsed.levels || {}
      });
      setMessage(t.packLoaded.replace('{name}', parsed.meta.name || parsed.meta.id));
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      event.target.value = '';
    }
  };

  const downloadPack = () => {
    if (!draft.meta.id) {
      setError(t.packIdRequired);
      return;
    }
    const pack = { meta: { ...draft.meta, createdAt: draft.meta.createdAt || Date.now() }, levels: draft.levels };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.meta.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const installPack = () => {
    if (!installPackFn) return;
    setError(null);
    if (!draft.meta.id || !draft.meta.name) {
      setError(t.packIdNameRequired);
      return;
    }
    if (isReservedPackIdFn && isReservedPackIdFn(draft.meta.id)) {
      setError(t.packIdReserved.replace('{id}', draft.meta.id));
      return;
    }
    if (!draft.levels || Object.keys(draft.levels).length === 0) {
      setError(t.packNeedsLevel);
      return;
    }
    try {
      const result = installPackFn(draft.meta, draft.levels, true);
      if (result.success) {
        if (onPackImported) onPackImported();
        setMessage(t.packInstalled.replace('{id}', draft.meta.id));
        setTimeout(() => setMessage(null), 2000);
      } else if (result.conflict) {
        setError(t.packConflict.replace('{id}', draft.meta.id));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const newPack = () => {
    if (window.confirm(t.newPackConfirm)) {
      setDraft(defaultDraft());
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="level-editor-root">
      <div className="level-editor-toolbar">
        <button onClick={onBack} className="level-editor-btn-back">
          {t.backToMenu}
        </button>
        <button onClick={toggleSidebar} className="level-editor-btn-sidebar">
          {t.packBuilder}
        </button>
      </div>
      <div className="level-editor-language-switcher">
        {['de', 'en'].map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={language === lang ? 'active' : ''}
          >
            {lang === 'de' ? '🇩🇪' : '🇬🇧'}
          </button>
        ))}
      </div>
      <iframe
        ref={iframeRef}
        src={`/level-editor/index.html?lang=${language}&v=4`}
        className="level-editor-iframe"
        title={t.levelEditorTitle}
      />
      {sidebarOpen && (
        <div className="level-editor-sidebar">
          <div className="level-editor-sidebar-header">
            <h3>{t.packBuilder}</h3>
            <div className="level-editor-sidebar-header-buttons">
              <button
                onClick={() => setShowHelp(prev => !prev)}
                className="level-editor-btn-help"
                title={t.howDoesItWork}
              >
                ?
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="level-editor-btn-close"
                title={t.closePackBuilder}
              >
                ×
              </button>
            </div>
          </div>
          {showHelp && (
            <div
              className="level-editor-help-text"
              dangerouslySetInnerHTML={{ __html: t.helpIntro + t.help1 + t.help2 + t.help3 + t.help4 + t.help5 + t.help6 + t.helpShare }}
            />
          )}
          {message && <div className="level-editor-message">{message}</div>}
          {error && <div className="level-editor-error">{error}</div>}

          <label className="level-editor-label">{t.packId}</label>
          <input className="level-editor-input" value={draft.meta.id} onChange={e => setMetaField('id', e.target.value)} placeholder={t.packIdPlaceholder} />
          <label className="level-editor-label">{t.packName}</label>
          <input className="level-editor-input" value={draft.meta.name} onChange={e => setMetaField('name', e.target.value)} placeholder={t.packNamePlaceholder} />
          <label className="level-editor-label">{t.version}</label>
          <input className="level-editor-input" value={draft.meta.version} onChange={e => setMetaField('version', e.target.value)} placeholder={t.versionPlaceholder} />
          <label className="level-editor-label">{t.author}</label>
          <input className="level-editor-input" value={draft.meta.author} onChange={e => setMetaField('author', e.target.value)} placeholder={t.authorPlaceholder} />

          <h4 className="level-editor-section-title">{t.levels}</h4>
          <div>
            {Object.keys(draft.levels).map(levelId => (
              <div key={levelId} className="level-editor-level-item">
                <span className="level-editor-level-name">{levelId}</span>
                <div className="level-editor-level-buttons">
                  <button onClick={() => editLevel(levelId)} className="level-editor-btn level-editor-btn-edit">{t.edit}</button>
                  <button onClick={() => moveLevel(levelId, -1)} className="level-editor-btn level-editor-btn-move">▲</button>
                  <button onClick={() => moveLevel(levelId, 1)} className="level-editor-btn level-editor-btn-move">▼</button>
                  <button onClick={() => removeLevel(levelId)} className="level-editor-btn level-editor-btn-remove">×</button>
                </div>
              </div>
            ))}
            {Object.keys(draft.levels).length === 0 && (
              <div className="level-editor-empty-levels">{t.noLevelsYet}</div>
            )}
          </div>

          <div className="level-editor-sidebar-footer">
            <button onClick={newPack} className="level-editor-btn level-editor-btn-new level-editor-btn-full-width">{t.newPack}</button>
            <button onClick={() => fileInputRef.current?.click()} className="level-editor-btn level-editor-btn-open level-editor-btn-full-width">{t.openPackFile}</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleOpenPack} className="level-editor-file-input" />
            <button onClick={downloadPack} className="level-editor-btn level-editor-btn-download level-editor-btn-full-width">{t.downloadPack}</button>
            {installPackFn && (
              <button onClick={installPack} className="level-editor-btn level-editor-btn-install level-editor-btn-full-width">{t.installPackInGame}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
