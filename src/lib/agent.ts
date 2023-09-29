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

const IMPLEMENTED_PROTOCOLS = [
  "https://didcomm.org/discover-features/2.0/queries",
  "https://didcomm.org/trust-ping/2.0/ping",
  "https://didcomm.org/basicmessage/2.0/message",
  "https://didcomm.org/user-profile/1.0/request-profile",
];

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

  private handleDiscoverFeatures(message: IMessage) {
    const regexEscape = (s: string) => s.replace(/([.*+?$^=!:{}()|\[\]\/\\])/g, "\\$1");
    const createRegex = (query: string) => (new RegExp(`^${query.split("*").map(regexEscape).join(".*")}$`));
    let protocolResponse: object[] = [];

    // Loop through all queries, then all implemented protocols and build up a
    // list of supported protocols that match the user's request
    for(let query of message.body.queries) {

      // Rudimentary implementation, ignoring all except protocol requests
      if(query["feature-type"] != "protocol")
        continue

      for(let protocol of IMPLEMENTED_PROTOCOLS) {
        if(createRegex(query).test(protocol)) {
          protocolResponse.push({
            "feature-type": "protocol",
            "id": protocol,
          })
        }
      }
    }
    const response = {
      "type": "https://didcomm.org/discover-features/2.0/disclose",
      "thid": message.id,
      "body": {
        "disclosures": protocolResponse
      }
    }
    return response
  }

  private handleCoreProtocolMessage(message: IMessage) {
    switch(message.type) {
      case "https://didcomm.org/trust-ping/2.0/ping":
        if(message.body?.response_requested !== false) {
          this.sendMessage({
              did: message.from
            }, {
            "type": "https://didcomm.org/trust-ping/2.0/ping-response",
            "thid": message.id,
          })
        }
        break;
      case "https://didcomm.org/discover-features/2.0/queries":
        const discloseMessage = this.handleDiscoverFeatures(message)
        this.sendMessage({
              did: message.from
            }, discloseMessage)
        break;
    }
  }

  private onMessageReceived(message: IMessage) {
    const from = message.from == this.profile.did ? this.profile as Contact : ContactService.getContact(message.from)
    const to = message.to[0] == this.profile.did ? this.profile as Contact : ContactService.getContact(message.to[0])

    // Handle core protocols first, but only if they are destined for us. Don't
    // handle them if they were sent by us.
    if(this.profile && to?.did == this.profile?.did)
      this.handleCoreProtocolMessage(message)

    eventbus.emit("messageReceived", {sender: from, receiver: to, message})
    eventbus.emit(message.type, {sender: from, receiver: to, message})
    if(ContactService.getContact(message.from)) {
      let fromName = message.from;
      if(from)
        fromName = from.label || from.did;
      ContactService.addMessage(
        message.from, {
          sender: fromName,
          receiver: to.label || to.did,
          timestamp: new Date(),
          content: message.body.content,
          type: message.type,
          raw: message,
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

  public onAnyMessage(callback: (message: AgentMessage) => void) {
    eventbus.on("messageReceived", callback);
  }

  public async sendMessage(to: Contact, message: DIDCommMessage) {
    this.postMessage({type: "sendMessage", payload: {to: to.did, message}})
  }

  public async refreshMessages() {
    this.postMessage({type: "pickupStatus", payload: {mediatorDid: DEFAULT_MEDIATOR}})
  }
}

export default new Agent()
