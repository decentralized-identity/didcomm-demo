import EventBus from './eventbus'

export enum LogTopic {
  LOG = "log",
  LOG_MESSAGE = "log.message",
  LOG_MESSAGE_CONTACT = "log.message.contact",
}

export interface Record {
  message: string
  timestamp: Date
  topic: string
}

export interface MessageRecord {
  to: string
  from: string
  message: object
}

export class LoggerService {
  private records: Record[] = []

  log(...messages: string[]) {
    console.log(...messages)
    const record = {
      message: messages.join(" "),
      timestamp: new Date(),
      topic: LogTopic.LOG
    }
    this.records.push(record)
    EventBus.emit(LogTopic.LOG, record)
  }

  sentMessage(message: MessageRecord) {
    const record = {
      message: "Sent: " + JSON.stringify(message.message, null, 2),
      timestamp: new Date(),
      topic: LogTopic.LOG_MESSAGE,
    }
    console.log("Sent message: ", record.message)
    this.records.push(record)
    EventBus.emit(LogTopic.LOG_MESSAGE_CONTACT + `.${message.to}`, record)
  }

  recvMessage(message: MessageRecord) {
    const record = {
      message: "Received: " + JSON.stringify(message.message, null, 2),
      timestamp: new Date(),
      topic: LogTopic.LOG_MESSAGE,
    }
    console.log("Received message: ", record.message)
    this.records.push(record)
    EventBus.emit(LogTopic.LOG_MESSAGE_CONTACT + `.${message.from}`, record)
  }

  subscribe(topic: LogTopic, callback: (record: Record) => Promise<void>) {
    EventBus.on(new RegExp(topic), callback)
  }

  unsubscribe(topic: LogTopic, callback: (record: Record) => Promise<void>) {
    EventBus.off(new RegExp(topic), callback)
  }

  subscribeContact(contact: string, callback: (record: Record) => Promise<void>) {
    EventBus.on(new RegExp(LogTopic.LOG_MESSAGE_CONTACT + `.${contact}`), callback)
  }

  unsubscribeContact(contact: string, callback: (record: Record) => Promise<void>) {
    EventBus.off(new RegExp(LogTopic.LOG_MESSAGE_CONTACT + `.${contact}`), callback)
  }
}

export default new LoggerService()
