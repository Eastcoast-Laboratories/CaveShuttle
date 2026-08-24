import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { storageKey } from '../core/storage-keys.js';
import { autoAccountManager } from '../game/auto-account.js';
import { useLanguage } from './LanguageContext.jsx';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { language } = useLanguage();
  const [isMobile, setIsMobile] = useState(() => {
    const ua = navigator.userAgent;
    const hasMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 0;
    const hasTouch = navigator.maxTouchPoints > 0;
    const narrowScreen = window.innerWidth < 768;
    const mobile = hasMobileUA || isIPadOS || (hasTouch && narrowScreen);
    console.log('[IS_MOBILE] UA:', ua, '| maxTouchPoints:', navigator.maxTouchPoints, '| innerWidth:', window.innerWidth, '| detected:', mobile);
    return mobile;
  });

  const [showTouchButtons, setShowTouchButtons] = useState(() => {
    const stored = localStorage.getItem(storageKey('showTouchButtons'));
    if (stored !== null) return JSON.parse(stored);
    return isMobile;
  });

  const [joystickEnabled, setJoystickEnabled] = useState(() => {
    const stored = localStorage.getItem(storageKey('joystickEnabled'));
    return stored === null ? true : stored === 'true';
  });

  const [soundVolume, setSoundVolume] = useState(() => {
    const stored = localStorage.getItem(storageKey('soundVolume'));
    if (stored !== null) {
      const parsed = parseFloat(stored);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.7;
    }
    return 0.2;
  });

  const [touchButtonOpacity, setTouchButtonOpacity] = useState(() => {
    const stored = localStorage.getItem(storageKey('touchButtonOpacity'));
    if (stored !== null) {
      const parsed = parseFloat(stored);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1;
    }
    return 0.5;
  });

  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const stored = localStorage.getItem(storageKey('vibrationEnabled'));
    return stored === null ? true : stored === 'true';
  });

  const [tiltSteering, setTiltSteering] = useState(() => {
    const stored = localStorage.getItem(storageKey('tiltSteering'));
    return stored === 'true';
  });

  const [tiltNeutralBeta, setTiltNeutralBeta] = useState(() => {
    const stored = localStorage.getItem(storageKey('tiltNeutralBeta'));
    const parsed = stored !== null ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const [tiltNeutralGamma, setTiltNeutralGamma] = useState(() => {
    const stored = localStorage.getItem(storageKey('tiltNeutralGamma'));
    const parsed = stored !== null ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const [tiltSteeringRotated, setTiltSteeringRotated] = useState(() => {
    const stored = localStorage.getItem(storageKey('tiltSteeringRotated'));
    return stored === 'true';
  });

  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
    const stored = localStorage.getItem(storageKey('analyticsEnabled'));
    return stored === null ? true : stored === 'true';
  });

  const [onlineSyncEnabled, setOnlineSyncEnabled] = useState(() => {
    const stored = localStorage.getItem(storageKey('onlineSyncEnabled'));
    return stored === null ? true : stored === 'true';
  });

  const [twoPlayer, setTwoPlayer] = useState(() => {
    try {
      return localStorage.getItem(storageKey('playerMode')) === 'two';
    } catch {
      return false;
    }
  });

  const [playerName, setPlayerName] = useState(() => {
    return null; // will be set by App.jsx via setPlayerName
  });

  const [player2Name, setPlayer2Name] = useState(() => {
    return null;
  });

  const [currentPackId, setCurrentPackId] = useState('default');

  const tiltSensorRef = useRef({ beta: 0, gamma: 0, alpha: 0 });

  // localStorage persistence
  useEffect(() => { localStorage.setItem(storageKey('showTouchButtons'), JSON.stringify(showTouchButtons)); }, [showTouchButtons]);
  useEffect(() => { localStorage.setItem(storageKey('joystickEnabled'), joystickEnabled.toString()); }, [joystickEnabled]);
  useEffect(() => { localStorage.setItem(storageKey('vibrationEnabled'), vibrationEnabled.toString()); }, [vibrationEnabled]);
  useEffect(() => { localStorage.setItem(storageKey('tiltSteering'), tiltSteering.toString()); }, [tiltSteering]);
  useEffect(() => { localStorage.setItem(storageKey('tiltNeutralBeta'), tiltNeutralBeta.toString()); }, [tiltNeutralBeta]);
  useEffect(() => { localStorage.setItem(storageKey('tiltNeutralGamma'), tiltNeutralGamma.toString()); }, [tiltNeutralGamma]);
  useEffect(() => { localStorage.setItem(storageKey('tiltSteeringRotated'), tiltSteeringRotated.toString()); }, [tiltSteeringRotated]);
  useEffect(() => { localStorage.setItem(storageKey('analyticsEnabled'), analyticsEnabled.toString()); }, [analyticsEnabled]);
  useEffect(() => { localStorage.setItem(storageKey('onlineSyncEnabled'), onlineSyncEnabled.toString()); }, [onlineSyncEnabled]);
  useEffect(() => { localStorage.setItem(storageKey('soundVolume'), soundVolume.toString()); }, [soundVolume]);
  useEffect(() => { localStorage.setItem(storageKey('touchButtonOpacity'), touchButtonOpacity.toString()); }, [touchButtonOpacity]);
  useEffect(() => { localStorage.setItem(storageKey('playerMode'), twoPlayer ? 'two' : 'single'); }, [twoPlayer]);

  // Auto-register/login with backend using profile.uid
  useEffect(() => {
    if (!onlineSyncEnabled) return;
    autoAccountManager.startOnlineListener();
    autoAccountManager.tryAutoRegister();
  }, [onlineSyncEnabled]);

  // On mobile, at least one control method (touch buttons, joystick, tilt) must stay on.
  const ensureOneControlActive = useCallback((nextButtons, nextJoystick, nextTilt, turningOff) => {
    console.log('[ENSURE_ONE_CONTROL_ACTIVE]', nextButtons, nextJoystick, nextTilt, turningOff);
    if (!isMobile) return;
    if (!nextButtons && !nextJoystick && !nextTilt) {
      if (turningOff === 'buttons') setJoystickEnabled(true);
      else setShowTouchButtons(true);
    }
  }, [isMobile]);

  const collectSettings = useCallback(() => ({
    language,
    showTouchButtons,
    joystickEnabled,
    soundVolume,
    touchButtonOpacity,
    vibrationEnabled,
    tiltSteering,
    tiltSteeringRotated,
    tiltNeutralBeta,
    tiltNeutralGamma,
    analyticsEnabled,
    twoPlayer,
    playerName,
    player2Name,
    currentPackId,
  }), [language, showTouchButtons, joystickEnabled, soundVolume, touchButtonOpacity, vibrationEnabled, tiltSteering, tiltSteeringRotated, tiltNeutralBeta, tiltNeutralGamma, analyticsEnabled, twoPlayer, playerName, player2Name, currentPackId]);

  // Sync settings to backend whenever onlineSyncEnabled is on and a setting changes
  const settingsSyncRef = useRef(false);
  useEffect(() => {
    if (!onlineSyncEnabled) return;
    if (!settingsSyncRef.current) {
      settingsSyncRef.current = true;
      return;
    }
    autoAccountManager.syncSettingsToBackend(collectSettings(), true);
  }, [collectSettings, onlineSyncEnabled]);

  const value = useMemo(() => ({
    isMobile, setIsMobile,
    showTouchButtons, setShowTouchButtons,
    joystickEnabled, setJoystickEnabled,
    soundVolume, setSoundVolume,
    touchButtonOpacity, setTouchButtonOpacity,
    vibrationEnabled, setVibrationEnabled,
    tiltSteering, setTiltSteering,
    tiltNeutralBeta, setTiltNeutralBeta,
    tiltNeutralGamma, setTiltNeutralGamma,
    tiltSteeringRotated, setTiltSteeringRotated,
    analyticsEnabled, setAnalyticsEnabled,
    onlineSyncEnabled, setOnlineSyncEnabled,
    twoPlayer, setTwoPlayer,
    playerName, setPlayerName,
    player2Name, setPlayer2Name,
    currentPackId, setCurrentPackId,
    tiltSensorRef,
    ensureOneControlActive,
    collectSettings,
  }), [
    isMobile, showTouchButtons, joystickEnabled, soundVolume, touchButtonOpacity,
    vibrationEnabled, tiltSteering, tiltNeutralBeta, tiltNeutralGamma, tiltSteeringRotated,
    analyticsEnabled, onlineSyncEnabled, twoPlayer, playerName, player2Name, currentPackId,
    ensureOneControlActive, collectSettings,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
