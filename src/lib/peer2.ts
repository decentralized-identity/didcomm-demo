import * as multibase from "multibase"
import * as multicodec from "multicodec"

// Common string abbreviation mappings
const commonStringAbbreviations: Record<string, string> = {
  type: "t",
  DIDCommMessaging: "dm",
  serviceEndpoint: "s",
  routingKeys: "r",
  accept: "a",
}

const reverseCommonStringAbbreviations: Record<string, string> = Object.entries(
  commonStringAbbreviations
).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {})

// Purpose code mappings
const purposeCodeList: Record<string, string> = {
  Assertion: "A",
  Encryption: "E",
  Verification: "V",
  "Capability Invocation": "I",
  "Capability Delegation": "D",
  Service: "S",
}

export default class DIDPeer {
  static keyToMultibase(key: Uint8Array, prefix: multicodec.CodecName): string {
    return multibase
      .encode("base58btc", multicodec.addPrefix(prefix, key))
      .toString()
  }

  static base64UrlEncode(input: string): string {
    let base64 = btoa(input)
    return base64.replace("+", "-").replace("/", "_").replace(/=+$/, "") // remove trailing '=' characters
  }

  static base64UrlDecode(input: string): string {
    // Replace URL-safe characters back to Base64 characters
    let base64 = input.replace("-", "+").replace("_", "/")

    // Add padding if necessary
    switch (base64.length % 4) {
      case 2:
        base64 += "=="
        break // 2 padding chars
      case 3:
        base64 += "="
        break // 1 padding char
    }

    return atob(base64)
  }

  // Determine ident for key
  static keyToIdent(key: Uint8Array, prefix: multicodec.CodecName): string {
    const encoded = DIDPeer.keyToMultibase(key, prefix)
    return encoded.toString().slice(1, 9)
  }

  // Generate a DID
  static generate(
    signingKeys: Uint8Array[],
    encryptionKeys: Uint8Array[],
    serviceBlock: object
  ): string {
    const didPrefix = "did:peer:2"

    // Encode keys
    const encodedSigningKeys = signingKeys.map(key => {
      const encoded = multibase.encode(
        "base58btc",
        multicodec.addPrefix("ed25519-pub", key)
      )
      return "." + purposeCodeList["Verification"] + encoded.toString()
    })

    const encodedEncryptionKeys = encryptionKeys.map(key => {
      const encoded = multibase.encode(
        "base58btc",
        multicodec.addPrefix("x25519-pub", key)
      )
      return "." + purposeCodeList["Encryption"] + encoded.toString()
    })

    // Encode service block
    let abbreviatedService = JSON.stringify(serviceBlock, (key, value) => {
      if (commonStringAbbreviations[key]) {
        return commonStringAbbreviations[key]
      }
      return value
    })
    abbreviatedService = abbreviatedService.replace(/\s+/g, "")
    const encodedService = DIDPeer.base64UrlEncode(abbreviatedService)
    const finalService = "." + purposeCodeList["Service"] + encodedService

    return (
      didPrefix +
      encodedSigningKeys.join("") +
      encodedEncryptionKeys.join("") +
      finalService
    )
  }

  // Resolve a DID into a DID Document
  static resolve(did: string) {
    const [, ...elements] = did.split(".")

    const doc: any = {
      "@context": "https://www.w3.org/ns/did/v1",
    }

    elements.forEach(element => {
      const purposeCode = element.charAt(0)
      const encodedValue = element.slice(1)

      switch (purposeCode) {
        case purposeCodeList["Verification"]:
          const decodedSigningKey = multicodec.rmPrefix(
            multibase.decode(encodedValue)
          )
          if (!doc.authentication) {
            doc.authentication = []
          }
          doc.authentication.push({
            id: `#${DIDPeer.keyToIdent(decodedSigningKey, "ed25519-pub")}`,
            type: "Ed25519VerificationKey2018",
            publicKeyMultibase: DIDPeer.keyToMultibase(
              decodedSigningKey,
              "ed25519-pub"
            ),
          })
          break

        case purposeCodeList["Encryption"]:
          const decodedEncryptionKey = multicodec.rmPrefix(
            multibase.decode(encodedValue)
          )
          if (!doc.keyAgreement) {
            doc.keyAgreement = []
          }
          doc.keyAgreement.push({
            id: `#${DIDPeer.keyToIdent(decodedEncryptionKey, "x25519-pub")}`,
            type: "X25519KeyAgreementKey2019",
            publicKeyBase58: DIDPeer.keyToMultibase(
              decodedEncryptionKey,
              "x25519-pub"
            ),
          })
          break

        case purposeCodeList["Service"]:
          const decodedService = DIDPeer.base64UrlDecode(encodedValue)
          const parsedService = JSON.parse(decodedService, (key, value) => {
            if (reverseCommonStringAbbreviations[key]) {
              return reverseCommonStringAbbreviations[key]
            }
            return value
          })
          doc.service = [parsedService]
          break

        default:
          // Other purpose codes can be handled here
          break
      }
    })

    return doc
  }
}
