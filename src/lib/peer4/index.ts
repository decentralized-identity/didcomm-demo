import * as bs58 from 'bs58';
import * as varint from 'varint';

type Document = Record<string, any>;

const json = 0x0200;
const sha2_256 = 0x12;
const sha2_bytes_256 = 0x20;
const base58btc = "z";
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const LONG_RE = new RegExp(`^did:peer:4zQm[${B58}]{44}:z[${B58}]{6,}$`)
export const SHORT_RE = new RegExp(`^did:peer:4zQm[${B58}]{44}$`)

function toMultibaseB58(input: Uint8Array): string {
  const encoded = bs58.encode(input);
  return `${base58btc}${encoded}`;
}

function fromMultibaseB58(input: string): Uint8Array {
  const decoded = bs58.decode(input.slice(1));
  return decoded
}

async function multihashSha256(input: Uint8Array): Promise<Uint8Array> {
  const mh = new Uint8Array(2);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
  varint.encode(sha2_256, mh, 0);
  varint.encode(sha2_bytes_256, mh, 1);
  const output = new Uint8Array(mh.length + digest.length);
  output.set(mh);
  output.set(digest, mh.length);
  return output
}

function toMulticodecJson(input: Document): Uint8Array {
  const encoded = new TextEncoder().encode(JSON.stringify(input));
  const bytes = new Uint8Array(2 + encoded.length);
  varint.encode(json, bytes, 0);
  bytes.set(encoded, 2);
  return bytes
}

function fromMulticodecJson(input: Uint8Array): Document {
  const decoded = new TextDecoder().decode(input.slice(2));
  return JSON.parse(decoded)
}

export async function encode(inputDocument: Document): Promise<string> {
  const encodedDocument = encodeDocument(inputDocument);
  const hash = await hashDocument(encodedDocument);

  const longForm = `did:peer:4${hash}:${encodedDocument}`;

  return longForm;
}

export async function encodeShort(inputDocument: Document): Promise<string> {
  const encodedDocument = encodeDocument(inputDocument);
  const hash = await hashDocument(encodedDocument);

  const shortForm = `did:peer:4${hash}`;

  return shortForm;
}

export function longToShort(did: string): string {
  if (!LONG_RE.test(did)) {
    throw new Error('DID is not a long form did:peer:4');
  }

  return did.slice(0, did.lastIndexOf(':'))
}

function encodeDocument(document: Document): string {
  const encoded = toMultibaseB58(
    toMulticodecJson(document)
  )
  return encoded
}

async function hashDocument(encodedDocument: string): Promise<string> {
  const bytes = new TextEncoder().encode(encodedDocument);
  const multihashed = await multihashSha256(bytes);
  return toMultibaseB58(multihashed);
}

export async function resolve(did: string): Promise<Document> {
  const decodedDocument = await decode(did);
  const document = contextualizeDocument(did, decodedDocument);
  document.alsoKnownAs = document.alsoKnownAs || [];
  document.alsoKnownAs.push(longToShort(did));
  return document;
}

export async function resolveShort(did: string): Promise<Document> {
  const decodedDocument = await decode(did);
  const shortForm = longToShort(did);
  const document = contextualizeDocument(shortForm, decodedDocument);
  document.alsoKnownAs = document.alsoKnownAs || [];
  document.alsoKnownAs.push(did);
  return document;
}

export async function resolveShortFromDoc(document: Document, did: string | null): Promise<Document> {
  const longForm = await encode(document);
  if (did !== null) {
    const shortForm = longToShort(longForm);
    if (did !== shortForm) {
      throw new Error(`DID mismatch: ${did} !== ${shortForm}`);
    }
  }
  return resolveShort(longForm);
}

export async function decode(did: string): Promise<Document> {
  if (!did.startsWith("did:peer:4")) {
    throw new Error('Invalid did:peer:4');
  }

  if (SHORT_RE.test(did)) {
    throw new Error('Cannot decode document form short form did:peer:4');
  }

  if (!LONG_RE.test(did)) {
    throw new Error('Invalid did:peer:4');
  }

  const [hash, doc] = did.slice(10).split(':')
  if (hash !== await hashDocument(doc)) {
    throw new Error(`Hash is invalid for did: ${did}`);
  }

  const decoded = fromMulticodecJson(fromMultibaseB58(doc))
  return decoded;
}

function operateOnEmbedded(callback: (document: Document) => Document): Document | string {
  function _curried(document: Document | string): Document | string {
    if (typeof document === "string") {
      return document;
    } else {
      return callback(document);
    }
  }
  return _curried;
}

function visitVerificationMethods(document: Document, callback: (document: Document) => Document) {
  document.verificationMethod = document.verificationMethod?.map(callback);
  document.authentication = document.authentication?.map(operateOnEmbedded(callback));
  document.assertionMethod = document.assertionMethod?.map(operateOnEmbedded(callback));
  document.keyAgreement = document.keyAgreement?.map(operateOnEmbedded(callback));
  document.capabilityDelegation = document.capabilityDelegation?.map(operateOnEmbedded(callback));
  document.capabilityInvocation = document.capabilityInvocation?.map(operateOnEmbedded(callback));
  return document
}

function contextualizeDocument(did: string, document: Document): Document {
  const contextualized = { ...document };
  contextualized.id = did;

  visitVerificationMethods(contextualized, (vm) => {
    if (vm.controller === undefined) {
      vm.controller = did
    }
    return vm
  })

  return contextualized;
}
