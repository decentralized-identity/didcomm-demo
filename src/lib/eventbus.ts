type Callback = (...args: any[]) => void;

export class EventBus {
  private listeners: { [event: string]: Callback[] } = {};
  private static instance: EventBus;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, listener: Callback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Callback): void {
    const listeners = this.listeners[event];
    if (listeners) {
      this.listeners[event] = listeners.filter(l => l !== listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners[event];
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}
