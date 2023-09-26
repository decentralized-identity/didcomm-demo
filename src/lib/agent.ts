import { DEFAULT_MEDIATOR } from "../constants"
import logger from "./logger"
import { Profile } from "./profile"
import { default as ContactService, Contact, Message } from "./contacts"
import { WorkerCommand, WorkerMessage } from "./workerTypes"
import eventbus from "./eventbus"
import { IMessage } from "didcomm"
import { DIDCommMessage } from "./didcomm"

export interface AgentMessage {
  sender: Contact
  receiver: Contact
  message: IMessage
}

export class Agent {
  public profile: Profile
  private worker: Worker

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url))
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
  }

  setupProfile(profile: Profile) {
    this.profile = profile
  }

  private postMessage<T>(message: WorkerCommand<T>) {
    console.log("Posting message: ", message)
    this.worker.postMessage(message)
  }

  private handleWorkerMessage(e: MessageEvent<WorkerMessage<any>>) {
    switch (e.data.type) {
      case "log":
        logger.log(e.data.payload.message)
        break
      case "init":
        this.postMessage({type: "establishMediation", payload: {mediatorDid: DEFAULT_MEDIATOR}})
        break
      case "didGenerated":
        this.onDidGenerated(e.data.payload)
        break
      case "messageReceived":
        this.onMessageReceived(e.data.payload)
        break
      default:
        logger.log("Unhandled message: ", e.data.type)
        console.log("Unhandled message: ", e.data)
    }
  }

  private onDidGenerated(did: string) {
    logger.log("DID Generated:", did)
    eventbus.emit("didGenerated", did)

    this.postMessage({type: "connect", payload: {mediatorDid: DEFAULT_MEDIATOR}})
  }

  set ondid(callback: (did: string) => void) {
    eventbus.on("didGenerated", callback)
  }

  private onMessageReceived(message: IMessage) {
    const from = message.from == this.profile.did ? this.profile as Contact : ContactService.getContact(message.from)
    const to = message.to[0] == this.profile.did ? this.profile as Contact : ContactService.getContact(message.to[0])
    eventbus.emit("messageReceived", {sender: from, receiver: to, message})
    eventbus.emit(message.type, {sender: from, receiver: to, message})
    if(ContactService.getContact(message.from) &&
       message.type == "https://didcomm.org/basicmessage/2.0/message") {
      let fromName = message.from;
      if(from)
        fromName = from.label || from.did;
      ContactService.addMessage(
        message.from, {
          sender: fromName,
          receiver: to.label || to.did,
          timestamp: new Date(),
          content: message.body.content
        }
      )
    }
  }

  set onmessage(callback: (message: AgentMessage) => void) {
    eventbus.on("messageReceived", callback)
  }

  public onMessage(type: string, callback: (message: AgentMessage) => void) {
    eventbus.on(type, callback)
  }

  public async sendMessage(to: Contact, message: DIDCommMessage) {
    this.postMessage({type: "sendMessage", payload: {to: to.did, message}})
  }

  public async refreshMessages() {
    this.postMessage({type: "pickupStatus", payload: {mediatorDid: DEFAULT_MEDIATOR}})
  }
}

export default new Agent()
