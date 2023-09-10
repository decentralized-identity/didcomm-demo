import {ed25519, x25519, edwardsToMontgomeryPub, edwardsToMontgomeryPriv} from "@noble/curves/ed25519";
import { DIDResolver, DIDDoc, Secret } from "didcomm";
import DIDPeer from "./peer2";
import * as multibase from 'multibase';
import * as multicodec from 'multicodec';

function x25519ToSecret(did: string, x25519KeyPriv: Uint8Array, x25519Key: Uint8Array): Secret {
    const encodedEnckey = multibase.encode("base58btc", multicodec.addPrefix('x25519-pub', x25519Key)).toString();
    const encIdent = `${did}#${encodedEnckey.slice(1,9)}`
    const secretEnc: Secret = {
      id: encIdent,
      type: "X25519KeyAgreementKey2020",
      privateKeyMultibase: multibase.encode("base58btc", multicodec.addPrefix('x25519-priv', x25519KeyPriv)).toString(),
    }
    return secretEnc;
}

function ed25519ToSecret(did: string, ed25519KeyPriv: Uint8Array, ed25519Key: Uint8Array): Secret {
  const encodedVerkey = DIDPeer.keyToIdent(ed25519Key, "ed25519-pub")
  const verIdent = `${did}#${encodedVerkey.slice(1,9)}`
  const secretVer: Secret = {
    id: verIdent,
    type: "Ed25519VerificationKey2020",
    privateKeyMultibase: multibase.encode("base58btc", multicodec.addPrefix("x25519-priv", ed25519KeyPriv)).toString(),
  }
  return secretVer;
}

export function generateDidForMediator() {
    const key = ed25519.utils.randomPrivateKey();
    const enckeyPriv = edwardsToMontgomeryPriv(key)
    const verkey = ed25519.getPublicKey(key);
    const enckey = edwardsToMontgomeryPub(verkey);
    const service = {
      id: "#didcomm",
      type: "DIDCommMessaging",
      serviceEndpoint: "didcomm:/transport/queue",
      accept: ["didcomm/v2"]
    }
    const did = DIDPeer.generate([verkey], [enckey], service);

    const secretVer = ed25519ToSecret(did, key, verkey);
    const secretEnc = x25519ToSecret(did, enckeyPriv, enckey);
    return {did, secrets: [secretVer, secretEnc]};
}

export function generateDid(routingKeys: string[], endpoint: string) {
    const key = ed25519.utils.randomPrivateKey();
    const enckeyPriv = edwardsToMontgomeryPriv(key)
    const verkey = ed25519.getPublicKey(key);
    const enckey = edwardsToMontgomeryPub(verkey);
    const service = {
      id: "#didcomm",
      type: "DIDCommMessaging",
      serviceEndpoint: endpoint,
      routingKeys: routingKeys,
      accept: ["didcomm/v2"]
    }
    const did = DIDPeer.generate([verkey], [enckey], service);

    const secretVer = ed25519ToSecret(did, key, verkey);
    const secretEnc = x25519ToSecret(did, enckeyPriv, enckey);
    return {did, secrets: [secretVer, secretEnc]};
}

class DIDResolverImpl implements DIDResolver {
  async resolve(did: string): DIDDoc | null {
    const raw_doc = DIDPeer.resolve(did);
    return {
      id: raw_doc.id,
      authentication: raw_doc.authentication,
      keyAgreement: raw_doc.keyAgreement,
      service: raw_doc.service,
    }
  }
}
