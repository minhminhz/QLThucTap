// Event bus for cross-tab and in-tab real-time synchronization
const CHANNEL_NAME = 'vymi_internship_channel';

class EventBus {
  constructor() {
    this.listeners = new Map();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type) {
            this._notifyListeners(type, payload, true);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or error:', err);
        this.channel = null;
      }
    }
  }

  emit(type, payload = {}) {
    // 1. Broadcast to other tabs
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch (err) {
        console.warn('Failed to postMessage:', err);
      }
    }

    // 2. Also notify listeners in current tab
    this._notifyListeners(type, payload, false);
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);

    // Return cleanup function
    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  _notifyListeners(type, payload, fromOtherTab = false) {
    const set = this.listeners.get(type);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload, fromOtherTab);
        } catch (err) {
          console.error(`Error in event listener for ${type}:`, err);
        }
      });
    }

    // Also support wildcard '*' listeners
    const wildcardSet = this.listeners.get('*');
    if (wildcardSet) {
      wildcardSet.forEach((cb) => {
        try {
          cb({ type, payload }, fromOtherTab);
        } catch (err) {
          console.error('Error in wildcard event listener:', err);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
export default eventBus;
