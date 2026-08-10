import React, { useRef, useEffect, useState } from 'react';
import KeyLabel from './KeyLabel.jsx';
import { parseImportedPackFile } from '../levels/level-pack-import.js';
import { registerCustomPack } from '../levels/levelpacks.js';
import { removeInstalledPack } from '../core/progress-storage.js';
import { HighScoreManager } from '../game/high-score-manager.js';
import { exportAllData, importAllData } from '../core/data-transfer.js';
import './cave-theme.css';
import './HamburgerMenu.css';
import PlayerNameInput from './PlayerNameInput.jsx';

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

export default function HamburgerMenu({ isOpen, onClose, levelButtons, onBackToMenu, appVersion, showTouchButtons, onToggleTouchButtons, installedPacks, currentPackId, onSwitchPack, onPackImported, onPackDeleted, twoPlayer, podDocked, soundVolume, onSoundVolumeChange, touchButtonOpacity, onTouchButtonOpacityChange, onShowTutorial, playerName, onPlayerNameChange, player2Name, onPlayer2NameChange, vibrationEnabled, onToggleVibration, tiltSteering, onToggleTiltSteering, tiltSensorRef, onCalibrateTilt, tiltSteeringRotated, onToggleTiltRotation, analyticsEnabled, onToggleAnalytics, networkRole = null }) {
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
  const [showErrorAnalysis, setShowErrorAnalysis] = useState(false);

  useEffect(() => {
    if (!isOpen) { setShowControls(false); setShowErrorAnalysis(false); }
  }, [isOpen]);

  const handleToggleVibration = () => {
    const wasEnabled = vibrationEnabled;
    console.log('[TOGGLE] Vibration: ', wasEnabled ? 'ON -> OFF' : 'OFF -> ON');
    if (onToggleVibration) onToggleVibration();
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
    if (onToggleTiltRotation) onToggleTiltRotation();
  };

  const handleToggleAnalytics = () => {
    console.log('[TOGGLE] Analytics:', analyticsEnabled ? 'ON -> OFF' : 'OFF -> ON');
    if (onToggleAnalytics) onToggleAnalytics();
  };

  const handleResetHighscores = () => {
    if (window.confirm('Reset all local data? This cannot be undone.')) {
      HighScoreManager.resetAll();
      const keys = Object.keys(localStorage).filter(k => k.startsWith('app_'));
      keys.forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const encoded = exportAllData();
    if (!encoded) {
      setDataTransferMsg({ type: 'error', text: 'Export failed: no data found.' });
      return;
    }
    setExportedData(encoded);
    setDataTransferMsg({ type: 'success', text: 'Data exported. Copy the code below.' });
  };

  const handleCopyExportedData = () => {
    if (!exportedData) {
      setDataTransferMsg({ type: 'error', text: 'Export data first.' });
      return;
    }
    navigator.clipboard.writeText(exportedData)
      .then(() => setDataTransferMsg({ type: 'success', text: 'Copied to clipboard!' }))
      .catch(() => setDataTransferMsg({ type: 'error', text: 'Copy failed. Select and copy manually.' }));
  };

  const handleImportData = () => {
    if (!importData.trim()) {
      setDataTransferMsg({ type: 'error', text: 'Paste export code to import.' });
      return;
    }
    const result = importAllData(importData);
    if (result.success) {
      setDataTransferMsg({ type: 'success', text: `Imported ${result.restoredCount} entries. Reloading...` });
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
    <div ref={menuRef} className="hamburger-menu">
      <button
        onClick={scrollToBottom}
        className="hamburger-scroll-btn"
      >
        ⌄
      </button>

      <h3 className="hamburger-section-title with-margin">SELECT LEVEL</h3>
      <div className="hamburger-level-buttons">
        {levelButtons}
      </div>

      <hr />
      <h3 className="hamburger-section-title">PLAYER NAME</h3>
      <div className="hamburger-settings-group">
        <PlayerNameInput playerName={playerName} onPlayerNameChange={onPlayerNameChange} />
      </div>
      {twoPlayer && !networkRole && (
        <>
          <h3 className="hamburger-section-title">PLAYER 2 NAME</h3>
          <div className="hamburger-settings-group">
            <PlayerNameInput playerName={player2Name} onPlayerNameChange={onPlayer2NameChange} />
          </div>
        </>
      )}

      <hr />
      <h3 className="hamburger-section-title">SOUND</h3>
      <div className="hamburger-settings-group">
        <SettingsSlider
          label="Sound Volume"
          value={volumeToSlider(soundVolume)}
          onChange={(e) => onSoundVolumeChange && onSoundVolumeChange(sliderToVolume(parseInt(e.target.value, 10)))}
        />
      </div>

      <hr />
      <h3
        className="hamburger-section-title"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setShowControls(!showControls)}
      >
        CONTROLS {showControls ? '▲' : '▼'}
      </h3>
      {showControls && (
        <>
          <div className="hamburger-settings-group">
            <div className="hamburger-toggle-row">
              <span className="toggle-label">Touch Buttons</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleToggleTouchButtons}
                className={`hamburger-toggle-btn ${showTouchButtons ? 'on' : 'off'}`}
              >
                {showTouchButtons ? 'ON' : 'OFF'}
              </button>
            </div>

            <SettingsSlider
              label="Transparency"
              value={Math.round((0.5 - touchButtonOpacity) / 0.5 * 100)}
              onChange={(e) => onTouchButtonOpacityChange && onTouchButtonOpacityChange(0.5 * (1 - parseInt(e.target.value, 10) / 100))}
              disabled={!showTouchButtons}
            />
          </div>

          <div className="hamburger-settings-group">
            <div className="hamburger-toggle-row">
              <span className="toggle-label">Tilt Steering</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleToggleTiltSteering}
                className={`hamburger-toggle-btn ${tiltSteering ? 'on' : 'off'}`}
              >
                {tiltSteering ? 'ON' : 'OFF'}
              </button>
            </div>
            {tiltSteering && (
              <>
                <p className="hamburger-hint">Tilt left/right to rotate, tilt back to thrust. Tap anywhere to fire.</p>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onCalibrateTilt}
                  className="hamburger-btn-green"
                >
                  Calibrate Neutral Position
                </button>
                <div className="hamburger-toggle-row">
                  <span className="toggle-label">Rotate Steering 90°</span>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleToggleTiltRotation}
                    className={`hamburger-toggle-btn ${tiltSteeringRotated ? 'on' : 'off'}`}
                  >
                    {tiltSteeringRotated ? 'ON' : 'OFF'}
                  </button>
                </div>
              </>
            )}
          </div>

          <h3 className="hamburger-section-title" style={{ marginTop: '16px' }}>KEYBOARD</h3>
          {!twoPlayer ? (
            <div className="hamburger-controls-list single-player">
              <div><KeyLabel>↑</KeyLabel> / <KeyLabel>W</KeyLabel> - Accelerate</div>
              <div><KeyLabel>←</KeyLabel> / <KeyLabel>A</KeyLabel> - Rotate Left</div>
              <div><KeyLabel>→</KeyLabel> / <KeyLabel>D</KeyLabel> - Rotate Right</div>
              <div><KeyLabel>Space</KeyLabel> / <KeyLabel>Ctrl</KeyLabel></div>
              <div className="indent-row" ><span className="nbsp">&nbsp;</span>Tractor Beam &Shield</div>
              <div><KeyLabel>X</KeyLabel> / <KeyLabel>Shift</KeyLabel> - Shoot</div>
            </div>
          ) : (
            <>
              <div className="hamburger-controls-list">
                <div className="player-label">Player 1 — Ship</div>
                <div><KeyLabel>↑</KeyLabel> - Accelerate</div>
                <div><KeyLabel>←</KeyLabel> / <KeyLabel>→</KeyLabel> - Rotate</div>
                <div><KeyLabel>Space</KeyLabel> - Tractor Beam & Shield</div>
                {podDocked && <div><KeyLabel>Ctrl</KeyLabel> - Shoot (with Pod)</div>}
              </div>
              <div className="hamburger-controls-list">
                <div className="player-label">Player 2 — {podDocked ? 'Pod' : 'Turret'}</div>
                {!podDocked ? (
                  <>
                    <div><KeyLabel>A</KeyLabel> / <KeyLabel>D</KeyLabel> - Rotate Turret</div>
                    <div><KeyLabel>Shift</KeyLabel> - Shoot</div>
                  </>
                ) : (
                  <>
                    <div><KeyLabel>A</KeyLabel> / <KeyLabel>D</KeyLabel> - Rotate Pod</div>
                    <div><KeyLabel>W</KeyLabel> - Thrust</div>
                    <div><KeyLabel>Shift</KeyLabel> - Shoot</div>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      <hr />
      <h3 className="hamburger-section-title">VIBRATION</h3>
      <div className="hamburger-settings-group">
        <div className="hamburger-toggle-row">
          <span className="toggle-label">Enabled</span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggleVibration}
            className={`hamburger-toggle-btn ${vibrationEnabled ? 'on' : 'off'}`}
          >
            {vibrationEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {showVibrationHint && (
          <p className="hamburger-hint">Make sure vibration is also enabled in your device settings.</p>
        )}
      </div>

      <hr />
      <h3 className="hamburger-section-title">LEVEL PACK</h3>
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
            Import Pack (.json)
          </span>
        </label>
        {importError && (
          <div className="hamburger-msg-error">
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="hamburger-msg-success">
            Pack imported successfully!
          </div>
        )}
        {conflictDialog && (
          <div className="hamburger-dialog">
            <div className="hamburger-dialog-text">
              Pack ID "{conflictDialog.parsed.meta.id}" already exists.
            </div>
            <div className="hamburger-dialog-actions">
              <button
                onClick={handleOverwrite}
                className="hamburger-btn-danger-sm"
              >
                Overwrite
              </button>
              <div className="hamburger-rename-row">
                <input
                  type="text"
                  value={renameId}
                  onChange={(e) => setRenameId(e.target.value)}
                  placeholder="New ID"
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
                Cancel
              </button>
            </div>
          </div>
        )}
        {deleteDialog && (
          <div className="hamburger-dialog">
            <div className="hamburger-dialog-text">
              Delete pack "{deleteDialog.name}"?
            </div>
            <div className="hamburger-dialog-actions">
              <button
                onClick={handleConfirmDelete}
                className="hamburger-btn-danger-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteDialog(null)}
                className="hamburger-btn-neutral-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <hr />
      <h3 className="hamburger-section-title">DATA TRANSFER</h3>
      <div className="hamburger-settings-group">
        <div className="hamburger-data-transfer-row">
          <button
            onClick={handleExportData}
            className="hamburger-btn-green-flex"
          >
            Export All Data
          </button>
          {exportedData && (
            <button
              onClick={handleCopyExportedData}
              className="hamburger-btn-neutral-flex active"
            >
              Copy
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
            placeholder="Paste export code here to import..."
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
          Import Data
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
          Reset all Data
        </button>
      </div>

      <hr />
      <h3
        className="hamburger-section-title"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setShowErrorAnalysis(!showErrorAnalysis)}
      >
        ERROR ANALYSIS {showErrorAnalysis ? '▲' : '▼'}
      </h3>
      {showErrorAnalysis && (
        <div className="hamburger-settings-group">
          <div className="hamburger-toggle-row">
            <span className="toggle-label">Send crash reports</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleToggleAnalytics}
              className={`hamburger-toggle-btn ${analyticsEnabled ? 'on' : 'off'}`}
            >
              {analyticsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="hamburger-hint">When enabled, anonymous error and crash data is sent to help improve the game. No personal data is collected.</p>
        </div>
      )}

      <hr />
      <br />
      <div className="hamburger-toggle-row">
        <button
          onClick={() => onShowTutorial && onShowTutorial()}
          className="hamburger-tutorial-btn"
        >
          Show Tutorial
        </button>
      </div>

      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          className="hamburger-back-btn"
        >
          Back to Menu
        </button>
      )}
      <div className="hamburger-version">
        v{appVersion}
      </div>
    </div>
  );
}
