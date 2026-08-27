import React, { useRef, useEffect, useState } from 'react';
import KeyLabel from './KeyLabel.jsx';
import { parseImportedPackFile } from '../levels/level-pack-import.js';
import { registerCustomPack } from '../levels/levelpacks.js';
import { removeInstalledPack } from '../core/progress-storage.js';
import { HighScoreManager } from '../game/high-score-manager.js';
import { autoAccountManager } from '../game/auto-account.js';
import { exportAllData, importAllData } from '../core/data-transfer.js';
import './cave-theme.css';
import './HamburgerMenu.css';
import PlayerNameInput from './PlayerNameInput.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useSettings } from '../i18n/SettingsContext.jsx';
import { hamburgerMenuTranslations } from '../i18n/hamburgerMenu.js';

// Logarithmic volume mapping: slider position 0-100 → audio volume 0-0.7
// At position 50 (middle) the volume is 10%; at position 100 (full right) it is 70%.
// Formula: volume = (1/70) * Math.exp(slider * Math.log(7) / 50)
export function sliderToVolume(slider) {
  if (slider <= 0) return 0;
  return (1 / 70) * Math.exp(slider * Math.log(7) / 50);
}

// Inverse mapping: audio volume 0-0.7 → slider position 0-100
export function volumeToSlider(volume) {
  if (volume <= 0) return 0;
  const raw = 50 * Math.log(70 * volume) / Math.log(7);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function SettingsSlider({ label, value, onChange, disabled = false }) {
  return (
    <div className={`hamburger-slider-row${disabled ? ' disabled' : ''}`}>
      <span className="slider-label">{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function HamburgerMenu({ isOpen, onClose, levelButtons, onBackToMenu, appVersion, installedPacks, onSwitchPack, onPackImported, onPackDeleted, podDocked, onShowTutorial, onPlayerNameChange, onPlayer2NameChange, onToggleOnlineSync, onToggleTouchButtons, onToggleJoystick, onToggleTiltSteering, onCalibrateTilt, networkRole = null }) {
  const { language } = useLanguage();
  const t = hamburgerMenuTranslations[language] || hamburgerMenuTranslations.en;
  const {
    isMobile,
    showTouchButtons, joystickEnabled,
    soundVolume, setSoundVolume,
    touchButtonOpacity, setTouchButtonOpacity,
    vibrationEnabled, setVibrationEnabled,
    tiltSteering, tiltSteeringRotated, setTiltSteeringRotated,
    orientationMode, setOrientationMode,
    analyticsEnabled, setAnalyticsEnabled,
    onlineSyncEnabled,
    twoPlayer, playerName, player2Name, currentPackId,
    tiltSensorRef,
  } = useSettings();
  const menuRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [conflictDialog, setConflictDialog] = useState(null);
  const [renameId, setRenameId] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [exportedData, setExportedData] = useState('');
  const [importData, setImportData] = useState('');
  const [showImportTextarea, setShowImportTextarea] = useState(false);
  const [dataTransferMsg, setDataTransferMsg] = useState(null);
  const [showVibrationHint, setShowVibrationHint] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showPrivacyOnline, setShowPrivacyOnline] = useState(false);

  useEffect(() => {
    if (!isOpen) { setShowControls(false); setShowPrivacyOnline(false); }
  }, [isOpen]);

  const handleToggleVibration = () => {
    const wasEnabled = vibrationEnabled;
    console.log('[TOGGLE] Vibration: ', wasEnabled ? 'ON -> OFF' : 'OFF -> ON');
    setVibrationEnabled(!vibrationEnabled);
    if (!wasEnabled) {
      setShowVibrationHint(true);
      setTimeout(() => setShowVibrationHint(false), 5000);
    }
  };

  const handleToggleTouchButtons = () => {
    console.log('[TOGGLE] Touch Buttons Visibility:', showTouchButtons ? 'ON -> OFF' : 'OFF -> ON');
    if (onToggleTouchButtons) onToggleTouchButtons();
  };

  const handleToggleTiltSteering = () => {
    console.log('[TOGGLE] Tilt Steering:', tiltSteering ? 'ON -> OFF' : 'OFF -> ON');
    if (onToggleTiltSteering) onToggleTiltSteering();
  };

  const handleToggleTiltRotation = () => {
    console.log('[TOGGLE] Tilt Rotation 90°:', tiltSteeringRotated ? 'ON -> OFF' : 'OFF -> ON');
    setTiltSteeringRotated(!tiltSteeringRotated);
  };

  const handleToggleAnalytics = () => {
    console.log('[TOGGLE] Analytics:', analyticsEnabled ? 'ON -> OFF' : 'OFF -> ON');
    setAnalyticsEnabled(!analyticsEnabled);
  };

  const handleResetHighscores = () => {
    if (window.confirm(t.resetAllData + '?')) {
      HighScoreManager.resetAll();
      const keys = Object.keys(localStorage).filter(k => k.startsWith('app_'));
      keys.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const encoded = exportAllData();
    if (!encoded) {
      setDataTransferMsg({ type: 'error', text: t.exportFailed });
      return;
    }
    setExportedData(encoded);
    setDataTransferMsg({ type: 'success', text: t.dataExported });
  };

  const handleCopyExportedData = () => {
    if (!exportedData) {
      setDataTransferMsg({ type: 'error', text: t.exportDataFirst });
      return;
    }
    navigator.clipboard.writeText(exportedData)
      .then(() => setDataTransferMsg({ type: 'success', text: t.copiedToClipboard }))
      .catch(() => setDataTransferMsg({ type: 'error', text: t.copyFailed }));
  };

  const handleImportData = () => {
    if (!importData.trim()) {
      setDataTransferMsg({ type: 'error', text: t.pasteToImport });
      return;
    }
    const result = importAllData(importData);
    if (result.success) {
      setDataTransferMsg({ type: 'success', text: t.importedEntries.replace('{count}', result.restoredCount) });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setDataTransferMsg({ type: 'error', text: result.error });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Use pointerdown for both desktop and mobile compatibility
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scrollToBottom = () => {
    if (menuRef.current) {
      menuRef.current.scrollTo({
        top: menuRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleImportPack = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    setConflictDialog(null);

    try {
      const fileText = await file.text();
      const parsed = parseImportedPackFile(fileText);
      const result = registerCustomPack(parsed.meta, parsed.levels);
      
      if (result.success) {
        setImportSuccess(true);
        if (onPackImported) {
          onPackImported();
        }
        if (onSwitchPack) {
          onSwitchPack(parsed.meta.id);
        }
      } else if (result.conflict) {
        setConflictDialog({ parsed, existingPack: result.existingPack });
      }
    } catch (error) {
      setImportError(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleOverwrite = () => {
    if (!conflictDialog) return;
    try {
      const result = registerCustomPack(conflictDialog.parsed.meta, conflictDialog.parsed.levels, true);
      if (result.success) {
        setImportSuccess(true);
        setConflictDialog(null);
        if (onPackImported) {
          onPackImported();
        }
        if (onSwitchPack) {
          onSwitchPack(conflictDialog.parsed.meta.id);
        }
      }
    } catch (error) {
      setImportError(error.message);
      setConflictDialog(null);
    }
  };

  const handleRename = () => {
    if (!conflictDialog || !renameId.trim()) return;
    try {
      const renamedMeta = { ...conflictDialog.parsed.meta, id: renameId.trim() };
      const result = registerCustomPack(renamedMeta, conflictDialog.parsed.levels);
      if (result.success) {
        setImportSuccess(true);
        setConflictDialog(null);
        setRenameId('');
        if (onPackImported) {
          onPackImported();
        }
        if (onSwitchPack) {
          onSwitchPack(renamedMeta.id);
        }
      }
    } catch (error) {
      setImportError(error.message);
    }
  };

  const handleDeleteClick = (pack) => {
    setDeleteDialog(pack);
  };

  const handleConfirmDelete = () => {
    if (!deleteDialog) return;
    try {
      removeInstalledPack(deleteDialog.id);
      setDeleteDialog(null);
      // Force a small delay to ensure localStorage write completes before state update
      setTimeout(() => {
        if (onPackDeleted) {
          onPackDeleted();
        }
        // If deleted pack was current, switch to default
        if (currentPackId === deleteDialog.id && onSwitchPack) {
          onSwitchPack('default');
        }
      }, 0);
    } catch (error) {
      setImportError(error.message);
      setDeleteDialog(null);
    }
  };

  return (
    <div ref={menuRef} className={`hamburger-menu${isMobile ? ' mobile' : ''}`}>
      <button
        onClick={scrollToBottom}
        className="hamburger-scroll-btn"
      >
        ⌄
      </button>

      <h3 className="hamburger-section-title with-margin">{t.selectLevel}</h3>
      <div className="hamburger-level-buttons">
        {levelButtons}
      </div>

      <hr />
      <h3 className="hamburger-section-title">{t.playerName}</h3>
      <div className="hamburger-settings-group">
        <PlayerNameInput playerName={playerName} onPlayerNameChange={onPlayerNameChange} />
      </div>
      {twoPlayer && !networkRole && (
        <>
          <h3 className="hamburger-section-title">{t.player2Name}</h3>
          <div className="hamburger-settings-group">
            <PlayerNameInput playerName={player2Name} onPlayerNameChange={onPlayer2NameChange} />
          </div>
        </>
      )}

      <hr />
      <h3
        className="hamburger-section-title"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '▼' : '▶'} {t.controls}
      </h3>
      {showControls && (
        <>
          <div className="hamburger-settings-group">
            <div className="hamburger-toggle-row">
              <span className="toggle-label">{t.touchButtons}</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleToggleTouchButtons}
                className={`hamburger-toggle-btn ${showTouchButtons ? 'on' : 'off'}`}
              >
                {showTouchButtons ? t.on : t.off}
              </button>
            </div>

            <SettingsSlider
              label={t.transparency}
              value={Math.round((0.5 - touchButtonOpacity) / 0.5 * 100)}
              onChange={(e) => setTouchButtonOpacity && setTouchButtonOpacity(0.5 * (1 - parseInt(e.target.value, 10) / 100))}
              disabled={!showTouchButtons}
            />
          </div>

          <div className="hamburger-settings-group">
            <div className="hamburger-toggle-row">
              <span className="toggle-label">{t.joystick}</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onToggleJoystick}
                className={`hamburger-toggle-btn ${joystickEnabled ? 'on' : 'off'}`}
              >
                {joystickEnabled ? t.on : t.off}
              </button>
            </div>
            {!joystickEnabled && (
              <p className="hamburger-hint">
                {t.tapAnywhereToFire}
              </p>
            )}
            {joystickEnabled && (
              <p className="hamburger-hint">{t.holdSwipeToSteer}</p>
            )}
          </div>

          <div className="hamburger-settings-group">
            <div className="hamburger-toggle-row">
              <span className="toggle-label">{t.tiltSteering}</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleToggleTiltSteering}
                className={`hamburger-toggle-btn ${tiltSteering ? 'on' : 'off'}`}
              >
                {tiltSteering ? t.on : t.off}
              </button>
            </div>
            {tiltSteering && (
              <>
                <p className="hamburger-hint">{t.tiltHint}</p>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onCalibrateTilt}
                  className="hamburger-btn-green"
                >
                  {t.calibrateNeutral}
                </button>
                <div className="hamburger-toggle-row">
                  <span className="toggle-label">{t.rotateSteering90}</span>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleToggleTiltRotation}
                    className={`hamburger-toggle-btn ${tiltSteeringRotated ? 'on' : 'off'}`}
                  >
                    {tiltSteeringRotated ? t.on : t.off}
                  </button>
                </div>
              </>
            )}
          </div>

          {!isMobile && (
            <>
              <h3 className="hamburger-section-title" style={{ marginTop: '16px' }}>{t.keyboard}</h3>
              {!twoPlayer ? (
                <div className="hamburger-controls-list single-player">
                  <div><KeyLabel>↑</KeyLabel> / <KeyLabel>W</KeyLabel> - {t.accelerate}</div>
                  <div><KeyLabel>←</KeyLabel> / <KeyLabel>A</KeyLabel> - {t.rotateLeft}</div>
                  <div><KeyLabel>→</KeyLabel> / <KeyLabel>D</KeyLabel> - {t.rotateRight}</div>
                  <div><KeyLabel>Space</KeyLabel> / <KeyLabel>Ctrl</KeyLabel></div>
                  <div className="indent-row" ><span className="nbsp">&nbsp;</span>{t.tractorBeamShield}</div>
                  <div><KeyLabel>X</KeyLabel> / <KeyLabel>Shift</KeyLabel> - {t.shoot}</div>
                </div>
              ) : (
                <>
                  <div className="hamburger-controls-list">
                    <div className="player-label">{t.player1Ship}</div>
                    <div><KeyLabel>↑</KeyLabel> - {t.accelerate}</div>
                    <div><KeyLabel>←</KeyLabel> / <KeyLabel>→</KeyLabel> - {t.rotate}</div>
                    <div><KeyLabel>Space</KeyLabel> - {t.tractorBeamShield}</div>
                    {podDocked && <div><KeyLabel>Ctrl</KeyLabel> - {t.shootWithPod}</div>}
                  </div>
                  <div className="hamburger-controls-list">
                    <div className="player-label">{t.player2Pod.replace('{role}', podDocked ? t.pod : t.turret)}</div>
                    {!podDocked ? (
                      <>
                        <div><KeyLabel>A</KeyLabel> / <KeyLabel>D</KeyLabel> - {t.rotateTurret}</div>
                        <div><KeyLabel>Shift</KeyLabel> - {t.shoot}</div>
                      </>
                    ) : (
                      <>
                        <div><KeyLabel>A</KeyLabel> / <KeyLabel>D</KeyLabel> - {t.rotatePod}</div>
                        <div><KeyLabel>W</KeyLabel> - {t.thrust}</div>
                        <div><KeyLabel>Shift</KeyLabel> - {t.shoot}</div>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <hr />
      <h3 className="hamburger-section-title">{t.orientation}</h3>
      <div className="hamburger-settings-group">
        <div className="hamburger-tri-toggle" style={{ display: 'flex', gap: '2px' }}>
          {['landscape', 'portrait', 'auto'].map((mode) => (
            <button
              key={mode}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { console.log('[ORIENTATION_MODE] setting to:', mode); setOrientationMode(mode); }}
              className={`hamburger-toggle-btn ${orientationMode === mode ? 'on' : 'off'}`}
              style={{ minWidth: '48px', textAlign: 'center' }}
            >
              {mode === 'landscape' ? t.orientationLandscape : mode === 'portrait' ? t.orientationPortrait : t.orientationAuto}
            </button>
          ))}
        </div>
      </div>

      <hr />
      <h3 className="hamburger-section-title">{t.sound}</h3>
      <div className="hamburger-settings-group">
        <SettingsSlider
          label={t.soundVolume}
          value={volumeToSlider(soundVolume)}
          onChange={(e) => setSoundVolume && setSoundVolume(sliderToVolume(parseInt(e.target.value, 10)))}
        />
      </div>

      <hr />
      <h3 className="hamburger-section-title">{t.vibration}</h3>
      <div className="hamburger-settings-group">
        <div className="hamburger-toggle-row">
          <span className="toggle-label">{t.enabled}</span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggleVibration}
            className={`hamburger-toggle-btn ${vibrationEnabled ? 'on' : 'off'}`}
          >
            {vibrationEnabled ? t.on : t.off}
          </button>
        </div>
        {showVibrationHint && (
          <p className="hamburger-hint">{t.vibrationHint}</p>
        )}
      </div>

      <hr />
      <h3 className="hamburger-section-title">{t.levelPacks}</h3>
      <div className="hamburger-pack-list">
        {(() => {
          // Find duplicate names
          const nameCounts = {};
          installedPacks.forEach(p => {
            nameCounts[p.name] = (nameCounts[p.name] || 0) + 1;
          });
          
          return installedPacks.map(pack => {
            const showId = nameCounts[pack.name] > 1 && pack.id !== pack.name;
            const isCustomPack = pack.source === 'local';
            return (
              <div key={pack.id} className="hamburger-pack-row">
                <button
                  onClick={() => onSwitchPack && onSwitchPack(pack.id)}
                  disabled={pack.id === currentPackId}
                  className={`hamburger-pack-btn ${pack.id === currentPackId ? 'active' : 'inactive'}`}
                >
                  {pack.name}
                  {showId && ` (${pack.id})`}
                  {pack.id === currentPackId && ' ✓'}
                </button>
                {isCustomPack && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(pack);
                    }}
                    className="hamburger-pack-delete-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          });
        })()}
        <label className="hamburger-import-pack-label">
          <input
            type="file"
            accept=".json"
            onChange={handleImportPack}
          />
          <span className="hamburger-import-pack-span">
            {t.importPack}
          </span>
        </label>
        {importError && (
          <div className="hamburger-msg-error">
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="hamburger-msg-success">
            {t.packImportedSuccess}
          </div>
        )}
        {conflictDialog && (
          <div className="hamburger-dialog">
            <div className="hamburger-dialog-text">
              {t.packIdExists.replace('{id}', conflictDialog.parsed.meta.id)}
            </div>
            <div className="hamburger-dialog-actions">
              <button
                onClick={handleOverwrite}
                className="hamburger-btn-danger-sm"
              >
                {t.overwrite}
              </button>
              <div className="hamburger-rename-row">
                <input
                  type="text"
                  value={renameId}
                  onChange={(e) => setRenameId(e.target.value)}
                  placeholder={t.newId}
                  className="hamburger-rename-input"
                />
                <button
                  onClick={handleRename}
                  disabled={!renameId.trim()}
                  className={`hamburger-rename-btn ${renameId.trim() ? 'active' : 'inactive'}`}
                >
                  ✓
                </button>
              </div>
              <button
                onClick={() => setConflictDialog(null)}
                className="hamburger-btn-neutral-sm"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
        {deleteDialog && (
          <div className="hamburger-dialog">
            <div className="hamburger-dialog-text">
              {t.deletePackConfirm.replace('{name}', deleteDialog.name)}
            </div>
            <div className="hamburger-dialog-actions">
              <button
                onClick={handleConfirmDelete}
                className="hamburger-btn-danger-sm"
              >
                {t.delete}
              </button>
              <button
                onClick={() => setDeleteDialog(null)}
                className="hamburger-btn-neutral-sm"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>

      <hr />
      <h3 className="hamburger-section-title">{t.dataTransfer}</h3>
      <div className="hamburger-settings-group">
        <div className="hamburger-data-transfer-row">
          <button
            onClick={handleExportData}
            className="hamburger-btn-green-flex"
          >
            {t.exportAllData}
          </button>
          {exportedData && (
            <button
              onClick={handleCopyExportedData}
              className="hamburger-btn-neutral-flex active"
            >
              {t.copy}
            </button>
          )}
        </div>
        {exportedData && (
          <textarea
            readOnly
            value={exportedData}
            onClick={(e) => e.target.select()}
            className="hamburger-textarea-readonly"
          />
        )}
        {showImportTextarea && (
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder={t.pasteExportCode}
            className="hamburger-textarea-input"
          />
        )}
        <button
          onClick={() => {
            if (!showImportTextarea) {
              setShowImportTextarea(true);
              return;
            }
            handleImportData();
          }}
          disabled={showImportTextarea && !importData.trim()}
          className={`hamburger-btn-blue ${(!showImportTextarea || importData.trim()) ? 'active' : 'inactive'}`}
        >
          {t.importData}
        </button>
        {dataTransferMsg && (
          <div className={`hamburger-data-transfer-msg ${dataTransferMsg.type}`}>
            {dataTransferMsg.text}
          </div>
        )}
      </div>

      <div className="hamburger-reset-section">
        <button
          onClick={handleResetHighscores}
          className="hamburger-btn-danger"
        >
          {t.resetAllData}
        </button>
      </div>

      <hr />
      <h3 className="hamburger-section-title">{t.account}</h3>
      <div className="hamburger-settings-group">
        {(() => {
          const authUser = autoAccountManager.getAuthUser();
          const isRegistered = autoAccountManager.isRegistered();
          if (!isRegistered) {
            return <p className="hamburger-hint">{t.notConnected}</p>;
          }
          return (
            <>
              <p className="hamburger-hint">{t.connectedAs} <strong>{authUser?.name || 'Unknown'}</strong></p>
              <button
                onClick={() => {
                  const token = autoAccountManager.getToken();
                  if (!token) return;
                  const isLocalDev = typeof window !== 'undefined' && import.meta.env?.DEV === true;
                  const baseUrl = isLocalDev
                    ? 'http://localhost:8001'
                    : 'https://community.caveshuttle.z11.de';
                  const form = document.createElement('form');
                  form.method = 'POST';
                  form.action = `${baseUrl}/auto-login?redirect=/settings`;
                  form.target = '_blank';
                  const csrfInput = document.createElement('input');
                  csrfInput.type = 'hidden';
                  csrfInput.name = 'token';
                  csrfInput.value = token;
                  form.appendChild(csrfInput);
                  document.body.appendChild(form);
                  form.submit();
                  document.body.removeChild(form);
                }}
                className="hamburger-btn-green"
              >
                {t.accountSettings}
              </button>
            </>
          );
        })()}
      </div>

      <hr />
      <h3
        className="hamburger-section-title"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setShowPrivacyOnline(!showPrivacyOnline)}
      >
        {showPrivacyOnline ? '▼' : '▶'} {t.privacyOnline}
      </h3>
      {showPrivacyOnline && (
        <div className="hamburger-settings-group">
          <div className="hamburger-toggle-row">
            <span className="toggle-label">{t.onlineSync}</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggleOnlineSync && onToggleOnlineSync()}
              className={`hamburger-toggle-btn ${onlineSyncEnabled ? 'on' : 'off'}`}
            >
              {onlineSyncEnabled ? t.on : t.off}
            </button>
          </div>
          <p className="hamburger-hint">{t.onlineSyncHint}</p>
          <div className="hamburger-toggle-row">
            <span className="toggle-label">{t.sendCrashReports}</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleToggleAnalytics}
              className={`hamburger-toggle-btn ${analyticsEnabled ? 'on' : 'off'}`}
            >
              {analyticsEnabled ? t.on : t.off}
            </button>
          </div>
          <p className="hamburger-hint">
            {t.analyticsHintBefore}
            <span
              style={{ color: 'inherit', cursor: 'default', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                console.log('[CRASH_TRIGGER] Simulating crash for testing');
                throw new Error('[TEST_CRASH] Simulated crash from hidden trigger button');
              }}
            >{t.analyticsHintCrashWord}</span>
            {t.analyticsHintAfter}
          </p>
        </div>
      )}

      <hr />
      <br />
      <div className="hamburger-toggle-row">
        <button
          onClick={() => onShowTutorial && onShowTutorial()}
          className="hamburger-tutorial-btn"
        >
          {t.showTutorial}
        </button>
      </div>

      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          className="hamburger-back-btn"
        >
          {t.backToMenu}
        </button>
      )}
      <div className="hamburger-version">
        v{appVersion}
      </div>
    </div>
  );
}
