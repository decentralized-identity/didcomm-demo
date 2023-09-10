type Callback = (...args: any[]) => Promise<void>

export class EventBus {
  private listeners: { [event: string]: Callback[] } = {}
  private static instance: EventBus

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  on(event: string, listener: Callback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
  }

  off(event: string, listener: Callback): void {
    const listeners = this.listeners[event]
    if (listeners) {
      this.listeners[event] = listeners.filter(l => l !== listener)
    }
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    const listeners = this.listeners[event]
    if (listeners) {
      listeners.forEach(async listener => await listener(...args))
    }
  }
}
