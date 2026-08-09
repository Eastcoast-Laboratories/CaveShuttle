// Scoring system
import { storageKey } from '../core/storage-keys.js';
import { TIME_BONUS_HEIGHT_SECONDS_PER_TILE, TIME_BONUS_WIDTH_SECONDS_PER_TILE, TIME_BONUS_POINTS_PER_SECOND, TIME_BONUS_MAX } from '../core/constants.js';

export class ScoringSystem {
  constructor() {
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem(storageKey('highscore')) || '0', 10);
    this.lives = 3;
    this.level = 1;
  }

  addScore(points) {
    this.score += points;
    this.updateHighScore();
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(storageKey('highscore'), this.highScore.toString());
    }
  }

  loseLife() {
    this.lives--;
    return this.lives <= 0;
  }

  resetLives() {
    this.lives = 3;
  }

  nextLevel() {
    this.level++;
  }

  resetLevel() {
    this.level = 1;
  }

  resetScore() {
    this.score = 0;
  }

  resetAll() {
    this.resetScore();
    this.resetLives();
    this.resetLevel();
  }

  getScore() {
    return this.score;
  }

  getHighScore() {
    return this.highScore;
  }

  getLives() {
    return this.lives;
  }

  getLevel() {
    return this.level;
  }

  isGameOver() {
    return this.lives <= 0;
  }

  /**
   * Calculate the time bonus for an active level completion time.
   *
   * The active playing time is measured and paused by GameCanvas and passed in as
   * activeMs. The level dimensions (width/height in tiles) are passed from
   * GameCanvas level.width/level.height. The allowed time budget is computed here
   * from the constants in src/core/constants.js (TIME_BONUS_HEIGHT_SECONDS_PER_TILE,
   * TIME_BONUS_WIDTH_SECONDS_PER_TILE). Each remaining full second under that budget
   * yields TIME_BONUS_POINTS_PER_SECOND points. The result is never negative and never
   * exceeds TIME_BONUS_MAX.
   *
   * @param {number} activeMs - Active play time in milliseconds, measured and paused by GameCanvas.
   * @param {number} levelWidth - Level width in tiles, from GameCanvas level.width.
   * @param {number} levelHeight - Level height in tiles, from GameCanvas level.height.
   * @returns {number} Time bonus points for this level completion.
   */
  static calculateTimeBonus(activeMs, levelWidth = 1, levelHeight = 1) {
    if (!Number.isFinite(activeMs) || activeMs <= 0) {
      return 0;
    }
    const activeSeconds = Math.floor(activeMs / 1000);
    const thresholdSeconds = (levelHeight * TIME_BONUS_HEIGHT_SECONDS_PER_TILE) +
                             (levelWidth * TIME_BONUS_WIDTH_SECONDS_PER_TILE);
    const remainingSeconds = Math.max(0, thresholdSeconds - activeSeconds);
    console.log('[BONUS] Level:', levelWidth, 'x', levelHeight, ', activeMs: ', activeMs, ', activeS: ', activeSeconds, ', thresholdS: ', thresholdSeconds, ', remainingS: ', remainingSeconds);
    return Math.max(0, Math.min(TIME_BONUS_MAX, Math.floor(remainingSeconds * TIME_BONUS_POINTS_PER_SECOND)));
  }
}
