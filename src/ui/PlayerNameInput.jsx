import React, { useState, useEffect, useRef } from 'react';
import './PlayerNameInput.css';

export default function PlayerNameInput({ playerName, onPlayerNameChange, readOnly = false }) {
  const [editName, setEditName] = useState(playerName || '');
  const [nameError, setNameError] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const checkmarkTimerRef = useRef(null);

  useEffect(() => {
    setEditName(playerName || '');
    setShowSave(false);
  }, [playerName]);

  useEffect(() => {
    return () => {
      if (checkmarkTimerRef.current) clearTimeout(checkmarkTimerRef.current);
    };
  }, []);

  const isDirty = editName !== (playerName || '');

  const handleSave = () => {
    if (!onPlayerNameChange) return;
    const result = onPlayerNameChange(editName);
    if (result.success) {
      setNameError(null);
      setShowSave(false);
      setShowCheckmark(true);
      if (checkmarkTimerRef.current) clearTimeout(checkmarkTimerRef.current);
      checkmarkTimerRef.current = setTimeout(() => setShowCheckmark(false), 2000);
    } else {
      setNameError(result.error);
    }
  };

  return (
    <div className="player-name-input-wrapper">
      <div className="player-name-input-row">
        <input
          type="text"
          value={editName}
          placeholder="your name"
          onChange={(e) => { setEditName(e.target.value); setNameError(null); }}
          onFocus={() => setShowSave(true)}
          onBlur={() => { if (!isDirty) setShowSave(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          className="player-name-input-field"
          readOnly={readOnly}
        />
        {!readOnly && (showSave || isDirty) && (
          <button
            onClick={handleSave}
            className="player-name-save-btn"
          >
            Save
          </button>
        )}
        {showCheckmark && (
          <span className="player-name-checkmark">✓</span>
        )}
      </div>
      {nameError && <div className="player-name-error">{nameError}</div>}
    </div>
  );
}
