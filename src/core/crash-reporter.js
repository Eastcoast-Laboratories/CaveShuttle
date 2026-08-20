// Global crash reporter: captures unhandled JS errors and promise rejections
// and sends them to the Cave Shuttle backend. Only sends when analyticsEnabled
// is true in localStorage.

import { storageKey } from '../core/storage-keys.js';
import { APP_VERSION } from '../version.js';

const CRASH_REPORT_URL = import.meta.env?.DEV === true
  ? '/api/mobile/caveshuttle/crash-report'
  : 'https://community.caveshuttle.z11.de/api/mobile/caveshuttle/crash-report';

const SESSION_ACTIVE_KEY = storageKey('sessionActive');
const LAST_CRASH_KEY = storageKey('lastCrashContext');

let initialized = false;

function isAnalyticsEnabled() {
  try {
    const stored = localStorage.getItem(storageKey('analyticsEnabled'));
    return stored === null ? true : stored === 'true';
  } catch {
    return false;
  }
}

function getAuthToken() {
  try {
    const raw = localStorage.getItem(storageKey('authToken'));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getProfileUid() {
  try {
    const raw = localStorage.getItem(storageKey('authUser'));
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.profile_uid ?? null;
  } catch {
    return null;
  }
}

async function sendCrashReport(payload) {
  if (!isAnalyticsEnabled()) return;

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    await fetch(CRASH_REPORT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    });
    console.log('[CRASH_REPORT] Sent crash report successfully');
  } catch (err) {
    console.error('[CRASH_REPORT] Failed to send crash report:', err);
  }
}

function buildPayload(type, message, stack, context = {}) {
  return {
    type,
    message: String(message || 'Unknown error').substring(0, 5000),
    stack: stack ? String(stack).substring(0, 10000) : null,
    url: typeof window !== 'undefined' ? window.location?.href : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    appVersion: APP_VERSION,
    profileUid: getProfileUid(),
    ...context,
  };
}

export function initCrashReporter() {
  if (initialized) return;
  initialized = true;

  // Detect previous session crash (native crash detection)
  try {
    const wasActive = localStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
    if (wasActive) {
      const lastContext = localStorage.getItem(LAST_CRASH_KEY);
      const extra = lastContext ? JSON.parse(lastContext) : {};
      console.warn('[CRASH_REPORT] Previous session ended abnormally — sending native crash report');
      sendCrashReport(buildPayload('native_crash', 'App crashed on previous launch', null, { extra }));
    }
    localStorage.setItem(SESSION_ACTIVE_KEY, 'true');
  } catch {
    // localStorage not available
  }

  // Unhandled JS exceptions
  window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event;
    sendCrashReport(buildPayload(
      'js_error',
      message,
      error?.stack || null,
      { line: lineno, col: colno, url: filename },
    ));
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason);
    const stack = reason?.stack || null;
    sendCrashReport(buildPayload('unhandled_rejection', message, stack));
  });

  // Mark session as inactive on clean exit (page hide / app pause)
  const markInactive = () => {
    try {
      localStorage.setItem(SESSION_ACTIVE_KEY, 'false');
    } catch {
      // ignore
    }
  };

  window.addEventListener('pagehide', markInactive);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      markInactive();
    }
  });
}
