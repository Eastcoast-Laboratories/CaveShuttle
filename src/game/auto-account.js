// Auto-account manager: handles automatic registration/login with the
// Cave Shuttle backend using profile.uid + a locally generated password.
// Works offline: queues the registration and retries when online.

import { storageKey } from '../core/storage-keys.js';
import { HighScoreManager } from './high-score-manager.js';
import { Capacitor } from '@capacitor/core';

const AUTH_STATUS_KEY = storageKey('authSyncStatus');
const AUTH_TOKEN_KEY = storageKey('authToken');
const AUTH_USER_KEY = storageKey('authUser');

const isCapacitorNative = typeof window !== 'undefined'
  && typeof Capacitor !== 'undefined'
  && Capacitor.isNativePlatform?.();

const COMMUNITY_API_URL = isCapacitorNative
  ? 'https://community.caveshuttle.z11.de/api/mobile/caveshuttle'
  : `${window.location.origin}/api/mobile/caveshuttle`;

function safeGet(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('[AUTO_ACCOUNT] Failed to read from localStorage:', key, error);
  }
  return defaultValue;
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[AUTO_ACCOUNT] Failed to write to localStorage:', key, error);
  }
}

export class AutoAccountManager {
  constructor() {
    this._retryTimer = null;
    this._onlineListenerBound = false;
  }

  getAuthStatus() {
    return safeGet(AUTH_STATUS_KEY, 'pending');
  }

  setAuthStatus(status) {
    safeSet(AUTH_STATUS_KEY, status);
  }

  getToken() {
    return safeGet(AUTH_TOKEN_KEY, null);
  }

  setToken(token) {
    safeSet(AUTH_TOKEN_KEY, token);
  }

  getAuthUser() {
    return safeGet(AUTH_USER_KEY, null);
  }

  isRegistered() {
    return this.getAuthStatus() === 'registered' && this.getToken();
  }

  async tryAutoRegister() {
    if (this.isRegistered()) {
      console.log('[AUTO_ACCOUNT] Already registered, skipping');
      return { success: true, alreadyRegistered: true };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[AUTO_ACCOUNT] Offline, deferring auto-register');
      this.setAuthStatus('pending');
      this._scheduleRetry();
      return { success: false, reason: 'offline' };
    }

    const profile = HighScoreManager.getPlayerProfile();
    if (!profile.uid || !profile.password) {
      console.error('[AUTO_ACCOUNT] Missing uid or password in profile');
      this.setAuthStatus('failed');
      return { success: false, reason: 'missing_credentials' };
    }

    try {
      const response = await fetch(`${COMMUNITY_API_URL}/auto-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_uid: profile.uid,
          password: profile.password,
          name: profile.name,
          install_source: isCapacitorNative ? 'android-app' : 'web',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AUTO_ACCOUNT] Auto-register failed:', response.status, errorData);
        this.setAuthStatus('failed');
        this._scheduleRetry();
        return { success: false, reason: 'server_error', status: response.status, error: errorData };
      }

      const data = await response.json();
      this.setToken(data.token);
      safeSet(AUTH_USER_KEY, data.user);
      this.setAuthStatus('registered');
      console.log('[AUTO_ACCOUNT] Auto-register successful, is_new:', data.is_new);
      return { success: true, isNew: data.is_new, user: data.user };
    } catch (error) {
      console.error('[AUTO_ACCOUNT] Network error during auto-register:', error);
      this.setAuthStatus('pending');
      this._scheduleRetry();
      return { success: false, reason: 'network_error', error };
    }
  }

  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${COMMUNITY_API_URL}/../verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('[AUTO_ACCOUNT] Token verification failed:', error);
      return false;
    }
  }

  async setPassword(newPassword, email) {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const body = { new_password: newPassword };
    if (email) body.email = email;

    try {
      const response = await fetch(`${COMMUNITY_API_URL}/account/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || 'Server error' };
      }

      return { success: true };
    } catch (error) {
      console.error('[AUTO_ACCOUNT] Set password failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  _scheduleRetry() {
    if (this._retryTimer) return;
    this._retryTimer = setTimeout(() => {
      this._retryTimer = null;
      this.tryAutoRegister();
    }, 30000);
  }

  startOnlineListener() {
    if (this._onlineListenerBound) return;
    this._onlineListenerBound = true;
    window.addEventListener('online', () => {
      console.log('[AUTO_ACCOUNT] Network online event, retrying auto-register');
      this.tryAutoRegister();
    });
  }

  logout() {
    this.setToken(null);
    safeSet(AUTH_USER_KEY, null);
    this.setAuthStatus('pending');
  }

  async syncScoresToBackend() {
    if (!this.isRegistered()) {
      console.log('[AUTO_ACCOUNT] Not registered, skipping score sync');
      return { success: false, reason: 'not_registered' };
    }

    const token = this.getToken();
    const data = HighScoreManager.exportSyncData();

    const scores = [];
    for (const lr of data.levelRecords) {
      scores.push({
        recordType: 'level',
        playerName: lr.name,
        runId: lr.runId,
        attemptId: lr.attemptId,
        packId: lr.packId,
        packVersion: lr.packVersion,
        level: lr.level,
        playerMode: lr.mode,
        player2Name: lr.player2Name || null,
        completed: lr.completed,
        score: lr.score,
        scoreBreakdown: lr.scoreBreakdown || null,
        levelTimeMs: lr.activeMs ? Math.round(lr.activeMs) : null,
        recordedAt: new Date(lr.recordedAt).toISOString(),
      });
    }
    for (const rr of data.runRecords) {
      scores.push({
        recordType: 'run',
        playerName: rr.name,
        runId: rr.runId,
        attemptId: null,
        packId: rr.packId,
        packVersion: rr.packVersion,
        level: null,
        playerMode: rr.mode,
        player2Name: rr.player2Name || null,
        completed: true,
        score: rr.totalScore,
        scoreBreakdown: null,
        levelTimeMs: null,
        recordedAt: new Date(rr.recordedAt).toISOString(),
      });
    }

    if (scores.length === 0) {
      console.log('[AUTO_ACCOUNT] No scores to sync');
      return { success: true, synced: 0 };
    }

    try {
      const response = await fetch(`${COMMUNITY_API_URL}/scores/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ scores }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AUTO_ACCOUNT] Score sync failed:', response.status, errorData);
        return { success: false, reason: 'server_error', status: response.status, error: errorData };
      }

      const result = await response.json();
      console.log('[AUTO_ACCOUNT] Score sync result:', result.synced, 'synced,', result.skipped, 'skipped,', result.conflicts?.length || 0, 'conflicts');
      return { success: true, ...result };
    } catch (error) {
      console.error('[AUTO_ACCOUNT] Network error during score sync:', error);
      return { success: false, reason: 'network_error', error };
    }
  }

  async fetchLeaderboard({ packVersion, playerMode, level, recordType }) {
    const params = new URLSearchParams({
      packVersion,
      playerMode,
      recordType: recordType || 'level',
    });
    if (level != null) params.set('level', level);

    try {
      const response = await fetch(`${COMMUNITY_API_URL}/leaderboard?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AUTO_ACCOUNT] Leaderboard fetch failed:', response.status, errorData);
        return { success: false, error: errorData };
      }

      const data = await response.json();
      return { success: true, leaderboard: data.leaderboard };
    } catch (error) {
      console.error('[AUTO_ACCOUNT] Network error fetching leaderboard:', error);
      return { success: false, error };
    }
  }
}

export const autoAccountManager = new AutoAccountManager();
