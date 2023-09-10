import {
  ed25519,
  edwardsToMontgomeryPub,
  edwardsToMontgomeryPriv,
} from "@noble/curves/ed25519"
import { DIDResolver, DIDDoc, SecretsResolver, Secret, Message, UnpackMetadata } from "didcomm"
import DIDPeer from "./peer2"
import {v4 as uuidv4} from "uuid"
import { EventBus } from "./eventbus"

function x25519ToSecret(
  did: string,
  x25519KeyPriv: Uint8Array,
  x25519Key: Uint8Array
): Secret {
  const encIdent = DIDPeer.keyToIdent(x25519Key, "x25519-pub")
  const secretEnc: Secret = {
    id: `${did}#${encIdent}`,
    type: "X25519KeyAgreementKey2020",
    privateKeyMultibase: DIDPeer.keyToMultibase(x25519KeyPriv, "x25519-priv")
  }
  return secretEnc
}

function ed25519ToSecret(
  did: string,
  ed25519KeyPriv: Uint8Array,
  ed25519Key: Uint8Array
): Secret {
  const verIdent = DIDPeer.keyToIdent(ed25519Key, "ed25519-pub")
  const secretVer: Secret = {
    id: `${did}#${verIdent}`,
    type: "Ed25519VerificationKey2020",
    privateKeyMultibase: DIDPeer.keyToMultibase(ed25519KeyPriv, "ed25519-priv")
  }
  return secretVer
}

export function generateDidForMediator() {
  const key = ed25519.utils.randomPrivateKey()
  const enckeyPriv = edwardsToMontgomeryPriv(key)
  const verkey = ed25519.getPublicKey(key)
  const enckey = edwardsToMontgomeryPub(verkey)
  const service = {
    id: "#didcomm",
    type: "DIDCommMessaging",
    serviceEndpoint: "didcomm:/transport/queue",
    accept: ["didcomm/v2"],
  }
  const did = DIDPeer.generate([verkey], [enckey], service)

  const secretVer = ed25519ToSecret(did, key, verkey)
  const secretEnc = x25519ToSecret(did, enckeyPriv, enckey)
  return { did, secrets: [secretVer, secretEnc] }
}

export function generateDid(routingKeys: string[], endpoint: string) {
  const key = ed25519.utils.randomPrivateKey()
  const enckeyPriv = edwardsToMontgomeryPriv(key)
  const verkey = ed25519.getPublicKey(key)
  const enckey = edwardsToMontgomeryPub(verkey)
  const service = {
    id: "#didcomm",
    type: "DIDCommMessaging",
    serviceEndpoint: endpoint,
    routingKeys: routingKeys,
    accept: ["didcomm/v2"],
  }
  const did = DIDPeer.generate([verkey], [enckey], service)

  const secretVer = ed25519ToSecret(did, key, verkey)
  const secretEnc = x25519ToSecret(did, enckeyPriv, enckey)
  return { did, secrets: [secretVer, secretEnc] }
}

export class DIDPeerResolver implements DIDResolver {
  async resolve(did: string): Promise<DIDDoc | null> {
    const raw_doc = DIDPeer.resolve(did)
    return {
      id: raw_doc.id,
      verificationMethod: raw_doc.verificationMethod,
      authentication: raw_doc.authentication,
      keyAgreement: raw_doc.keyAgreement,
      service: raw_doc.service,
    }
  }
}

export class LocalSecretsResolver implements SecretsResolver {
  private readonly storageKey = "secretsResolver"

  constructor() {
    // Initialize local storage if it hasn't been done before
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}))
    }
  }

  private static createError(message: string, name: string): Error {
    const e = new Error(message)
    e.name = name
    return e
  }

  async get_secret(secret_id: string): Promise<Secret | null> {
    try {
      const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}")
      return secrets[secret_id] || null
    } catch (error) {
      throw LocalSecretsResolver.createError(
        "Unable to perform IO operation",
        "DIDCommIoError"
      )
    }
  }

  async find_secrets(secret_ids: Array<string>): Promise<Array<string>> {
    try {
      const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}")
      return secret_ids.map(id => secrets[id]).filter(secret => !!secret) // Filter out undefined or null values
    } catch (error) {
      throw LocalSecretsResolver.createError(
        "Unable to perform IO operation",
        "DIDCommIoError"
      )
    }
  }

  // Helper method to store a secret in localStorage
  store_secret(secret: Secret): void {
    try {
      const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}")
      secrets[secret.id] = secret
      localStorage.setItem(this.storageKey, JSON.stringify(secrets))
    } catch (error) {
      throw LocalSecretsResolver.createError(
        "Unable to perform IO operation",
        "DIDCommIoError"
      )
    }
  }
}

interface DIDCommMessage {
  type: string
  body: string
  [key: string]: any
}

export class DIDComm {
  private readonly resolver: DIDPeerResolver
  private readonly secretsResolver: LocalSecretsResolver
  constructor() {
    this.resolver = new DIDPeerResolver()
    this.secretsResolver = new LocalSecretsResolver()
  }
  async generateDidForMediator() {
    const { did, secrets } = generateDidForMediator()
    secrets.forEach(secret => this.secretsResolver.store_secret(secret))
    return { did, secrets }
  }
  async generateDid(routingKeys: string[], endpoint: string) {
    const { did, secrets } = generateDid(routingKeys, endpoint)
    secrets.forEach(secret => this.secretsResolver.store_secret(secret))
    return { did, secrets }
  }
  async prepareMessage(to: string, from: string, message: DIDCommMessage) {
    const msg = new Message({
      id: uuidv4(),
      typ: "application/didcomm-plain+json",
      from: from,
      to: [to],
      created_time: Date.now(),
      ...message,
    })
    return await msg.pack_encrypted(
      to, from, null, this.resolver, this.secretsResolver, {forward: true}
    )
  }
  async unpackMessage(message: string): Promise<[Message, UnpackMetadata]> {
      return await Message.unpack(
        message, this.resolver, this.secretsResolver, {}
      )
  }
  async sendMessageAndExpectReply(to: string, from: string, message: DIDCommMessage): Promise<[Message, UnpackMetadata]> {
    const [packed, meta]= await this.prepareMessage(to, from, message)
    if (!meta.messaging_service) {
      throw new Error("No messaging service found")
    }

    try {
      const response = await fetch(meta.messaging_service.service_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/didcomm-encrypted+json"
        },
        body: packed,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error sending message: ${text}`)
      }

      const packedResponse = await response.text()
      return await this.unpackMessage(packedResponse)
    } catch (error) {
      console.error(error)
    }
  }
  async sendMessage(to: string, from: string, message: DIDCommMessage) {
    const [packed, meta]= await this.prepareMessage(to, from, message)
    if (!meta.messaging_service) {
      throw new Error("No messaging service found")
    }

    try {
      const response = await fetch(meta.messaging_service.service_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/didcomm-encrypted+json"
        },
        body: packed,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error sending message: ${text}`)
      }

      const packedResponse = await response.text()
      return await this.receiveMessage(packedResponse)
    } catch (error) {
      console.error(error)
    }
  }
  async receiveMessage(message: string): Promise<void> {
      const [resp, respMeta] = await Message.unpack(
        message, this.resolver, this.secretsResolver, {}
      )
      EventBus.getInstance().emit("message", resp, respMeta)
  }    
}
