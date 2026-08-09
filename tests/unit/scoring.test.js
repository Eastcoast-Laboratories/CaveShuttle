import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoringSystem } from '../../src/game/scoring.js';

describe('Scoring System', () => {
  let scoring;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => '0'),
      setItem: vi.fn()
    };
    global.localStorage = localStorageMock;
    
    scoring = new ScoringSystem();
  });

  it('should create scoring system with defaults', () => {
    expect(scoring.score).toBe(0);
    expect(scoring.highScore).toBe(0);
    expect(scoring.lives).toBe(3);
    expect(scoring.level).toBe(1);
  });

  it('should add score', () => {
    scoring.addScore(100);
    expect(scoring.score).toBe(100);
  });

  it('should update high score when score exceeds it', () => {
    scoring.addScore(500);
    expect(scoring.highScore).toBe(500);
    expect(localStorage.setItem).toHaveBeenCalledWith('caveshuttle_highscore', '500');
  });

  it('should not update high score when score is lower', () => {
    scoring.highScore = 1000;
    scoring.addScore(500);
    expect(scoring.highScore).toBe(1000);
  });

  it('should load high score from localStorage', () => {
    localStorage.getItem = vi.fn(() => '1000');
    const newScoring = new ScoringSystem();
    expect(newScoring.highScore).toBe(1000);
  });

  it('should lose life', () => {
    const gameOver = scoring.loseLife();
    expect(scoring.lives).toBe(2);
    expect(gameOver).toBe(false);
  });

  it('should return game over when lives reach 0', () => {
    scoring.lives = 1;
    const gameOver = scoring.loseLife();
    expect(scoring.lives).toBe(0);
    expect(gameOver).toBe(true);
  });

  it('should reset lives', () => {
    scoring.lives = 0;
    scoring.resetLives();
    expect(scoring.lives).toBe(3);
  });

  it('should advance to next level', () => {
    scoring.nextLevel();
    expect(scoring.level).toBe(2);
  });

  it('should reset level', () => {
    scoring.level = 5;
    scoring.resetLevel();
    expect(scoring.level).toBe(1);
  });

  it('should reset score', () => {
    scoring.score = 1000;
    scoring.resetScore();
    expect(scoring.score).toBe(0);
  });

  it('should reset all', () => {
    scoring.score = 1000;
    scoring.lives = 0;
    scoring.level = 5;
    
    scoring.resetAll();
    
    expect(scoring.score).toBe(0);
    expect(scoring.lives).toBe(3);
    expect(scoring.level).toBe(1);
  });

  it('should get score', () => {
    scoring.addScore(500);
    expect(scoring.getScore()).toBe(500);
  });

  it('should get high score', () => {
    scoring.addScore(1000);
    expect(scoring.getHighScore()).toBe(1000);
  });

  it('should get lives', () => {
    scoring.loseLife();
    expect(scoring.getLives()).toBe(2);
  });

  it('should get level', () => {
    scoring.nextLevel();
    expect(scoring.getLevel()).toBe(2);
  });

  it('should check game over', () => {
    expect(scoring.isGameOver()).toBe(false);
    scoring.lives = 0;
    expect(scoring.isGameOver()).toBe(true);
  });
});
