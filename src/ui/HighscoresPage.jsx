import React, { useEffect, useState } from 'react';
import './LegalPages.css';
import './cave-theme.css';
import './HighscoresPage.css';
import { HighScoreManager } from '../game/high-score-manager.js';
import { autoAccountManager } from '../game/auto-account.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getHighscoreTranslations } from '../i18n/highscores.js';

// Standalone highscores page linked from the main menu.
export default function HighscoresPage({ onBack, onPlay, installedPacks = [], currentPackId, twoPlayer = false }) {
  const { language } = useLanguage();
  const t = getHighscoreTranslations(language);
  const [activeTab, setActiveTab] = useState('runs');
  const [selectedPackId, setSelectedPackId] = useState(currentPackId || (installedPacks[0]?.id || 'default'));
  const [selectedMode, setSelectedMode] = useState(twoPlayer ? 'two' : 'single');
  const [runTop10, setRunTop10] = useState([]);
  const [levelTop, setLevelTop] = useState([]);
  const [profile, setProfile] = useState(() => HighScoreManager.getPlayerProfile());
  const [packVersion, setPackVersion] = useState('1');
  const [levelCount, setLevelCount] = useState(6);
  const [runDetail, setRunDetail] = useState(null);
  const [levelDetail, setLevelDetail] = useState(null);
  const [ownRunEntry, setOwnRunEntry] = useState(null);
  const [onlineLeaderboard, setOnlineLeaderboard] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const playerName = profile.name;

  const getDisplayName = (entry) => entry.player2Name ? `${entry.name} & ${entry.player2Name}` : entry.name;
  const isOwnEntry = (entry) => entry.name === playerName || entry.player2Name === playerName;
  const formatDateTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    if (language === 'en') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${dd}, '${yy} ${hh}:${mi}`;
    }
    return `${dd}.${mm}.${yy} ${hh}:${mi}`;
  };

  useEffect(() => {
    setProfile(HighScoreManager.getPlayerProfile());
    const modes = selectedMode === 'all' ? ['single', 'two'] : [selectedMode];
    const pack = installedPacks.find(p => p.id === selectedPackId);
    const pv = pack?.version || pack?.meta?.version || '1';
    const lc = pack?.meta?.levelCount || 6;
    setPackVersion(pv);
    setLevelCount(lc);

    // Aggregate run top 10 across selected modes
    const allRuns = [];
    for (const mode of modes) {
      const top10 = HighScoreManager.getRunTop10({ packId: selectedPackId, packVersion: pv, mode });
      allRuns.push(...top10);
    }
    // Sort aggregated runs and take top 10
    const sortedRuns = HighScoreManager._sortEntries(allRuns).slice(0, 10);
    sortedRuns.forEach((r, i) => { r.rank = i + 1; });
    setRunTop10(sortedRuns);

    // Find player's own best run not in top 10
    const inTop10 = sortedRuns.some(r => isOwnEntry(r));
    if (!inTop10) {
      const ownAllRuns = [];
      for (const mode of modes) {
        ownAllRuns.push(...HighScoreManager._getHighscoreData().runRecords.filter(
          r => r.packId === selectedPackId && r.packVersion === pv && r.mode === mode
        ));
      }
      const sortedOwn = HighScoreManager._sortEntries(ownAllRuns);
      const ownBest = sortedOwn.find(r => isOwnEntry(r));
      setOwnRunEntry(ownBest ? { ...ownBest, rank: sortedOwn.indexOf(ownBest) + 1 } : null);
    } else {
      setOwnRunEntry(null);
    }

    // Aggregate level top scores across selected modes
    const levels = [];
    for (let i = 1; i <= lc; i++) {
      let bestTop = null;
      for (const mode of modes) {
        const top = HighScoreManager.getLevelTop10({ packId: selectedPackId, packVersion: pv, level: i, mode });
        if (top[0] && (!bestTop || top[0].score > bestTop.score)) {
          bestTop = top[0];
        }
      }
      levels.push({ level: i, top: bestTop });
    }
    setLevelTop(levels);
  }, [installedPacks, selectedPackId, selectedMode]);

  useEffect(() => {
    if (!showOnline) return;
    const mode = selectedMode === 'all' ? 'single' : selectedMode;
    setOnlineLoading(true);
    autoAccountManager.fetchLeaderboard({
      packVersion,
      playerMode: mode,
      recordType: activeTab === 'runs' ? 'run' : 'level',
    }).then(result => {
      setOnlineLoading(false);
      if (result.success) {
        setOnlineLeaderboard(result.leaderboard || []);
      } else {
        setOnlineLeaderboard([]);
      }
    });
  }, [showOnline, packVersion, selectedMode, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      if (runDetail) {
        e.preventDefault();
        setRunDetail(null);
      } else if (levelDetail) {
        e.preventDefault();
        setLevelDetail(null);
      } else {
        e.preventDefault();
        onBack();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [runDetail, levelDetail, onBack]);

  const openRunDetail = (run) => {
    const records = (run.levelRecordIds || []).map(id => HighScoreManager.getLevelRecordByAttemptId(id)).filter(Boolean);
    setRunDetail({ ...run, records });
  };

  const openLevelDetail = (level) => {
    const modes = selectedMode === 'all' ? ['single', 'two'] : [selectedMode];
    const pack = installedPacks.find(p => p.id === selectedPackId);
    const pv = pack?.version || pack?.meta?.version || '1';
    const allRecords = [];
    for (const mode of modes) {
      allRecords.push(...HighScoreManager.getLevelRecords({ packId: selectedPackId, packVersion: pv, level, mode }));
    }
    const sorted = HighScoreManager._sortEntries(allRecords);
    sorted.forEach((r, i) => { r.rank = i + 1; });
    const top10 = sorted.slice(0, 10);
    const inTop10 = top10.some(r => isOwnEntry(r));
    const ownEntry = inTop10 ? null : sorted.find(r => isOwnEntry(r));
    setLevelDetail({ level, records: top10, ownEntry });
  };

  const lastRecord = runDetail ? runDetail.records[runDetail.records.length - 1] : null;

  return (
    <div className="modal-page highscores-page cave-background">
      <div className="modal-page-inner cave-panel">
        <h1 className="highscore-title"><img src="/images/highscore/highscore_title.png" alt="HIGH SCORE" /></h1>
        <p className="player-info">
          {t.player}: <strong className="player-name">{profile.name}</strong>
        </p>
        <div className="top-row">
          <span className="nbsp">&nbsp;</span>
          <button className="back-button" onClick={onBack}>{t.back}</button>
          <div className="tabs">
            <span className="nbsp">&nbsp;</span>
            <button
              className={`tab-button ${activeTab === 'runs' ? 'active' : ''}`}
              onClick={() => setActiveTab('runs')}
            >{t.runs}</button>
            <button
              className={`tab-button ${activeTab === 'levels' ? 'active' : ''}`}
              onClick={() => setActiveTab('levels')}
            >{t.levels}</button>
          </div>
          <span className="nbsp">&nbsp;</span>
          <button
            className={`tab-button ${showOnline ? 'active' : ''}`}
            onClick={() => setShowOnline(!showOnline)}
          >{showOnline ? t.onlineTab : t.localTab}</button>
          <span className="nbsp">&nbsp;</span>
          <div className="filter-group">
            <select
              className="filter-select"
              value={selectedPackId}
              onChange={(e) => setSelectedPackId(e.target.value)}
            >
              {installedPacks.map(pack => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <option value="all">{t.allPlayers}</option>
              <option value="single">{t.onePlayer}</option>
              <option value="two">{t.twoPlayer}</option>
            </select>
          </div>
          <div style={{ flex: 1 }} />
          {onPlay && <button className="play-button" onClick={() => onPlay()}>{t.play}</button>}
          <span className="nbsp">&nbsp;&nbsp;</span>
        </div>

        {showOnline ? (
          <div>
            {onlineLoading ? (
              <p className="empty-message">Loading online leaderboard...</p>
            ) : onlineLeaderboard.length === 0 ? (
              <p className="empty-message">No online scores yet. Play and complete levels to appear here!</p>
            ) : (
              <table className="highscores-table">
                <thead>
                  <tr>
                    <th className="solid-col edge-img edge-tl"></th>
                    <th className="rank-col"></th>
                    <th className="level-col">{t.rank}</th>
                    <th className="text-right">{t.score}</th>
                    {activeTab === 'levels' && <th className="level-col">{t.level}</th>}
                    <th>{t.name}</th>
                    <th className="solid-col edge-img edge-tr"></th>
                  </tr>
                </thead>
                <tbody>
                  {onlineLeaderboard.map((entry, i) => (
                    <tr key={i}>
                      <td className="solid-col"></td>
                      <td className="rank-col"></td>
                      <td className="level-col">{i + 1}</td>
                      <td className="text-right">{String(entry.score).padStart(6, '0')}</td>
                      {activeTab === 'levels' && <td className="level-col">{entry.level}</td>}
                      <td className="uppercase">{entry.name}</td>
                      <td className="solid-col"></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="solid-col edge-img edge-bl"></td>
                    <td colSpan={activeTab === 'levels' ? 5 : 4}></td>
                    <td className="solid-col edge-img edge-br"></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        ) : activeTab === 'runs' ? (
          <div>
            {runTop10.length === 0 ? (
              <p className="empty-message">{t.noRunHighscores}</p>
            ) : (
              <table className="highscores-table">
                <thead>
                  <tr>
                    <th className="solid-col edge-img edge-tl"></th>
                    <th className="rank-col"></th>
                    <th className="level-col">{t.rank}</th>
                    <th className="text-right">{t.score}</th>
                    <th className="level-col">{t.level}</th>
                    <th>{t.name}</th>
                    <th className="solid-col edge-img edge-tr"></th>
                  </tr>
                </thead>
                <tbody>
                  {runTop10.map(entry => (
                    <tr key={entry.runId || entry.rank} onClick={() => openRunDetail(entry)}>
                      <td className="solid-col"></td>
                      <td className="rank-col"></td>
                      <td className="level-col">{entry.rank}</td>
                      <td className="text-right">{String(entry.totalScore).padStart(6, '0')}</td>
                      <td className="level-col">{entry.lastLevel}{(() => {
                        const lastRec = (entry.levelRecordIds || []).map(id => HighScoreManager.getLevelRecordByAttemptId(id)).filter(Boolean).pop();
                        return lastRec && lastRec.pass > 1 ? ` (${t.stageLabel.replace('{n}', lastRec.pass)})` : '';
                      })()}</td>
                      <td className={`uppercase ${isOwnEntry(entry) ? 'own-name' : ''}`}>{getDisplayName(entry)}</td>
                      <td className="solid-col"></td>
                    </tr>
                  ))}
                  {ownRunEntry && (
                    <tr key="own-run" className="own-entry-row" onClick={() => openRunDetail(ownRunEntry)}>
                      <td className="solid-col"></td>
                      <td className="rank-col"></td>
                      <td className="level-col">{ownRunEntry.rank}</td>
                      <td className="text-right">{String(ownRunEntry.totalScore).padStart(6, '0')}</td>
                      <td className="level-col">{ownRunEntry.lastLevel}</td>
                      <td className="uppercase own-name">{getDisplayName(ownRunEntry)}</td>
                      <td className="solid-col"></td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="solid-col edge-img edge-bl"></td>
                    <td colSpan="5"></td>
                    <td className="solid-col edge-img edge-br"></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        ) : (
          <div>
            <table className="highscores-table">
              <thead>
                <tr>
                  <th className="solid-col"><span className="edge-img edge-tl"></span></th>
                  <th className="level-col">{t.level}</th>
                  <th className="text-right">{t.score}</th>
                  <th>{t.name}</th>
                  <th className="solid-col"><span className="edge-img edge-tr"></span></th>
                </tr>
              </thead>
              <tbody>
                {levelTop.map(({ level, top }) => (
                  <tr key={level} onClick={() => openLevelDetail(level)}>
                    <td className="solid-col"></td>
                    <td className="level-col">{level}{top && top.pass > 1 ? ` (${t.stageLabel.replace('{n}', top.pass)})` : ''}</td>
                    <td className="text-right">{top ? String(top.score).padStart(6, '0') : '------'}</td>
                    <td className={`uppercase ${top && isOwnEntry(top) ? 'own-name' : ''}`}>{top ? getDisplayName(top) : t.noScore}</td>
                    <td className="solid-col"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="solid-col"><span className="edge-img edge-bl"></span></td>
                  <td colSpan="3"></td>
                  <td className="solid-col"><span className="edge-img edge-br"></span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <br />
        <img src="/images/highscore/highscore_spaceship.png" className="highscore-spaceship" alt="spaceship" />
      </div>

      {runDetail && (
        <div className="popup-overlay popup-overlay-top" onClick={(e) => { if (e.target === e.currentTarget) setRunDetail(null); }}>
          <div className="popup-content">
            <h2>{runDetail.startLevel === runDetail.lastLevel ? `${runDetail.startLevel}` : `${runDetail.startLevel} - ${runDetail.lastLevel}`}: {getDisplayName(runDetail)}</h2>
            <p className="total-score">{t.totalScore}: {runDetail.totalScore}</p>
            <p className="player-mode">{runDetail.mode === 'two' ? t.twoPlayer : t.onePlayer}</p>
            {runDetail.recordedAt && (
              <p className="popup-datetime">{formatDateTime(runDetail.recordedAt)}</p>
            )}
            {lastRecord && (
              <p className="last-level">
                {t.lastPlayed.replace('{level}', lastRecord.level).replace('{score}', lastRecord.score).replace('{suffix}', lastRecord.completed ? '' : t.gameOverSuffix)}
              </p>
            )}
            {runDetail.records.length === 0 ? (
              <p>{t.noLevelRecords}</p>
            ) : (
              <div className="popup-levels">
                {runDetail.records.map(r => {
                  const breakdown = r.scoreBreakdown || {};
                  const orderedKeys = ['bunker', 'button', 'pod', 'reactor', 'fuel', 'level', 'time', 'timeBonus'];
                  const labelMap = t.breakdownLabels;
                  const categories = orderedKeys
                    .map(k => {
                      let value = breakdown[k];
                      if (k === 'time') {
                        value = value > 0 ? value : (r.activeMs ? (r.activeMs / 1000).toFixed(1) : 0);
                      }
                      return {
                        key: k,
                        label: labelMap[k] || k,
                        value: value > 0 ? value : 0
                      };
                    })
                    .filter(item => item.value > 0)
                    .map(item => ({
                      ...item,
                      display: item.key === 'time' ? `${item.value}s` : `${item.value}`
                    }));
                  return (
                    <div key={r.attemptId} className="popup-level-row">
                      <div className="popup-level-header">
                        <span>{t.level} {r.level}{r.pass > 1 ? ` (${t.stageLabel.replace('{n}', r.pass)})` : ''}{r.completed ? '' : t.levelFailed}</span>
                        <span className="popup-level-score">
                          <span>{r.score} {t.points}</span>
                          {breakdown.time > 0 && breakdown.timeBonus > 0 && (
                            <span>{breakdown.time}s</span>
                          )}
                          <span className="popup-level-datetime">{formatDateTime(r.recordedAt)}</span>
                        </span>
                      </div>
                      <div className="popup-categories">
                        {categories.map(c => (
                          <span key={c.key} className="popup-category">{c.label}: {c.display}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="close-button" onClick={() => setRunDetail(null)}>{t.close}</button>
          </div>
        </div>
      )}

      {levelDetail && (
        <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) setLevelDetail(null); }}>
          <div className="popup-content">
            <h2>{t.level} {levelDetail.level}</h2>
            {levelDetail.records.length === 0 ? (
              <p>{t.noEntriesYet}</p>
            ) : (
              <table className="highscores-table">
                <thead>
                  <tr>
                    <th className="solid-col"></th>
                    <th className="rank-col">{t.rank}</th>
                    <th>{t.name}</th>
                    <th>{t.stage}</th>
                    <th className="text-right">{t.score}</th>
                  </tr>
                </thead>
                <tbody>
                  {levelDetail.records.map(r => (
                    <tr
                      key={r.attemptId}
                      onClick={() => {
                        const run = HighScoreManager.getRunRecordByRunId(r.runId);
                        if (run) openRunDetail(run);
                      }}
                    >
                      <td className="solid-col"></td>
                      <td className="rank-col">{r.rank}</td>
                      <td className={isOwnEntry(r) ? 'own-name' : ''}>{getDisplayName(r)}</td>
                      <td>{r.pass > 1 ? t.stageLabel.replace('{n}', r.pass) : '1'}</td>
                      <td className="text-right">{r.score}</td>
                    </tr>
                  ))}
                  {levelDetail.ownEntry && (
                    <tr key="own-level" className="own-entry-row">
                      <td className="solid-col"></td>
                      <td className="rank-col">{levelDetail.ownEntry.rank}</td>
                      <td className="own-name">{getDisplayName(levelDetail.ownEntry)}</td>
                      <td>{levelDetail.ownEntry.pass > 1 ? t.stageLabel.replace('{n}', levelDetail.ownEntry.pass) : '1'}</td>
                      <td className="text-right">{levelDetail.ownEntry.score}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <button className="close-button" onClick={() => setLevelDetail(null)}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
