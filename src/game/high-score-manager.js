// Local highscore manager for Phase 1 (offline only)
import { storageKey } from '../core/storage-keys.js';

const HS_DATA_VERSION = 1;
const EXPORT_FORMAT_VERSION = 1;

const PLAYER_PROFILE_KEY = storageKey('playerProfile');
const HIGHSCORE_DATA_KEY = storageKey('highscoreData');

const SPACE_TERMS = [
  'Star', 'Comet', 'Moon', 'Planet', 'Asteroid', 'Nebula', 'Galaxy', 'Nova', 'Quasar', 'Meteor', 'Blackhole', 'Supernova', 'Space', 'Cosmos', 'Void', 'Cosmic', 'Stellar', 'Exo', 'Galactic', 'Interstellar', 'Cosmo', 'Hyperspace', 'Warp', 'Quantum'
];
const ROLES = [
  'Pilot', 'Ranger', 'Scout', 'Commander', 'Ace', 'Voyager', 'Captain', 'Navigator', 'Explorer', 'Hero', 'Legend', 'Conqueror', 'Leader', 'Warrior', 'Invader', 'Bob'
];
const SUFFIXES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeGet(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('[HIGHSCORE] Failed to read from localStorage:', key, error);
  }
  return defaultValue;
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[HIGHSCORE] Failed to write to localStorage:', key, error);
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value) {
  return Number.isInteger(value);
}

function isString(value) {
  return typeof value === 'string';
}

export class HighScoreManager {
  // --- Player profile ---

  static generatePlayerName() {
    const name = `${pick(SPACE_TERMS)} ${pick(ROLES)} ${pick(SUFFIXES)}`;
    return name.length > 20 ? name.slice(0, 20).trim() : name;
  }

  static validateName(name) {
    if (typeof name !== 'string') {
      return { valid: false, error: 'Name must be a string' };
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) return { valid: false, error: 'Name cannot be empty' };
    if (trimmed.length > 20) return { valid: false, error: 'Name cannot exceed 20 characters' };
    if (!/^[A-Za-z0-9 _-]+$/.test(trimmed)) {
      return { valid: false, error: 'Name contains invalid characters' };
    }
    return { valid: true, name: trimmed };
  }

  static getPlayerProfile() {
    let profile = safeGet(PLAYER_PROFILE_KEY, null);
    if (!isPlainObject(profile) || typeof profile.name !== 'string' || !profile.name.trim()) {
      profile = { name: this.generatePlayerName() };
      safeSet(PLAYER_PROFILE_KEY, profile);
    }
    if (typeof profile.player2Name !== 'string' || !profile.player2Name.trim()) {
      profile.player2Name = this.generatePlayerName();
      safeSet(PLAYER_PROFILE_KEY, profile);
    }
    return profile;
  }

  static savePlayerName(name) {
    const validation = this.validateName(name);
    if (!validation.valid) return { success: false, error: validation.error };
    const profile = this.getPlayerProfile();
    profile.name = validation.name;
    safeSet(PLAYER_PROFILE_KEY, profile);
    return { success: true, profile };
  }

  static savePlayer2Name(name) {
    const validation = this.validateName(name);
    if (!validation.valid) return { success: false, error: validation.error };
    const profile = this.getPlayerProfile();
    profile.player2Name = validation.name;
    safeSet(PLAYER_PROFILE_KEY, profile);
    return { success: true, profile };
  }

  // --- Run context ---

  static createRunContext({ packId, packVersion, startLevel, mode }) {
    return {
      runId: generateId(),
      packId: packId || 'default',
      packVersion: packVersion || '1',
      startLevel: isInteger(startLevel) ? startLevel : 1,
      pass: 1,
      mode: mode === 'two' ? 'two' : 'single',
      startedAt: Date.now()
    };
  }

  // --- Storage helpers ---

  static _getHighscoreData() {
    const data = safeGet(HIGHSCORE_DATA_KEY, null);
    if (
      isPlainObject(data) &&
      isInteger(data.version) &&
      Array.isArray(data.levelRecords) &&
      Array.isArray(data.runRecords)
    ) {
      return data;
    }
    return { version: HS_DATA_VERSION, levelRecords: [], runRecords: [] };
  }

  static _setHighscoreData(data) {
    safeSet(HIGHSCORE_DATA_KEY, data);
  }

  static _validateLevelRecord(record) {
    if (!isPlainObject(record)) return 'Record must be an object';
    if (!isString(record.runId)) return 'runId is required';
    if (!isString(record.packId)) return 'packId is required';
    if (!isString(record.packVersion)) return 'packVersion is required';
    if (record.mode !== 'single' && record.mode !== 'two') return 'mode must be single or two';
    if (!isInteger(record.level) || record.level < 1) return 'level must be a positive integer';
    if (!isInteger(record.pass) || record.pass < 1) return 'pass must be a positive integer';
    if (typeof record.completed !== 'boolean') return 'completed must be a boolean';
    if (!Number.isFinite(record.score) || record.score < 0) return 'score must be a non-negative number';
    if (!isPlainObject(record.scoreBreakdown)) return 'scoreBreakdown must be an object';
    if (!Number.isFinite(record.activeMs) || record.activeMs < 0) return 'activeMs must be a non-negative number';
    if (!isString(record.scoringVersion)) return 'scoringVersion is required';
    if (!isString(record.name)) return 'name is required';
    if (record.player2Name !== undefined && !isString(record.player2Name)) return 'player2Name must be a string if present';
    return null;
  }

  static _validateRunRecord(record) {
    if (!isPlainObject(record)) return 'Record must be an object';
    if (!isString(record.runId)) return 'runId is required';
    if (!isString(record.packId)) return 'packId is required';
    if (!isString(record.packVersion)) return 'packVersion is required';
    if (record.mode !== 'single' && record.mode !== 'two') return 'mode must be single or two';
    if (!isInteger(record.startLevel) || record.startLevel < 1) return 'startLevel must be a positive integer';
    if (!isInteger(record.lastLevel) || record.lastLevel < 1) return 'lastLevel must be a positive integer';
    if (!Number.isFinite(record.totalScore) || record.totalScore < 0) return 'totalScore must be a non-negative number';
    if (!Array.isArray(record.levelRecordIds)) return 'levelRecordIds must be an array';
    if (!isString(record.name)) return 'name is required';
    if (record.player2Name !== undefined && !isString(record.player2Name)) return 'player2Name must be a string if present';
    return null;
  }

  static _hasCompletedLevel({ packId, packVersion, level, mode }) {
    const data = this._getHighscoreData();
    return data.levelRecords.some(
      r =>
        r.completed === true &&
        r.packId === packId &&
        r.packVersion === packVersion &&
        r.level === level &&
        r.mode === mode
    );
  }

  // --- Record management ---

  static addLevelRecord(record) {
    const validationError = this._validateLevelRecord(record);
    if (validationError) {
      console.error('[HIGHSCORE] Invalid LevelScoreRecord:', validationError, record);
      return { saved: false, reason: validationError };
    }

    const data = this._getHighscoreData();

    if (!record.completed && !record.runId) {
      if (this._hasCompletedLevel(record)) {
        return { saved: false, reason: 'Completed level already exists for this combination' };
      }
    }

    const newRecord = {
      pass: 1,
      ...record,
      attemptId: generateId(),
      recordedAt: Date.now()
    };

    data.levelRecords.push(newRecord);
    this._setHighscoreData(data);

    return { saved: true, record: newRecord };
  }

  static addRunRecord(record) {
    const validationError = this._validateRunRecord(record);
    if (validationError) {
      console.error('[HIGHSCORE] Invalid RunScoreRecord:', validationError, record);
      return { saved: false, reason: validationError };
    }

    const data = this._getHighscoreData();
    const existingIndex = data.runRecords.findIndex(r => r.runId === record.runId);
    const recordedAt = existingIndex >= 0 ? data.runRecords[existingIndex].recordedAt : Date.now();
    const newRecord = { ...record, recordedAt };
    if (existingIndex >= 0) {
      data.runRecords[existingIndex] = newRecord;
    } else {
      data.runRecords.push(newRecord);
    }
    this._setHighscoreData(data);

    return { saved: true, record: newRecord };
  }

  static hasCompletedLevel({ packId, packVersion, level, mode }) {
    return this._hasCompletedLevel({ packId, packVersion, level, mode });
  }

  // --- Leaderboards ---

  static _sortEntries(entries) {
    const getScore = (e) => (typeof e.totalScore === 'number' ? e.totalScore : e.score);
    return entries.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? -1 : 1;
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.recordedAt || 0) - (b.recordedAt || 0);
    });
  }

  static _withRanks(entries) {
    return entries.slice(0, 10).map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  static getLevelTop10({ packId, packVersion, level, mode }) {
    const data = this._getHighscoreData();
    const entries = data.levelRecords.filter(
      r =>
        r.packId === packId &&
        r.packVersion === packVersion &&
        r.level === level &&
        r.mode === mode
    );
    const completed = entries.filter(r => r.completed);
    const source = completed.length > 0 ? completed : entries;
    return this._withRanks(this._sortEntries(source));
  }

  static getLevelRecords({ packId, packVersion, level, mode }) {
    const data = this._getHighscoreData();
    const entries = data.levelRecords.filter(
      r =>
        r.packId === packId &&
        r.packVersion === packVersion &&
        r.level === level &&
        r.mode === mode
    );
    return this._sortEntries(entries).map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  static getRunTop10({ packId, packVersion, mode }) {
    const data = this._getHighscoreData();
    const entries = data.runRecords.filter(
      r => r.packId === packId && r.packVersion === packVersion && r.mode === mode
    );
    return this._withRanks(this._sortEntries(entries));
  }

  static _matchesName(record, name) {
    return record.name === name || record.player2Name === name;
  }

  static getPersonalBestLevel({ packId, packVersion, level, mode, name }) {
    const top = this.getLevelTop10({ packId, packVersion, level, mode });
    const matches = top.filter(r => r.completed && this._matchesName(r, name));
    return matches.length > 0 ? matches[0] : null;
  }

  static getPersonalBestRun({ packId, packVersion, mode, name }) {
    const top = this.getRunTop10({ packId, packVersion, mode });
    const matches = top.filter(r => this._matchesName(r, name));
    return matches.length > 0 ? matches[0] : null;
  }

  static getLevelRecordByAttemptId(attemptId) {
    const data = this._getHighscoreData();
    return data.levelRecords.find(r => r.attemptId === attemptId) || null;
  }

  static getRunRecordByRunId(runId) {
    const data = this._getHighscoreData();
    return data.runRecords.find(r => r.runId === runId) || null;
  }

  // --- Highscore detection ---

  static isLevelTop10({ packId, packVersion, level, mode, attemptId }) {
    const top10 = this.getLevelTop10({ packId, packVersion, level, mode });
    return top10.some(r => r.attemptId === attemptId);
  }

  static isRunTop10({ packId, packVersion, mode, runId }) {
    const top10 = this.getRunTop10({ packId, packVersion, mode });
    return top10.some(r => r.runId === runId);
  }

  static getLevelRank({ packId, packVersion, level, mode, attemptId }) {
    const records = this.getLevelRecords({ packId, packVersion, level, mode });
    const found = records.find(r => r.attemptId === attemptId);
    return found ? found.rank : null;
  }

  static getRunRank({ packId, packVersion, mode, runId }) {
    const data = this._getHighscoreData();
    const entries = data.runRecords.filter(
      r => r.packId === packId && r.packVersion === packVersion && r.mode === mode
    );
    const sorted = this._sortEntries(entries);
    const index = sorted.findIndex(r => r.runId === runId);
    return index >= 0 ? index + 1 : null;
  }

  static updateRecordNames({ levelAttemptIds, runId, name, player2Name }) {
    const data = this._getHighscoreData();
    let changed = false;

    const ids = Array.isArray(levelAttemptIds) ? levelAttemptIds : [];
    for (const attemptId of ids) {
      const record = data.levelRecords.find(r => r.attemptId === attemptId);
      if (!record) continue;
      if (name !== undefined && record.name !== name) { record.name = name; changed = true; }
      if (player2Name !== undefined && record.player2Name !== player2Name) { record.player2Name = player2Name; changed = true; }
    }
    if (runId) {
      const runRecord = data.runRecords.find(r => r.runId === runId);
      if (runRecord) {
        if (name !== undefined && runRecord.name !== name) { runRecord.name = name; changed = true; }
        if (player2Name !== undefined && runRecord.player2Name !== player2Name) { runRecord.player2Name = player2Name; changed = true; }
      }
    }

    if (changed) this._setHighscoreData(data);
    return changed;
  }

  // --- Export / Import ---

  static exportData() {
    const profile = this.getPlayerProfile();
    const highscoreData = this._getHighscoreData();
    const payload = {
      formatVersion: EXPORT_FORMAT_VERSION,
      exportedAt: Date.now(),
      playerProfile: profile,
      highscoreData
    };
    const json = JSON.stringify(payload);
    // encodeURIComponent makes the string safe for btoa while preserving unicode
    return btoa(encodeURIComponent(json));
  }

  static importData(encoded) {
    if (!isString(encoded) || encoded.length === 0) {
      return { success: false, error: 'Empty import data' };
    }
    let payload;
    try {
      payload = JSON.parse(decodeURIComponent(atob(encoded)));
    } catch (error) {
      return { success: false, error: 'Import data is corrupt' };
    }
    if (!isPlainObject(payload)) return { success: false, error: 'Import must be an object' };
    if (payload.formatVersion !== EXPORT_FORMAT_VERSION) {
      return { success: false, error: `Unsupported format version: ${payload.formatVersion}` };
    }
    if (!isPlainObject(payload.playerProfile) || !isString(payload.playerProfile.name)) {
      return { success: false, error: 'Missing player profile' };
    }
    if (
      !isPlainObject(payload.highscoreData) ||
      payload.highscoreData.version !== HS_DATA_VERSION ||
      !Array.isArray(payload.highscoreData.levelRecords) ||
      !Array.isArray(payload.highscoreData.runRecords)
    ) {
      return { success: false, error: 'Missing or invalid highscore data' };
    }
    safeSet(PLAYER_PROFILE_KEY, payload.playerProfile);
    this._setHighscoreData(payload.highscoreData);
    return { success: true };
  }

  // --- Network sync ---

  static exportSyncData() {
    return this._getHighscoreData();
  }

  static mergeSyncRecord(record) {
    console.log('[HS_SYNC] mergeSyncRecord called, type:', record?.type);
    if (!isPlainObject(record)) return { success: false, error: 'Invalid record' };
    if (record.type === 'level') {
      return this._mergeLevelRecord(record.data);
    } else if (record.type === 'run') {
      return this._mergeRunRecord(record.data);
    }
    return { success: false, error: 'Unknown record type' };
  }

  static _mergeLevelRecord(remoteRecord) {
    console.log('[HS_SYNC] _mergeLevelRecord, attemptId:', remoteRecord?.attemptId);
    if (!isPlainObject(remoteRecord) || !remoteRecord.attemptId) {
      return { success: false, error: 'Invalid level record' };
    }
    const validationError = this._validateLevelRecord(remoteRecord);
    if (validationError) {
      console.error('[HS_SYNC] Level record validation failed:', validationError);
      return { success: false, error: validationError };
    }
    const localData = this._getHighscoreData();
    const exists = localData.levelRecords.some(r => r.attemptId === remoteRecord.attemptId);
    if (!exists) {
      localData.levelRecords.push(remoteRecord);
      this._setHighscoreData(localData);
      console.log('[HS_SYNC] Added level record, total now:', localData.levelRecords.length);
    } else {
      console.log('[HS_SYNC] Level record already exists, skipping');
    }
    return { success: true };
  }

  static _mergeRunRecord(remoteRecord) {
    console.log('[HS_SYNC] _mergeRunRecord, runId:', remoteRecord?.runId);
    if (!isPlainObject(remoteRecord) || !remoteRecord.runId) {
      return { success: false, error: 'Invalid run record' };
    }
    const validationError = this._validateRunRecord(remoteRecord);
    if (validationError) {
      console.error('[HS_SYNC] Run record validation failed:', validationError);
      return { success: false, error: validationError };
    }
    const localData = this._getHighscoreData();
    const existingIndex = localData.runRecords.findIndex(r => r.runId === remoteRecord.runId);
    if (existingIndex >= 0) {
      localData.runRecords[existingIndex] = remoteRecord;
      console.log('[HS_SYNC] Updated existing run record');
    } else {
      localData.runRecords.push(remoteRecord);
      console.log('[HS_SYNC] Added run record, total now:', localData.runRecords.length);
    }
    this._setHighscoreData(localData);
    return { success: true };
  }

  static mergeSyncData(remoteData) {
    console.log('[HS_SYNC] mergeSyncData called, version:', remoteData?.version, 'levelRecords:', remoteData?.levelRecords?.length, 'runRecords:', remoteData?.runRecords?.length);
    if (
      !isPlainObject(remoteData) ||
      remoteData.version !== HS_DATA_VERSION ||
      !Array.isArray(remoteData.levelRecords) ||
      !Array.isArray(remoteData.runRecords)
    ) {
      return { success: false, error: 'Invalid remote highscore data' };
    }

    const localData = this._getHighscoreData();

    // Merge level records: add remote records that don't have a matching attemptId
    const localAttemptIds = new Set(localData.levelRecords.map(r => r.attemptId));
    for (const remoteRecord of remoteData.levelRecords) {
      if (remoteRecord.attemptId && !localAttemptIds.has(remoteRecord.attemptId)) {
        const validationError = this._validateLevelRecord(remoteRecord);
        if (!validationError) {
          localData.levelRecords.push(remoteRecord);
        }
      }
    }

    // Merge run records: add remote records that don't have a matching runId
    const localRunIds = new Set(localData.runRecords.map(r => r.runId));
    for (const remoteRecord of remoteData.runRecords) {
      if (remoteRecord.runId && !localRunIds.has(remoteRecord.runId)) {
        const validationError = this._validateRunRecord(remoteRecord);
        if (!validationError) {
          localData.runRecords.push(remoteRecord);
        }
      }
    }

    this._setHighscoreData(localData);
    return { success: true };
  }

  // --- Reset ---

  static resetHighscores() {
    this._setHighscoreData({ version: HS_DATA_VERSION, levelRecords: [], runRecords: [] });
  }

  static resetAll() {
    this.resetHighscores();
    safeSet(PLAYER_PROFILE_KEY, { name: this.generatePlayerName() });
  }
}
