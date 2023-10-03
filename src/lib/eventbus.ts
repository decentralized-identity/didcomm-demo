type Callback = (...args: any[]) => Promise<void> | void

interface PatternListeners {
  pattern: RegExp
  listeners: Callback[]
}

export class EventListenerHandle {
  eventbus: EventBus
  pattern: RegExp
  listener: Callback
  constructor(eventbus: EventBus, pattern: RegExp, listener: Callback) {
    this.eventbus = eventbus
    this.pattern = pattern
    this.listener = listener
  }

  off() {
    this.eventbus.off(this.pattern, this.listener)
  }
}

export class EventBus {
  private listeners: PatternListeners[] = []
  private static instance: EventBus

  protected constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Subscribe to an event.
   * @param pattern Regex pattern to match the event name.
   * @param listener Callback to be called when the event is emitted.
   * @returns Handle to the listener. Can be used to unsubscribe.
   */
  on(pattern: RegExp | string, listener: Callback): EventListenerHandle {
    if (typeof pattern === "string") {
      pattern = new RegExp(pattern)
    }
    let found = false
    for (const entry of this.listeners) {
      if (entry.pattern.toString() === pattern.toString()) {
        entry.listeners.push(listener)
        found = true
        break
      }
    }
    if (!found) {
      this.listeners.push({ pattern: pattern, listeners: [listener] })
    }
    return new EventListenerHandle(this, pattern, listener)
  }

  off(pattern: RegExp, listener: Callback): void {
    this.listeners = this.listeners.filter(entry => {
      if (entry.pattern.toString() === pattern.toString()) {
        entry.listeners = entry.listeners.filter(l => l !== listener)
        return entry.listeners.length > 0
      }
      return true
    })
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    for (const entry of this.listeners) {
      if (entry.pattern.test(event)) {
        for (const listener of entry.listeners) {
          const result = listener(...args)
          if (result instanceof Promise) {
            await result
          }
        }
      }
    }
  }

  scoped(): ScopedEventBus {
    return new ScopedEventBus(this)
  }
}

export class ScopedEventBus extends EventBus {
  private handles: EventListenerHandle[] = []
  private eventbus: EventBus

  public constructor(eventbus: EventBus) {
    super()
    this.eventbus = eventbus
  }

  on(pattern: string | RegExp, listener: Callback): EventListenerHandle {
    const handle = this.eventbus.on(pattern, listener)
    this.handles.push(handle)
    return handle
  }

  collect(...handles: EventListenerHandle[]) {
    this.handles.push(...handles)
  }

  off(pattern: RegExp, listener: Callback): void {
    this.eventbus.off(pattern, listener)
  }

  emit(event: string, ...args: any[]): Promise<void> {
    return this.eventbus.emit(event, ...args)
  }

  close() {
    this.handles.forEach(handle => {
      handle.off()
    })
  }
}

export default EventBus.getInstance()
