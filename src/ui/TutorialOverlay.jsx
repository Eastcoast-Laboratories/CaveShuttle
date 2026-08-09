import React, { useEffect, useRef, useState } from 'react';
import { getTouchButtonRects, TOP_GAP, drawTouchButton } from '../core/touch-buttons.js';
import { tutorialTranslations } from '../i18n/tutorial.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
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
      false,
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

export default function TutorialOverlay({ isMobile, onDismiss }) {
  const { language } = useLanguage();
  const [podIcon, setPodIcon] = useState(null);
  const [crosshairIcon, setCrosshairIcon] = useState(null);

  const t = tutorialTranslations[language] || tutorialTranslations.en;

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

  return (
    <div
      onClick={handleBackdropClick}
      className="tutorial-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tutorial-overlay__card"
      >
        <h2>{t.title}</h2>
        <p className="tutorial-overlay__intro">{t.intro}</p>

        {/* Objective */}
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

        {/* Desktop controls */}
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

        {/* Touch button preview */}
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

        {/* Tilt Steering (mobile only) */}
        {isMobile && (
          <section>
            <h3>{t.tiltSteering.title}</h3>
            <p>{t.tiltSteering.hint}</p>
            <div className="tutorial-overlay__controls">
              <div>{t.tiltSteering.rotate}</div>
              <div>{t.tiltSteering.thrust}</div>
              <div>{t.tiltSteering.fire}</div>
              <div>{t.tiltSteering.pod}</div>
            </div>
          </section>
        )}

        {/* Tip: Bonus */}
        <section>
          <h3>{t.bonusTitle}</h3>
          <p>{t.bonus}</p>
        </section>

        {/* Menu hint */}
        <section>
          <h3>{t.menuHint}</h3>
          <p>{t.menuText}</p>
        </section>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="tutorial-overlay__dismiss"
        >
          {t.dismiss}
        </button>
        <br />
        <br />
        <br />
        <br />
        <br />
      </div>
    </div>
  );
}
