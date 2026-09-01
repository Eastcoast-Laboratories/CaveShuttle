import { describe, it, expect, beforeEach } from 'vitest';
import { HighScoreManager } from '../../src/game/high-score-manager.js';

function makeRun() {
  return HighScoreManager.createRunContext({ packId: 'default', packVersion: '1', startLevel: 1, mode: 'single' });
}

function makeLevelRecord(run, overrides = {}) {
  return {
    runId: run.runId,
    packId: run.packId,
    packVersion: run.packVersion,
    mode: run.mode,
    pass: run.pass,
    level: 1,
    completed: true,
    score: 1000,
    scoreBreakdown: { bunker: 0, button: 0, pod: 0, fuel: 0, level: 1000, timeBonus: 0, time: 1, scoringVersion: '1.0' },
    activeMs: 5000,
    scoringVersion: '1.0',
    name: 'Tester',
    ...overrides
  };
}

describe('HighScoreManager Phase 1', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates and persists a player profile on first access', () => {
    const profile = HighScoreManager.getPlayerProfile();
    expect(typeof profile.name).toBe('string');
    expect(profile.name.length).toBeGreaterThan(0);

    const loaded = HighScoreManager.getPlayerProfile();
    expect(loaded.name).toBe(profile.name);
  });

  it('validates player names', () => {
    expect(HighScoreManager.validateName('')).toEqual({ valid: false, error: 'Name cannot be empty' });
    expect(HighScoreManager.validateName('a'.repeat(21))).toEqual({ valid: false, error: 'Name cannot exceed 20 characters' });
    expect(HighScoreManager.validateName('Bad!')).toEqual({ valid: false, error: 'Name contains invalid characters' });
    expect(HighScoreManager.validateName('Good Name')).toEqual({ valid: true, name: 'Good Name' });
  });

  it('saves and updates the player name', () => {
    const result = HighScoreManager.savePlayerName('Commander');
    expect(result.success).toBe(true);
    expect(HighScoreManager.getPlayerProfile().name).toBe('Commander');
  });

  it('creates a run context with all required fields', () => {
    const run = HighScoreManager.createRunContext({ packId: 'default', packVersion: '1.0', startLevel: 2, mode: 'two' });
    expect(run.runId).toBeDefined();
    expect(run.packId).toBe('default');
    expect(run.packVersion).toBe('1.0');
    expect(run.startLevel).toBe(2);
    expect(run.pass).toBe(1);
    expect(run.mode).toBe('two');
    expect(typeof run.startedAt).toBe('number');
  });

  it('saves a completed level record and returns it in the top 10', () => {
    const run = makeRun();
    const record = makeLevelRecord(run, { score: 2500 });
    const result = HighScoreManager.addLevelRecord(record);
    expect(result.saved).toBe(true);
    expect(result.record.attemptId).toBeDefined();

    const top = HighScoreManager.getLevelTop10({ packId: 'default', packVersion: '1', level: 1, mode: 'single' });
    expect(top).toHaveLength(1);
    expect(top[0].rank).toBe(1);
    expect(top[0].score).toBe(2500);
  });

  it('excludes failed attempts from level top-10 once a completed record exists', () => {
    const run = makeRun();
    HighScoreManager.addLevelRecord(makeLevelRecord(run, { completed: false, score: 5000, name: 'Fast' }));
    HighScoreManager.addLevelRecord(makeLevelRecord(run, { completed: true, score: 3000, name: 'Good' }));
    HighScoreManager.addLevelRecord(makeLevelRecord(run, { completed: true, score: 4000, name: 'Better' }));

    const top = HighScoreManager.getLevelTop10({ packId: 'default', packVersion: '1', level: 1, mode: 'single' });
    expect(top).toHaveLength(2);
    expect(top[0].completed).toBe(true);
    expect(top[0].score).toBe(4000);
    expect(top[1].score).toBe(3000);
  });

  it('returns only the best level score per player name, ignoring case', () => {
    const firstRun = makeRun();
    const secondRun = makeRun();
    HighScoreManager.addLevelRecord(makeLevelRecord(firstRun, { score: 1000, name: 'Tester' }));
    HighScoreManager.addLevelRecord(makeLevelRecord(secondRun, { score: 2500, name: 'tester' }));

    const top = HighScoreManager.getLevelTop10({ packId: 'default', packVersion: '1', level: 1, mode: 'single' });
    expect(top).toHaveLength(1);
    expect(top[0].score).toBe(2500);
  });

  it('does not save a failed level if a completed one already exists', () => {
    const run = makeRun();
    HighScoreManager.addLevelRecord(makeLevelRecord(run));
    const failed = makeLevelRecord(run, { completed: false, score: 0 });
    const result = HighScoreManager.addLevelRecord(failed);
    expect(result.saved).toBe(false);
  });

  it('saves a failed level when no completed record exists', () => {
    const run = makeRun();
    const result = HighScoreManager.addLevelRecord(makeLevelRecord(run, { completed: false, score: 100 }));
    expect(result.saved).toBe(true);
    expect(result.record.completed).toBe(false);
  });

  it('saves a run record and upserts by runId', () => {
    const run = makeRun();
    HighScoreManager.addLevelRecord(makeLevelRecord(run));

    const runResult = HighScoreManager.addRunRecord({
      runId: run.runId,
      packId: run.packId,
      packVersion: run.packVersion,
      mode: run.mode,
      startLevel: 1,
      lastLevel: 1,
      totalScore: 1000,
      levelRecordIds: [],
      name: 'Tester'
    });
    expect(runResult.saved).toBe(true);

    const updated = HighScoreManager.addRunRecord({
      runId: run.runId,
      packId: run.packId,
      packVersion: run.packVersion,
      mode: run.mode,
      startLevel: 1,
      lastLevel: 2,
      totalScore: 2500,
      levelRecordIds: [],
      name: 'Tester'
    });
    expect(updated.saved).toBe(true);
    const top = HighScoreManager.getRunTop10({ packId: 'default', packVersion: '1', mode: 'single' });
    expect(top).toHaveLength(1);
    expect(top[0].totalScore).toBe(2500);
    expect(top[0].lastLevel).toBe(2);
  });

  it('returns only the best run per player name, ignoring case', () => {
    for (let i = 0; i < 12; i++) {
      const run = makeRun();
      HighScoreManager.addRunRecord({
        runId: run.runId,
        packId: 'default',
        packVersion: '1',
        mode: 'single',
        startLevel: 1,
        lastLevel: 1,
        totalScore: i * 100,
        levelRecordIds: [],
        name: i % 2 === 0 ? 'Tester' : 'tester'
      });
    }
    const top = HighScoreManager.getRunTop10({ packId: 'default', packVersion: '1', mode: 'single' });
    expect(top).toHaveLength(1);
    expect(top[0].totalScore).toBe(1100);
  });

  it('keeps different player names as separate local run scores', () => {
    for (const [name, totalScore] of [['Alpha', 100], ['Beta', 200], ['Alpha', 300]]) {
      const run = makeRun();
      HighScoreManager.addRunRecord({
        runId: run.runId,
        packId: 'default',
        packVersion: '1',
        mode: 'single',
        startLevel: 1,
        lastLevel: 1,
        totalScore,
        levelRecordIds: [],
        name
      });
    }
    const top = HighScoreManager.getRunTop10({ packId: 'default', packVersion: '1', mode: 'single' });
    expect(top.map(record => [record.name, record.totalScore])).toEqual([['Alpha', 300], ['Beta', 200]]);
  });

  it('uses an order-independent player pair for two-player scores', () => {
    const scores = [
      ['Alpha', 'Beta', 100],
      ['beta', 'alpha', 300],
      ['Alpha', 'Gamma', 200]
    ];
    for (const [name, player2Name, totalScore] of scores) {
      const run = HighScoreManager.createRunContext({ packId: 'default', packVersion: '1', startLevel: 1, mode: 'two' });
      HighScoreManager.addRunRecord({
        runId: run.runId,
        packId: run.packId,
        packVersion: run.packVersion,
        mode: run.mode,
        startLevel: 1,
        lastLevel: 1,
        totalScore,
        levelRecordIds: [],
        name,
        player2Name
      });
    }
    const top = HighScoreManager.getRunTop10({ packId: 'default', packVersion: '1', mode: 'two' });
    expect(top.map(record => record.totalScore)).toEqual([300, 200]);
  });

  it('resets all highscore and profile data', () => {
    const run = makeRun();
    HighScoreManager.addLevelRecord(makeLevelRecord(run));
    HighScoreManager.resetAll();
    const top = HighScoreManager.getLevelTop10({ packId: 'default', packVersion: '1', level: 1, mode: 'single' });
    expect(top).toHaveLength(0);
    expect(HighScoreManager.getPlayerProfile().name).toBeDefined();
  });

  it('exports and imports data correctly', () => {
    HighScoreManager.savePlayerName('ExportPlayer');
    const run = makeRun();
    HighScoreManager.addLevelRecord(makeLevelRecord(run));

    const exported = HighScoreManager.exportData();
    expect(typeof exported).toBe('string');

    localStorage.clear();
    const imported = HighScoreManager.importData(exported);
    expect(imported.success).toBe(true);
    expect(HighScoreManager.getPlayerProfile().name).toBe('ExportPlayer');
    const top = HighScoreManager.getLevelTop10({ packId: 'default', packVersion: '1', level: 1, mode: 'single' });
    expect(top).toHaveLength(1);
  });

  it('rejects corrupted import data', () => {
    expect(HighScoreManager.importData('not-valid-base64!!!')).toEqual({ success: false, error: 'Import data is corrupt' });
  });
});
