import {
  ed25519,
  x25519,
  edwardsToMontgomeryPub,
  edwardsToMontgomeryPriv,
} from "@noble/curves/ed25519"
import { DIDResolver, DIDDoc, SecretsResolver, Secret } from "didcomm"
import DIDPeer from "./peer2"
import * as multibase from "multibase"
import * as multicodec from "multicodec"

function x25519ToSecret(
  did: string,
  x25519KeyPriv: Uint8Array,
  x25519Key: Uint8Array
): Secret {
  const encodedEnckey = multibase
    .encode("base58btc", multicodec.addPrefix("x25519-pub", x25519Key))
    .toString()
  const encIdent = `${did}#${encodedEnckey.slice(1, 9)}`
  const secretEnc: Secret = {
    id: encIdent,
    type: "X25519KeyAgreementKey2020",
    privateKeyMultibase: multibase
      .encode("base58btc", multicodec.addPrefix("x25519-priv", x25519KeyPriv))
      .toString(),
  }
  return secretEnc
}

function ed25519ToSecret(
  did: string,
  ed25519KeyPriv: Uint8Array,
  ed25519Key: Uint8Array
): Secret {
  const encodedVerkey = DIDPeer.keyToIdent(ed25519Key, "ed25519-pub")
  const verIdent = `${did}#${encodedVerkey.slice(1, 9)}`
  const secretVer: Secret = {
    id: verIdent,
    type: "Ed25519VerificationKey2020",
    privateKeyMultibase: multibase
      .encode("base58btc", multicodec.addPrefix("x25519-priv", ed25519KeyPriv))
      .toString(),
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
