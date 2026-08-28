import { HUD_HEIGHT, BUTTON_SIZE_FACTOR, BUTTON_MARGIN_FACTOR } from './constants.js';

// Fixed canvas-space gap kept below the canvas top edge for the touch buttons.
// This is independent of screen size/scale so the layout stays anchored to the
// canvas top.
export const TOP_GAP = 10;

// Geometry of all touch control buttons in canvas-internal coordinates.
// Returns an array of button objects with type, position, size, label, and color.
// Shared by both the renderer and the pointer hit-testing (DRY).
//
// Single fixed layout for every screen size / aspect ratio (no landscape/portrait
// branching). All buttons are anchored to the top edge:
//   Left thumb  : two tall rotate buttons (← / →).
//   Right thumb : one very large thrust button in the top-right corner
//                 (pressed almost permanently, ~1.75x the others).
//     - Fire (X)      sits directly below thrust.
//     - Special (POD) sits left of fire, on the same row.
//   This clustering lets the right thumb hold thrust while reaching down to fire and
//   over to special, enabling thrust + fire + special combos.
// Defines the single-player touch button layout.
// Returns the right-cluster buttons (rotate, fire, thrust) in canvas-internal
// coordinates. topGap is a fixed canvas-space gap below the canvas top edge.
// topOffset and ratio are kept in the signature for call-site compatibility.
export function getTouchButtonRects(w, h, ratio, topOffset = 0, topGap = TOP_GAP, showTouchButtons = true, isMobile = false, options = {}) {
  const margin = BUTTON_MARGIN_FACTOR;
  const hitMargin = BUTTON_MARGIN_FACTOR; // Extra margin for hit area
  const gap = BUTTON_MARGIN_FACTOR * 2; // Spacing between buttons in a cluster (>= 2*hitMargin so hit areas don't overlap)
  const buttons = [];
  const sizeScale = options.sizeScale || 1;
  const sizeFactor = BUTTON_SIZE_FACTOR * sizeScale;
  const buttonMargin = margin * sizeScale;
  const buttonHitMargin = hitMargin * sizeScale;
  const buttonGap = gap * sizeScale;
  const includePod = options.includePod !== false;
  const forceVisible = options.forceVisible === true;
  const podType = options.podType || 'pod';
  const typeMap = options.typeMap || {};
  const showFire = options.showFire !== false;
  const showThrust = options.showThrust !== false;

  // Base button sizes based on BUTTON_SIZE_FACTOR. Thrust is the largest.
  const baseRotateWidth = sizeFactor * 1.6;
  let rotateHeight = options.rotateHeight !== undefined ? options.rotateHeight : (sizeFactor * 3);
  const baseThrustWidth = sizeFactor * 3.5;
  const baseThrustHeight = sizeFactor * 3;
  const baseFireWidth = sizeFactor * 2;
  let fireHeight = sizeFactor * 2;
  const specialWidth = sizeFactor * 2;
  let specialHeight = sizeFactor * 2;

  // anchorBottom: position buttons upward from the bottom edge (used for
  // two-player side strips where the rotation maps strip-bottom to screen-top).
  // Default (top-anchored): buttons sit below the visible canvas top edge.
  const anchorBottom = options.anchorBottom === true;
  const bottomEdge = h - topGap; // topGap repurposed as gap from bottom when anchorBottom
  const topEdge = topGap + topOffset;

  // Apply maximization options for specific button dimensions.
  // maximizeThrustHeight: 1-player mode, thrust fills from the visible top
  // edge down to above fire.
  // maximizeWidth: 2-player mode, on-screen height = strip width (w).
  let rotateLeftWidth = baseRotateWidth;
  let rotateRightWidth = baseRotateWidth;
  let thrustWidth = baseThrustWidth;
  let thrustHeight = baseThrustHeight;
  let fireWidth = baseFireWidth;

  const bottomOffset = options.bottomOffset || 0;

  if (options.maximizeThrustHeight) {
    const availableHeight = h - topEdge - HUD_HEIGHT - buttonGap - bottomOffset;
    fireHeight = availableHeight / 3;
    specialHeight = fireHeight;
    thrustHeight = availableHeight * 2 / 3;
  }

  if (options.maximizeRotateHeight) {
    const availableHeight = h - topEdge - HUD_HEIGHT - bottomOffset;
    if (options.podBelowRotate) {
      // Reserve 1/3 for the POD button below the rotate buttons (with a gap between)
      rotateHeight = (availableHeight - buttonGap) * 2 / 3;
    } else {
      rotateHeight = availableHeight - buttonMargin;
    }
  }

  if (options.maximizeWidth) {
    if (options.maximizeWidth.rotateLeft) {
      rotateLeftWidth = w - 2 * buttonMargin - 2 * buttonGap - baseRotateWidth - baseThrustWidth;
    }
    if (options.maximizeWidth.thrust) {
      thrustWidth = w - 2 * buttonMargin - 2 * buttonGap - 2 * baseRotateWidth;
    }
    if (options.maximizeWidth.fire) {
      fireWidth = w - 2 * buttonMargin - 2 * buttonGap - 2 * baseRotateWidth;
    }
  }

  // Right cluster geometry.
  const fireX = w - fireWidth - buttonMargin;
  const specialX = fireX - buttonGap - specialWidth;
  let fireY, specialY, thrustY, thrustX;
  fireY = topEdge + HUD_HEIGHT;
  specialY = topEdge + HUD_HEIGHT; // tractor and shield
  thrustY = topEdge + fireHeight + buttonGap + HUD_HEIGHT;
  thrustX = specialX;
  thrustWidth = fireWidth + specialWidth + buttonGap;


  const tiltSteeringMode = options.tiltSteering === true;

  // Rotate buttons (top-left or bottom-left depending on anchor).
  // When top-anchored, place them just below the visible top edge so they
  // stay on screen even when the canvas content is cropped at the top.
  const rotateY = options.rotateY !== undefined
    ? options.rotateY + topOffset
    : (anchorBottom ? bottomEdge - rotateHeight : topEdge + HUD_HEIGHT);
  if (!tiltSteeringMode && (forceVisible || showTouchButtons)) {
    const rotateLeftX = buttonMargin;
    const rotateRightX = buttonMargin + rotateLeftWidth + buttonGap;
    buttons.push(
      { type: typeMap.rotateLeft || 'rotateLeft', x: rotateLeftX, y: rotateY, w: rotateLeftWidth, h: rotateHeight, label: '↺', font: `${24 * sizeScale}px Arial`, color: 'rgba(0, 100, 255, 0.2)', activeColor: 'rgba(0, 100, 255, 0.5)', hitX: rotateLeftX - buttonHitMargin, hitY: rotateY - buttonHitMargin, hitW: rotateLeftWidth + buttonHitMargin * 2, hitH: rotateHeight + buttonHitMargin * 2 },
      { type: typeMap.rotateRight || 'rotateRight', x: rotateRightX, y: rotateY, w: rotateRightWidth, h: rotateHeight, label: '↻', font: `${24 * sizeScale}px Arial`, color: 'rgba(0, 100, 255, 0.2)', activeColor: 'rgba(0, 100, 255, 0.5)', hitX: rotateRightX - buttonHitMargin, hitY: rotateY - buttonHitMargin, hitW: rotateRightWidth + buttonHitMargin * 2, hitH: rotateHeight + buttonHitMargin * 2 }
    );
  }

  // Special / POD (tractor beam) button.
  // Visible when touch buttons are shown, forced visible, or tilt steering is active.
  if (includePod && (tiltSteeringMode || forceVisible || showTouchButtons)) {
    if (tiltSteeringMode || (!showTouchButtons && !forceVisible)) {
      // In tilt steering mode: POD button fills full height at the far right edge
      const podX = w - specialWidth * 1.7 - buttonMargin;
      const podY = topEdge + HUD_HEIGHT - 80; // positioned 80px shifted up, because the image is rendered at the bottom of the button
      const podH = h - podY - buttonMargin;
      buttons.push(
        { type: podType, x: podX, y: podY, w: specialWidth * 1.7, h: podH, label: 'POD', font: `${14 * sizeScale}px Arial`, color: 'rgba(0, 0, 0, 0.2)', activeColor: 'rgba(0, 0, 0, 0.5)', hitX: podX - buttonHitMargin, hitY: podY - buttonHitMargin, hitW: specialWidth * 1.7 + buttonHitMargin * 2, hitH: podH + buttonHitMargin * 2 }
      );
    } else if (options.podBelowRotate) {
      // 1-player mode: POD button sits below the rotate buttons on the left side,
      // spanning the full width of both rotate buttons and taking 1/3 of the
      // available height (screen height without HUD).
      const podX = buttonMargin;
      const podY = rotateY + rotateHeight + buttonGap;
      const podW = rotateLeftWidth + buttonGap + rotateRightWidth;
      const availableHeight = h - topEdge - HUD_HEIGHT - bottomOffset;
      const podH = (availableHeight - buttonGap) * 1 / 3;
      buttons.push(
        { type: podType, x: podX, y: podY, w: podW, h: podH, label: 'POD', font: `${14 * sizeScale}px Arial`, color: 'rgba(0, 0, 0, 0.2)', activeColor: 'rgba(0, 0, 0, 0.5)', hitX: podX - buttonHitMargin, hitY: podY - buttonHitMargin, hitW: podW + buttonHitMargin * 2, hitH: podH + buttonHitMargin * 2 }
      );
    } else {
      buttons.push(
        { type: podType, x: specialX, y: specialY, w: specialWidth, h: specialHeight, label: 'POD', font: `${14 * sizeScale}px Arial`, color: 'rgba(0, 0, 0, 0.2)', activeColor: 'rgba(0, 0, 0, 0.5)', hitX: specialX - buttonHitMargin, hitY: specialY - buttonHitMargin, hitW: specialWidth + buttonHitMargin * 2, hitH: specialHeight + buttonHitMargin * 2 }
      );
    }
  }

  // Fire button (directly below thrust) - visible when showTouchButtons and showFire
  if (!tiltSteeringMode && showFire && (forceVisible || showTouchButtons)) {
    buttons.push(
      { type: typeMap.fire || 'fire', x: fireX, y: fireY, w: fireWidth, h: fireHeight, label: '⌖', font: `${24 * sizeScale}px Arial`, color: 'rgba(255, 0, 0, 0.2)', activeColor: 'rgba(255, 0, 0, 0.5)', hitX: fireX - buttonHitMargin, hitY: fireY - buttonHitMargin, hitW: fireWidth + buttonHitMargin * 2, hitH: fireHeight + buttonHitMargin * 2 }
    );
  }

  // Thrust button (largest, top-right corner) - only visible when showTouchButtons and showThrust
  if (!tiltSteeringMode && showThrust && (forceVisible || showTouchButtons)) {
    buttons.push(
      { type: typeMap.accelerate || 'accelerate', x: thrustX, y: thrustY, w: thrustWidth, h: thrustHeight, label: '↑', font: `${32 * sizeScale}px Arial`, color: 'rgba(0, 255, 0, 0.2)', activeColor: 'rgba(0, 255, 0, 0.5)', hitX: thrustX - buttonHitMargin, hitY: thrustY - buttonHitMargin, hitW: thrustWidth + buttonHitMargin * 2, hitH: thrustHeight + buttonHitMargin * 2 }
    );
  }

  return buttons;
}

// Defines all touch buttons for one side in two-player mode.
// The strip is 100px wide and the buttons are stacked from the top with a
// fixed row height. Each strip contains rotate left/right, thrust and fire.
// For P1 the POD / special button is placed left of the fire button on the
// same row. The right-side strip (P1) ends at the right canvas edge, the
// left-side strip (P2) starts at the left canvas edge. No rotation is used:
// returned coordinates are already in screen space.
export function getSideStripButtons(w, h, topGap, topOffset, isRight, sizeScale, options = {}) {
  const stripWidth = 100;
  const hitMargin = BUTTON_MARGIN_FACTOR * sizeScale;
  const gap = hitMargin * 2;
  const stripX = isRight ? w - stripWidth : 0;
  const typeMap = options.typeMap || {};
  const includePod = options.includePod !== false;
  const showTouchButtons = options.showTouchButtons !== false;
  const forceVisible = options.forceVisible === true;
  const showThrust = options.showThrust !== false;
  const showFire = options.showFire !== false;
  const buttons = [];
  if (!forceVisible && !showTouchButtons) return buttons;

  // Distribute available height: thrust gets 1/2, other rows get 1/4 each
  const bottomOffset = options.bottomOffset || 0;
  const availableHeight = h - topGap - topOffset - HUD_HEIGHT - bottomOffset;
  let visibleRows = 1; // rotate row is always visible
  if (includePod || showFire) visibleRows++; // fire/pod row
  if (showThrust) visibleRows++; // thrust row
  const totalGaps = (visibleRows - 1) * gap;
  const usableHeight = availableHeight - totalGaps;
  // Weights: thrust = 2, other rows = 1 each -> thrust gets 2/(visibleRows+1) = 1/2 when 3 rows
  const rowHeight = usableHeight / (visibleRows + (showThrust ? 1 : 0));
  const thrustRowHeight = showThrust ? rowHeight * 2 : rowHeight;

  const addButton = (type, label, y, width, height, color, activeColor, fontSize = 24, xPos = stripX) => {
    buttons.push({
      type: typeMap[type] || type,
      x: xPos,
      y,
      w: width,
      h: height,
      label,
      font: `${fontSize * sizeScale}px Arial`,
      color,
      activeColor,
      hitX: xPos - hitMargin,
      hitY: y - hitMargin,
      hitW: width + hitMargin * 2,
      hitH: height + hitMargin * 2,
    });
  };

  let y = topGap + topOffset + HUD_HEIGHT;

  // Rotate row: left/right buttons side by side
  const halfWidth = (stripWidth - gap) / 2;
  addButton('rotateLeft', '↺', y, halfWidth, rowHeight, 'rgba(0, 100, 255, 0.2)', 'rgba(0, 100, 255, 0.5)');
  addButton('rotateRight', '↻', y, halfWidth, rowHeight, 'rgba(0, 100, 255, 0.2)', 'rgba(0, 100, 255, 0.5)', 24, stripX + halfWidth + gap);
  y += rowHeight + gap;

  // Fire row. In two-player mode P1 gets the POD / special button left of fire.
  if (includePod) {
    addButton('pod', 'POD', y, halfWidth, rowHeight, 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)', 14);
    if (showFire) {
      addButton('fire', '⌖', y, halfWidth, rowHeight, 'rgba(255, 0, 0, 0.2)', 'rgba(255, 0, 0, 0.5)', 24, stripX + halfWidth + gap);
    }
  } else {
    if (showFire) {
      addButton('fire', '⌖', y, stripWidth, rowHeight, 'rgba(255, 0, 0, 0.2)', 'rgba(255, 0, 0, 0.5)');
    }
  }
  y += rowHeight + gap;

  // Thrust button (hidden for P2 until pod is docked)
  if (showThrust) {
    addButton('accelerate', '↑', y, stripWidth, thrustRowHeight, 'rgba(0, 255, 0, 0.2)', 'rgba(0, 255, 0, 0.5)', 32);
  }

  return buttons;
}

// Return all touch controls for the current mode.
// - Single-player: getTouchButtonRects builds the right-cluster layout.
// - Two-player: getSideStripButtons builds the P1 (right) and P2 (left)
//   vertical strips; this is where all 2-player buttons are defined.
export function getTouchButtons(w, h, ratio, topOffset = 0, topGap = TOP_GAP, showTouchButtons = true, isMobile = false, twoPlayer = false, podDocked = false, tiltSteering = false, networkRole = null, bottomOffset = 0) {
  if (!twoPlayer && !networkRole) {
    if (tiltSteering) {
      return getTouchButtonRects(w, h, ratio, topOffset, topGap, showTouchButtons, isMobile, {
        maximizeThrustHeight: true,
        maximizeRotateHeight: true,
        tiltSteering: true,
        bottomOffset,
      });
    }
    return getTouchButtonRects(w, h, ratio, topOffset, topGap, showTouchButtons, isMobile, {
      maximizeThrustHeight: true,
      maximizeRotateHeight: true,
      podBelowRotate: true,
      bottomOffset,
    });
  }

  // Network mode: each player gets a single-player-style layout on their own screen.
  if (networkRole) {
    if (networkRole === 'host') {
      // Host controls the ship: fire only visible after pod is docked.
      return getTouchButtonRects(w, h, ratio, topOffset, topGap, showTouchButtons, isMobile, {
        maximizeThrustHeight: true,
        maximizeRotateHeight: true,
        showFire: podDocked,
        tiltSteering,
        bottomOffset,
      });
    } else {
      // Client controls the pod/turret: thrust only visible after pod is docked.
      return getTouchButtonRects(w, h, ratio, topOffset, topGap, showTouchButtons, isMobile, {
        maximizeThrustHeight: true,
        maximizeRotateHeight: true,
        includePod: false,
        showThrust: podDocked,
        tiltSteering,
        bottomOffset,
        typeMap: {
          rotateLeft: 'p2RotateLeft',
          rotateRight: 'p2RotateRight',
          accelerate: 'p2Thrust',
          fire: 'p2Fire',
        },
      });
    }
  }

  // Local two-player: side strips on a shared screen.
  const sizeScale = 0.7;
  // Player 1: right side strip (ends at the right edge, starts 100px left).
  const playerOneButtons = getSideStripButtons(w, h, topGap, topOffset, true, sizeScale, { includePod: true, showTouchButtons, showFire: podDocked, bottomOffset });
  // Player 2: left side strip (starts at the left edge).
  const playerTwoButtons = getSideStripButtons(w, h, topGap, topOffset, false, sizeScale, {
    includePod: false,
    showTouchButtons,
    showThrust: podDocked,
    bottomOffset,
    typeMap: {
      rotateLeft: 'p2RotateLeft',
      rotateRight: 'p2RotateRight',
      accelerate: 'p2Thrust',
      fire: 'p2Fire',
    },
  });
  return [...playerOneButtons, ...playerTwoButtons];
}

// Draw a single touch button using the same style used in the real game.
export function drawTouchButton(ctx, btn, active, touchButtonOpacity = 1, podIcon = null, crosshairIcon = null) {
  const angle = btn.angle || 0;
  const origin = btn.origin || { x: 0, y: 0 };
  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(angle);
  ctx.globalAlpha = touchButtonOpacity;
  ctx.fillStyle = active ? btn.activeColor : btn.color;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeStyle = btn.activeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  // Draw icon for POD button, text for other buttons
  if (btn.type === 'pod' && podIcon) {
    // Scale icon to fit button with padding while preserving aspect ratio (2.4:1)
    const iconPadding = 4;
    const iconAspectRatio = 2.4; // height/width from original 367x881
    const availableWidth = btn.w - iconPadding * 2;
    const availableHeight = btn.h - iconPadding * 2;

    let iconWidth, iconHeight;
    if (availableHeight / availableWidth > iconAspectRatio) {
      // Button is taller than icon ratio - fit to width
      iconWidth = availableWidth;
      iconHeight = iconWidth * iconAspectRatio;
    } else {
      // Button is wider than icon ratio - fit to height
      iconHeight = availableHeight;
      iconWidth = iconHeight / iconAspectRatio;
    }

    const iconX = btn.x + (btn.w - iconWidth) / 2;
    const iconY = btn.y + (btn.h - iconHeight) / 2;
    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(podIcon, iconX, iconY, iconWidth, iconHeight);
  } else if ((btn.type === 'fire' || btn.type === 'p2Fire') && crosshairIcon) {
    // Draw the crosshair image for the fire button, centered with padding.
    const iconPadding = Math.min(btn.w, btn.h) * 0.2;
    const iconAspectRatio = crosshairIcon.width / crosshairIcon.height;
    const availableWidth = btn.w - iconPadding * 2;
    const availableHeight = btn.h - iconPadding * 2;
    let iconWidth, iconHeight;
    if (availableHeight / availableWidth > iconAspectRatio) {
      iconWidth = availableWidth;
      iconHeight = iconWidth / iconAspectRatio;
    } else {
      iconHeight = availableHeight;
      iconWidth = iconHeight * iconAspectRatio;
    }
    const iconX = btn.x + (btn.w - iconWidth) / 2;
    const iconY = btn.y + (btn.h - iconHeight) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(crosshairIcon, iconX, iconY, iconWidth, iconHeight);
  } else if (btn.type === 'fire' || btn.type === 'p2Fire') {
    // Fallback scaled vector crosshair if the icon has not loaded yet.
    const cx = btn.x + btn.w / 2;
    const cy = btn.y + btn.h / 2;
    const crossSize = Math.min(btn.w, btn.h) * 0.25;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, crossSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = btn.font;
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
  }
  ctx.restore();
}
