// Translations for the standalone level editor iframe.
// The language is determined by URL param ?lang=de, postMessage from parent, or browser default.
// New languages can be added here without touching editor.js or index.html.

(function () {
  const translations = {
    de: {
      // Tool titles
      paintTool: 'Malwerkzeug (P)',
      selectTool: 'Auswahlwerkzeug (S)',
      slopeTool: 'Hangwerkzeug (L)',
      triangleTool: 'Dreieckswerkzeug (D)',
      hillTool: 'Hügelwerkzeug (H)',
      bucketTool: 'Eimerwerkzeug (B)',
      eraserTool: 'Radiergummi (E)',

      // Section headings
      actions: 'Aktionen',
      moveZoom: 'Bewegen & Zoom',
      levelControls: 'Level-Steuerung',
      levelParameters: 'Level-Parameter',
      levelPreview: 'Level-Vorschau',
      templates: 'Vorlagen',
      tilePalette: 'Tile-Palette',
      levelAscii: 'Level ASCII',

      // Action titles
      undo: 'Rückgängig (Ctrl+Z)',
      redo: 'Wiederherstellen (Ctrl+Y)',
      copy: 'Kopieren (Ctrl+C)',
      paste: 'Einfügen (Ctrl+V)',
      fillSelection: 'Auswahl füllen (G)',
      delete: 'Löschen (Entf)',

      // Level controls
      default: 'Standard',
      classic: 'Klassisch',
      levelNamePlaceholder: 'Level-Name (z.B. level2)',
      wallColor: 'Wandfarbe',
      wallColorPicker: 'Farbauswahl Wandfarbe',
      rgbValues: 'RGB-Werte:',
      copyRgb: 'RGB kopieren',
      load: 'Laden',
      new: 'Neu',
      generate: 'Generieren',
      save: 'Speichern',
      test: 'Testen',
      addToPack: 'Zum Pack hinzufügen',

      // Parameter labels
      width: 'Breite:',
      height: 'Höhe:',
      startHeight: 'Starthöhe:',
      emptySpace: 'Leerraum:',
      bedrock: 'Grundgestein:',
      bunkers: 'Bunker:',
      fuel: 'Treibstoff:',
      bunkerChance: 'Bunker-Wahrscheinlichkeit:',
      fuelChance: 'Treibstoff-Wahrscheinlichkeit:',
      podColor: 'Pod-Farbe:',

      // Canvas info
      cursorPos: 'X: {x}, Y: {y}',
      levelSize: 'Größe: {w} x {h}',
      empty: 'Leer',

      // Modal
      copyModal: 'Kopieren',
      saveAsTxt: 'Als .txt speichern',
      copied: 'Kopiert!',

      // Alerts / confirms
      generateConfirm: 'Zufälliges Level generieren? Ungespeicherte Änderungen gehen verloren.',
      generatorNotLoaded: 'Level-Generator nicht geladen. Stelle sicher, dass level-generator.js eingebunden ist.',
      widthTooSmall: 'Breite ist zu klein für den Level-Generator ({width}). Sie wird auf {min} erhöht.',
      failedToLoad: 'Level konnte nicht geladen werden: {error}',
      failedToGenerate: 'Gültiges Level konnte nicht generiert werden: {error}',

      // Info button title
      infoHelp: 'Hilfe',

      // Info popover texts
      info_emptySpace: 'Vertikaler Versatz für den leeren Raum über dem Gelände (wird als emptySpaceHeight in den Header geschrieben). Steuert die Sterndichte im Himmel. Negative Werte heben das Gelände an, positive Werte senken es ab.',
      info_bedrock: 'Höhe der unzerstörbaren Grundgestein-Schicht am unteren Ende (wird als bedrockHeight in den Header geschrieben). Das Spiel generiert so viele Zeilen massiver Wand-Tiles unter dem Level-Grid als Boden.',
      info_bunkers: 'Zielanzahl der zu platzierenden Bunker. Der Generator versucht, diese Anzahl über alle Korridore zu verteilen. Mehrere Bunker pro Korridor sind möglich. Wenn das Level zu klein ist, wird bestmöglich platziert.',
      info_fuel: 'Zielanzahl der Treibstoffdepots. Gleiche Logik wie Bunker: mehrere Depots pro Korridor, bestmögliche Platzierung bei zu kleinem Level.',
      info_bunkerChance: 'Wahrscheinlichkeit (0.0–1.0), dass ein Bunker-Platzierungsversuch erfolgreich ist. Leer = 1.0 (jeden Bunker platzieren) bei angegebener Anzahl, sonst 0.5 (zufällige Platzierung).',
      info_fuelChance: 'Wahrscheinlichkeit (0.0–1.0), dass ein Treibstoff-Platzierungsversuch erfolgreich ist. Gleiche Standardlogik wie Bunker-Wahrscheinlichkeit (1.0 mit Anzahl, 0.55 ohne).',

      // Level option
      levelN: 'Level {n}',
    },

    en: {
      // Tool titles
      paintTool: 'Paint Tool (P)',
      selectTool: 'Select Tool (S)',
      slopeTool: 'Slope Tool (L)',
      triangleTool: 'Triangle Tool (D)',
      hillTool: 'Hill Tool (H)',
      bucketTool: 'Bucket Tool (B)',
      eraserTool: 'Eraser (E)',

      // Section headings
      actions: 'Actions',
      moveZoom: 'Move & Zoom',
      levelControls: 'Level Controls',
      levelParameters: 'Level Parameters',
      levelPreview: 'Level Preview',
      templates: 'Templates',
      tilePalette: 'Tile Palette',
      levelAscii: 'Level ASCII',

      // Action titles
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      copy: 'Copy (Ctrl+C)',
      paste: 'Paste (Ctrl+V)',
      fillSelection: 'Fill Selection (G)',
      delete: 'Delete (Del)',

      // Level controls
      default: 'Default',
      classic: 'Classic',
      levelNamePlaceholder: 'Level name (e.g., level2)',
      wallColor: 'Wall Color',
      wallColorPicker: 'Wall color picker',
      rgbValues: 'RGB values:',
      copyRgb: 'Copy RGB',
      load: 'Load',
      new: 'New',
      generate: 'Generate',
      save: 'Save',
      test: 'Test',
      addToPack: 'Add to Pack',

      // Parameter labels
      width: 'Width:',
      height: 'Height:',
      startHeight: 'Start Height:',
      emptySpace: 'Empty Space:',
      bedrock: 'Bedrock:',
      bunkers: 'Bunkers:',
      fuel: 'Fuel:',
      bunkerChance: 'Bunker Chance:',
      fuelChance: 'Fuel Chance:',
      podColor: 'Pod Color:',

      // Canvas info
      cursorPos: 'X: {x}, Y: {y}',
      levelSize: 'Size: {w} x {h}',
      empty: 'Empty',

      // Modal
      copyModal: 'Copy',
      saveAsTxt: 'Save as .txt',
      copied: 'Copied!',

      // Alerts / confirms
      generateConfirm: 'Generate a random level? Unsaved changes will be lost.',
      generatorNotLoaded: 'Level generator not loaded. Make sure level-generator.js is included.',
      widthTooSmall: 'Width is too small for the level generator ({width}). It will be increased to {min}.',
      failedToLoad: 'Failed to load level: {error}',
      failedToGenerate: 'Failed to generate valid level: {error}',

      // Info button title
      infoHelp: 'Help',

      // Info popover texts
      info_emptySpace: 'Vertical offset for empty space above the terrain (written to the .def header as emptySpaceHeight). Controls star field density in the sky. Negative values raise the terrain; positive values lower it.',
      info_bedrock: 'Height of the indestructible bedrock layer at the bottom (written to the .def header as bedrockHeight). The game generates this many rows of solid wall tiles below the level grid as floor.',
      info_bunkers: 'Target number of bunkers to place. The generator tries to place this many bunkers across all corridors. Multiple bunkers can be placed per corridor at different horizontal positions. If the level is too small, the generator gets as close as possible (best-effort).',
      info_fuel: 'Target number of fuel depots to place. Same multi-placement logic as bunkers: multiple fuel depots per corridor, best-effort fallback.',
      info_bunkerChance: 'Probability (0.0–1.0) that a given bunker placement attempt succeeds. If left empty while a bunker count is specified, defaults to 1.0 (try to place every bunker). If no count is specified, defaults to 0.5 (random placement).',
      info_fuelChance: 'Probability (0.0–1.0) that a given fuel placement attempt succeeds. Same defaulting logic as Bunker Chance (1.0 with count, 0.55 without).',

      // Level option
      levelN: 'Level {n}',
    },
  };

  let currentLang = 'en';

  function detectLanguage() {
    // 1. URL param ?lang=de
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && translations[urlLang]) return urlLang;

    // 2. localStorage
    try {
      const stored = localStorage.getItem('caveShuttle_language');
      if (stored && translations[stored]) return stored;
    } catch {}

    // 3. Browser default
    if (navigator.language && navigator.language.startsWith('de')) return 'de';

    return 'en';
  }

  function t(key, params) {
    const dict = translations[currentLang] || translations.en;
    let str = dict[key] || translations.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
      }
    }
    return str;
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    applyTranslations();
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', t(key));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', t(key));
    });
  }

  // Listen for language changes from parent window
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_LANGUAGE' && event.data.lang) {
      setLanguage(event.data.lang);
    }
  });

  // Initialize on load
  currentLang = detectLanguage();
  document.addEventListener('DOMContentLoaded', applyTranslations);

  // Expose globally
  window.editorI18n = { t, setLanguage, getLanguage: () => currentLang, applyTranslations };
})();
