import { DEFAULT_MEDIATOR } from "../constants"
import logger from "./logger"
import { Profile } from "./profile"
import { default as ContactService, Contact, Message } from "./contacts"
import { WorkerCommand, WorkerMessage } from "./workerTypes"
import eventbus, { EventListenerHandle } from "./eventbus"
import { IMessage } from "didcomm"
import { DIDCommMessage, DID } from "./didcomm"

export interface AgentMessage {
  sender: Contact
  receiver: Contact
  message: IMessage
}

const IMPLEMENTED_PROTOCOLS = [
  "https://didcomm.org/discover-features/2.0",
  "https://didcomm.org/trust-ping/2.0",
  "https://didcomm.org/basicmessage/2.0",
  "https://didcomm.org/user-profile/1.0",
]

export class Agent {
  public profile: Profile
  private worker: Worker

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url))
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
    this.onAnyMessage(this.handleCoreProtocolMessage.bind(this))
    this.onMessage(
      "https://didcomm.org/user-profile/1.0/profile",
      this.onProfileUpdate.bind(this)
    )
    this.onMessage(
      "https://didcomm.org/user-profile/1.0/request-profile",
      this.onProfileRequest.bind(this)
    )
  }

  setupProfile(profile: Profile) {
    this.profile = profile
  }

  private postMessage<T>(message: WorkerCommand<T>) {
    console.log("Posting message: ", message)
    this.worker.postMessage(message)
  }

  private handleWorkerMessage(e: MessageEvent<WorkerMessage<any>>) {
    console.log("Agent received message: ", e.data.type)
    switch (e.data.type) {
      case "log":
        logger.log(e.data.payload.message)
        break
      case "init":
        this.postMessage({
          type: "establishMediation",
          payload: { mediatorDid: DEFAULT_MEDIATOR },
        })
        break
      case "didGenerated":
        this.onDidGenerated(e.data.payload)
        break
      case "didRotated":
        let contacts = ContactService.getContacts()
        const {oldDid, newDid, jwt} = e.data.payload
        if(this.profile.did == oldDid)
          this.profile.did = newDid

        for (let contact of contacts) {
          const message = {
            type: "https://didcomm.org/empty/1.0/empty",
            body: {},
            from_prior: jwt,
          }
          logger.log("Sending new did to contact:", contact?.label || contact.did)
          console.log("Sending new did to contact:", contact, message)
          this.sendMessage(contact, message as IMessage)
        }
        break
      case "messageReceived":
        this.onMessageReceived(e.data.payload)
        break
      case "connected":
        eventbus.emit("connected")
        break
      case "disconnected":
        eventbus.emit("disconnected")
        break
      case "error":
      default:
        logger.log("Unhandled message: ", e.data.type)
        console.log("Unhandled message: ", e.data)
    }
  }

  private onDidGenerated(did: string) {
    logger.log("DID Generated:", did)
    eventbus.emit("didGenerated", did)

    this.postMessage({
      type: "connect",
      payload: { mediatorDid: DEFAULT_MEDIATOR },
    })
  }

  set ondid(callback: (did: string) => void) {
    eventbus.on("didGenerated", callback)
  }

  private handleDiscoverFeatures(message: IMessage) {
    const regexEscape = (s: string) =>
      s.replace(/([.*+?$^=!:{}()|\[\]\/\\])/g, "\\$1")
    const createRegex = (query: string) =>
      new RegExp(`^${query.split("*").map(regexEscape).join(".*")}$`)
    let protocolResponse: object[] = []

    // Loop through all queries, then all implemented protocols and build up a
    // list of supported protocols that match the user's request
    for (let query of message.body.queries) {
      // Rudimentary implementation, ignoring all except protocol requests
      if (query["feature-type"] != "protocol") continue

      for (let protocol of IMPLEMENTED_PROTOCOLS) {
        if (createRegex(query["match"]).test(protocol)) {
          protocolResponse.push({
            "feature-type": "protocol",
            id: protocol,
          })
        }
      }
    }
    const response = {
      type: "https://didcomm.org/discover-features/2.0/disclose",
      thid: message.id,
      body: {
        disclosures: protocolResponse,
      },
    }
    return response
  }

  private handleCoreProtocolMessage(message: AgentMessage) {
    const msg = message.message
    switch (msg.type) {
      case "https://didcomm.org/trust-ping/2.0/ping":
        if (msg.body?.response_requested !== false) {
          this.sendMessage(msg.from, {
            type: "https://didcomm.org/trust-ping/2.0/ping-response",
            thid: msg.id,
          })
        }
        break
      case "https://didcomm.org/discover-features/2.0/queries":
        const discloseMessage = this.handleDiscoverFeatures(msg)
        this.sendMessage(msg.from, discloseMessage)
        break
    }
  }

  private onMessageReceived(message: IMessage) {
    if (message?.prior) {
      const oldContact = ContactService.getContact(message.prior.iss)
      oldContact && ContactService.rotateContact(oldContact, message.prior.sub)
    }
    const from =
      message.from == this.profile.did
        ? (this.profile as Contact)
        : ContactService.getContact(message.from)
    const to =
      message.to[0] == this.profile.did
        ? (this.profile as Contact)
        : ContactService.getContact(message.to[0])

    if (ContactService.getContact(message.from)) {
      let fromName = message.from
      if (from) {
        fromName = from.label || from.did
      }
      ContactService.addMessage(message.from, {
        sender: fromName,
        receiver: to?.label || to.did,
        timestamp: new Date(),
        content: message.body.content,
        type: message.type,
        raw: message,
      })
    }
    eventbus.emit("messageReceived", { sender: from, receiver: to, message })
    eventbus.emit(message.type, { sender: from, receiver: to, message })
  }

  public onMessage(
    type: string,
    callback: (message: AgentMessage) => void
  ): EventListenerHandle {
    return eventbus.on(type, callback)
  }

  public onAnyMessage(
    callback: (message: AgentMessage) => void
  ): EventListenerHandle {
    return eventbus.on("messageReceived", callback)
  }

  public async sendMessage(to: Contact | DID, message: DIDCommMessage) {
    const contact: Contact =
      typeof to == "string" ? ContactService.getContact(to) : to
    const internalMessage = {
      sender: this.profile.label,
      receiver: contact.label || contact.did,
      timestamp: new Date(),
      type: message.type,
      content: message.body?.content ?? "",
      raw: message,
    }
    this.postMessage({
      type: "sendMessage",
      payload: { to: contact.did, message },
    })
    internalMessage.raw.from = this.profile.did
    ContactService.addMessage(contact.did, internalMessage)
  }

  public async rotateDid() {
    this.worker.postMessage({
      type: "rotateDid",
      payload: {},
    })
  }

  public async refreshMessages() {
    this.postMessage({
      type: "pickupStatus",
      payload: { mediatorDid: DEFAULT_MEDIATOR },
    })
  }

  public async sendProfile(contact: Contact) {
    const message = {
      type: "https://didcomm.org/user-profile/1.0/profile",
      body: {
        profile: {
          displayName: this.profile.label,
        },
      },
    }
    await this.sendMessage(contact, message as IMessage)
  }

  public async requestProfile(contact: Contact) {
    const message = {
      type: "https://didcomm.org/user-profile/1.0/request-profile",
      body: {
        query: ["displayName"],
      },
    }
    await this.sendMessage(contact, message as IMessage)
  }

  async onProfileUpdate(message: AgentMessage) {
    let contact = ContactService.getContact(message.message.from)
    if (!contact) {
      return
    }

    let label = message.message.body?.profile?.displayName
    if (!label) {
      return
    }

    contact.label = label
    ContactService.addContact(contact)
  }

  async onProfileRequest(message: AgentMessage) {
    let contact = ContactService.getContact(message.message.from)
    if (!contact) {
      return
    }
    await this.sendProfile(contact)
  }

  public async sendFeatureDiscovery(contact: Contact) {
    const message = {
      type: "https://didcomm.org/discover-features/2.0/queries",
      body: {
        queries: [
          {
            "feature-type": "protocol",
            match: "https://didcomm.org/*",
          },
        ],
      },
    }
    await this.sendMessage(contact, message as IMessage)
  }

  public async connect() {
    this.worker.postMessage({
      type: "connect",
      payload: { mediatorDid: DEFAULT_MEDIATOR },
    })
  }

  set onconnect(callback: () => void) {
    eventbus.on("connected", callback)
  }

  public async disconnect() {
    this.worker.postMessage({ type: "disconnect" })
  }

  set ondisconnect(callback: () => void) {
    eventbus.on("disconnected", callback)
  }
}

export default new Agent()
