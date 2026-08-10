import React, { useState, useEffect, useMemo, useRef } from 'react';
import Menu from './ui/Menu';
import GameCanvas from './ui/GameCanvas';
import LevelCompleteOverlay from './ui/LevelCompleteOverlay';
import HamburgerMenu from './ui/HamburgerMenu';
import TopRightMenu from './ui/TopRightMenu';
import TutorialOverlay from './ui/TutorialOverlay';
import LevelEditor from './ui/LevelEditor';
import MultiplayerMenu from './ui/MultiplayerMenu';
import LocalLobby from './ui/LocalLobby';
import OnlineLobby from './ui/OnlineLobby';
import LobbyRoom from './ui/LobbyRoom';
import HighscoresPage from './ui/HighscoresPage';
import { useNetwork } from './network/NetworkContext.jsx';
import { SCORE_LEVEL_COMPLETE, SCORE_FUEL_REMAINING, SCORE_BUNKER_DESTROYED, ENABLE_LEVEL_EDITOR, INITIAL_LIVES, SCORING_VERSION, BONUS_LIFE_THRESHOLDS } from './core/constants.js';
import { ScoringSystem } from './game/scoring.js';
import { HighScoreManager } from './game/high-score-manager.js';
import { APP_VERSION } from './version.js';
import { storageKey } from './core/storage-keys.js';
import { migrateLegacyProgress, getPackProgress, markLevelCompleted } from './core/progress-storage.js';
import { getAllPacks, ensurePackMetaLoaded, BUILTIN_PACKS, registerCustomPack, isReservedPackId } from './levels/levelpacks.js';
import { useLanguage } from './i18n/LanguageContext.jsx';
import { getHighscoreTranslations } from './i18n/highscores.js';

function App() {
  const { language, setLanguage } = useLanguage();
  const t = getHighscoreTranslations(language);
  const [gameState, setGameState] = useState('menu'); // Start with menu screen
  const previousGameStateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [levelScoreBreakdown, setLevelScoreBreakdown] = useState({
    bunker: 0,
    button: 0,
    pod: 0,
    reactor: 0,
    fuel: 0,
    level: 0,
    timeBonus: 0,
    time: 1,
    scoringVersion: ''
  });
  const [playerName, setPlayerName] = useState(() => HighScoreManager.getPlayerProfile().name);
  const [player2Name, setPlayer2Name] = useState(() => HighScoreManager.getPlayerProfile().player2Name || HighScoreManager.generatePlayerName());
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey('lastPlayedLevel'));
      const parsed = stored ? parseInt(stored, 10) : 1;
      return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
    } catch {
      return 1;
    }
  });
  const [fuel, setFuel] = useState(100);
  const [currentPackId, setCurrentPackId] = useState('default');
  const [installedPacks, setInstalledPacks] = useState(() => getAllPacks());
  const [completedLevels, setCompletedLevels] = useState(() => getPackProgress('default'));
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isEditorTestMode, setIsEditorTestMode] = useState(false);
  const [editorLevelData, setEditorLevelData] = useState(null);
  const [editorWallColor, setEditorWallColor] = useState('#ff0000');
  const [isMobile, setIsMobile] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  });
  const [showTouchButtons, setShowTouchButtons] = useState(() => {
    const stored = localStorage.getItem(storageKey('showTouchButtons'));
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // Default: on for mobile, off for laptop
    return isMobile;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const stored = localStorage.getItem(storageKey('soundVolume'));
    if (stored !== null) {
      const parsed = parseFloat(stored);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.7;
    }
    return 0.2; // default: 20% volume (max is 70%)
  });
  const [touchButtonOpacity, setTouchButtonOpacity] = useState(() => {
    const stored = localStorage.getItem(storageKey('touchButtonOpacity'));
    if (stored !== null) {
      const parsed = parseFloat(stored);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1;
    }
    return 0.5; // default: 50% opacity
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
  const tiltSensorRef = useRef({ beta: 0, gamma: 0, alpha: 0 });

  // One-time migration of legacy completedLevels to classic pack
  useEffect(() => {
    migrateLegacyProgress();
  }, []);

  // Load meta for the current pack (built-in packs fetch meta.json lazily)
  useEffect(() => {
    const pack = installedPacks.find(p => p.id === currentPackId);
    if (!pack) return;
    if (pack.meta) return; // already loaded
    ensurePackMetaLoaded(pack).then(meta => {
      setInstalledPacks(prev => prev.map(p =>
        p.id === currentPackId ? { ...p, meta } : p
      ));
    }).catch(err => console.error('[APP] Failed to load pack meta:', err));
  }, [currentPackId]);

  useEffect(() => {
    localStorage.setItem(storageKey('showTouchButtons'), JSON.stringify(showTouchButtons));
  }, [showTouchButtons]);

  useEffect(() => {
    localStorage.setItem(storageKey('vibrationEnabled'), vibrationEnabled.toString());
  }, [vibrationEnabled]);

  useEffect(() => {
    localStorage.setItem(storageKey('tiltSteering'), tiltSteering.toString());
  }, [tiltSteering]);

  useEffect(() => {
    localStorage.setItem(storageKey('tiltNeutralBeta'), tiltNeutralBeta.toString());
  }, [tiltNeutralBeta]);

  useEffect(() => {
    localStorage.setItem(storageKey('tiltNeutralGamma'), tiltNeutralGamma.toString());
  }, [tiltNeutralGamma]);

  useEffect(() => {
    localStorage.setItem(storageKey('tiltSteeringRotated'), tiltSteeringRotated.toString());
  }, [tiltSteeringRotated]);

  useEffect(() => {
    localStorage.setItem(storageKey('analyticsEnabled'), analyticsEnabled.toString());
  }, [analyticsEnabled]);

  useEffect(() => {
    localStorage.setItem(storageKey('soundVolume'), soundVolume.toString());
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem(storageKey('touchButtonOpacity'), touchButtonOpacity.toString());
  }, [touchButtonOpacity]);

  const [tutorialDismissed, setTutorialDismissed] = useState(() => {
    const stored = localStorage.getItem(storageKey('tutorialDismissed'));
    return stored === 'true';
  });
  const [showTutorial, setShowTutorial] = useState(false);

  // Remember the last played level across reloads.
  useEffect(() => {
    localStorage.setItem(storageKey('lastPlayedLevel'), level.toString());
  }, [level]);

  // End editor test mode when leaving the game and returning to the menu
  useEffect(() => {
    if (gameState === 'menu') {
      setIsEditorTestMode(false);
    }
  }, [gameState]);

  const [gravityMultiplier, setGravityMultiplier] = useState(1.0);
  const [gameSession, setGameSession] = useState(0); // Increments on each new game to force GameCanvas remount

  // Check for ?level= URL parameter or #level= hash fragment to start game with a custom level (from external editor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let levelParam = params.get('level');
    let wallColor = params.get('wallColor') || '#ff0000';
    let fromHash = false;
    if (!levelParam && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      levelParam = hashParams.get('level');
      wallColor = hashParams.get('wallColor') || wallColor;
      fromHash = true;
    }
    if (levelParam) {
      try {
        const decoded = atob(levelParam);
        if (fromHash) {
          // Save as 'external' pack in localStorage so the level can be replayed from level selection
          registerCustomPack(
            { id: 'external', name: 'External', version: '1.0', author: 'Editor', createdAt: Date.now(), levelCount: 1 },
            { level1: decoded },
            true
          );
          setInstalledPacks(getAllPacks());
          setCurrentPackId('external');
          // Remove hash from URL so F5 doesn't re-trigger the level
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        setEditorLevelData(decoded);
        setEditorWallColor(wallColor);
        setIsEditorTestMode(true);
        setLives(999);
        setLevel(1);
        setGameState('playing');
        setGameSession(prev => prev + 1);
      } catch (e) {
        console.error('[APP] Failed to decode level from URL parameter:', e);
      }
    }
  }, []);
  const scoreRef = useRef(0); // Synchronous score tracking for bonus life threshold checks
  const bonusLivesAwardedRef = useRef(0); // Number of bonus lives awarded so far this run
  const [bonusLifePopup, setBonusLifePopup] = useState(null); // { threshold, id } to signal GameCanvas
  const runContextRef = useRef(null);
  const levelRecordIdsRef = useRef([]);
  const gameOverSavedRef = useRef(false);
  const [newHighscore, setNewHighscore] = useState(null); // { level: boolean, run: boolean }
  const [twoPlayer, setTwoPlayer] = useState(() => {
    try {
      return localStorage.getItem(storageKey('playerMode')) === 'two';
    } catch {
      return false;
    }
  });

  // Persist selected player mode across reloads.
  useEffect(() => {
    localStorage.setItem(storageKey('playerMode'), twoPlayer ? 'two' : 'single');
  }, [twoPlayer]);

  const [podDocked, setPodDocked] = useState(false);
  const { manager: networkManager, state: networkState } = useNetwork();
  const [multiplayerView, setMultiplayerView] = useState(null);
  const [networkRole, setNetworkRole] = useState(null);

  useEffect(() => {
    if (gameState === 'menu' && networkRole && networkState.state !== 'lobby' && networkState.state !== 'ready') {
      networkManager.reset();
      setNetworkRole(null);
    }
  }, [gameState, networkRole, networkManager, networkState.state]);

  // [NETWORK] Listen for playagain event from the other player
  useEffect(() => {
    if (!networkManager || !networkRole) return;
    const handlePlayAgain = (data) => {
      if (data?.type === 'playagain' && gameState === 'gameover') {
        handleStartLevel(data?.level || level);
      }
    };
    networkManager.on('game:event', handlePlayAgain);
    return () => networkManager.off('game:event', handlePlayAgain);
  }, [networkManager, networkRole, gameState, level]);

  // [NETWORK] Listen for nextlevel event from the other player
  useEffect(() => {
    if (!networkManager || !networkRole) return;
    const handleNextLevelRemote = (data) => {
      if (data?.type === 'nextlevel' && gameState === 'levelcomplete') {
        handleNextLevel();
      }
    };
    networkManager.on('game:event', handleNextLevelRemote);
    return () => networkManager.off('game:event', handleNextLevelRemote);
  }, [networkManager, networkRole, gameState]);

  // [NETWORK] Listen for startlevel event from the other player
  useEffect(() => {
    if (!networkManager || !networkRole) return;
    const handleStartLevelRemote = (data) => {
      if (data?.type === 'startlevel' && typeof data?.level === 'number') {
        console.log('[NETWORK] Received startlevel event for level', data.level);
        handleStartLevel(data.level);
      }
    };
    networkManager.on('game:event', handleStartLevelRemote);
    return () => networkManager.off('game:event', handleStartLevelRemote);
  }, [networkManager, networkRole]);

  const handleStartGame = (isTwoPlayer = twoPlayer, role = null) => {
    setNewHighscore(null);
    const mode = isTwoPlayer ? 'two' : 'single';
    const pack = installedPacks.find(p => p.id === currentPackId);
    const packVersion = pack?.version || pack?.meta?.version || '1';
    setTwoPlayer(isTwoPlayer);
    setNetworkRole(role);
    setPodDocked(false);
    setGameState('playing');
    setScore(0);
    setLevelScore(0);
    setLevelScoreBreakdown({ bunker: 0, button: 0, pod: 0, reactor: 0, fuel: 0, level: 0, timeBonus: 0, time: 0, scoringVersion: '' });
    setLives(INITIAL_LIVES);
    setLevel(1);
    setFuel(100);
    setGravityMultiplier(1.0);
    setGameSession(prev => prev + 1); // Force full GameCanvas reset
    runContextRef.current = HighScoreManager.createRunContext({ packId: currentPackId, packVersion, startLevel: 1, mode });
    levelRecordIdsRef.current = [];
    gameOverSavedRef.current = false;
    if (!tutorialDismissed) setShowTutorial(true);
  };

  const handleStartLevel = (levelNum) => {
    setNewHighscore(null);
    const pack = installedPacks.find(p => p.id === currentPackId);
    const packVersion = pack?.version || pack?.meta?.version || '1';
    setPodDocked(false);
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    bonusLivesAwardedRef.current = 0;
    setBonusLifePopup(null);
    setLevel(levelNum);
    setLevelScore(0);
    setLevelScoreBreakdown({ bunker: 0, button: 0, pod: 0, reactor: 0, fuel: 0, level: 0, timeBonus: 0, time: 0, scoringVersion: '' });
    setLives(INITIAL_LIVES);
    setFuel(100);
    setGravityMultiplier(1.0);
    setGameSession(prev => prev + 1); // Force full GameCanvas reset
    runContextRef.current = HighScoreManager.createRunContext({ packId: currentPackId, packVersion, startLevel: levelNum, mode: twoPlayer ? 'two' : 'single' });
    levelRecordIdsRef.current = [];
    gameOverSavedRef.current = false;
  };

  const handleStartLevelNetworked = (levelNum) => {
    if (networkRole && networkManager) {
      networkManager.sendEvent({ type: 'startlevel', level: levelNum });
    }
    handleStartLevel(levelNum);
  };

  const handlePlayAgain = () => {
    if (networkRole && networkManager) {
      networkManager.sendEvent({ type: 'playagain', level });
    }
    handleStartLevel(level);
  };

  const handleLevelComplete = (completedLevel, levelTimeMs, levelWidth, levelHeight) => {
    setPodDocked(false);
    const fuelRemaining = Math.max(0, Math.min(100, fuel));
    const livesLeft = Math.max(0, lives);
    const levelCompleteLives = Math.min(livesLeft, completedLevel);
    const fuelPoints = Math.floor(fuelRemaining * SCORE_FUEL_REMAINING);
    const levelPoints = levelCompleteLives * SCORE_LEVEL_COMPLETE;
    const timeBonus = ScoringSystem.calculateTimeBonus(levelTimeMs, levelWidth, levelHeight);
    const timeSeconds = Math.max(1, Math.ceil(levelTimeMs / 1000));
    const levelCompleteBonus = levelPoints + fuelPoints + timeBonus;
    const levelTotalScore = levelScore + levelCompleteBonus;
    const breakdownFull = { ...levelScoreBreakdown, fuel: fuelPoints, level: levelPoints, timeBonus, time: timeSeconds, scoringVersion: SCORING_VERSION };
    setScore(prev => prev + levelCompleteBonus);
    scoreRef.current += levelCompleteBonus;
    setLevelScore(levelTotalScore);
    setLevelScoreBreakdown(breakdownFull);
    checkBonusLifeThresholds();

    const run = runContextRef.current;
    const recordResult = HighScoreManager.addLevelRecord({
      runId: run?.runId,
      packId: run?.packId,
      packVersion: run?.packVersion,
      mode: run?.mode,
      pass: run?.pass || 1,
      level: completedLevel,
      completed: true,
      score: levelTotalScore,
      scoreBreakdown: breakdownFull,
      activeMs: levelTimeMs,
      scoringVersion: SCORING_VERSION,
      name: hsName,
      player2Name: hsFinalPlayer2Name,
    });
    const levelAttemptId = recordResult.saved ? recordResult.record.attemptId : null;
    if (levelAttemptId) {
      levelRecordIdsRef.current.push(levelAttemptId);
    }

    const newTotalScore = score + levelCompleteBonus;
    if (run) {
      HighScoreManager.addRunRecord({
        runId: run.runId,
        packId: run.packId,
        packVersion: run.packVersion,
        mode: run.mode,
        startLevel: run.startLevel,
        lastLevel: completedLevel,
        totalScore: newTotalScore,
        levelRecordIds: [...levelRecordIdsRef.current],
        name: playerName,
        player2Name: hsPlayer2Name,
      });
    }

    // Check for new highscores (per-level and per-run, for the current mode)
    const hs = { level: false, run: false };
    if (run && levelAttemptId) {
      hs.level = HighScoreManager.isLevelTop10({
        packId: run.packId, packVersion: run.packVersion,
        level: completedLevel, mode: run.mode, attemptId: levelAttemptId
      });
      hs.run = HighScoreManager.isRunTop10({
        packId: run.packId, packVersion: run.packVersion,
        mode: run.mode, runId: run.runId
      });
    }
    setNewHighscore(hs);

    // Auto-sync new highscore records to peer in network mode
    if (networkRole && networkManager) {
      if (recordResult.saved && recordResult.record) {
        networkManager.sendHighscoreRecord({ type: 'level', data: recordResult.record });
        console.log('[HS_SYNC] Sent level record to peer');
      }
      if (run) {
        const runRecord = HighScoreManager.getRunRecordByRunId(run.runId);
        if (runRecord) {
          networkManager.sendHighscoreRecord({ type: 'run', data: runRecord });
          console.log('[HS_SYNC] Sent run record to peer');
        }
      }
    }

    const updated = markLevelCompleted(currentPackId, completedLevel);
    setCompletedLevels(updated);
    setGameState('levelcomplete');
  };

  const handleNextLevel = () => {
    if (networkRole && networkManager) {
      networkManager.sendEvent({ type: 'nextlevel' });
    }
    const currentPack = installedPacks.find(p => p.id === currentPackId);
    const levelCount = currentPack?.meta?.levelCount || 6;
    // If last level completed, restart from level 1 with stronger gravity
    if (level >= levelCount) {
      setLevel(1);
      setGravityMultiplier(prev => prev + 0.4); // Increase gravity by 40% each time all levels in the pack are completed
      if (runContextRef.current) {
        runContextRef.current = { ...runContextRef.current, pass: (runContextRef.current.pass || 1) + 1 };
      }
    } else {
      setLevel(prev => prev + 1);
    }
    setGameState('playing');
    setLevelScore(0);
    setLevelScoreBreakdown({ bunker: 0, button: 0, pod: 0, reactor: 0, fuel: 0, level: 0, timeBonus: 0, time: 0, scoringVersion: '' });
    setBonusLifePopup(null);
    setGameSession(prev => prev + 1); // Force full GameCanvas reset to reset ship position and velocity
  };

  const handleGameOver = () => {
    if (gameOverSavedRef.current) {
      setGameState('gameover');
      return;
    }
    setNewHighscore(null);
    gameOverSavedRef.current = true;
    const run = runContextRef.current;
    const currentLevelValue = level;
    if (run) {
      const failResult = HighScoreManager.addLevelRecord({
        runId: run.runId,
        packId: run.packId,
        packVersion: run.packVersion,
        mode: run.mode,
        pass: run.pass || 1,
        level: currentLevelValue,
        completed: false,
        score: levelScore,
        scoreBreakdown: { ...levelScoreBreakdown },
        activeMs: 0,
        scoringVersion: SCORING_VERSION,
        name: playerName,
        player2Name: hsPlayer2Name,
      });
      if (failResult.saved && failResult.record.attemptId) {
        levelRecordIdsRef.current.push(failResult.record.attemptId);
      }

      if (run.startLevel > 1 || levelRecordIdsRef.current.length > 0) {
        HighScoreManager.addRunRecord({
          runId: run.runId,
          packId: run.packId,
          packVersion: run.packVersion,
          mode: run.mode,
          startLevel: run.startLevel,
          lastLevel: currentLevelValue,
          totalScore: score,
          levelRecordIds: [...levelRecordIdsRef.current],
          name: playerName,
          player2Name: hsPlayer2Name,
        });
      }

      // Check for new run highscore (game over only qualifies for run top 10)
      const hs = { level: false, run: false };
      hs.run = HighScoreManager.isRunTop10({
        packId: run.packId, packVersion: run.packVersion,
        mode: run.mode, runId: run.runId
      });
      setNewHighscore(hs);

      // Auto-sync new highscore records to peer in network mode
      if (networkRole && networkManager) {
        if (failResult.saved && failResult.record) {
          networkManager.sendHighscoreRecord({ type: 'level', data: failResult.record });
          console.log('[HS_SYNC] Sent level record to peer (game over)');
        }
        const runRecord = HighScoreManager.getRunRecordByRunId(run.runId);
        if (runRecord) {
          networkManager.sendHighscoreRecord({ type: 'run', data: runRecord });
          console.log('[HS_SYNC] Sent run record to peer (game over)');
        }
      }
    }

    setGameState('gameover');
  };

  const handlePlayerNameChange = (name) => {
    const result = HighScoreManager.savePlayerName(name);
    if (result.success) setPlayerName(result.profile.name);
    return result;
  };

  const handlePlayer2NameChange = (name) => {
    const result = HighScoreManager.savePlayer2Name(name);
    if (result.success) setPlayer2Name(result.profile.player2Name);
    return result;
  };

  // For highscore records: store player 1 name and (optional) player 2 name separately.
  // In network multiplayer, the client is always P1 and the host is always P2 in the
  // highscore, so both players create identical records (important for future sync).
  const opponentName = networkRole
    ? networkState.players.find(p => p.role !== networkRole)?.name
    : null;
  const hsPlayer2Name = twoPlayer ? (opponentName || player2Name) : undefined;
  const hsName = networkRole === 'host' ? (opponentName || playerName) : playerName;
  const hsFinalPlayer2Name = networkRole === 'host' ? playerName : hsPlayer2Name;

  const checkBonusLifeThresholds = () => {
    while (bonusLivesAwardedRef.current < BONUS_LIFE_THRESHOLDS.length) {
      const threshold = BONUS_LIFE_THRESHOLDS[bonusLivesAwardedRef.current];
      if (scoreRef.current >= threshold) {
        bonusLivesAwardedRef.current += 1;
        setBonusLifePopup({ threshold, id: Date.now() });
        console.log('[BONUS_LIFE] Awarded bonus life at score', scoreRef.current, '| threshold:', threshold);
      } else {
        break;
      }
    }
  };

  const handleScoreChange = (scoreEvent) => {
    const points = typeof scoreEvent === 'number' ? scoreEvent : scoreEvent.points;
    const type = typeof scoreEvent === 'number' ? null : scoreEvent.type;
    scoreRef.current += points;
    setScore(prev => prev + points);
    setLevelScore(prev => prev + points);
    if (type) {
      setLevelScoreBreakdown(prev => ({ ...prev, [type]: prev[type] + points }));
    }
    checkBonusLifeThresholds();
  };

  const handleLivesChange = (newLives) => {
    setLives(newLives);
  };

  const handleSwitchPack = async (packId) => {
    let pack = installedPacks.find(p => p.id === packId);
    if (!pack) {
      // Newly imported packs may not yet be reflected in the local state,
      // so look them up directly from the persisted registry.
      pack = getAllPacks().find(p => p.id === packId);
    }
    if (!pack) return;
    const meta = await ensurePackMetaLoaded(pack);
    setInstalledPacks(prev => {
      const exists = prev.some(p => p.id === packId);
      const updated = prev.map(p => p.id === packId ? { ...p, meta } : p);
      return exists ? updated : [...updated, { ...pack, meta }];
    });
    setCurrentPackId(packId);
    setCompletedLevels(getPackProgress(packId));
    setLevel(1);
    setGravityMultiplier(1.0);
  };

  const handlePackImported = () => {
    setInstalledPacks(getAllPacks());
  };

  const handlePackDeleted = () => {
    setInstalledPacks(getAllPacks());
  };

  const getCurrentPackBaseUrl = () => {
    const pack = installedPacks.find(p => p.id === currentPackId);
    return pack?.baseUrl || '/levelpacks/default';
  };

  const scoreBreakdown = useMemo(() => [
    { key: 'time', label: t.time, value: levelScoreBreakdown.time + t.seconds },
    { key: 'bunker', label: levelScoreBreakdown.bunker > SCORE_BUNKER_DESTROYED ? t.bunkerDestroyedPlural : t.bunkerDestroyed, value: levelScoreBreakdown.bunker },
    { key: 'button', label: t.buttonActivated, value: levelScoreBreakdown.button },
    { key: 'pod', label: t.podConnected, value: levelScoreBreakdown.pod },
    { key: 'fuel', label: t.fuelRemaining, value: levelScoreBreakdown.fuel },
    { key: 'level', label: t.levelCompleteLabel, value: levelScoreBreakdown.level },
    { key: 'reactor', label: t.reactorEscape, value: levelScoreBreakdown.reactor },
    { key: 'timeBonus', label: t.timeBonus, value: levelScoreBreakdown.timeBonus }
  ].filter(item => item.value !== 0 || (item.key === 'time' && levelScoreBreakdown.time > 0)), [levelScoreBreakdown, t]);

  // Generate level buttons (DRY: used by hamburger menu)
  const generateLevelButtons = (onClose) => {
    const buttons = [];
    const currentPack = installedPacks.find(p => p.id === currentPackId);
    const levelCount = currentPack?.meta?.levelCount || 6;
    for (let i = 1; i <= levelCount; i++) {
      const isUnlocked = i === 1 || completedLevels.has(i - 1) || completedLevels.has(i);
      buttons.push(
        <button
          key={i}
          onClick={() => {
            handleStartLevelNetworked(i);
            if (onClose) onClose();
          }}
          disabled={!isUnlocked}
          title={isUnlocked ? `Level ${i}` : 'Complete previous level to unlock'}
          style={{
            padding: '8px 4px',
            cursor: isUnlocked ? 'pointer' : 'not-allowed',
            background: completedLevels.has(i)
              ? 'linear-gradient(135deg, #00ff88, #00cc66)'
              : isUnlocked
              ? 'linear-gradient(135deg, #333, #444)'
              : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            color: isUnlocked ? '#fff' : '#555',
            border: completedLevels.has(i)
              ? '1px solid #00ff88'
              : isUnlocked
              ? '1px solid #555'
              : '1px solid #333',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            opacity: isUnlocked ? 1 : 0.5,
            boxShadow: completedLevels.has(i)
              ? '0 2px 10px rgba(0, 255, 136, 0.3)'
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (!isUnlocked) return;
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = completedLevels.has(i)
              ? '0 4px 15px rgba(0, 255, 136, 0.5)'
              : '0 4px 15px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            if (!isUnlocked) return;
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = completedLevels.has(i)
              ? '0 2px 10px rgba(0, 255, 136, 0.3)'
              : 'none';
          }}
        >
          {i}
          {completedLevels.has(i) && ' ' /* ✓ */} 
        </button>
      );
    }
    return buttons;
  };

  const handleSyncHighscores = () => {
    const role = networkRole || networkManager?.role;
    if (!networkManager || !role) {
      console.log('[HS_SYNC] Cannot sync: no networkManager or role. networkRole:', networkRole, 'manager.role:', networkManager?.role);
      return;
    }
    const data = HighScoreManager.exportSyncData();
    console.log('[HS_SYNC] Exporting local data:', data.levelRecords.length, 'level records,', data.runRecords.length, 'run records');
    networkManager.sendHighscoreSync(data);
    console.log('[HS_SYNC] Sent local highscore data to peer via', networkManager.mode, 'mode, role:', role);
  };

  // Listen for incoming highscore sync from peer
  useEffect(() => {
    const role = networkRole || networkManager?.role;
    if (!networkManager || !role) {
      console.log('[HS_SYNC] Listener not active: missing networkManager or role. networkRole:', networkRole, 'manager.role:', networkManager?.role);
      return;
    }
    console.log('[HS_SYNC] Listener registered for game:event, role:', role);
    const handleHsSync = (event) => {
      console.log('[HS_SYNC] Received game:event:', event?.type, 'has data:', !!event?.data);
      if (event?.type === 'hs-sync' && event?.data) {
        console.log('[HS_SYNC] Processing full sync:', event.data.levelRecords?.length, 'level records,', event.data.runRecords?.length, 'run records');
        const result = HighScoreManager.mergeSyncData(event.data);
        if (result.success) {
          console.log('[HS_SYNC] Merged remote highscore data successfully');
          networkManager.addStatus('Highscores synced');
        } else {
          console.error('[HS_SYNC] Failed to merge:', result.error);
        }
      } else if (event?.type === 'hs-sync-record' && event?.data) {
        console.log('[HS_SYNC] Processing single record:', event.data.type);
        const result = HighScoreManager.mergeSyncRecord(event.data);
        if (result.success) {
          console.log('[HS_SYNC] Merged remote highscore record:', event.data.type);
        } else {
          console.error('[HS_SYNC] Failed to merge record:', result.error);
        }
      }
    };
    networkManager.on('game:event', handleHsSync);
    return () => networkManager.off('game:event', handleHsSync);
  }, [networkManager, networkRole]);

  const handleShowHighscores = () => {
    previousGameStateRef.current = gameState;
    setGameState('highscores');
  };

  const handleBackFromHighscores = () => {
    if (networkRole) {
      networkManager.backToLobby();
    }
    setGameState('menu');
  };

  // Keyboard shortcuts for game over and level complete screens
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'gameover') {
        if (e.key === ' ' || e.key === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handlePlayAgain();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setGameState('menu');
        }
      } else if (gameState === 'levelcomplete') {
        if (e.key === ' ' || e.key === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleNextLevel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Shared hamburger menu settings (DRY): used by both the in-game hamburger
  // and the unified TopRightMenu. Excludes close-sensitive handlers, which are
  // wired individually per usage.
  const hamburgerSettingsProps = {
    appVersion: APP_VERSION,
    showTouchButtons,
    onToggleTouchButtons: () => setShowTouchButtons(!showTouchButtons),
    installedPacks,
    currentPackId,
    onSwitchPack: handleSwitchPack,
    onPackImported: handlePackImported,
    onPackDeleted: handlePackDeleted,
    twoPlayer,
    playerName,
    onPlayerNameChange: handlePlayerNameChange,
    player2Name,
    onPlayer2NameChange: handlePlayer2NameChange,
    soundVolume,
    onSoundVolumeChange: setSoundVolume,
    touchButtonOpacity,
    onTouchButtonOpacityChange: setTouchButtonOpacity,
    vibrationEnabled,
    onToggleVibration: () => setVibrationEnabled(!vibrationEnabled),
    tiltSteering,
    onToggleTiltSteering: () => setTiltSteering(!tiltSteering),
    tiltSensorRef,
    onCalibrateTilt: () => { setTiltNeutralBeta(tiltSensorRef.current.beta); setTiltNeutralGamma(tiltSensorRef.current.gamma); },
    tiltSteeringRotated,
    onToggleTiltRotation: () => setTiltSteeringRotated(!tiltSteeringRotated),
    analyticsEnabled,
    onToggleAnalytics: () => setAnalyticsEnabled(!analyticsEnabled),
  };

  return (
    <div className="app" id="app" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden', touchAction: 'none' }}>
      {(gameState === 'menu' || gameState === 'highscores') && (
        <TopRightMenu
          language={language}
          onLanguageChange={setLanguage}
          onOpenLevelEditor={() => setGameState('editor')}
          makeLevelButtons={generateLevelButtons}
          onBackToMenu={() => setGameState('menu')}
          onShowTutorial={() => setShowTutorial(true)}
          hamburgerProps={hamburgerSettingsProps}
        />
      )}
      {gameState === 'menu' && (
        <div id="menu-container" style={{ width: '100%', height: '100%', overflow: 'auto', touchAction: 'auto' }}>
          <Menu
            onStart={(isTwoPlayer) => handleStartGame(isTwoPlayer, null)}
            onMultiplayer={() => setMultiplayerView('menu')}
            onOpenLevelEditor={() => setGameState('editor')}
            installedPacks={installedPacks}
            currentPackId={currentPackId}
            twoPlayer={twoPlayer}
            onTogglePlayerMode={() => setTwoPlayer(!twoPlayer)}
          />
        </div>
      )}

      {gameState === 'menu' && multiplayerView === 'menu' && (
        <MultiplayerMenu
          onLocal={() => setMultiplayerView('local')}
          onOnline={() => setMultiplayerView('online')}
          onBack={() => { setMultiplayerView(null); networkManager.reset(); }}
        />
      )}

      {gameState === 'menu' && multiplayerView === 'local' && !['lobby', 'ready', 'playing'].includes(networkState.state) && (
        <LocalLobby onBack={() => setMultiplayerView('menu')} />
      )}

      {gameState === 'menu' && multiplayerView === 'online' && !['lobby', 'ready', 'playing'].includes(networkState.state) && (
        <OnlineLobby onBack={() => setMultiplayerView('menu')} />
      )}

      {gameState === 'menu' && multiplayerView && multiplayerView !== 'menu' && (networkState.state === 'lobby' || networkState.state === 'ready') && (
        <LobbyRoom
          onStartGame={(role) => handleStartGame(true, role)}
          onLeave={() => { networkManager.reset(); setNetworkRole(null); setMultiplayerView(null); }}
          onSyncHighscores={handleSyncHighscores}
        />
      )}

      {gameState === 'editor' && (
        <LevelEditor
          onBack={() => setGameState('menu')}
          onPackImported={handlePackImported}
          installPackFn={registerCustomPack}
          isReservedPackIdFn={isReservedPackId}
          onEditorTest={(levelData, wallColor) => {
            setEditorLevelData(levelData);
            setEditorWallColor(wallColor);
            setIsEditorTestMode(true);
            setLives(999);
            setGameState('playing');
            setGameSession(prev => prev + 1);
          }}
        />
      )}

      {gameState === 'highscores' && (
        <HighscoresPage
          onBack={handleBackFromHighscores}
          onPlay={null}
          installedPacks={installedPacks}
          currentPackId={currentPackId}
          twoPlayer={twoPlayer}
        />
      )}

      {/* In-game hamburger and editor button (in-game layout; editor only in test mode).
          Non-game screens use the unified TopRightMenu instead. */}
      {(gameState === 'playing' || gameState === 'gameover' || gameState === 'levelcomplete') && (
        <>
          {/* Level editor button - only visible in editor test mode */}
          {ENABLE_LEVEL_EDITOR && isEditorTestMode && (
            <button
              onClick={() => setGameState('editor')}
              style={{
                position: 'fixed',
                top: '2px',
                right: '55px',
                marginTop: '4px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6644ff, #4422cc)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '0',
                zIndex: 3000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}
              title="Level Editor"
            >
              ✎
            </button>
          )}

          {/* Hamburger button - outside all containers with position fixed */}
          <button
            id="hamburger-button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{ position: 'fixed', top: '-5px', right: '22px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '4px', zIndex: 3000 }}
          >
            ☰
          </button>
        </>
      )}

      {/* Game canvas, HUD and overlays - only during active gameplay */}
      {(gameState === 'playing' || gameState === 'gameover' || gameState === 'levelcomplete') && (
        <>
          <div id="hud-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0, 0, 0, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 10 }}>
            <div id="hud-stats" style={{ display: 'flex', flexDirection: 'row', gap: '16px', fontSize: '12px', color: '#fff', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>SCORE {score}</span>
              <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>LIVES {lives > 10 ? '∞ ❤️' : '❤️'.repeat(Math.max(0, lives))}</span>
              <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>LEVEL {level}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>FUEL</span>
                <div style={{ width: '80px', height: '12px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${fuel}%`, height: '100%', background: fuel > 30 ? 'linear-gradient(90deg, #00ff88, #00cc66)' : 'linear-gradient(90deg, #ff4444, #cc0000)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Canvas wrapper for scaled canvas and centered overlays */}
          <div id="canvas-wrapper" style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <div id="canvas-container" style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}>
              <GameCanvas
                key={`game-${gameSession}`}
                onFuelChange={setFuel}
                onLevelComplete={handleLevelComplete}
                onGameOver={handleGameOver}
                onScoreChange={handleScoreChange}
                onLivesChange={handleLivesChange}
                level={level}
                packBaseUrl={getCurrentPackBaseUrl()}
                gravityMultiplier={gravityMultiplier}
                frozen={gameState === 'gameover' || gameState === 'levelcomplete' || showTutorial || showMobileMenu}
                showTouchButtons={showTouchButtons}
                isMobile={isMobile}
                isEditorTestMode={isEditorTestMode}
                editorLevelData={editorLevelData}
                editorWallColor={editorWallColor}
                initialLives={lives}
                twoPlayer={twoPlayer}
                networkRole={networkRole}
                onPodDockedChange={setPodDocked}
                soundVolume={soundVolume}
                touchButtonOpacity={touchButtonOpacity}
                vibrationEnabled={vibrationEnabled}
                tiltSteering={tiltSteering}
                tiltNeutralBeta={tiltNeutralBeta}
                tiltNeutralGamma={tiltNeutralGamma}
                tiltSteeringRotated={tiltSteeringRotated}
                tiltSensorRef={tiltSensorRef}
                bonusLifePopup={bonusLifePopup}
              />

              {/* Game over overlay - centered over canvas */}
              {gameState === 'gameover' && (
                <LevelCompleteOverlay
                  title={t.gameOver}
                  breakdown={scoreBreakdown}
                  total={score}
                  totalLabel={t.scoreLabel}
                  newHighscore={newHighscore}
                  twoPlayer={twoPlayer}
                  networkRole={networkRole}
                  hsName={hsName}
                  hsPlayer2Name={hsFinalPlayer2Name}
                  onShowHighscores={handleShowHighscores}
                  playerName={playerName}
                  onPlayerNameChange={handlePlayerNameChange}
                  player2Name={player2Name}
                  onPlayer2NameChange={handlePlayer2NameChange}
                  podDocked={podDocked}
                  soundVolume={soundVolume}
                  onSoundVolumeChange={setSoundVolume}
                  vibrationEnabled={vibrationEnabled}
                  onToggleVibration={() => setVibrationEnabled(!vibrationEnabled)}
                  tiltSteering={tiltSteering}
                  onToggleTiltSteering={() => setTiltSteering(!tiltSteering)}
                  tiltSensorRef={tiltSensorRef}
                  onCalibrateTilt={() => { setTiltNeutralBeta(tiltSensorRef.current.beta); setTiltNeutralGamma(tiltSensorRef.current.gamma); }}
                  tiltSteeringRotated={tiltSteeringRotated}
                  onToggleTiltRotation={() => setTiltSteeringRotated(!tiltSteeringRotated)}
                  onShowTutorial={() => { setShowTutorial(true); setShowMobileMenu(false); }}
                  buttons={
                    <>
                      <button onClick={() => handlePlayAgain()} style={{ padding: '16px 32px', fontSize: '16px', fontWeight: '600', color: '#fff', background: 'linear-gradient(135deg, #00ff88, #00cc66)', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 136, 0.5)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.3)'; }}>
                        {t.playAgain}
                      </button>
                      <button onClick={() => { if (networkRole) { networkManager.backToLobby(); setGameState('menu'); } else { setGameState('menu'); } }} style={{ padding: '16px 32px', fontSize: '16px', fontWeight: '600', color: '#fff', background: 'linear-gradient(135deg, #555, #333)', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.5)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'; }}>
                        {networkRole ? t.backToLobby : t.backToMenu}
                      </button>
                    </>
                  }
                />
              )}

              {/* Level complete overlay - centered over canvas */}
              {gameState === 'levelcomplete' && (
                <LevelCompleteOverlay
                  title={t.levelComplete}
                  breakdown={scoreBreakdown}
                  total={levelScore}
                  totalLabel={t.scoreLabel}
                  newHighscore={newHighscore}
                  twoPlayer={twoPlayer}
                  networkRole={networkRole}
                  hsName={hsName}
                  hsPlayer2Name={hsFinalPlayer2Name}
                  onShowHighscores={handleShowHighscores}
                  levelNumber={level}
                  playerName={playerName}
                  onPlayerNameChange={handlePlayerNameChange}
                  player2Name={player2Name}
                  onPlayer2NameChange={handlePlayer2NameChange}
                  buttons={
                    <button onClick={handleNextLevel} style={{ padding: '16px 32px', fontSize: '16px', fontWeight: '600', color: '#fff', background: 'linear-gradient(135deg, #00ff88, #00cc66)', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 136, 0.5)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.3)'; }}>
                      {t.nextLevel}
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* In-game hamburger overlay (uses shared settings via hamburgerSettingsProps). */}
      {(gameState === 'playing' || gameState === 'gameover' || gameState === 'levelcomplete') && showMobileMenu && (
        <HamburgerMenu
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          levelButtons={generateLevelButtons(() => setShowMobileMenu(false))}
          onBackToMenu={() => { setGameState('menu'); setShowMobileMenu(false); }}
          onOpenLevelEditor={() => { setGameState('editor'); setShowMobileMenu(false); }}
          onShowTutorial={() => { setShowTutorial(true); setShowMobileMenu(false); }}
          podDocked={podDocked}
          {...hamburgerSettingsProps}
        />
      )}

      {showTutorial && (
        <TutorialOverlay
          isMobile={isMobile}
          onDismiss={() => {
            setShowTutorial(false);
            setTutorialDismissed(true);
            localStorage.setItem(storageKey('tutorialDismissed'), 'true');
          }}
        />
      )}
    </div>
  );
}

export default App;
