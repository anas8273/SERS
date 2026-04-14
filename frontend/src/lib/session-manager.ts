/**
 * SERS Session Manager
 * Enterprise-grade idle timeout, activity tracking, and cross-tab synchronization.
 *
 * Features:
 * - Configurable idle timeout (30 minutes for guests, 60 minutes for "Remember Me")
 * - Warning dialog 2 minutes before forced logout
 * - Activity tracking: mouse, keyboard, touch, scroll, visibility change
 * - Cross-tab synchronization via BroadcastChannel API
 * - Automatic session extension on detected activity
 * - Throttled activity handlers to prevent performance issues
 */

export type SessionEvent = 'idle-warning' | 'idle-logout' | 'session-extended' | 'tab-logout';

type SessionEventHandler = () => void;

interface SessionConfig {
  /** Total idle time before forced logout (ms). Default: 30 minutes */
  idleTimeoutMs: number;
  /** Time before logout to show the warning dialog (ms). Default: 2 minutes */
  warningBeforeMs: number;
  /** Throttle interval for activity events (ms). Default: 10 seconds */
  throttleMs: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  idleTimeoutMs: 30 * 60 * 1000,   // 30 minutes
  warningBeforeMs: 2 * 60 * 1000,  // 2 minute warning
  throttleMs: 10_000,               // Throttle check every 10s
};

const CHANNEL_NAME = 'sers-session-sync';
const LAST_ACTIVE_KEY = 'sers_last_active';

class SessionManager {
  private config: SessionConfig = DEFAULT_CONFIG;
  private handlers: Map<SessionEvent, SessionEventHandler[]> = new Map();
  private warningTimerId: ReturnType<typeof setTimeout> | null = null;
  private logoutTimerId: ReturnType<typeof setTimeout> | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  private channel: BroadcastChannel | null = null;
  private isRunning = false;
  private isWarningVisible = false;

  /** Bound event listener refs for cleanup */
  private activityBound = this.handleActivity.bind(this);
  private visibilityBound = this.handleVisibilityChange.bind(this);

  /** Start the session manager with optional config overrides */
  start(config?: Partial<SessionConfig>) {
    if (typeof window === 'undefined') return;
    if (this.isRunning) return;

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isRunning = true;
    this.isWarningVisible = false;

    this.setupBroadcastChannel();
    this.attachActivityListeners();
    // Stamp last-active NOW so the first idle window starts from login time
    this.updateLastActive();
    this.resetTimers();
  }

  /** Stop and clean up all timers and listeners */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    this.clearTimers();
    // Clean up throttle timer to prevent memory leak
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    this.detachActivityListeners();
    this.channel?.close();
    this.channel = null;
  }

  /** Extend the session (called when user clicks "Stay Logged In") */
  extend() {
    this.isWarningVisible = false;
    this.resetTimers();
    this.updateLastActive();
    this.broadcastActivity();
    this.emit('session-extended');
  }

  /** Register an event handler */
  on(event: SessionEvent, handler: SessionEventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  /** Unregister an event handler */
  off(event: SessionEvent, handler: SessionEventHandler) {
    const arr = this.handlers.get(event);
    if (arr) {
      this.handlers.set(event, arr.filter(h => h !== handler));
    }
  }

  /** Get remaining idle time in ms */
  getRemainingMs(): number {
    const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
    if (!lastActive) return this.config.idleTimeoutMs;
    return Math.max(0, lastActive + this.config.idleTimeoutMs - Date.now());
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private setupBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'activity') {
          // Another tab is active → reset our timers
          this.resetTimers();
        } else if (event.data?.type === 'logout') {
          // Another tab logged out → emit logout
          this.emit('tab-logout');
        }
      };
    } catch {
      // BroadcastChannel not supported (very old browsers) — silently ignore
    }
  }

  private broadcastActivity() {
    try {
      this.channel?.postMessage({ type: 'activity', ts: Date.now() });
    } catch { /* ignore */ }
  }

  private broadcastLogout() {
    try {
      this.channel?.postMessage({ type: 'logout', ts: Date.now() });
    } catch { /* ignore */ }
  }

  private attachActivityListeners() {
    const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];
    EVENTS.forEach(ev => window.addEventListener(ev, this.activityBound, { passive: true }));
    document.addEventListener('visibilitychange', this.visibilityBound);
  }

  private detachActivityListeners() {
    const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'];
    EVENTS.forEach(ev => window.removeEventListener(ev, this.activityBound));
    document.removeEventListener('visibilitychange', this.visibilityBound);
  }

  private handleActivity() {
    if (!this.isRunning || this.throttleTimer) return;
    // Throttle: only process activity every throttleMs
    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
    }, this.config.throttleMs);

    this.isWarningVisible = false;
    this.updateLastActive();
    this.resetTimers();
    this.broadcastActivity();
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Tab became visible — check if the session expired while hidden
      const remaining = this.getRemainingMs();
      if (remaining <= 0) {
        this.onIdleLogout();
      } else if (remaining <= this.config.warningBeforeMs) {
        this.onIdleWarning();
      } else {
        this.resetTimers();
      }
    }
  }

  private updateLastActive() {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  }

  private resetTimers() {
    this.clearTimers();

    const warningDelay = this.config.idleTimeoutMs - this.config.warningBeforeMs;
    const logoutDelay = this.config.idleTimeoutMs;

    this.warningTimerId = setTimeout(() => this.onIdleWarning(), warningDelay);
    this.logoutTimerId = setTimeout(() => this.onIdleLogout(), logoutDelay);
  }

  private clearTimers() {
    if (this.warningTimerId) clearTimeout(this.warningTimerId);
    if (this.logoutTimerId) clearTimeout(this.logoutTimerId);
    this.warningTimerId = null;
    this.logoutTimerId = null;
  }

  private onIdleWarning() {
    if (this.isWarningVisible) return;
    this.isWarningVisible = true;
    this.emit('idle-warning');
  }

  private onIdleLogout() {
    this.isWarningVisible = false;
    this.stop();
    this.broadcastLogout();
    this.emit('idle-logout');
    // Clean up last active
    localStorage.removeItem(LAST_ACTIVE_KEY);
  }

  private emit(event: SessionEvent) {
    this.handlers.get(event)?.forEach(h => {
      try { h(); } catch { /* ignore handler errors */ }
    });
  }
}

/** Singleton session manager instance */
export const sessionManager = new SessionManager();
