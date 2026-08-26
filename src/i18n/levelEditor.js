// Translations for the level editor and pack builder sidebar.
// New languages can be added here without touching the component.
export const levelEditorTranslations = {
  de: {
    // Toolbar
    backToMenu: '← Menu',
    packBuilder: 'Pack Builder',

    // Sidebar header
    howDoesItWork: 'Wie funktioniert der Pack Builder?',
    closePackBuilder: 'Pack Builder schließen',

    // Help text
    helpIntro: '<strong>Pack Builder</strong> ermöglicht es dir, Level zu einem teilbaren Pack zusammenzustellen.<br /><br />',
    help1: '<strong>1.</strong> Designe ein Level im Editor links.<br />',
    help2: '<strong>2.</strong> Klicke <strong>"Zum Pack hinzufügen"</strong>, um es deinem Pack hinzuzufügen.<br />',
    help3: '<strong>3.</strong> Sortiere Level mit ▲▼ oder entferne sie mit ×.<br />',
    help4: '<strong>4.</strong> Klicke ein Level an und drücke <strong>Bearbeiten</strong>, um es in den Editor zu laden.<br />',
    help5: '<strong>5.</strong> Verwende <strong>Pack herunterladen</strong>, um eine .json-Datei zu speichern, die du teilen kannst.<br />',
    help6: '<strong>6.</strong> Verwende <strong>Pack im Spiel installieren</strong>, um es sofort zu spielen.<br /><br />',
    helpShare: 'Wenn du es teilst, kann jeder dein Level-Pack im Spielmenü importieren.',
    helpUpload: '<strong>7.</strong> Verwende <strong>In Community hochladen</strong>, um dein Pack direkt auf community.caveshuttle.z11.de zu veröffentlichen.',

    // Form labels
    packId: 'Pack-ID',
    packName: 'Pack-Name',
    version: 'Version',
    author: 'Autor',

    // Placeholders
    packIdPlaceholder: 'eindeutige-pack-id',
    packNamePlaceholder: 'Mein Pack',
    versionPlaceholder: '1.0',
    authorPlaceholder: 'Autor',

    // Levels section
    levels: 'Level',
    edit: 'Bearbeiten',
    noLevelsYet: 'Noch keine Level. Verwende "Zum Pack hinzufügen" im Editor.',

    // Footer buttons
    newPack: 'Neues Pack',
    openPackFile: 'Pack-Datei öffnen',
    downloadPack: 'Pack herunterladen',
    installPackInGame: 'Pack im Spiel installieren',
    uploadToCommunity: 'In Community hochladen',
    uploading: 'Wird hochgeladen...',

    // Messages
    addedToPack: '{id} zum Pack hinzugefügt.',
    packLoaded: 'Pack {name} geladen.',
    packInstalled: 'Pack {id} installiert.',
    packIdRequired: 'Pack-ID ist für den Download erforderlich.',
    packIdNameRequired: 'Pack-ID und Name sind erforderlich.',
    packIdReserved: 'Pack-ID "{id}" ist für ein integriertes Pack reserviert.',
    packNeedsLevel: 'Pack muss mindestens ein Level enthalten.',
    packConflict: 'Pack {id} konnte aufgrund eines Konflikts nicht installiert werden.',
    draftTooLarge: 'Pack-Entwurf ist zu groß zum Speichern.',
    newPackConfirm: 'Neues Pack erstellen? Der aktuelle Entwurf wird verworfen.',
    uploadSuccess: 'Pack hochgeladen! Siehe es auf community.caveshuttle.z11.de/packs/{id}.',
    uploadFailed: 'Upload fehlgeschlagen: {error}',
    uploadNeedsLevels: 'Pack muss mindestens ein Level enthalten zum Hochladen.',

    // Iframe title
    levelEditorTitle: 'Level Editor',
  },

  en: {
    // Toolbar
    backToMenu: 'Back to Menu',
    packBuilder: 'Pack Builder',

    // Sidebar header
    howDoesItWork: 'How does the Pack Builder work?',
    closePackBuilder: 'Close Pack Builder',

    // Help text
    helpIntro: '<strong>Pack Builder</strong> lets you collect levels into a shareable pack.<br /><br />',
    help1: '<strong>1.</strong> Design a level in the editor on the left.<br />',
    help2: '<strong>2.</strong> Click <strong>"Add to Pack"</strong> to add it to your pack.<br />',
    help3: '<strong>3.</strong> Reorder levels with ▲▼ or remove them with ×.<br />',
    help4: '<strong>4.</strong> Click a level and press <strong>Edit</strong> to load it back into the editor.<br />',
    help5: '<strong>5.</strong> Use <strong>Download Pack</strong> to save a .json file you can share.<br />',
    help6: '<strong>6.</strong> Use <strong>Install Pack in Game</strong> to play it immediately.<br /><br />',
    helpShare: 'If you share it, everybody can import your level-pack in their game menu.',
    helpUpload: '<strong>7.</strong> Use <strong>Upload to Community</strong> to publish your pack directly to community.caveshuttle.z11.de.',

    // Form labels
    packId: 'Pack ID',
    packName: 'Pack Name',
    version: 'Version',
    author: 'Author',

    // Placeholders
    packIdPlaceholder: 'unique-pack-id',
    packNamePlaceholder: 'My Pack',
    versionPlaceholder: '1.0',
    authorPlaceholder: 'Author',

    // Levels section
    levels: 'Levels',
    edit: 'Edit',
    noLevelsYet: 'No levels yet. Use "Add to Pack" in the editor.',

    // Footer buttons
    newPack: 'New Pack',
    openPackFile: 'Open Pack File',
    downloadPack: 'Download Pack',
    installPackInGame: 'Install Pack in Game',
    uploadToCommunity: 'Upload to Community',
    uploading: 'Uploading...',

    // Messages
    addedToPack: 'Added {id} to pack.',
    packLoaded: 'Pack {name} loaded.',
    packInstalled: 'Pack {id} installed.',
    packIdRequired: 'Pack ID is required for download.',
    packIdNameRequired: 'Pack ID and name are required.',
    packIdReserved: 'Pack ID "{id}" is reserved for a built-in pack.',
    packNeedsLevel: 'Pack must contain at least one level.',
    packConflict: 'Pack {id} could not be installed due to a conflict.',
    draftTooLarge: 'Pack draft is too large to save.',
    newPackConfirm: 'Create a new pack? The current draft will be discarded.',
    uploadSuccess: 'Pack uploaded! View it at community.caveshuttle.z11.de/packs/{id}.',
    uploadFailed: 'Upload failed: {error}',
    uploadNeedsLevels: 'Pack must contain at least one level to upload.',

    // Iframe title
    levelEditorTitle: 'Level Editor',
  },
};
