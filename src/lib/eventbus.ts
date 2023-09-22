type Callback = (...args: any[]) => Promise<void> | void

interface PatternListeners {
  pattern: RegExp;
  listeners: Callback[];
}

export class EventBus {
  private listeners: PatternListeners[] = [];
  private static instance: EventBus;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(pattern: RegExp | string, listener: Callback): void {
    if (typeof pattern === "string") {
      pattern = new RegExp(pattern);
    }
    let found = false;
    for (const entry of this.listeners) {
      if (entry.pattern.toString() === pattern.toString()) {
        entry.listeners.push(listener);
        found = true;
        break;
      }
    }
    if (!found) {
      this.listeners.push({ pattern: pattern, listeners: [listener] });
    }
  }

  off(pattern: RegExp, listener: Callback): void {
    this.listeners = this.listeners.filter(entry => {
      if (entry.pattern.toString() === pattern.toString()) {
        entry.listeners = entry.listeners.filter(l => l !== listener);
        return entry.listeners.length > 0;
      }
      return true;
    });
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    for (const entry of this.listeners) {
      if (entry.pattern.test(event)) {
        for (const listener of entry.listeners) {
          const result = listener(...args);
          if (result instanceof Promise) {
            await result
          }
        }
      }
    }
  }
}

export default EventBus.getInstance();
