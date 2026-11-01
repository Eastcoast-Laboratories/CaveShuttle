import React, { useEffect, useRef, useState } from 'react';
import { getTouchButtonRects, TOP_GAP, drawTouchButton } from '../core/touch-buttons.js';
import { tutorialTranslations } from '../i18n/tutorial.js';
import { useLanguage } from '../i18n/language-context.js';
import { useSettings } from '../i18n/settings-context.js';
import KeyLabel from './KeyLabel.jsx';
import './TutorialOverlay.css';

function renderTranslatedText(text) {
  return text.split(/<br\s*\/?>/).map((line, i) => (
    <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
  ));
}

function TouchButtonPreview({ buttonTypes, podIcon, crosshairIcon, label }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const allButtons = getTouchButtonRects(
      300,
      300,
      1,
      0,
      TOP_GAP,
      true,
      { rotateHeight: 120, forceVisible: true, maximizeThrustHeight: buttonTypes.includes('accelerate') }
    );

    const buttons = buttonTypes
      .map((type) => allButtons.find((b) => b.type === type))
      .filter(Boolean);

    if (buttons.length === 0) return;

    const padding = 10;
    const gap = 10;
    const totalW = buttons.reduce((sum, b, i) => sum + b.w + (i > 0 ? gap : 0), 0) + padding * 2;
    const maxH = Math.max(...buttons.map((b) => b.h));
    const totalH = maxH + padding * 2;

    canvas.width = totalW;
    canvas.height = totalH;
    ctx.clearRect(0, 0, totalW, totalH);

    let x = padding;
    const y = (totalH - maxH) / 2;

    for (const btn of buttons) {
      const previewBtn = {
        ...btn,
        origin: { x: x - btn.x, y: y - btn.y },
      };
      drawTouchButton(ctx, previewBtn, false, 1, podIcon, crosshairIcon);
      x += btn.w + gap;
    }
  }, [buttonTypes, podIcon, crosshairIcon]);

  return (
    <div className="tutorial-overlay__touch-preview">
      <canvas ref={canvasRef} className="tutorial-overlay__touch-canvas" />
      <span className="tutorial-overlay__touch-label">{label}</span>
    </div>
  );
}

export default function TutorialOverlay({ onDismiss, canCancel = false, onCancel, onStartGuidedLevel }) {
  const { language } = useLanguage();
  const { isMobile } = useSettings();
  const [podIcon, setPodIcon] = useState(null);
  const [crosshairIcon, setCrosshairIcon] = useState(null);

  const t = tutorialTranslations[language] || tutorialTranslations.en;
  const guidedHints = t.guidedHints;

  // Load touch button icons once so each preview canvas can reuse them.
  useEffect(() => {
    const pod = new Image();
    pod.src = '/POD_button.png';
    const crosshair = new Image();
    crosshair.src = '/crosshair.png';

    let loaded = 0;
    const onLoad = () => {
      loaded += 1;
      if (loaded >= 2) {
        setPodIcon(pod);
        setCrosshairIcon(crosshair);
      }
    };

    pod.onload = onLoad;
    crosshair.onload = onLoad;
    pod.onerror = onLoad;
    crosshair.onerror = onLoad;
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onDismiss();
  };

  const [page, setPage] = useState(0);

  // The overlay is split into pages so every step fits a landscape phone
  // screen without scrolling; page count differs between mobile (has the
  // tilt section) and desktop.
  const pages = [
    <React.Fragment key="objective">
      <h2>{t.title}</h2>
      <p className="tutorial-overlay__intro">{t.intro}</p>
      <section>
        <h3>{t.objective}</h3>
        <p>
          {renderTranslatedText(t.objectiveText)}
        </p>
        <img
          src="/tutorial/pod_docked.png"
          alt={t.objective}
        />
        <p className="tutorial-overlay__image-caption">{renderTranslatedText(t.dockingPodImageText)}</p>
      </section>
    </React.Fragment>,
    <React.Fragment key="controls">
      {!isMobile && (
        <section>
          <h3>{t.controls}</h3>
          <div className="tutorial-overlay__controls">
            <div><KeyLabel>↑</KeyLabel> / <KeyLabel>W</KeyLabel> — {t.keys.accelerate}</div>
            <div><KeyLabel>←</KeyLabel> / <KeyLabel>A</KeyLabel> — {t.keys.rotateLeft}</div>
            <div><KeyLabel>→</KeyLabel> / <KeyLabel>D</KeyLabel> — {t.keys.rotateRight}</div>
            <div><KeyLabel>Space</KeyLabel> / <KeyLabel>Ctrl</KeyLabel> — {t.keys.tractor}</div>
            <div><KeyLabel>X</KeyLabel> / <KeyLabel>Shift</KeyLabel> — {t.keys.shoot}</div>
          </div>
        </section>
      )}
      <section>
        <h3>{t.touchButtons}</h3>
        <p>{t.touchHint}</p>
        <div className="tutorial-overlay__touch-previews">
          <TouchButtonPreview
            buttonTypes={['rotateLeft', 'rotateRight']}
            podIcon={podIcon}
            label={`${t.keys.rotateLeft} / ${t.keys.rotateRight}`}
          />
          <TouchButtonPreview
            buttonTypes={['accelerate']}
            podIcon={podIcon}
            label={t.touchLabels.thrust}
          />
          <div className="tutorial-overlay__touch-break" />
          <TouchButtonPreview
            buttonTypes={['fire']}
            podIcon={podIcon}
            crosshairIcon={crosshairIcon}
            label={t.touchLabels.fire}
          />
          <TouchButtonPreview
            buttonTypes={['pod']}
            podIcon={podIcon}
            label={t.touchLabels.pod}
          />
        </div>
      </section>
    </React.Fragment>,
    ...(isMobile ? [(
      <React.Fragment key="tilt">
        <section>
          <h3>{t.tiltSteering.title}</h3>
          <p>{t.tiltSteering.hint}</p>
          <div className="tutorial-overlay__controls">
            <div className="tutorial-overlay__mode-title">{t.tiltSteering.aimTitle}</div>
            <div>{t.tiltSteering.aimDirection}</div>
            <div>{t.tiltSteering.aimThrust}</div>
            <div className="tutorial-overlay__mode-title">{t.tiltSteering.rotateTitle}</div>
            <div>{t.tiltSteering.rotateRotate}</div>
            <div>{t.tiltSteering.rotateThrust}</div>
            <div>{t.tiltSteering.fire}</div>
            <div>{t.tiltSteering.pod}</div>
          </div>
        </section>
      </React.Fragment>
    )] : []),
    <React.Fragment key="tips">
      <section>
        <h3>{t.bonusTitle}</h3>
        <p>{t.bonus}</p>
      </section>
      <section>
        <h3>{t.menuHint}</h3>
        <p>{t.menuText}</p>
      </section>
      <button
        onClick={onStartGuidedLevel || onDismiss}
        className="tutorial-overlay__dismiss"
      >
        {canCancel ? guidedHints.restartLevel1 : t.dismiss}
      </button>
      {canCancel && onCancel && (
        <button
          onClick={onCancel}
          className="tutorial-overlay__cancel"
        >
          {guidedHints.cancel}
        </button>
      )}
    </React.Fragment>,
  ];

  const isLastPage = page === pages.length - 1;

  // Swipe navigation: a dominant horizontal swipe flips one page
  // (left = next, right = back), matching the pager buttons.
  const swipeStartRef = useRef(null);
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e) => {
    if (!swipeStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStartRef.current.x;
    const dy = t.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && !isLastPage) setPage(page + 1);
      else if (dx > 0 && page > 0) setPage(page - 1);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="tutorial-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="tutorial-overlay__card"
      >
        <button
          className="tutorial-overlay__skip-btn"
          onClick={onStartGuidedLevel || onDismiss}
          title={guidedHints.skip}
          aria-label={guidedHints.skip}
        >
          {guidedHints.skip} {'\u23ED'}
        </button>

        <div className="tutorial-overlay__page">
          {pages[page]}
        </div>

        <div className="tutorial-overlay__pager">
          {page > 0 ? (
            <button
              className="tutorial-overlay__pager-btn"
              onClick={() => setPage(page - 1)}
            >
              ‹ {t.back}
            </button>
          ) : <span className="tutorial-overlay__pager-spacer" />}
          <div className="tutorial-overlay__dots" aria-label={t.pageIndicator(page + 1, pages.length)}>
            {pages.map((_, i) => (
              <button
                key={i}
                className={`tutorial-overlay__dot ${i === page ? 'active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={t.pageIndicator(i + 1, pages.length)}
                aria-current={i === page ? 'page' : undefined}
              />
            ))}
          </div>
          {!isLastPage ? (
            <button
              className="tutorial-overlay__pager-btn tutorial-overlay__pager-btn--next"
              onClick={() => setPage(page + 1)}
            >
              {t.next} ›
            </button>
          ) : <span className="tutorial-overlay__pager-spacer" />}
        </div>
      </div>
    </div>
  );
}
