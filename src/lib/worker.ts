import {DIDComm, DIDCommMessage} from './didcomm'
import {IMessage} from "didcomm"
import { WorkerCommand, WorkerMessage } from './workerTypes'
import logger, { LogTopic, Record } from './logger'

const ctx: Worker = self as any;

class DIDCommWorker {
  private didcomm: DIDComm
  private didForMediator: string
  private did: string
  private ws: WebSocket

  onLog(record: Record) {
    this.postMessage({type: "log", payload: record})
  }

  init() {
    logger.subscribe(LogTopic.LOG, this.onLog.bind(this))
    this.didcomm = new DIDComm()
    this.postMessage({type: "init", payload: {}})
    logger.log("Worker initialized.")
  }

  async establishMediation({mediatorDid}: {mediatorDid: string}) {
    logger.log("Establishing mediation with mediator: ", mediatorDid)
    this.didForMediator = await this.didcomm.generateDidForMediator()
    {
      const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(
        mediatorDid,
        this.didForMediator,
        {
          type: "https://didcomm.org/coordinate-mediation/3.0/mediate-request"
        }
      )
      const reply = msg.as_value()
      if (reply.type !== 'https://didcomm.org/coordinate-mediation/3.0/mediate-grant') {
        console.error("Unexpected reply: ", reply)
        throw new Error("Unexpected reply")
      }
      const routingDid = reply.body.routing_did[0]
      this.did = await this.didcomm.generateDid(routingDid)
      this.postMessage({type: "didGenerated", payload: this.did})
    }

    const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(
      mediatorDid,
      this.didForMediator,
      {
        type: "https://didcomm.org/coordinate-mediation/3.0/recipient-update",
        body: {
          updates: [
            {
              recipient_did: this.did,
              action: "add",
            }
          ]
        }
      }
    )

    const reply = msg.as_value()
    if (reply.type !== 'https://didcomm.org/coordinate-mediation/3.0/recipient-update-response') {
      console.error("Unexpected reply: ", reply)
      throw new Error("Unexpected reply")
    }

    if (reply.body.updated[0]?.recipient_did !== this.did) {
      throw new Error("Unexpected did in recipient update response")
    }

    if (reply.body.updated[0]?.action !== "add") {
      throw new Error("Unexpected action in recipient update response")
    }

    if (reply.body.updated[0]?.result !== "success") {
      throw new Error("Unexpected status in recipient update response")
    }
  }

  async pickupStatus({mediatorDid}: {mediatorDid: string}) {
    const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(
      mediatorDid, this.didForMediator, {
        type: "https://didcomm.org/messagepickup/3.0/status-request",
        body: {
          message_count: 0
        }
      }
    )
    const status = msg.as_value()
    if (status.type !== "https://didcomm.org/messagepickup/3.0/status") {
      throw new Error("Unexpected reply: " + status.type)
    }
    await this.handleMessage(status)
  }

  async connect({mediatorDid}: {mediatorDid: string}) {
    logger.log("Connecting to mediator: ", mediatorDid)
    const endpoint = await this.didcomm.wsEndpoint(mediatorDid)
    logger.log("Discovered WS endpoint: ", endpoint.service_endpoint)
    this.ws = new WebSocket(endpoint.service_endpoint)

    this.ws.onmessage = async (event) => {
      console.log("ws onmessage: ", event)
      await this.handlePackedMessage(event.data)
    }
    this.ws.onopen = async (event) => {
      console.log("ws onopen", event)
      const [plaintext, live, meta] = await this.didcomm.prepareMessage(
        mediatorDid, this.didForMediator, {
        type: "https://didcomm.org/messagepickup/3.0/live-delivery-change",
        body: {
          live_delivery: true
        }
      })
      this.ws.send(live)
      this.postMessage({type: "connected", payload: {}})
    }
    this.ws.onerror = (event) => {
      console.log("ws onerror", event)
      this.postMessage({type: "error", payload: {}})
    }
    this.ws.onclose = (event) => {
      console.log("ws onclose", event)
      this.postMessage({type: "disconnected", payload: {}})
    }

  }

  async handleMessage(message: IMessage) {
    switch (message.type) {
      case "https://didcomm.org/messagepickup/3.0/status":
        if (message.body.message_count > 0) {
          const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(
            message.from, this.didForMediator, {
              type: "https://didcomm.org/messagepickup/3.0/delivery-request",
              body: {
                limit: message.body.message_count,
              },
              return_route: "all"
            }
          )
          const delivery = msg.as_value()
          if (delivery.type !== "https://didcomm.org/messagepickup/3.0/delivery") {
            throw new Error("Unexpected reply: " + delivery.type)
          }
          await this.handleMessage(delivery)
        }
        break

      case "https://didcomm.org/messagepickup/3.0/delivery":
        let received: string[] = []
        message.attachments.forEach(async (attachement) => {
          if ("base64" in attachement.data) {
            received.push(attachement.id)
            this.handlePackedMessage(atob(attachement.data.base64))
          } else {
            console.error("Unhandled attachment: ", attachement)
          }
        })
        const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(
          message.from, this.didForMediator, {
            type: "https://didcomm.org/messagepickup/3.0/messages-received",
            body: {
              message_id_list: received,
            },
            return_route: "all"
          }
        )
        const status = msg.as_value()
        if (status.type !== "https://didcomm.org/messagepickup/3.0/status") {
          throw new Error("Unexpected reply: " + status.type)
        }
        await this.handleMessage(status)
        break
      default:
        console.log("Unhandled message: ", message)
        break
    }
    this.postMessage({type: "messageReceived", payload: message})
  }

  async handlePackedMessage(packed: string) {
    const [msg, meta] = await this.didcomm.unpackMessage(packed)
    const message = msg.as_value()
    return await this.handleMessage(message)
  }

  async disconnect() {
    this.ws.close()
    this.postMessage({type: "disconnected", payload: {}})
  }

  async sendMessage({to, message}: {to: string, message: DIDCommMessage}) {
    await this.didcomm.sendMessage(to, this.did, message)
  }

  postMessage<T>(message: WorkerMessage<T>) {
    self.postMessage(message)
  }

  async route(event: MessageEvent<WorkerCommand<any>>) {
    const {type, payload} = event.data
    const method = this[type]

    if (typeof method === 'function') {
      const result = method.call(this, payload)

      if (result instanceof Promise) {
        await result
      }
    } else {
      console.error("Unknown command type: ", type)
    }
  }
}

const handler = new DIDCommWorker()
console.log("Created worker: ", handler)
ctx.onmessage = async (event: MessageEvent) => {
  console.log("Worker received message: ", event)
  await handler.route(event)
}
handler.init()
